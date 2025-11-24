document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const db = firebase.firestore();
    
    // Elementos da Navbar
    const loginItem = document.getElementById('nav-login-item');
    const profileItem = document.getElementById('nav-profile-item');
    const profileBubble = document.getElementById('profile-bubble');
    const profileBubbleImg = document.getElementById('profile-bubble-img');
    const newPostButton = document.getElementById('btn-new-post');
    const navUl = document.querySelector('#main-nav ul'); // Referência à lista do menu

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

                    // --- LÓGICA DO MENU PAINEL (PJ) ---
                    const existingPanelLink = document.getElementById('nav-painel-item');

                    // Se for PJ e o link ainda não existir, cria
                    if (userType === 'pj') {
                        if (!existingPanelLink && navUl) {
                            const li = document.createElement('li');
                            li.id = 'nav-painel-item';
                            // Insere o link. A classe create-account-btn é opcional, remove se quiser link simples.
                            li.innerHTML = '<a href="dashboard.html" style="font-weight: bold; color: var(--primary-color);">Painel</a>';
                            
                            // Insere antes do botão "Meu Perfil" se existir, para organização
                            if(profileItem) {
                                navUl.insertBefore(li, profileItem);
                            } else {
                                navUl.appendChild(li);
                            }
                        }
                        
                        // Botão de Nova Publicação (HUB)
                        if (newPostButton) newPostButton.style.display = 'inline-flex';
                    
                    } else {
                        // Se NÃO for PJ (ex: PF) e o link existir, remove
                        if (existingPanelLink) existingPanelLink.remove();
                        if (newPostButton) newPostButton.style.display = 'none';
                    }

                } else {
                    console.log("Documento do usuário não encontrado!");
                    localStorage.removeItem('userType');
                    if (newPostButton) newPostButton.style.display = 'none';
                }
            }).catch(error => {
                // Tratamento offline
                if (error.code === 'unavailable' || error.message.includes('offline') || error.message.includes('network-request-failed')) {
                    console.warn("Aplicação offline. Usando dados do cache.");
                    const existingUserType = localStorage.getItem('userType');
                    
                    if (existingUserType === 'pj') {
                        if (newPostButton) newPostButton.style.display = 'inline-flex';
                        // Tenta recriar o menu se estiver offline e soubermos que é PJ
                        const existingPanelLink = document.getElementById('nav-painel-item');
                        if (!existingPanelLink && navUl) {
                            const li = document.createElement('li');
                            li.id = 'nav-painel-item';
                            li.innerHTML = '<a href="dashboard.html" style="font-weight: bold;">Painel</a>';
                            navUl.insertBefore(li, profileItem);
                        }
                    } else {
                        if (newPostButton) newPostButton.style.display = 'none';
                    }
                } else {
                    console.error("Erro ao buscar dados do usuário:", error);
                }
            });

        } else {
            // --- USUÁRIO DESLOGADO ---
            if (loginItem) loginItem.style.display = 'list-item';
            if (profileItem) profileItem.style.display = 'none';
            if (profileBubble) profileBubble.style.display = 'none';
            
            // Remove botão Painel se existir
            const existingPanelLink = document.getElementById('nav-painel-item');
            if (existingPanelLink) existingPanelLink.remove();

            localStorage.removeItem('userType');
            if (newPostButton) newPostButton.style.display = 'none';
        }
    });
});