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

    // Função para carregar posts do usuário (sem alterações)
    const loadUserPosts = async (userId) => {
        if (!userId || !userPostsContainer) return;
        userPostsContainer.innerHTML = "A carregar publicações..."; 

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

            userPostsContainer.innerHTML = ""; 

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

             // Listeners (sem alterações)
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

    // --- INÍCIO DA MODIFICAÇÃO ---

    // Função principal para *renderizar* os dados do perfil
    // Esta função será chamada pelo listener sempre que os dados mudarem
    const renderUserProfile = (user, userData) => {
        
        // --- 1. DEFINIR NOME ---
        const firestoreName = userData?.nomeCompleto || userData?.nome;
        const authName = user.displayName;
        const displayName = firestoreName || authName || "Nome não definido";
        if (profileName) profileName.textContent = displayName;

        // --- 2. DEFINIR USERNAME ---
        if (profileUsername) {
            profileUsername.textContent = userData?.username ? `@${userData.username}` : "@indefinido";
        }

        // --- 3. DEFINIR FOTO DE PERFIL ---
        // AGORA VAI ATUALIZAR EM TEMPO REAL
         if (profilePicture) {
            profilePicture.src = userData?.photoURL || user.photoURL || 'assets/imagens/avatar-padrao.png';
        }

        // --- 4. DEFINIR BIO ---
        if (profileBio) {
            profileBio.textContent = userData?.bio || 'Edite o seu perfil para adicionar uma biografia.';
        }

        // --- 5. DEFINIR TIPO DE PERFIL (UserType) ---
        let userTypeText = "";
        let badgeClass = "";
        let showPosts = false;
        let finalUserType = userData?.userType; 

        // --- REGRA DE NEGÓCIO: Login social É SEMPRE PF ---
        const isSocialLogin = user.providerData.some(provider => 
            provider.providerId === 'google.com' || provider.providerId === 'facebook.com'
        );

        if (isSocialLogin) {
            finalUserType = 'pf';
            // Não precisa mais do console.log daqui
        } 
        
        // Define o texto e a visibilidade dos posts
        if (finalUserType === 'pf') {
            userTypeText = 'Pessoa Física';
            badgeClass = 'badge-pf';
            showPosts = false;
        } else if (finalUserType === 'pj') {
            userTypeText = 'Pessoa Jurídica';
            badgeClass = 'badge-pj';
            showPosts = true;
        } else {
            userTypeText = 'Tipo Indefinido';
            showPosts = false; 
            console.warn("userType indefinido para o usuário:", user.uid);
             if (!userData?.userType) {
                // Define 'pf' como padrão no Firestore se não existir
                const userDocRef = firebase.firestore().collection('users').doc(user.uid);
                userDocRef.set({ userType: 'pf' }, { merge: true })
                  .catch(err => console.error("Erro ao definir userType padrão:", err));
             }
        }

        if (profileUserType) {
            profileUserType.textContent = userTypeText;
            profileUserType.className = `user-type-badge ${badgeClass}`;
        }

        // --- Controla a exibição da seção de Posts ---
        if (myPostsSection) {
            // Verifica se o estado mudou antes de recarregar os posts
            const isCurrentlyShowing = myPostsSection.style.display === 'block';
            if (showPosts && !isCurrentlyShowing) {
                 myPostsSection.style.display = 'block';
                 loadUserPosts(user.uid); // Passa o ID diretamente
            } else if (!showPosts) {
                 myPostsSection.style.display = 'none';
            }
        }
    };

    // --- INICIALIZAÇÃO (MODIFICADA PARA USAR LISTENER) ---
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // Se o utilizador estiver logado, "ouve" as alterações do perfil
            const userDocRef = firebase.firestore().collection('users').doc(user.uid);
            
            // SUBSTITUÍMOS .get() POR .onSnapshot()
            userDocRef.onSnapshot((docSnap) => {
                let userData = null;
                if (docSnap.exists) {
                    userData = docSnap.data();
                } else {
                    console.warn("Documento do usuário não encontrado no Firestore. Usando dados do Auth como fallback.");
                }
                
                // Renderiza o perfil com os dados (do cache ou do servidor)
                // Isto será executado novamente quando os dados do servidor chegarem!
                renderUserProfile(user, userData);

            }, (error) => {
                // Trata erros do listener
                console.error("Erro CRÍTICO ao carregar dados do perfil:", error);
                if (profileName) profileName.textContent = "Erro ao carregar";
                if (profileUserType) profileUserType.textContent = ""; 
                if (myPostsSection) myPostsSection.style.display = 'none';
            });

        } else {
            // Se não, redireciona para a página de login
            console.log("Usuário não logado, redirecionando...");
            window.location.href = 'auth.html'; 
        }
    });
    // --- FIM DA MODIFICAÇÃO ---


     // --- Logout (Exemplo - sem alterações) ---
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