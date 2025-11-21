document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DA PÁGINA ---
    const profilePicture = document.getElementById('profile-picture');
    const profileName = document.getElementById('profile-name');
    const profileUsername = document.getElementById('profile-username');
    const profileUserType = document.getElementById('profile-user-type'); 
    const profileBio = document.getElementById('profile-bio');
    const myPostsSection = document.getElementById('my-posts-section');
    const userPostsContainer = document.getElementById('user-posts-container');

    // --- FUNÇÕES ---

    // Função para carregar posts do usuário
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

                // Alterado para usar a mesma estrutura de classes do HUB
                postElement.innerHTML = `
                    <div class="info-card">
                         <img src="${post.image || 'https://placehold.co/300x150'}" alt="Imagem do post" class="card-image-small">
                         <div class="card-content-small">
                             <h5>${post.title || 'Sem Título'}</h5>
                             
                             <div class="post-actions">
                                <button class="btn-edit" data-id="${postId}">Editar</button>
                                <button class="btn-delete" data-id="${postId}">Apagar</button>
                             </div>
                         </div>
                    </div>
                `;
                userPostsContainer.appendChild(postElement);
            });

             // Listeners atualizados para as novas classes
             userPostsContainer.querySelectorAll('.btn-edit').forEach(btn => {
                btn.onclick = () => window.location.href = `novo-post.html?id=${btn.dataset.id}`;
            });
            userPostsContainer.querySelectorAll('.btn-delete').forEach(btn => {
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

    // --- RENDERIZAÇÃO DO PERFIL ---
    const renderUserProfile = (user, userData) => {
        const firestoreName = userData?.nomeCompleto || userData?.nome;
        const authName = user.displayName;
        const displayName = firestoreName || authName || "Nome não definido";
        if (profileName) profileName.textContent = displayName;

        if (profileUsername) {
            profileUsername.textContent = userData?.username ? `@${userData.username}` : "@indefinido";
        }

         if (profilePicture) {
            profilePicture.src = userData?.photoURL || user.photoURL || 'assets/imagens/avatar-padrao.png';
        }

        if (profileBio) {
            profileBio.textContent = userData?.bio || 'Edite o seu perfil para adicionar uma biografia.';
        }

        let userTypeText = "";
        let badgeClass = "";
        let showPosts = false;
        let finalUserType = userData?.userType; 

        const isSocialLogin = user.providerData.some(provider => 
            provider.providerId === 'google.com' || provider.providerId === 'facebook.com'
        );

        if (isSocialLogin) {
            finalUserType = 'pf';
        } 
        
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
             if (!userData?.userType) {
                const userDocRef = firebase.firestore().collection('users').doc(user.uid);
                userDocRef.set({ userType: 'pf' }, { merge: true })
                  .catch(err => console.error("Erro ao definir userType padrão:", err));
             }
        }

        if (profileUserType) {
            profileUserType.textContent = userTypeText;
            profileUserType.className = `user-type-badge ${badgeClass}`;
        }

        if (myPostsSection) {
            const isCurrentlyShowing = myPostsSection.style.display === 'block';
            if (showPosts && !isCurrentlyShowing) {
                 myPostsSection.style.display = 'block';
                 loadUserPosts(user.uid); 
            } else if (!showPosts) {
                 myPostsSection.style.display = 'none';
            }
        }
    };

    // --- INICIALIZAÇÃO ---
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            const userDocRef = firebase.firestore().collection('users').doc(user.uid);
            userDocRef.onSnapshot((docSnap) => {
                let userData = null;
                if (docSnap.exists) {
                    userData = docSnap.data();
                } 
                renderUserProfile(user, userData);
            }, (error) => {
                console.error("Erro ao carregar perfil:", error);
            });
        } else {
            window.location.href = 'auth.html'; 
        }
    });

     const logoutButton = document.getElementById('logout-button');
     if(logoutButton) {
         logoutButton.addEventListener('click', () => {
             auth.signOut().then(() => {
                 window.location.href = 'index.html';
             });
         });
     }
});