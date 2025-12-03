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
        userPostsContainer.innerHTML = await i18n.translateText("Carregando publicações..."); // TRADUZIDO

        try {
            const postsRef = firebase.firestore().collection("posts");
            const querySnapshot = await postsRef
                .where("creatorId", "==", userId)
                .orderBy("createdAt", "desc")
                .get();

            if (querySnapshot.empty) {
                userPostsContainer.innerHTML = `<p>${await i18n.translateText("Você ainda não fez nenhuma publicação.")}</p>`; // TRADUZIDO
                return;
            }

            userPostsContainer.innerHTML = ""; 

            // Loop para renderizar posts
            // (Nota: Como é loop, não vamos traduzir título por título aqui para não estourar a API, 
            // a não ser que seja necessário. O HUB já faz isso.)
            for (const doc of querySnapshot.docs) {
                const post = doc.data();
                const postId = doc.id;
                const postElement = document.createElement("div");
                postElement.classList.add("info-card-wrapper", "simple-card");

                // Traduz o título se não for português
                let displayTitle = post.title || 'Sem Título';
                if (!i18n.currentLang.startsWith('pt')) {
                    displayTitle = await i18n.translateText(displayTitle);
                }

                postElement.innerHTML = `
                    <div class="info-card">
                         <img src="${post.image || 'https://placehold.co/300x150'}" alt="Imagem do post" class="card-image-small">
                         <div class="card-content-small">
                             <h5>${displayTitle}</h5>
                             
                             <div class="post-actions">
                                <button class="btn-edit" data-id="${postId}">${await i18n.translateText("Editar")}</button>
                                <button class="btn-delete" data-id="${postId}">${await i18n.translateText("Apagar")}</button>
                             </div>
                         </div>
                    </div>
                `;
                userPostsContainer.appendChild(postElement);
            }

             userPostsContainer.querySelectorAll('.btn-edit').forEach(btn => {
                btn.onclick = () => window.location.href = `novo-post.html?id=${btn.dataset.id}`;
            });
            userPostsContainer.querySelectorAll('.btn-delete').forEach(btn => {
                btn.onclick = async () => {
                    const confirmMsg = await i18n.translateText('Tem certeza que deseja apagar esta publicação?');
                    if (confirm(confirmMsg)) {
                        firebase.firestore().collection('posts').doc(btn.dataset.id).delete()
                          .then(() => btn.closest('.info-card-wrapper').remove())
                          .catch(err => alert('Erro: ' + err.message));
                    }
                };
            });

        } catch (error) {
            console.error("Erro ao carregar posts do usuário:", error);
            userPostsContainer.innerHTML = "<p>Erro ao carregar publicações.</p>";
        }
    };

    // --- RENDERIZAÇÃO DO PERFIL ---
    const renderUserProfile = async (user, userData) => {
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
            let bioText = userData?.bio || 'Edite o seu perfil para adicionar uma biografia.';
            // Traduz a bio ou o placeholder padrão
            if (i18n && !i18n.currentLang.startsWith('pt')) {
                bioText = await i18n.translateText(bioText);
            }
            profileBio.textContent = bioText;
        }

        let userTypeText = "";
        let badgeClass = "";
        let showPosts = false;
        let finalUserType = userData?.userType; 

        const isSocialLogin = user.providerData.some(provider => 
            provider.providerId === 'google.com' || provider.providerId === 'facebook.com'
        );

        if (isSocialLogin) finalUserType = 'pf';
        
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
                userDocRef.set({ userType: 'pf' }, { merge: true }).catch(console.error);
             }
        }

        if (profileUserType) {
            // AQUI ESTÁ A CORREÇÃO: Traduz o tipo de usuário
            const translatedType = await i18n.translateText(userTypeText);
            profileUserType.textContent = translatedType;
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
                if (docSnap.exists) userData = docSnap.data();
                renderUserProfile(user, userData);
            }, (error) => console.error("Erro ao carregar perfil:", error));
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

// Mantive o resto do Dashboard igual, pois o usuário não reclamou dele especificamente,
// mas a lógica seria a mesma se precisar traduzir "Seguidores", etc.
async function carregarDashboard(user) {
    if (!user) return;
    const elSeguidores = document.getElementById('dash-seguidores');
    const elAlcance = document.getElementById('dash-alcance');
    const elEngajamento = document.getElementById('dash-engajamento');
    const elPalavras = document.getElementById('dash-palavras');
    const elPeriodo = document.getElementById('dash-periodo');

    const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
    const userData = userDoc.data();
    if(elSeguidores) elSeguidores.innerText = userData.followers ? userData.followers.length : 0;

    const postsSnapshot = await firebase.firestore().collection('posts').where('creatorId', '==', user.uid).get();
    let totalAlcance = 0;
    let totalEngajamento = 0;
    let textoCompleto = "";
    let postsPorData = {};

    postsSnapshot.forEach(doc => {
        const post = doc.data();
        totalAlcance += (post.views || 0);
        totalEngajamento += (post.likes ? post.likes.length : 0) + (post.commentCount || 0);
        textoCompleto += ` ${post.title} ${post.description}`;
        if (post.createdAt) {
            const data = new Date(post.createdAt.seconds * 1000);
            const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`;
            if (!postsPorData[mesAno]) postsPorData[mesAno] = 0;
            postsPorData[mesAno] += (post.views || 0);
        }
    });

    if(elAlcance) elAlcance.innerText = totalAlcance;
    if(elEngajamento) elEngajamento.innerText = totalEngajamento;
    if(elPalavras && textoCompleto) {
       // Lógica de palavras (mantida)
       elPalavras.innerText = "Carregando..."; 
    }
    if(elPeriodo) {
        const topPeriodo = Object.entries(postsPorData).sort((a, b) => b[1] - a[1])[0];
        elPeriodo.innerText = topPeriodo ? `${topPeriodo[0]} (${topPeriodo[1]} views)` : "Sem dados";
    }
}
firebase.auth().onAuthStateChanged((user) => { if (user) carregarDashboard(user); });