// js/hub.js - Versão Corrigida e Segura

document.addEventListener("DOMContentLoaded", () => {
    // --- ELEMENTOS DO DOM ---
    const hubFeedContainer = document.getElementById("hub-feed-container");
    const searchInput = document.querySelector(".search-bar input");
    const filterBtn = document.getElementById("filter-btn-icon");
    const filterOptions = document.getElementById("filter-options");
    const filterLinks = document.querySelectorAll(".filter-option");

    // --- ESTADO DA APLICAÇÃO ---
    let currentUser = null;
    let currentUserData = null;
    let allPostsData = [];
    let currentFilter = "all";
    let currentSearchTerm = "";

    // --- INICIALIZAÇÃO ---
    firebase.auth().onAuthStateChanged(async (user) => {
        currentUser = user;
        if (user) {
            try {
                const userDoc = await firebase.firestore().collection("users").doc(user.uid).get();
                if (userDoc.exists) {
                    currentUserData = userDoc.data();
                }
            } catch (e) {
                console.error("Erro ao buscar dados do usuário:", e);
            }
        } else {
            currentUserData = null;
        }
        
        // Atualiza a interface (esconde/mostra botão de postar)
        updateUIBasedOnAuth();
        
        // Carrega as publicações
        loadPosts();
    });

    // --- FUNÇÕES GLOBAIS (Acessíveis pelo HTML) ---
    window.contactOrganization = function(type, value) {
        let userName = "visitante";
        if (currentUserData) userName = currentUserData.nome || currentUserData.nomeCompleto || userName;
        
        const message = `Olá, meu nome é ${userName}, vi sua publicação na plataforma R.U.M.O e gostaria de mais informações.`;
        
        if (type === 'whatsapp') {
            window.open(`https://wa.me/${value.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
        } else if (type === 'email') {
            window.location.href = `mailto:${value}?subject=Contato via RUMO&body=${encodeURIComponent(message)}`;
        } else {
            window.location.href = `tel:${value}`;
        }
    };

    window.openLocationMap = function(mapsLink, address) {
        if (mapsLink && mapsLink.trim() !== "") {
            window.open(mapsLink, '_blank');
        } else if (address) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
        } else {
            alert('Localização não disponível.');
        }
    };

    // --- OUVINTE DE IDIOMA (Recarrega posts ao mudar idioma) ---
    window.addEventListener('languageChanged', () => {
        if (allPostsData.length > 0) {
            hubFeedContainer.style.opacity = '0.5';
            renderFilteredAndSearchedPosts().then(() => {
                hubFeedContainer.style.opacity = '1';
            });
        }
    });

    // --- CARREGAMENTO DE DADOS ---
    const loadPosts = () => {
        if (!hubFeedContainer) return;
        
        firebase.firestore().collection("posts")
            .orderBy("createdAt", "desc")
            .onSnapshot(async (snapshot) => {
                if (snapshot.empty) {
                    const noPostsText = await i18n.translateText("Ainda não há publicações.");
                    hubFeedContainer.innerHTML = `<p style="text-align:center; padding:20px;">${noPostsText}</p>`;
                    return;
                }
                
                allPostsData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    data: doc.data(),
                    commentCount: doc.data().commentCount || 0
                }));
                
                await renderFilteredAndSearchedPosts();
            }, (error) => {
                console.error("Erro ao carregar posts: ", error);
            });
    };

    // --- RENDERIZAÇÃO ---
    const renderFilteredAndSearchedPosts = async () => {
        hubFeedContainer.innerHTML = "";
        
        const postsToRender = allPostsData.filter((postInfo) => {
            const post = postInfo.data;
            const matchesFilter = currentFilter === "all" || (post.category || "noticia") === currentFilter;
            
            const searchTerm = currentSearchTerm.toLowerCase();
            // Remove tags HTML da descrição para buscar apenas no texto
            const descriptionText = post.description ? post.description.replace(/<[^>]*>?/gm, "") : "";
            
            const matchesSearch = searchTerm === "" || 
                (post.title && post.title.toLowerCase().includes(searchTerm)) ||
                (descriptionText && descriptionText.toLowerCase().includes(searchTerm)) ||
                (post.authorName && post.authorName.toLowerCase().includes(searchTerm));

            return matchesFilter && matchesSearch;
        });

        if (postsToRender.length === 0) {
            const noFilterText = await i18n.translateText("Nenhuma publicação encontrada.");
            hubFeedContainer.innerHTML = `<p style="text-align:center; padding:20px;">${noFilterText}</p>`;
        } else {
            for (const postInfo of postsToRender) {
                await renderPost(postInfo);
            }
        }
    };

    const renderPost = async (postInfo) => {
        const { id: postId, data: post, commentCount } = postInfo;
        const postElement = document.createElement("div");
        postElement.className = "info-card-wrapper";

        // Preparação de Textos e Traduções
        let displayTitle = post.title;
        let cleanDesc = post.description ? post.description.replace(/<[^>]*>?/gm, "") : "";
        let snippetText = cleanDesc.substring(0, 200); 

        // Se o idioma não for PT, traduz o título e o resumo
        if (!i18n.currentLang.startsWith('pt')) {
           displayTitle = await i18n.translateText(post.title);
           snippetText = await i18n.translateText(snippetText);
        }
        
        const descriptionPreview = snippetText.length > 150 ? snippetText.substring(0, 150) + "..." : snippetText;
        
        // Textos dos botões traduzidos
        const viewMoreText = await i18n.translateText("Ver mais");
        const editBtnText = await i18n.translateText("Editar");
        const deleteBtnText = await i18n.translateText("Apagar");
        
        // Botões de Gerenciamento (Apenas para o dono do post)
        const managementButtons = currentUser && currentUser.uid === post.creatorId ? `
            <div class="post-actions">
                <button class="btn-edit" data-id="${postId}"><i class="fas fa-edit"></i> ${editBtnText}</button>
                <button class="btn-delete" data-id="${postId}"><i class="fas fa-trash"></i> ${deleteBtnText}</button>
            </div>` : "";

        const postDate = post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : "";
        
        // Interações (Likes/Salvos)
        const likes = post.likes || [];
        const isLiked = currentUser && likes.includes(currentUser.uid);
        const isSaved = (currentUserData && currentUserData.savedPosts && currentUserData.savedPosts.includes(postId));

        const interactionsHTML = `
            <div class="info-card-interactions">
                <div class="interaction-item">
                    <button class="${isLiked ? "btn-like liked" : "btn-like"}" data-id="${postId}">
                        <i class="${isLiked ? "fas fa-heart" : "far fa-heart"}"></i>
                    </button>
                    <span class="like-count">${likes.length}</span>
                </div>
                <div class="interaction-item">
                    <button class="btn-comment" data-id="${postId}"><i class="far fa-comment"></i></button>
                    <span class="comment-count">${commentCount}</span>
                </div>
                 <div class="interaction-item">
                    <button class="btn-save ${isSaved ? "saved" : ""}" data-id="${postId}">
                        <i class="${isSaved ? "fas fa-bookmark" : "far fa-bookmark"}"></i>
                    </button>
                </div>
            </div>`;

        postElement.innerHTML = `
            <div class="info-card">
                <div class="info-card-header">
                    <span class="info-card-author" onclick="window.location.href='perfil-usuario.html?id=${post.creatorId}'">
                        ${post.authorName || post.fantasia || "Usuário RUMO"}
                    </span>
                    <span class="info-card-topic">${post.category || "Geral"}</span>
                </div>
                ${managementButtons}
                <div class="info-card-body">
                    <img src="${post.image || "assets/imagens/banner3 (2).png"}" alt="Imagem do post" class="card-image" onerror="this.src='assets/imagens/banner3 (2).png'">
                    <h3>${displayTitle}</h3>
                    <p class="post-description-preview">${descriptionPreview}</p>
                    <button class="btn-ver-mais" data-id="${postId}">${viewMoreText}</button>
                </div>
                <div class="info-card-footer">
                    <span class="info-card-date">${postDate}</span>
                    ${currentUser ? interactionsHTML : ""}
                </div>
            </div>`;
        
        hubFeedContainer.appendChild(postElement);
    };

    // --- CORREÇÃO DA LÓGICA DE UI (ESCONDER BOTÃO DE POSTAR) ---
   // js/hub.js - Substitua a função updateUIBasedOnAuth por esta:

const updateUIBasedOnAuth = () => {
    const btnNewPost = document.getElementById("btn-new-post");
    
    // REGRA DE OURO: Na dúvida, esconde.
    // 1. Se não carregou os dados ainda -> Esconde
    // 2. Se o usuário não tem tipo definido -> Esconde
    // 3. Se o usuário É 'pf' -> Esconde
    if (!currentUserData || !currentUserData.userType || currentUserData.userType === 'pf') {
        if (btnNewPost) btnNewPost.style.display = "none";
    } else {
        // Só mostra se tiver certeza que é PJ, ONG ou Governo
        if (btnNewPost) btnNewPost.style.display = "block";
    }
};

    // --- EVENT LISTENERS (Delegação de Eventos) ---
    hubFeedContainer.addEventListener("click", (e) => {
        const targetButton = e.target.closest("button");
        if (!targetButton) return;
        
        const postId = targetButton.dataset.id;
        
        if (targetButton.classList.contains("btn-delete")) {
            if (confirm("Tem certeza que deseja apagar esta publicação?")) {
                firebase.firestore().collection("posts").doc(postId).delete();
            }
        } else if (targetButton.classList.contains("btn-edit")) {
            window.location.href = `novo-post.html?id=${postId}`;
        } else if (targetButton.classList.contains("btn-like")) {
            toggleLike(postId);
        } else if (targetButton.classList.contains("btn-comment")) {
            openCommentSection(postId);
        } else if (targetButton.classList.contains("btn-ver-mais")) {
            openVerMaisModal(postId);
        } else if (targetButton.classList.contains("btn-save")) {
            toggleSavePost(postId, targetButton);
        }
    });

    // Busca
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            currentSearchTerm = e.target.value;
            clearTimeout(window.searchTimeout);
            window.searchTimeout = setTimeout(() => {
                renderFilteredAndSearchedPosts();
            }, 500);
        });
    }

    // Filtros
    filterLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            currentFilter = link.getAttribute("data-filter");
            filterOptions.classList.remove("active"); 
            renderFilteredAndSearchedPosts();
        });
    });

    if (filterBtn) {
        filterBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            filterOptions.classList.toggle("active");
        });
    }

    window.addEventListener("click", () => {
        if (filterOptions) filterOptions.classList.remove("active");
    });

    // --- MODAL "VER MAIS" ---
    async function openVerMaisModal(postId) {
        const postInfo = allPostsData.find((p) => p.id === postId);
        if (postInfo) {
            const btn = document.querySelector(`button[data-id="${postId}"].btn-ver-mais`);
            const originalText = btn.textContent;
            btn.textContent = "..."; 
            btn.disabled = true;
            try {
                await renderVerMaisModal(postInfo);
            } finally {
                btn.textContent = originalText; 
                btn.disabled = false;
            }
        }
    }

    async function renderVerMaisModal(postInfo) {
        const { data: post } = postInfo;
        const existingModal = document.getElementById("ver-mais-modal");
        if (existingModal) existingModal.remove();

        let displayTitle = post.title;
        let displayContent = post.description;
        
        if (!i18n.currentLang.startsWith('pt')) {
            displayTitle = await i18n.translateText(post.title);
            // Tradução simples do conteúdo (limpando HTML para evitar quebra na API de tradução)
            // Se precisar manter formatação rica traduzida, seria necessária uma lógica mais complexa.
            displayContent = await i18n.translateText(post.description.replace(/<[^>]*>?/gm, " ")); 
        }

        const hasContact = post.contactType && post.contactValue;
        const hasLocation = post.location && (post.location.address || post.location.mapsLink);
        
        let contactBtn = hasContact ? `<button onclick="window.contactOrganization('${post.contactType}', '${post.contactValue}')" title="Contato" class="modal-action-btn contact"><i class="fas fa-${post.contactType === 'whatsapp' ? 'whatsapp' : (post.contactType === 'email' ? 'envelope' : 'phone-alt')}"></i></button>` : '';
        let locationBtn = hasLocation ? `<button onclick="window.openLocationMap('${post.location.mapsLink || ''}', '${post.location.address || ''}')" title="Mapa" class="modal-action-btn location"><i class="fas fa-map-marker-alt"></i></button>` : '';
        
        const sourceBtnText = await i18n.translateText("Ver Fonte Oficial");

        const modalHTML = `
            <div class="ver-mais-modal-backdrop" id="ver-mais-modal">
                <div class="ver-mais-modal-content">
                    <div class="ver-mais-modal-header">
                        <h4>${displayTitle}</h4>
                        <button class="close-modal-btn">×</button>
                    </div>
                    <div class="ver-mais-modal-body">
                        <img src="${post.image || "assets/imagens/banner3 (2).png"}" class="ver-mais-modal-image" onerror="this.src='assets/imagens/banner3 (2).png'">
                        <div class="ql-snow"><div class="ql-editor">${displayContent}</div></div>
                        ${post.location && post.location.address ? `<p class="modal-address"><i class="fas fa-map-pin"></i> ${post.location.address}</p>` : ''}
                    </div>
                    <div class="ver-mais-modal-footer">
                        <div class="modal-actions-left">${contactBtn}${locationBtn}</div>
                        ${post.sourceLink ? `<a href="${post.sourceLink}" target="_blank" class="btn btn-primary btn-source">${sourceBtnText}</a>` : ''}
                    </div>
                </div>
            </div>`;
            
        document.body.insertAdjacentHTML("beforeend", modalHTML);
        const modal = document.getElementById("ver-mais-modal");
        
        // Pequeno delay para permitir transição CSS
        setTimeout(() => modal.classList.add("active"), 10);
        
        const closeModal = () => {
            modal.classList.remove("active");
            setTimeout(() => modal.remove(), 300);
        };
        
        modal.querySelector(".close-modal-btn").addEventListener("click", closeModal);
        modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
    }

    // --- LIKES E SALVOS ---
    async function toggleLike(postId) {
        if (!currentUser) return alert("Faça login para curtir.");
        const postRef = firebase.firestore().collection("posts").doc(postId);
        
        try {
            const postDoc = await postRef.get();
            if (!postDoc.exists) return;
            
            const likes = postDoc.data().likes || [];
            const action = likes.includes(currentUser.uid) ? "arrayRemove" : "arrayUnion";
            
            await postRef.update({ 
                likes: firebase.firestore.FieldValue[action](currentUser.uid) 
            });
        } catch (error) {
            console.error("Erro ao curtir:", error);
        }
    }

    async function toggleSavePost(postId, buttonElement) {
        if (!currentUser) return alert("Faça login para salvar.");
        
        const userRef = firebase.firestore().collection("users").doc(currentUser.uid);
        
        try {
            const doc = await userRef.get();
            if (!doc.exists) return;
            
            const saved = doc.data().savedPosts || [];
            const isSaved = saved.includes(postId);
            
            await userRef.update({
                savedPosts: firebase.firestore.FieldValue[isSaved ? 'arrayRemove' : 'arrayUnion'](postId)
            });
            
            // Atualiza UI instantaneamente
            buttonElement.classList.toggle("saved", !isSaved);
            buttonElement.querySelector("i").className = !isSaved ? "fas fa-bookmark" : "far fa-bookmark";
            
            // Atualiza cache local
            if (currentUserData) {
                if (isSaved) {
                    currentUserData.savedPosts = currentUserData.savedPosts.filter(id => id !== postId);
                } else {
                    if (!currentUserData.savedPosts) currentUserData.savedPosts = [];
                    currentUserData.savedPosts.push(postId);
                }
            }
        } catch (error) {
            console.error("Erro ao salvar post:", error);
        }
    }

    // --- COMENTÁRIOS ---
    async function openCommentSection(postId) {
        if (!currentUser) return alert("Faça login para comentar.");
        await renderCommentModal(postId);
    }

    async function renderCommentModal(postId) {
        const existingModal = document.getElementById("comment-modal");
        if (existingModal) existingModal.remove();

        let title = "Comentários";
        let emptyMsg = "Seja o primeiro a comentar!";
        let placeholder = "Adicione um comentário...";
        let btnText = "Postar";
        
        if (!i18n.currentLang.startsWith('pt')) {
            [title, emptyMsg, placeholder, btnText] = await Promise.all([
                i18n.translateText(title),
                i18n.translateText(emptyMsg),
                i18n.translateText(placeholder),
                i18n.translateText(btnText)
            ]);
        }

        const modalHTML = `
            <div class="comment-modal-backdrop" id="comment-modal">
                <div class="comment-modal-content">
                    <div class="comment-modal-header"><h4>${title}</h4><button class="close-modal-btn">×</button></div>
                    <ul class="comment-list"><p class="comment-loading">${await i18n.translateText("Carregando...")}</p></ul>
                    <form class="comment-form">
                        <input type="text" placeholder="${placeholder}" required />
                        <button type="submit" class="btn btn-primary">${btnText}</button>
                    </form>
                </div>
            </div>`;
            
        document.body.insertAdjacentHTML("beforeend", modalHTML);
        const modal = document.getElementById("comment-modal");
        setTimeout(() => modal.classList.add("active"), 10);
        
        const closeModal = () => { modal.classList.remove("active"); setTimeout(() => modal.remove(), 300); };
        modal.querySelector(".close-modal-btn").addEventListener("click", closeModal);
        modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
        
        modal.querySelector(".comment-form").addEventListener("submit", async (e) => {
            e.preventDefault();
            const input = e.target.querySelector("input");
            if (input.value.trim()) {
                await postComment(postId, input.value.trim());
                input.value = "";
            }
        });
        
        loadComments(postId, emptyMsg);
    }

    function loadComments(postId, emptyMsgTranslated) {
        const commentList = document.querySelector("#comment-modal .comment-list");
        if (!commentList) return;
        
        firebase.firestore().collection("posts").doc(postId).collection("comments")
            .orderBy("timestamp", "asc")
            .onSnapshot(async (snapshot) => {
                if (snapshot.empty) {
                    commentList.innerHTML = `<p class="comment-list-empty">${emptyMsgTranslated}</p>`;
                    return;
                }
                
                commentList.innerHTML = "";
                for (const doc of snapshot.docs) {
                    const comment = doc.data();
                    const commentItem = document.createElement("li");
                    commentItem.className = "comment-item";
                    
                    let commentText = comment.text;
                    if (!i18n.currentLang.startsWith('pt')) {
                        commentText = await i18n.translateText(commentText);
                    }
                    
                    commentItem.innerHTML = `
                        <img src="${comment.userPhotoURL || "assets/imagens/avatar-padrao.png"}" class="comment-avatar" onerror="this.src='assets/imagens/avatar-padrao.png'">
                        <div class="comment-body">
                            <span class="comment-author" onclick="window.location.href='perfil-usuario.html?id=${comment.userId}'">
                                ${comment.userName}
                            </span>
                            <p class="comment-text">${commentText}</p>
                        </div>`;
                    commentList.appendChild(commentItem);
                }
            });
    }

    async function postComment(postId, text) {
        if (!currentUser || !currentUserData) return;
        
        const userName = currentUserData.nomeCompleto || currentUserData.nome || "Usuário";
        const commentData = {
            text,
            userId: currentUser.uid,
            userName,
            userPhotoURL: currentUserData.photoURL || null,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        try {
            await firebase.firestore().runTransaction(async (transaction) => {
                const postRef = firebase.firestore().collection("posts").doc(postId);
                transaction.set(postRef.collection("comments").doc(), commentData);
                transaction.update(postRef, {
                    commentCount: firebase.firestore.FieldValue.increment(1)
                });
            });
        } catch (error) {
            console.error("Erro ao comentar:", error);
            alert("Erro ao enviar comentário.");
        }
    }
});