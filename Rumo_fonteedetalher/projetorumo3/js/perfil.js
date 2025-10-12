// js/perfil.js
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

    const loadUserPosts = async (user) => {
        if (!user) return;
        userPostsContainer.innerHTML = "A carregar publicações...";

        const postsRef = firebase.firestore().collection("posts");
        const querySnapshot = await postsRef
            .where("creatorId", "==", user.uid)
            .orderBy("createdAt", "desc")
            .get();

        if (querySnapshot.empty) {
            userPostsContainer.innerHTML = "<p>Você ainda não fez nenhuma publicação.</p>";
            return;
        }

        userPostsContainer.innerHTML = ""; // Limpa a mensagem

        querySnapshot.forEach((doc) => {
            const post = doc.data();
            const postElement = document.createElement("div");
            postElement.classList.add("info-card-wrapper"); // Usa a classe do hub para consistência

            const postDate = post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'Data indisponível';
            const descriptionSnippet = (post.description || '').replace(/<[^>]*>?/gm, "").substring(0, 150);

            postElement.innerHTML = `
                <div class="info-card">
                    <div class="info-card-header">
                        <span class="info-card-author">${post.authorName || post.fantasia || "Pessoa Jurídica"}</span>
                        <span class="info-card-topic">${post.category}</span>
                    </div>
                    <div class="info-card-body">
                        <img src="${post.image || 'https://placehold.co/600x300'}" alt="Imagem do post" class="card-image">
                        <h3>${post.title}</h3>
                        <p>${descriptionSnippet}...</p>
                    </div>
                    <div class="info-card-footer">
                        <span class="info-card-date">${postDate}</span>
                    </div>
                </div>
            `;
            userPostsContainer.appendChild(postElement);
        });
    };

    const loadUserProfile = async (user) => {
        if (!user) return;

        const userDocRef = firebase.firestore().collection('users').doc(user.uid);
        const docSnap = await userDocRef.get();

        if (docSnap.exists) {
            const userData = docSnap.data();

            // Preenche os dados visuais do perfil
            profilePicture.src = userData.photoURL || 'assets/imagens/avatar-padrao.png';
            profileName.textContent = userData.nomeCompleto || userData.nome || 'Nome não definido';
            profileUsername.textContent = `@${userData.username || userData.nome || user.uid.substring(0, 6)}`;
            profileBio.textContent = userData.bio || 'Edite o seu perfil para adicionar uma biografia.';
            
            // Lógica para o tipo de utilizador
            const userType = userData.userType;
            if (userType === 'pf') {
                profileUserType.textContent = 'Pessoa Física';
                if (myPostsSection) {
                    // Esconde a secção de posts se for Pessoa Física
                    myPostsSection.style.display = 'none';
                }
            } else if (userType === 'pj') {
                profileUserType.textContent = 'Pessoa Jurídica';
                if (myPostsSection) {
                    // Mostra a secção e carrega os posts se for Pessoa Jurídica
                    myPostsSection.style.display = 'block';
                    loadUserPosts(user);
                }
            }
        } else {
            console.error("Não foi possível encontrar os dados do perfil no Firestore!");
            profileName.textContent = "Perfil não encontrado";
        }
    };

    // --- INICIALIZAÇÃO ---
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // Se o utilizador estiver logado, carrega o seu perfil
            loadUserProfile(user);
        } else {
            // Se não, redireciona para a página de login
            window.location.href = 'login.html';
        }
    });
});