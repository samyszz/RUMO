document.addEventListener('DOMContentLoaded', () => {
    const loginItem = document.getElementById('nav-login-item');
    const profileItem = document.getElementById('nav-profile-item');
    const profileBubble = document.getElementById('profile-bubble');
    const profileBubbleImg = document.getElementById('profile-bubble-img');
    const newPostButton = document.getElementById('btn-new-post');

    auth.onAuthStateChanged(user => {
        if (user) {
            // --- USUÁRIO ESTÁ LOGADO ---
            if (loginItem) loginItem.style.display = 'none';
            if (profileItem) profileItem.style.display = 'list-item';
            if (profileBubble) profileBubble.style.display = 'block';

            // --- BUSCAR DADOS DO USUÁRIO NO FIRESTORE ---
            db.collection('users').doc(user.uid).get().then(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    const userType = userData.userType;
                    // Salva o tipo de usuário no localStorage
                    localStorage.setItem('userType', userType);

                    // Atualiza a imagem da bolha de perfil, se existir
                    if (profileBubbleImg && userData.profilePicture) {
                        profileBubbleImg.src = userData.profilePicture;
                    }

                    // Controla a visibilidade do botão de "Nova Publicação"
                    if (newPostButton) {
                        if (userType === 'pj') {
                            newPostButton.style.display = 'inline-flex';
                        } else {
                            newPostButton.style.display = 'none';
                        }
                    }
                } else {
                    console.log("Documento do usuário não encontrado!");
                    localStorage.removeItem('userType');
                    if (newPostButton) newPostButton.style.display = 'none';
                }
            }).catch(error => {
                if (error.code === 'unavailable' || error.message.includes('offline') || error.message.includes('network-request-failed')) {
                    console.warn("Aplicação offline. Usando dados do cache se disponíveis.");
                    const existingUserType = localStorage.getItem('userType');
                    if (newPostButton) {
                         newPostButton.style.display = existingUserType === 'pj' ? 'inline-flex' : 'none';
                    }
                } else {
                    console.error("Erro ao buscar dados do usuário:", error);
                    localStorage.removeItem('userType');
                    if (newPostButton) newPostButton.style.display = 'none';
                }
            });

        } else {
            // --- USUÁRIO DESLOGADO ---
            if (loginItem) loginItem.style.display = 'list-item';
            if (profileItem) profileItem.style.display = 'none';
            if (profileBubble) profileBubble.style.display = 'none';
            
            localStorage.removeItem('userType');
            if (newPostButton) newPostButton.style.display = 'none';
        }
    });
});
