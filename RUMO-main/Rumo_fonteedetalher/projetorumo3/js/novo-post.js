document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('new-post-form');
    if (!form) {
        console.error("ERRO: O formulário com id 'new-post-form' não foi encontrado.");
        return; 
    }

    // --- INICIALIZAÇÃO DO EDITOR DE TEXTO QUILL ---
    const toolbarOptions = [
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['clean']
    ];

    const quill = new Quill('#editor-container', {
        modules: {
            toolbar: toolbarOptions
        },
        theme: 'snow'
    });
    // --- FIM DA INICIALIZAÇÃO DO QUILL ---

    const postTitleField = document.getElementById('post-title');
    const postImageField = document.getElementById('post-image');
    const postSourceLinkField = document.getElementById('post-sourceLink');
    const postCategoryField = document.getElementById('post-category');
    const postIdField = document.getElementById('post-id'); // Campo oculto para ID de edição
    const submitButton = form.querySelector('button[type="submit"]');

    let editMode = false;
    let currentPostId = null;
    let currentUserData = null; // Guarda os dados do usuário logado

    // --- 1. VERIFICA AUTENTICAÇÃO E BUSCA DADOS DO USUÁRIO ---
    auth.onAuthStateChanged(user => {
        if (user) {
            // Usuário está logado, busca dados do Firestore
            db.collection('users').doc(user.uid).get().then(doc => {
                if (doc.exists) {
                    currentUserData = doc.data();
                    console.log("Dados do usuário PJ carregados:", currentUserData);

                    // --- REGRA DE NEGÓCIO: SÓ PJ PODE ESTAR AQUI ---
                    if (currentUserData.userType !== 'pj') {
                        alert('ERRO: Apenas Pessoas Jurídicas podem criar publicações.');
                        window.location.href = 'hub.html';
                        return; // Para a execução
                    }

                    // Se é PJ, continua para verificar se está em modo de edição
                    checkEditMode(user.uid);

                } else {
                    console.error("Documento do usuário não encontrado no Firestore! UID:", user.uid);
                    alert("Erro ao carregar dados do seu perfil. Tente novamente.");
                    window.location.href = 'hub.html';
                }
            }).catch(error => {
                 console.error("Erro ao buscar dados do usuário:", error);
                 alert("Erro ao carregar dados do seu perfil. Tente recarregar a página.");
                 window.location.href = 'hub.html';
            });
        } else {
             // Se não estiver logado, redireciona
            console.log("Usuário não logado, redirecionando para auth.html...");
            window.location.href = 'auth.html';
        }
    });

    // --- 2. FUNÇÃO PARA CARREGAR DADOS (SE ESTIVER EM MODO EDIÇÃO) ---
    function checkEditMode(currentUserId) {
        const params = new URLSearchParams(window.location.search);
        currentPostId = params.get('id');
        
        if (currentPostId) {
            editMode = true;
            if (submitButton) submitButton.textContent = 'Atualizar';
            
            // Carrega dados do post para edição
            db.collection('posts').doc(currentPostId).get().then(doc => {
                if (doc.exists) {
                    const post = doc.data();
                    // Verifica permissão
                    if (post.creatorId !== currentUserId) {
                        alert("Você não tem permissão para editar este post.");
                        window.location.href = 'hub.html';
                        return;
                    }
                    // Preenche o formulário
                    postTitleField.value = post.title || '';
                    quill.root.innerHTML = post.description || '';
                    postImageField.value = post.image || '';
                    postSourceLinkField.value = post.sourceLink || '';
                    postCategoryField.value = post.category || '';
                    postIdField.value = doc.id;
                } else {
                    alert("Erro: Post a ser editado não encontrado.");
                    window.location.href = 'hub.html';
                }
            }).catch(err => {
                console.error("Erro ao carregar post para edição:", err);
                window.location.href = 'hub.html';
            });
        }
    }

    // --- 3. LISTENER DE SUBMISSÃO DO FORMULÁRIO ---
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const user = auth.currentUser;
        
        // Validação final (usuário existe E dados do usuário (PJ) foram carregados)
        if (!user || !currentUserData || currentUserData.userType !== 'pj') {
            alert('ERRO: Você não tem permissão para publicar. Verifique se está logado como Pessoa Jurídica.');
            submitButton.disabled = false;
            return;
        }

        // Coleta os dados do formulário
        const postData = {
            title: postTitleField.value.trim(),
            description: quill.root.innerHTML,
            image: postImageField.value.trim(),
            sourceLink: postSourceLinkField.value.trim(),
            category: postCategoryField.value,
        };

        // Validação básica
        if (!postData.title || quill.getLength() <= 1) {
            alert('ERRO: O título e a descrição não podem estar vazios.');
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = editMode ? 'Atualizando...' : 'Publicando...';

        if (editMode && currentPostId) {
            // --- ATUALIZA O POST (Modo Edição) ---
            postData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

            db.collection('posts').doc(currentPostId).update(postData)
                .then(() => {
                    alert('Publicação atualizada com sucesso!');
                    window.location.href = 'hub.html';
                })
                .catch(error => {
                    alert(`ERRO AO ATUALIZAR: ${error.message}`);
                    submitButton.disabled = false;
                    submitButton.textContent = 'Atualizar';
                });
        } else {
            // --- CRIA UM NOVO POST ---
            postData.creatorId = user.uid;
            postData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            postData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

            // --- LÓGICA CORRIGIDA PARA SALVAR O NOME FANTASIA ---
            // Usamos 'nome' ou 'nomeCompleto' do currentUserData (que sabemos ser PJ)
            const nomeEmpresa = currentUserData.nome || currentUserData.nomeCompleto;

            if (nomeEmpresa && typeof nomeEmpresa === 'string' && nomeEmpresa.trim() !== '') {
                 postData.fantasia = nomeEmpresa.trim(); // SALVA NOME DA EMPRESA
                 postData.authorName = null; // Garante que authorName seja nulo
                 console.log(`Salvando NOVO post com Nome Fantasia: "${postData.fantasia}"`);
            } else {
                 // Fallback (se o nome da empresa estiver vazio no perfil)
                 postData.fantasia = "Organização Cadastrada"; 
                 postData.authorName = null;
                 console.warn("Não foi possível encontrar o nome da empresa no perfil (currentUserData.nome). Usando fallback.");
            }
            // --- FIM DA LÓGICA CORRIGIDA ---

            db.collection('posts').add(postData)
                .then(() => {
                    alert('Publicação criada com sucesso!');
                    window.location.href = 'hub.html';
                })
                .catch(error => {
                    alert(`ERRO AO PUBLICAR: ${error.message}`);
                    submitButton.disabled = false;
                    submitButton.textContent = 'Publicar';
                });
        }
    });
});