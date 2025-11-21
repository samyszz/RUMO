document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('new-post-form');
    if (!form) return;

    // CLOUDINARY CONFIG (Seus dados)
    const CLOUDINARY_CLOUD_NAME = 'dssih4h24'; 
    const CLOUDINARY_UPLOAD_PRESET = 'rumo_preset'; 

    // QUILL
    const quill = new Quill('#editor-container', {
        modules: { toolbar: [ ['bold', 'italic', 'underline'], [{ 'list': 'ordered'}, { 'list': 'bullet' }], ['clean'] ] },
        theme: 'snow'
    });

    // CAMPOS GERAIS
    const postTitleField = document.getElementById('post-title');
    const postSourceLinkField = document.getElementById('post-sourceLink');
    const postCategoryField = document.getElementById('post-category');
    const postIdField = document.getElementById('post-id'); 
    const submitButton = form.querySelector('button[type="submit"]');

    // CAMPOS DE IMAGEM
    const radioUrl = document.querySelector('input[name="imageSource"][value="url"]');
    const radioUpload = document.querySelector('input[name="imageSource"][value="upload"]');
    const urlInputContainer = document.getElementById('url-input-container');
    const fileInputContainer = document.getElementById('file-input-container');
    const postImageField = document.getElementById('post-image'); 
    const postImageFile = document.getElementById('post-image-file'); 
    const filePreview = document.getElementById('file-preview');

    // NOVOS CAMPOS (CONTATO E LOCALIZAÇÃO)
    const extraFieldsContainer = document.getElementById('extra-fields-container');
    const contactTypeSelect = document.getElementById('contact-type');
    const contactValueInput = document.getElementById('contact-value');
    const contactIcon = document.getElementById('contact-icon');
    // Seleciona os campos de texto para endereço
    const postAddressField = document.getElementById('post-address'); 
    const postMapsLinkField = document.getElementById('post-maps-link'); 

    let editMode = false;
    let currentPostId = null;
    let currentUserData = null;
    let currentImageUrl = ''; 

    // --- LÓGICA VISUAL DE CATEGORIA ---
    function toggleExtraFields() {
        const cat = postCategoryField.value;
        if (cat === 'ong' || cat === 'governo') {
            extraFieldsContainer.style.display = 'block';
        } else {
            extraFieldsContainer.style.display = 'none';
        }
    }
    postCategoryField.addEventListener('change', toggleExtraFields);
    toggleExtraFields(); 

    // Troca ícone de contato
    contactTypeSelect.addEventListener('change', () => {
        const type = contactTypeSelect.value;
        if (type === 'whatsapp') contactIcon.className = 'fab fa-whatsapp';
        else if (type === 'email') contactIcon.className = 'fas fa-envelope';
        else contactIcon.className = 'fas fa-phone-alt';
    });

    // --- IMAGEM ---
    function toggleImageSource() {
        if (radioUpload.checked) {
            urlInputContainer.style.display = 'none';
            fileInputContainer.style.display = 'block';
        } else {
            urlInputContainer.style.display = 'block';
            fileInputContainer.style.display = 'none';
        }
    }
    radioUrl.addEventListener('change', toggleImageSource);
    radioUpload.addEventListener('change', toggleImageSource);

    postImageFile.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) { filePreview.innerHTML = `<img src="${e.target.result}">`; }
            reader.readAsDataURL(file);
        }
    });

    // --- AUTH ---
    auth.onAuthStateChanged(user => {
        if (user) {
            db.collection('users').doc(user.uid).get().then(doc => {
                if (doc.exists) {
                    currentUserData = doc.data();
                    if (currentUserData.userType !== 'pj') {
                        alert('Apenas Pessoas Jurídicas podem postar.');
                        window.location.href = 'hub.html';
                        return;
                    }
                    checkEditMode(user.uid);
                }
            });
        } else {
            window.location.href = 'auth.html';
        }
    });

    function checkEditMode(currentUserId) {
        const params = new URLSearchParams(window.location.search);
        currentPostId = params.get('id');
        if (currentPostId) {
            editMode = true;
            submitButton.textContent = 'Atualizar';
            db.collection('posts').doc(currentPostId).get().then(doc => {
                if (doc.exists) {
                    const post = doc.data();
                    if (post.creatorId !== currentUserId) return;
                    
                    postTitleField.value = post.title;
                    quill.root.innerHTML = post.description;
                    postCategoryField.value = post.category;
                    postSourceLinkField.value = post.sourceLink;
                    
                    currentImageUrl = post.image;
                    if(currentImageUrl) postImageField.value = currentImageUrl;

                    toggleExtraFields();

                    if (post.contactType) {
                        contactTypeSelect.value = post.contactType;
                        contactValueInput.value = post.contactValue;
                        contactTypeSelect.dispatchEvent(new Event('change'));
                    }
                    
                    // Preenche endereço e link se existirem
                    if (post.location) {
                        postAddressField.value = post.location.address || '';
                        postMapsLinkField.value = post.location.mapsLink || '';
                    }
                }
            });
        }
    }

    // --- UPLOAD CLOUDINARY ---
    async function uploadToCloudinary(file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET); 
        const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
        const res = await fetch(url, { method: 'POST', body: formData });
        const data = await res.json();
        return data.secure_url;
    }

    // --- SUBMIT ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user || !currentUserData || currentUserData.userType !== 'pj') return;

        const title = postTitleField.value.trim();
        const description = quill.root.innerHTML;
        const category = postCategoryField.value;
        const isOngGov = (category === 'ong' || category === 'governo');

        // VALIDAÇÃO OBRIGATÓRIA PARA ONG/GOVERNO
        if (isOngGov) {
            if (!contactValueInput.value.trim()) {
                alert('Para ONGs e Governo, o campo de CONTATO é obrigatório.');
                contactValueInput.focus();
                return;
            }
            if (!postAddressField.value.trim()) {
                alert('Para ONGs e Governo, o campo ENDEREÇO é obrigatório.');
                postAddressField.focus();
                return;
            }
            if (!postMapsLinkField.value.trim()) {
                alert('Para ONGs e Governo, o campo LINK DO GOOGLE MAPS é obrigatório.');
                postMapsLinkField.focus();
                return;
            }
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Processando...';
        
        let finalImageUrl = currentImageUrl;
        try {
            if (radioUpload.checked && postImageFile.files[0]) {
                submitButton.textContent = 'Enviando imagem...';
                finalImageUrl = await uploadToCloudinary(postImageFile.files[0]);
            } else if (!radioUpload.checked && postImageField.value.trim()) {
                finalImageUrl = postImageField.value.trim();
            }

            const postData = {
                title, description, category,
                image: finalImageUrl,
                sourceLink: postSourceLinkField.value.trim(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                fantasia: currentUserData.nome || currentUserData.nomeCompleto || "Organização"
            };

            // Adiciona dados extras se preenchidos
            if (contactValueInput.value.trim()) {
                postData.contactType = contactTypeSelect.value;
                postData.contactValue = contactValueInput.value.trim();
            }
            // Salva localização como texto e link (SEM LAT/LNG)
            if (postAddressField.value.trim()) {
                postData.location = {
                    address: postAddressField.value.trim(),
                    mapsLink: postMapsLinkField.value.trim()
                };
            }

            submitButton.textContent = 'Salvando...';

            if (editMode) {
                await db.collection('posts').doc(currentPostId).update(postData);
                alert('Atualizado!');
            } else {
                postData.creatorId = user.uid;
                postData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await db.collection('posts').add(postData);
                alert('Criado!');
            }
            window.location.href = 'hub.html';

        } catch (error) {
            console.error(error);
            alert('Erro: ' + error.message);
            submitButton.disabled = false;
        }
    });
});