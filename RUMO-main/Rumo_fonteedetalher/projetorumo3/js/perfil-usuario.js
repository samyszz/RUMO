// js/perfil-usuario.js

document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DA PÁGINA ---
    const profileName = document.getElementById('profile-name');
    const profileBio = document.getElementById('profile-bio');
    const profileAvatar = document.getElementById('profile-avatar');
    const feedContainer = document.getElementById('profile-feed-container');
    const followBtn = document.getElementById('follow-btn');

    let currentUserId = null;
    let profileUserId = null;

    // --- INICIALIZAÇÃO ---
    const params = new URLSearchParams(window.location.search);
    profileUserId = params.get('id');

    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            currentUserId = user.uid;
        }

        if (!profileUserId) {
            alert(await i18n.translateText("ID de usuário não encontrado na URL."));
            window.location.href = 'hub.html';
            return;
        }
        // Redireciona para o perfil principal se o ID for do próprio usuário
        if (profileUserId === currentUserId) {
            window.location.href = 'perfil.html';
            return;
        }

        await carregarDadosDoPerfil();
        await carregarPostsDoUsuario();
    });

    // --- FUNÇÕES ---

    async function carregarDadosDoPerfil() {
        const docRef = firebase.firestore().collection("users").doc(profileUserId);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            const data = docSnap.data();
            const displayName = data.nomeCompleto || data.nome || 'Usuário';

            profileName.textContent = displayName;
            
            // TRADUÇÃO DA BIOGRAFIA
            let bioText = data.bio || 'Sem biografia.';
            if (i18n && !i18n.currentLang.startsWith('pt')) {
                // Se a bio existir, traduz. Se for o placeholder, traduz também.
                bioText = await i18n.translateText(bioText);
            }
            profileBio.textContent = bioText;

            if (data.photoURL) profileAvatar.src = data.photoURL;

            // CORREÇÃO: Mostra o username do PERFIL VISITADO (data), não do usuário logado
            const profileUsername = document.getElementById('profile-username');
            if (profileUsername) {
                profileUsername.textContent = '@' + (data.username || 'usuario');
            }

            // TRADUÇÃO DO TIPO DE USUÁRIO
            const profileUserType = document.getElementById('profile-user-type');
            if (profileUserType) {
                const userTypeMap = {
                    'pj': 'Pessoa Jurídica',
                    'pf': 'Pessoa Física'
                };
                let userTypeText = userTypeMap[data.userType] || data.userType || '';
                
                if (userTypeText) {
                    userTypeText = await i18n.translateText(userTypeText);
                }
                
                profileUserType.textContent = userTypeText;
                profileUserType.style.display = userTypeText ? 'inline-block' : 'none';
            }

            // TRADUÇÃO DO BOTÃO SEGUIR
            if (currentUserId && currentUserId !== profileUserId && data.userType === 'pj') {
                followBtn.style.display = 'block';
                if ((data.followers || []).includes(currentUserId)) {
                    followBtn.textContent = await i18n.translateText('Deixar de Seguir');
                    followBtn.classList.add('unfollow-btn');
                } else {
                    followBtn.textContent = await i18n.translateText('Seguir');
                    followBtn.classList.remove('unfollow-btn');
                }
            } else {
                followBtn.style.display = 'none';
            }
        } else {
            console.error("Usuário não encontrado no Firestore!");
            alert(await i18n.translateText("Usuário não encontrado!"));
        }
    }

    async function carregarPostsDoUsuario() {
        feedContainer.innerHTML = await i18n.translateText('Carregando publicações...');
        
        const postsRef = firebase.firestore().collection("posts");
        const querySnapshot = await postsRef.where("creatorId", "==", profileUserId).orderBy("createdAt", "desc").get();

        if (querySnapshot.empty) {
            const emptyMsg = await i18n.translateText('Este usuário ainda não fez nenhuma publicação.');
            feedContainer.innerHTML = `<p>${emptyMsg}</p>`;
            return;
        }

        feedContainer.innerHTML = '';
        
        // Renderiza os posts (usando loop for...of para permitir await na tradução)
        for (const docSnap of querySnapshot.docs) {
            const post = docSnap.data();
            const postElement = document.createElement('div');
            postElement.classList.add('info-card-wrapper');

            const postDate = post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : '';
            
            // TRADUÇÃO DO TÍTULO E DESCRIÇÃO
            let displayTitle = post.title;
            let displayDesc = (post.description || '').substring(0, 150) + '...';
            
            if (!i18n.currentLang.startsWith('pt')) {
                displayTitle = await i18n.translateText(displayTitle);
                displayDesc = await i18n.translateText((post.description || '').substring(0, 150));
                displayDesc += '...';
            }

            postElement.innerHTML = `
                <div class="info-card">
                    <div class="info-card-header">
                        <span class="info-card-author">${post.authorName || post.fantasia || 'Usuário'}</span>
                        <span class="info-card-date">${postDate}</span>
                    </div>
                    <div class="info-card-body">
                         ${post.image ? `<img src="${post.image}" alt="Imagem do post" class="card-image">` : ''}
                        <h3>${displayTitle}</h3>
                        <p>${displayDesc}</p>
                    </div>
                </div>
            `;
            feedContainer.appendChild(postElement);
        }
    }

    async function toggleFollow() {
        if (!currentUserId) {
            alert(await i18n.translateText('Você precisa estar logado para seguir alguém.'));
            return;
        }
        const loggedInUserRef = firebase.firestore().collection("users").doc(currentUserId);
        const profileUserRef = firebase.firestore().collection("users").doc(profileUserId);

        const profileDoc = await profileUserRef.get();
        const isFollowing = (profileDoc.data().followers || []).includes(currentUserId);
        const updateAction = isFollowing ? 'arrayRemove' : 'arrayUnion';

        try {
            await loggedInUserRef.update({ following: firebase.firestore.FieldValue[updateAction](profileUserId) });
            await profileUserRef.update({ followers: firebase.firestore.FieldValue[updateAction](currentUserId) });

            await carregarDadosDoPerfil();
        } catch (error) {
            console.error("Erro ao seguir/deixar de seguir:", error);
            alert(await i18n.translateText("Ocorreu um erro. Tente novamente."));
        }
    }

    if (followBtn) {
        followBtn.addEventListener('click', toggleFollow);
    }

    // Modal de Seguidores/Seguindo (Se existir na interface)
    async function showFollowListModal(userId, listType) {
        const userRef = firebase.firestore().collection("users").doc(userId);
        const userSnap = await userRef.get();
        if (!userSnap.exists()) return;

        const userData = userSnap.data();
        const idList = listType === 'followers' ? (userData.followers || []) : (userData.following || []);
        
        let modalTitle = listType === 'followers' ? 'Seguidores' : 'Seguindo';
        modalTitle = await i18n.translateText(modalTitle);

        const backdrop = document.createElement('div');
        backdrop.className = 'follow-list-modal-backdrop';
        backdrop.innerHTML = `
            <div class="follow-list-modal-content">
                <div class="follow-list-header">
                    <h4>${modalTitle}</h4>
                    <button class="close-modal-btn">&times;</button>
                </div>
                <div class="follow-list-body"></div>
            </div>
        `;
        document.body.appendChild(backdrop);

        const listBody = backdrop.querySelector('.follow-list-body');
        const closeModal = () => backdrop.remove();

        backdrop.querySelector('.close-modal-btn').addEventListener('click', closeModal);
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) closeModal();
        });

        if (idList.length === 0) {
            listBody.innerHTML = `<p class="follow-list-empty">${await i18n.translateText("Nenhum usuário encontrado.")}</p>`;
            return;
        }

        listBody.innerHTML = `<p class="follow-list-empty">${await i18n.translateText("Carregando...")}</p>`;
        const usersDocs = await Promise.all(idList.map(id => firebase.firestore().collection("users").doc(id).get()));

        listBody.innerHTML = '';
        usersDocs.forEach(docSnap => {
            if (docSnap.exists()) {
                const followUserData = docSnap.data();
                const followUserId = docSnap.id;
                const displayName = followUserData.nomeCompleto || followUserData.nome || 'Usuário';

                const userItem = document.createElement('a');
                userItem.className = 'follow-list-item';
                userItem.href = followUserId === currentUserId ? 'perfil.html' : `perfil-usuario.html?id=${followUserId}`;

                userItem.innerHTML = `
                    <img src="${followUserData.photoURL || 'assets/imagens/avatar-padrao.png'}" alt="Avatar">
                    <span>${displayName}</span>
                `;
                listBody.appendChild(userItem);
            }
        });
    }
});