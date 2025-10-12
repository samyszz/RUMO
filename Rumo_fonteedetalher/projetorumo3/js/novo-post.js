document.addEventListener('DOMContentLoaded', () => {
    // 1. VERIFICA SE OS ELEMENTOS DO FORMULÁRIO EXISTEM NA PÁGINA
    const form = document.getElementById('new-post-form');
    if (!form) {
        console.error("ERRO: O formulário com id 'new-post-form' não foi encontrado.");
        return; // Interrompe o script se o formulário não existir
    }

    // --- INICIALIZAÇÃO DO EDITOR DE TEXTO QUILL ---
    const toolbarOptions = [
        ['bold', 'italic', 'underline', 'strike'], // botões de formatação
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['clean'] // remover formatação
    ];

    const quill = new Quill('#editor-container', {
        modules: {
            toolbar: toolbarOptions
        },
        theme: 'snow' // 'snow' é o tema padrão com a barra de ferramentas
    });
    // --- FIM DA INICIALIZAÇÃO DO QUILL ---

    const postTitleField = document.getElementById('post-title');
    // O postDescriptionField (textarea) não é mais necessário, pois usamos o Quill.
    const postImageField = document.getElementById('post-image');
    const postSourceLinkField = document.getElementById('post-sourceLink');
    const postCategoryField = document.getElementById('post-category');
    const postIdField = document.getElementById('post-id');
    const submitButton = form.querySelector('button[type="submit"]');

    let editMode = false;
    let currentPostId = null;

    // Lógica para verificar se está em modo de edição (pela URL)
    try {
        const params = new URLSearchParams(window.location.search);
        currentPostId = params.get('id');
        if (currentPostId) {
            editMode = true;
            console.log("Modo de Edição Ativado. ID do Post:", currentPostId);
            
            if (submitButton) submitButton.textContent = 'Atualizar';
            
            // Carrega os dados do post no formulário e no editor Quill
            db.collection('posts').doc(currentPostId).get().then(doc => {
                if (doc.exists) {
                    const post = doc.data();
                    postTitleField.value = post.title || '';
                    // Carrega o conteúdo HTML no editor Quill
                    quill.root.innerHTML = post.description || ''; 
                    postImageField.value = post.image || '';
                    postSourceLinkField.value = post.sourceLink || '';
                    postCategoryField.value = post.category || '';
                    postIdField.value = doc.id;
                } else {
                    alert("Erro: Post a ser editado não encontrado.");
                    window.location.href = 'hub.html';
                }
            });
        }
    } catch (error) {
        console.error("Erro ao verificar modo de edição:", error);
    }
    

    // 2. ADICIONA O LISTENER DE SUBMISSÃO AO FORMULÁRIO
    form.addEventListener('submit', (e) => {
        e.preventDefault(); // Impede o recarregamento da página

        // 3. VERIFICA SE HÁ UM USUÁRIO LOGADO
        const user = auth.currentUser;
        if (!user) {
            alert('ERRO: Você precisa estar logado para criar uma publicação. Por favor, faça o login novamente.');
            return;
        }

        // 4. COLETA E VERIFICA OS DADOS DO FORMULÁRIO
        const postData = {
            title: postTitleField.value.trim(),
            // Pega o conteúdo do Quill como HTML
            description: quill.root.innerHTML,
            image: postImageField.value.trim(),
            sourceLink: postSourceLinkField.value.trim(),
            category: postCategoryField.value,
        };

        // Verifica se os campos essenciais não estão vazios
        // quill.getLength() > 1 significa que há mais do que uma linha em branco
        if (!postData.title || quill.getLength() <= 1) { 
            alert('ERRO: O título e a descrição não podem estar vazios.');
            return;
        }

        console.log("Dados a serem salvos:", postData);
        submitButton.disabled = true; // Desabilita o botão para evitar cliques duplos
        submitButton.textContent = 'Enviando...';

        // 5. ENVIA OS DADOS PARA O FIREBASE
        if (editMode) {
            // --- ATUALIZA O POST ---
            postData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
            db.collection('posts').doc(currentPostId).update(postData)
                .then(() => {
                    alert('Publicação atualizada com sucesso!');
                    window.location.href = 'hub.html';
                })
                .catch(error => {
                    alert(`ERRO AO ATUALIZAR: ${error.message}`);
                    console.error("Erro detalhado:", error);
                    submitButton.disabled = false;
                    submitButton.textContent = 'Atualizar';
                });
        } else {
            // --- CRIA UM NOVO POST ---
            postData.creatorId = user.uid;
            // Busca o nome do usuário no Firestore para garantir que está atualizado
            db.collection('users').doc(user.uid).get().then(userDoc => {
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    postData.authorName = userData.nomeCompleto || userData.nome; // Para PF
                    postData.fantasia = userData.fantasia; // Para PJ
                } else {
                    // Fallback caso não encontre o documento do usuário
                    postData.authorName = user.displayName || 'Usuário';
                }

                postData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                postData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

                db.collection('posts').add(postData)
                    .then(() => {
                        alert('Publicação criada com sucesso!');
                        window.location.href = 'hub.html';
                    })
                    .catch(error => {
                        alert(`ERRO AO PUBLICAR: ${error.message}`);
                        console.error("Erro detalhado:", error);
                        submitButton.disabled = false;
                        submitButton.textContent = 'Publicar';
                    });
            });
        }
    });
});