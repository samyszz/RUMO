






























































// js/perfil-usuario.js

// Usando o SDK v8 global do Firebase, compatível com seu projeto
document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DA PÁGINA ---
    const profileName = document.getElementById('profile-name');
    const profileBio = document.getElementById('profile-bio');
    const profileAvatar = document.getElementById('profile-avatar');
    const feedContainer = document.getElementById('profile-feed-container');
    const followBtn = document.getElementById('follow-btn'); // Botão correto do HTML

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
            alert("ID de usuário não encontrado na URL.");
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
            profileBio.textContent = data.bio || 'Sem biografia.';
            if (data.photoURL) profileAvatar.src = data.photoURL;

            // Set username with @ prefix to logged-in user's username
            const profileUsername = document.getElementById('profile-username');
            if (profileUsername) {
                if (currentUserId) {
                    const currentUserRef = firebase.firestore().collection("users").doc(currentUserId);
                    currentUserRef.get().then((doc) => {
                        if (doc.exists) {
                            const currentUserData = doc.data();
                            profileUsername.textContent = '@' + (currentUserData.username || 'usuario');
                        } else {
                            profileUsername.textContent = '@usuario';
                        }
                    }).catch(() => {
                        profileUsername.textContent = '@usuario';
                    });
                } else {
                    profileUsername.textContent = '@usuario';
                }
            }

            // Set user type badge with green dot
            const profileUserType = document.getElementById('profile-user-type');
            if (profileUserType) {
                // Map userType codes to full names
                const userTypeMap = {
                    'pj': 'Pessoa Jurídica',
                    'pf': 'Pessoa Física'
                };
                const userTypeText = userTypeMap[data.userType] || data.userType || '';
                profileUserType.textContent = userTypeText;
                profileUserType.style.display = userTypeText ? 'inline-block' : 'none';
            }

            // Lógica para mostrar e configurar o botão "Seguir"
            // Mostra apenas se for um perfil de PJ e não for o perfil do próprio usuário
            if (currentUserId && currentUserId !== profileUserId && data.userType === 'pj') {
                followBtn.style.display = 'block';
                if ((data.followers || []).includes(currentUserId)) {
                    followBtn.textContent = 'Deixar de Seguir';
                    followBtn.classList.add('unfollow-btn');
                } else {
                    followBtn.textContent = 'Seguir';
                    followBtn.classList.remove('unfollow-btn');
                }
            } else {
                followBtn.style.display = 'none'; // Garante que o botão fique escondido em perfis PF
            }
        } else {
            console.error("Usuário não encontrado no Firestore!");
            alert("Usuário não encontrado!");
        }
    }

    async function carregarPostsDoUsuario() {
        feedContainer.innerHTML = 'Carregando publicações...';
        const postsRef = firebase.firestore().collection("posts");
        const querySnapshot = await postsRef.where("creatorId", "==", profileUserId).orderBy("createdAt", "desc").get();

        if (querySnapshot.empty) {
            feedContainer.innerHTML = '<p>Este usuário ainda não fez nenhuma publicação.</p>';
            return;
        }

        feedContainer.innerHTML = '';
        querySnapshot.forEach((docSnap) => {
            const post = docSnap.data();
            const postElement = document.createElement('div');
            postElement.classList.add('info-card-wrapper'); // Reutiliza a classe do hub para consistência

            const postDate = post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : '';

            postElement.innerHTML = `
                <div class="info-card">
                    <div class="info-card-header">
                        <span class="info-card-author">${post.authorName || post.fantasia || 'Usuário'}</span>
                        <span class="info-card-date">${postDate}</span>
                    </div>
                    <div class="info-card-body">
                         ${post.image ? `<img src="${post.image}" alt="Imagem do post" class="card-image">` : ''}
                        <h3>${post.title}</h3>
                        <p>${(post.description || '').substring(0, 150)}...</p>
                    </div>
                </div>
            `;
            feedContainer.appendChild(postElement);
        });
    }

    async function toggleFollow() {
        if (!currentUserId) {
            alert('Você precisa estar logado para seguir alguém.');
            return;
        }
        const loggedInUserRef = firebase.firestore().collection("users").doc(currentUserId);
        const profileUserRef = firebase.firestore().collection("users").doc(profileUserId);

        const profileDoc = await profileUserRef.get();
        const isFollowing = (profileDoc.data().followers || []).includes(currentUserId);
        const updateAction = isFollowing ? 'arrayRemove' : 'arrayUnion';

        try {
            // Atualiza a lista de 'seguindo' do usuário logado
            await loggedInUserRef.update({ following: firebase.firestore.FieldValue[updateAction](profileUserId) });
            // Atualiza a lista de 'seguidores' do perfil visitado
            await profileUserRef.update({ followers: firebase.firestore.FieldValue[updateAction](currentUserId) });

            // Recarrega os dados do perfil para atualizar a contagem e o texto do botão
            await carregarDadosDoPerfil();
        } catch (error) {
            console.error("Erro ao seguir/deixar de seguir:", error);
            alert("Ocorreu um erro. Tente novamente.");
        }
    }

    // Adiciona o evento de clique diretamente no botão
    if (followBtn) {
        followBtn.addEventListener('click', toggleFollow);
    }

    async function showFollowListModal(userId, listType) {
        const userRef = firebase.firestore().collection("users").doc(userId);
        const userSnap = await userRef.get();
        if (!userSnap.exists()) return;

        const userData = userSnap.data();
        const idList = listType === 'followers' ? (userData.followers || []) : (userData.following || []);
        const modalTitle = listType === 'followers' ? 'Seguidores' : 'Seguindo';

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
            listBody.innerHTML = `<p class="follow-list-empty">Nenhum usuário encontrado.</p>`;
            return;
        }

        listBody.innerHTML = `<p class="follow-list-empty">Carregando...</p>`;
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