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

    // Submissão do formulário
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) {
            showNotification('Você precisa estar logado para editar o perfil.', true);
            return;
        }

        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'A salvar...';

        try {
            // ✅ CORREÇÃO: Inicia photoURL com o valor existente ou null.
            let photoURL = currentUserData.photoURL || null;

            // 1. Se uma nova foto foi selecionada, faz o upload
            if (newAvatarFile) {
                // Adicionado referência ao Firebase Storage
                const storage = firebase.storage();
                const storageRef = storage.ref(`profile_pictures/${currentUser.uid}/${newAvatarFile.name}`);
                const snapshot = await storageRef.put(newAvatarFile);
                photoURL = await snapshot.ref.getDownloadURL();
            }

            // 2. Prepara os dados para atualizar no Firestore
            const updatedData = {
                username: usernameInput.value,
                bio: bioTextarea.value,
                objectives: objectivesTextarea.value,
                contact: contactInput.value,
                photoURL: photoURL // Agora, este valor será a nova URL ou a URL antiga (ou null)
            };

            // 3. Atualiza o documento do utilizador
            const userDocRef = firebase.firestore().collection('users').doc(currentUser.uid);
            await userDocRef.update(updatedData);

            showNotification('Perfil atualizado com sucesso!');
            
            // Redireciona para a página de perfil após um breve momento
            setTimeout(() => {
                window.location.href = 'perfil.html';
            }, 1500);

        } catch (error) {
            console.error("Erro ao atualizar o perfil:", error);
            showNotification('Erro ao atualizar o perfil. Tente novamente.', true);
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar Alterações';
        }
    });
});