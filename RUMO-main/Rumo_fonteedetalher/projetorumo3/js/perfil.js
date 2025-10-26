document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DA PÁGINA ---
    const profilePicture = document.getElementById('profile-picture');
    const profileName = document.getElementById('profile-name');
    const profileUsername = document.getElementById('profile-username');
    const profileUserType = document.getElementById('profile-user-type'); // Elemento para o tipo (badge)
    const profileBio = document.getElementById('profile-bio');
    const myPostsSection = document.getElementById('my-posts-section');
    const userPostsContainer = document.getElementById('user-posts-container');

    // --- FUNÇÕES ---

    // Função para carregar posts do usuário (apenas se for PJ)
    const loadUserPosts = async (userId) => {
        if (!userId || !userPostsContainer) return;
        userPostsContainer.innerHTML = "A carregar publicações..."; // Feedback inicial

        try {
            const postsRef = firebase.firestore().collection("posts");
            const querySnapshot = await postsRef
                .where("creatorId", "==", userId)
                .orderBy("createdAt", "desc")
                .get();

            if (querySnapshot.empty) {
                userPostsContainer.innerHTML = "<p>Você ainda não fez nenhuma publicação.</p>";
                return;
            }

            userPostsContainer.innerHTML = ""; // Limpa a mensagem

            querySnapshot.forEach((doc) => {
                const post = doc.data();
                const postId = doc.id;
                const postElement = document.createElement("div");
                postElement.classList.add("info-card-wrapper", "simple-card");

                const postDate = post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'Data indisponível';
                
                postElement.innerHTML = `
                    <div class="info-card">
                         <img src="${post.image || 'https://placehold.co/300x150'}" alt="Imagem do post" class="card-image-small">
                         <div class="card-content-small">
                             <h5>${post.title || 'Sem Título'}</h5>
                             <div class="profile-post-actions">
                                <button class="btn-edit-post-profile" data-id="${postId}">Editar</button>
                                <button class="btn-delete-post-profile" data-id="${postId}">Apagar</button>
                             </div>
                         </div>
                    </div>
                `;
                userPostsContainer.appendChild(postElement);
            });

             // Listeners para botões de editar/apagar
             userPostsContainer.querySelectorAll('.btn-edit-post-profile').forEach(btn => {
                btn.onclick = () => window.location.href = `novo-post.html?id=${btn.dataset.id}`;
            });
            userPostsContainer.querySelectorAll('.btn-delete-post-profile').forEach(btn => {
                btn.onclick = () => {
                    if (confirm('Tem certeza que deseja apagar esta publicação?')) {
                        firebase.firestore().collection('posts').doc(btn.dataset.id).delete()
                          .then(() => btn.closest('.info-card-wrapper').remove())
                          .catch(err => alert('Erro ao apagar: ' + err.message));
                    }
                };
            });

        } catch (error) {
            console.error("Erro ao carregar posts do usuário:", error);
            userPostsContainer.innerHTML = "<p>Erro ao carregar publicações.</p>";
        }
    };

    // Função principal para carregar os dados do perfil
    const loadUserProfile = async (user) => {
        if (!user) return; // Sai se o objeto user for nulo

        const userDocRef = firebase.firestore().collection('users').doc(user.uid);
        let userData = null; // Variável para guardar os dados do Firestore

        try {
            const docSnap = await userDocRef.get();
            if (docSnap.exists) {
                userData = docSnap.data();
            } else {
                 console.warn("Documento do usuário não encontrado no Firestore. Usando dados do Auth como fallback.");
            }

            // --- 1. DEFINIR NOME ---
            // Prioridade: Firestore (nomeCompleto > nome) > Auth (displayName) > Fallback
            const firestoreName = userData?.nomeCompleto || userData?.nome; // Usa optional chaining (?.)
            const authName = user.displayName;
            const displayName = firestoreName || authName || "Nome não definido";
            if (profileName) profileName.textContent = displayName;

            // --- 2. DEFINIR USERNAME ---
            if (profileUsername) {
                profileUsername.textContent = userData?.username ? `@${userData.username}` : "@indefinido";
            }

            // --- 3. DEFINIR FOTO DE PERFIL ---
             if (profilePicture) {
                profilePicture.src = userData?.profilePicture || user.photoURL || 'assets/imagens/avatar-padrao.png';
            }

            // --- 4. DEFINIR BIO ---
            if (profileBio) {
                profileBio.textContent = userData?.bio || 'Edite o seu perfil para adicionar uma biografia.';
            }

            // --- 5. DEFINIR TIPO DE PERFIL (UserType) ---
            let userTypeText = "";
            let badgeClass = "";
            let showPosts = false;
            let finalUserType = userData?.userType; // Pega do Firestore se existir

            // --- REGRA DE NEGÓCIO: Login social É SEMPRE PF ---
            // Verifica se o login foi feito por rede social (Google, Facebook, etc.)
            const isSocialLogin = user.providerData.some(provider => 
                provider.providerId === 'google.com' || provider.providerId === 'facebook.com'
                // Adicione outros provedores sociais aqui se necessário (ex: 'twitter.com')
            );

            if (isSocialLogin) {
                // Se for login social, FORÇA ser Pessoa Física, mesmo que o Firestore diga outra coisa
                finalUserType = 'pf';
                console.log("Login social detectado, forçando userType para 'pf'.");
            } 
            // Fim da regra de negócio

            // Define o texto e a visibilidade dos posts baseado no 'finalUserType'
            if (finalUserType === 'pf') {
                userTypeText = 'Pessoa Física';
                badgeClass = 'badge-pf';
                showPosts = false;
            } else if (finalUserType === 'pj') {
                userTypeText = 'Pessoa Jurídica';
                badgeClass = 'badge-pj';
                showPosts = true;
            } else {
                // Se AINDA ASSIM for indefinido (nem Firestore, nem social)
                userTypeText = 'Tipo Indefinido';
                 // COMO MEDIDA DE SEGURANÇA: Se não sabe o tipo, não mostra posts
                showPosts = false; 
                console.warn("userType indefinido para o usuário:", user.uid);
                 // Tenta atualizar o userType no Firestore para 'pf' como padrão de segurança
                 if (!userData?.userType) { // Só atualiza se realmente não existir
                    userDocRef.set({ userType: 'pf' }, { merge: true })
                      .then(() => console.log("userType definido como 'pf' no Firestore por segurança."))
                      .catch(err => console.error("Erro ao definir userType padrão:", err));
                 }
            }

            if (profileUserType) {
                profileUserType.textContent = userTypeText;
                profileUserType.className = `user-type-badge ${badgeClass}`;
            }

            // --- Controla a exibição da seção de Posts ---
            if (myPostsSection) {
                myPostsSection.style.display = showPosts ? 'block' : 'none';
                if (showPosts) {
                    loadUserPosts(user.uid); // Passa o ID diretamente
                }
            }

        } catch (error) {
            console.error("Erro CRÍTICO ao carregar dados do perfil:", error);
            if (profileName) profileName.textContent = "Erro ao carregar";
            if (profileUserType) profileUserType.textContent = ""; // Limpa tipo em caso de erro
            if (myPostsSection) myPostsSection.style.display = 'none'; // Esconde posts em caso de erro
        }
    };

    // --- INICIALIZAÇÃO ---
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // Se o utilizador estiver logado, carrega o seu perfil
            loadUserProfile(user);
        } else {
            // Se não, redireciona para a página de login
            console.log("Usuário não logado, redirecionando...");
            window.location.href = 'auth.html'; // Redireciona para auth.html
        }
    });

     // --- Logout (Exemplo) ---
     const logoutButton = document.getElementById('logout-button'); // Certifique-se que este ID existe
     if(logoutButton) {
         logoutButton.addEventListener('click', () => {
             auth.signOut().then(() => {
                 window.location.href = 'index.html';
             }).catch((error) => {
                 console.error('Erro ao fazer logout:', error);
             });
         });
     }
});