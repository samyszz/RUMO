// js/editar-perfil.js

document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DO DOM ---
    const form = document.getElementById('edit-profile-form');
    const avatarPreview = document.getElementById('profile-avatar-preview');
    const photoUploadInput = document.getElementById('photo-upload');
    const usernameInput = document.getElementById('username');
    const bioTextarea = document.getElementById('bio');
    const objectivesTextarea = document.getElementById('objectives');
    const contactInput = document.getElementById('contact');

    let currentUser = null;
    let currentUserData = null;
    let newAvatarFile = null;

    // --- CARREGAR DADOS INICIAIS ---
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            const userDocRef = firebase.firestore().collection('users').doc(user.uid);
            const docSnap = await userDocRef.get();

            if (docSnap.exists) {
                currentUserData = docSnap.data();
                
                // Preenche o formulário com os dados existentes
                avatarPreview.src = currentUserData.photoURL || 'assets/imagens/avatar-padrao.png';
                usernameInput.value = currentUserData.username || '';
                bioTextarea.value = currentUserData.bio || '';
                objectivesTextarea.value = currentUserData.objectives || '';
                contactInput.value = currentUserData.contact || '';
            }
        } else {
            window.location.href = 'login.html';
        }
    });

    // --- EVENT LISTENERS ---

    // Pré-visualização da nova imagem de perfil
    photoUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            newAvatarFile = file;
            const reader = new FileReader();
            reader.onload = (event) => {
                avatarPreview.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Submissão do formulário (MODIFICADO PARA CLOUDINARY + ALERTS)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) {
            // CORREÇÃO: Trocado 'showNotification' por 'alert'
            alert('Você precisa estar logado para editar o perfil.');
            return;
        }

        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'A salvar...';

        // --- Configuração Cloudinary ---

        // !!!!! ATENÇÃO !!!!!
        // Substitua 'dssih4h24' pelo seu Cloud Name se estiver errado.
        // Substitua 'SEU_UPLOAD_PRESET' pelo nome EXATO do seu preset "Unsigned".
        const CLOUDINARY_CLOUD_NAME = 'dssih4h24'; 
        const CLOUDINARY_UPLOAD_PRESET = 'rumo_preset'; 
        const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

        try {
    // CORREÇÃO AQUI:
    // Verifica se currentUserData existe antes de tentar ler a propriedade.
    let photoURL = (currentUserData && currentUserData.photoURL) ? currentUserData.photoURL : null;

            // 1. Se uma nova foto foi selecionada, faz o upload para o Cloudinary
            if (newAvatarFile) {
                
                // Log de debug para verificar o preset
                console.log(`A tentar upload para Cloudinary com preset: ${CLOUDINARY_UPLOAD_PRESET}`);

                const formData = new FormData();
                formData.append('file', newAvatarFile);
                formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

                const response = await fetch(CLOUDINARY_URL, {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    const data = await response.json();
                    photoURL = data.secure_url; 
                } else {
                    const errorData = await response.json();
                    console.error('Erro ao fazer upload para o Cloudinary:', errorData);
                    // O erro 400 (Bad Request) geralmente é um 'upload_preset' errado ou não 'unsigned'.
                    throw new Error('Falha no upload da nova imagem. Verifique o console e o "upload_preset".');
                }
            }

            // 2. Prepara os dados para atualizar no Firestore
            const updatedData = {
                username: usernameInput.value,
                bio: bioTextarea.value,
                objectives: objectivesTextarea.value,
                contact: contactInput.value,
                photoURL: photoURL 
            };

            // 3. Atualiza o documento do utilizador no Firestore
            const userDocRef = firebase.firestore().collection('users').doc(currentUser.uid);
            await userDocRef.update(updatedData);

            // CORREÇÃO: Trocado 'showNotification' por 'alert'
            alert('Perfil atualizado com sucesso!');
            
            setTimeout(() => {
                window.location.href = 'perfil.html';
            }, 1500);

        } catch (error) {
            console.error("Erro ao atualizar o perfil:", error);
            // CORREÇÃO: Trocado 'showNotification' por 'alert'
            alert(error.message || 'Erro ao atualizar o perfil. Tente novamente.');
            
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar Alterações';
        }
    });
});