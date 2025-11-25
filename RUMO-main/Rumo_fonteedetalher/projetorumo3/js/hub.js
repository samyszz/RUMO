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
      const userDoc = await firebase.firestore().collection("users").doc(user.uid).get();
      if (userDoc.exists) {
        currentUserData = userDoc.data();
      }
    } else {
      currentUserData = null;
    }
    updateUIBasedOnAuth();
    loadPosts();
  });

  // --- FUNÇÕES GLOBAIS PARA O MODAL ---
  
  window.contactOrganization = function(type, value) {
      let userName = "um visitante";
      if (currentUserData && (currentUserData.nome || currentUserData.nomeCompleto)) {
          userName = currentUserData.nome || currentUserData.nomeCompleto;
      }

      const message = `Olá, meu nome é ${userName}, eu sou um imigrante no Brasil. Vim através do seu post feito na plataforma R.U.M.O e gostaria de mais informações.`;
      
      if (type === 'whatsapp') {
          const cleanPhone = value.replace(/\D/g, '');
          const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
          window.open(url, '_blank');
      } else if (type === 'email') {
          const subject = "Contato via Plataforma R.U.M.O";
          const url = `mailto:${value}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
          window.location.href = url;
      } else {
          window.location.href = `tel:${value}`;
      }
  };

  // Função INTELIGENTE de mapa: Usa Link se tiver, senão busca pelo Endereço
  window.openLocationMap = function(mapsLink, address) {
      if (mapsLink && mapsLink.trim() !== "") {
          window.open(mapsLink, '_blank');
      } else if (address && address.trim() !== "") {
          // Cria link de busca do Google Maps com o endereço
          const query = encodeURIComponent(address);
          window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
      } else {
          alert('Localização não disponível.');
      }
  };

  // --- OUVINTE DE MUDANÇA DE IDIOMA ---
  window.addEventListener('languageChanged', () => {
      if (allPostsData.length > 0) {
          hubFeedContainer.style.opacity = '0.5'; 
          renderFilteredAndSearchedPosts().then(() => {
              hubFeedContainer.style.opacity = '1';
          });
      }
  });

  // --- LÓGICA DE TRADUÇÃO ---
  async function fetchTranslation(text, isoCode) {
      try {
          const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=pt&tl=${isoCode}&dt=t&q=${encodeURIComponent(text)}`;
          const res = await fetch(url);
          const data = await res.json();
          if (data && data[0]) {
              return data[0].map(part => part[0]).join('');
          }
      } catch (e) {
          console.warn("Google falhou, tentando backup...", e);
      }

      try {
          const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=pt|${isoCode}`;
          const res = await fetch(url);
          const data = await res.json();
          const translated = data.responseData.translatedText;
          if (translated.includes("MYMEMORY WARNING") || translated.includes("ISIT HTTPS")) {
              return text; 
          }
          return translated;
      } catch (e) {
          return text;
      }
  }

  async function translateText(text, targetLang) {
    if (!text || text.trim().length === 0) return text;
    const isoCode = targetLang.split('-')[0];
    if (isoCode === 'pt') return text;

    const CHUNK_SIZE = 1000; 
    if (text.length <= CHUNK_SIZE) {
        return await fetchTranslation(text, isoCode);
    }

    const sentences = text.match(/[^.!?]+[.!?]+|\s*$/g) || [text];
    const chunks = [];
    let currentChunk = "";

    for (const sentence of sentences) {
        if ((currentChunk + sentence).length > CHUNK_SIZE) {
            chunks.push(currentChunk);
            currentChunk = sentence;
        } else {
            currentChunk += sentence;
        }
    }
    if (currentChunk.trim()) chunks.push(currentChunk);

    const translatedChunks = await Promise.all(
        chunks.map(chunk => fetchTranslation(chunk, isoCode))
    );

    return translatedChunks.join(" ");
  }

  async function translateHtmlContent(htmlString, targetLang) {
    const isoCode = targetLang.split('-')[0];
    if (isoCode === 'pt' || !htmlString) return htmlString;

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];
    let node;

    while(node = walker.nextNode()) {
        if (node.nodeValue.trim().length > 0) {
            textNodes.push(node);
        }
    }

    await Promise.all(textNodes.map(async (textNode) => {
        const translatedText = await translateText(textNode.nodeValue, targetLang);
        textNode.nodeValue = translatedText;
    }));

    return doc.body.innerHTML;
  }

  // --- CARREGAMENTO DE DADOS ---
  const loadPosts = () => {
    if (!hubFeedContainer) return;

    firebase.firestore().collection("posts").orderBy("createdAt", "desc").onSnapshot(
        async (snapshot) => {
          hubFeedContainer.innerHTML = "";
          if (snapshot.empty) {
            const currentLang = localStorage.getItem('rumo_lang') || 'pt-brasil';
            const noPostsText = currentLang.startsWith('en') ? "No posts yet." : 
                               currentLang.startsWith('es') ? "Aún no hay publicaciones." :
                               "Ainda não há publicações.";
            hubFeedContainer.innerHTML = `<p>${noPostsText}</p>`;
            return;
          }

          allPostsData = await Promise.all(
            snapshot.docs.map(async (doc) => {
              const commentsSnapshot = await firebase.firestore().collection("posts").doc(doc.id).collection("comments").get();
              return { id: doc.id, data: doc.data(), commentCount: commentsSnapshot.size };
            })
          );

          await renderFilteredAndSearchedPosts();
        },
        (error) => console.error("Erro ao carregar os posts: ", error)
      );
  };

  // --- RENDERIZAÇÃO ---
  const renderFilteredAndSearchedPosts = async () => {
    hubFeedContainer.innerHTML = "";
    const postsToRender = allPostsData.filter((postInfo) => {
      const post = postInfo.data;
      const matchesFilter = currentFilter === "all" || (post.category || "noticia") === currentFilter;
      const searchTerm = currentSearchTerm.toLowerCase();
      const descriptionText = post.description ? post.description.replace(/<[^>]*>?/gm, "") : "";
      const matchesSearch = searchTerm === "" || 
        (post.title && post.title.toLowerCase().includes(searchTerm)) ||
        (descriptionText && descriptionText.toLowerCase().includes(searchTerm)) ||
        (post.authorName && post.authorName.toLowerCase().includes(searchTerm));
      return matchesFilter && matchesSearch;
    });

    if (postsToRender.length === 0) {
      const currentLang = localStorage.getItem('rumo_lang') || 'pt-brasil';
      const noFilterText = currentLang.startsWith('en') ? "No posts found." : 
                          currentLang.startsWith('es') ? "No se encontraron publicaciones." :
                          "Nenhuma publicação encontrada.";
      hubFeedContainer.innerHTML = `<p>${noFilterText}</p>`;
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

    const currentLang = localStorage.getItem('rumo_lang') || 'pt-brasil';
    let displayTitle = post.title;
    let cleanDesc = post.description ? post.description.replace(/<[^>]*>?/gm, "") : "";
    let snippetText = cleanDesc.substring(0, 200); 

    if (!currentLang.startsWith('pt')) {
       displayTitle = await translateText(post.title, currentLang);
       snippetText = await translateText(snippetText, currentLang);
    }
    
    const descriptionPreview = snippetText.length > 150 ? snippetText.substring(0, 150) + "..." : snippetText;
    const viewMoreText = currentLang.startsWith('en') ? "Read more" : currentLang.startsWith('es') ? "Ver más" : "Ver mais";
    
    const managementButtons = currentUser && currentUser.uid === post.creatorId ? `
            <div class="post-actions">
                <button class="btn-edit" data-id="${postId}">Editar</button>
                <button class="btn-delete" data-id="${postId}">Apagar</button>
            </div>` : "";

    const postDate = post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : "Data indisponível";
    const likes = post.likes || [];
    const isLiked = currentUser && likes.includes(currentUser.uid);
    const savedPosts = (currentUserData && currentUserData.savedPosts) || [];
    const isSaved = savedPosts.includes(postId);

    

    const interactionsHTML = `
            <div class="info-card-interactions">
                <div class="interaction-item">
                    <button class="${isLiked ? "btn-like liked" : "btn-like"}" data-id="${postId}"><i class="${isLiked ? "fas fa-heart" : "far fa-heart"}"></i></button>
                    <span class="like-count">${likes.length}</span>
                </div>
                <div class="interaction-item">
                    <button class="btn-comment" data-id="${postId}"><i class="far fa-comment"></i></button>
                    <span class="comment-count">${commentCount}</span>
                </div>
                 <div class="interaction-item">
                    <button class="btn-save ${isSaved ? "saved" : ""}" data-id="${postId}"><i class="${isSaved ? "fas fa-bookmark" : "far fa-bookmark"}"></i></button>
                </div>
            </div>`;

    postElement.innerHTML = `
            <div class="info-card">
                <div class="info-card-header">
                    <span class="info-card-author" style="cursor:pointer;" onclick="window.location.href='perfil-usuario.html?id=${post.creatorId}'">${post.authorName || post.fantasia || "Pessoa Jurídica"}</span>
                    <span class="info-card-topic">${post.category}</span>
                </div>
                ${managementButtons}
                <div class="info-card-body">
                    <img src="${post.image || "https://placehold.co/600x300"}" alt="Imagem do post" class="card-image">
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

  const updateUIBasedOnAuth = () => {
    const btnNewPost = document.getElementById("btn-new-post");
    if (!btnNewPost) return;
    if (currentUser && currentUserData && currentUserData.userType !== "pf") {
      btnNewPost.style.display = "block";
    } else {
      btnNewPost.style.display = "none";
    }
  };

  // --- EVENT LISTENERS ---
  hubFeedContainer.addEventListener("click", (e) => {
    const targetButton = e.target.closest("button");
    if (!targetButton) return;
    const postId = targetButton.dataset.id;

    if (targetButton.classList.contains("btn-delete")) {
      if (confirm("Tem certeza?")) firebase.firestore().collection("posts").doc(postId).delete();
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

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearchTerm = e.target.value;
      clearTimeout(window.searchTimeout);
      window.searchTimeout = setTimeout(() => { renderFilteredAndSearchedPosts(); }, 500);
    });
  }

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
    if (filterOptions && filterOptions.classList.contains("active")) filterOptions.classList.remove("active");
  });

  // --- MODAL VER MAIS ---
  async function openVerMaisModal(postId) {
    const postInfo = allPostsData.find((p) => p.id === postId);
    if (postInfo) {
      const btn = document.querySelector(`button[data-id="${postId}"].btn-ver-mais`);
      const originalText = btn.textContent;
      btn.textContent = "Carregando..."; 
      btn.disabled = true;
      try { await renderVerMaisModal(postInfo); } 
      finally { btn.textContent = originalText; btn.disabled = false; }
    }
  }

  async function renderVerMaisModal(postInfo) {
    const { data: post } = postInfo;
    const existingModal = document.getElementById("ver-mais-modal");
    if (existingModal) existingModal.remove();

    const currentLang = localStorage.getItem('rumo_lang') || 'pt-brasil';
    let displayTitle = post.title;
    let displayContent = post.description;

    if (!currentLang.startsWith('pt')) {
        displayTitle = await translateText(post.title, currentLang);
        displayContent = await translateHtmlContent(post.description, currentLang);
    }

    // --- LÓGICA DOS BOTÕES EXTRAS (CORRIGIDA) ---
    const hasContact = post.contactType && post.contactValue;
    
    // VERIFICA SE TEM LOCAL (Endereço OU Link)
    // Antes verificava apenas mapsLink. Agora verifica se existe qualquer info de local.
    const hasLocation = post.location && (post.location.address || post.location.mapsLink);

    // Botão de Contato
    let contactBtn = '';
    if (hasContact) {
        let iconClass = 'fas fa-phone-alt';
        if (post.contactType === 'whatsapp') iconClass = 'fab fa-whatsapp';
        if (post.contactType === 'email') iconClass = 'fas fa-envelope';

        contactBtn = `
            <button onclick="window.contactOrganization('${post.contactType}', '${post.contactValue}')"
                title="Entrar em contato"
                style="width: 40px; height: 40px; background-color: #fffde7; border: 1px solid #fbc02d; border-radius: 8px; margin-right: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s;"
                onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                <i class="${iconClass}" style="color: #fbc02d; font-size: 1.2rem;"></i>
            </button>
        `;
    }

    // Botão de Localização (CORRIGIDO PARA USAR ENDEREÇO SE NÃO TIVER LINK)
    let locationBtn = '';
    if (hasLocation) {
        // Passa tanto o link quanto o endereço para a função decidir
        const mapsLinkSafe = post.location.mapsLink ? post.location.mapsLink.replace(/'/g, "\\'") : "";
        const addressSafe = post.location.address ? post.location.address.replace(/'/g, "\\'") : "";

        locationBtn = `
            <button onclick="window.openLocationMap('${mapsLinkSafe}', '${addressSafe}')"
                title="Ver no Google Maps"
                style="width: 40px; height: 40px; background-color: #e0f2f1; border: 1px solid #00897b; border-radius: 8px; margin-right: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s;"
                onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                <i class="fas fa-map-marker-alt" style="color: #00897b; font-size: 1.2rem;"></i>
            </button>
        `;
    }

    const modalHTML = `
            <div class="ver-mais-modal-backdrop" id="ver-mais-modal">
                <div class="ver-mais-modal-content">
                    <div class="ver-mais-modal-header">
                        <h4>${displayTitle}</h4>
                        <button class="close-modal-btn">×</button>
                    </div>
                    <div class="ver-mais-modal-body">
                        <img src="${post.image || "https://placehold.co/600x300"}" alt="Imagem do post" class="ver-mais-modal-image">
                        <div class="ql-snow"><div class="ql-editor">${displayContent}</div></div>
                        ${post.location && post.location.address ? `<p style="font-size: 0.9em; color: #666; margin-top: 15px;"><i class="fas fa-map-pin"></i> ${post.location.address}</p>` : ''}
                    </div>
                    <div class="ver-mais-modal-footer" style="display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center;">
                            ${contactBtn}
                            ${locationBtn}
                        </div>
                        ${post.sourceLink ? `<a href="${post.sourceLink}" target="_blank" class="btn btn-primary">Ver Fonte Oficial</a>` : ''}
                    </div>
                </div>
            </div>`;
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    const modal = document.getElementById("ver-mais-modal");
    setTimeout(() => modal.classList.add("active"), 10);
    const closeModal = () => { modal.classList.remove("active"); setTimeout(() => modal.remove(), 300); };
    modal.querySelector(".close-modal-btn").addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  }

  // --- LIKE & SAVE ---
  async function toggleLike(postId) {
    if (!currentUser) return alert("Você precisa estar logado.");
    const postRef = firebase.firestore().collection("posts").doc(postId);
    const postDoc = await postRef.get();
    if (!postDoc.exists) return;
    const likes = postDoc.data().likes || [];
    const updateAction = likes.includes(currentUser.uid) ? "arrayRemove" : "arrayUnion";
    await postRef.update({ likes: firebase.firestore.FieldValue[updateAction](currentUser.uid) });
  }
  
  async function toggleSavePost(postId, buttonElement) {
    if (!currentUser) return alert("Você precisa estar logado.");
    const userRef = firebase.firestore().collection("users").doc(currentUser.uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return;
    const savedPosts = userDoc.data().savedPosts || [];
    const isSaved = savedPosts.includes(postId);
    const updateAction = isSaved ? 'arrayRemove' : 'arrayUnion';
    await userRef.update({ savedPosts: firebase.firestore.FieldValue[updateAction](postId) });
    buttonElement.classList.toggle("saved", !isSaved);
    const icon = buttonElement.querySelector("i");
    icon.classList.toggle("fas", !isSaved);
    icon.classList.toggle("far", isSaved);
    if (currentUserData) {
        if (isSaved) currentUserData.savedPosts = currentUserData.savedPosts.filter(id => id !== postId);
        else { if (!currentUserData.savedPosts) currentUserData.savedPosts = []; currentUserData.savedPosts.push(postId); }
    }
  }

  // --- COMENTÁRIOS ---
  function openCommentSection(postId) {
    if (!currentUser) return alert("Você precisa estar logado.");
    renderCommentModal(postId);
  }

  function renderCommentModal(postId) {
    const existingModal = document.getElementById("comment-modal");
    if (existingModal) existingModal.remove();
    const modalHTML = `
            <div class="comment-modal-backdrop" id="comment-modal">
                <div class="comment-modal-content">
                    <div class="comment-modal-header"><h4>Comentários</h4><button class="close-modal-btn">×</button></div>
                    <ul class="comment-list"><p class="comment-list-empty">Carregando...</p></ul>
                    <form class="comment-form">
                        <input type="text" placeholder="Adicione um comentário..." required />
                        <button type="submit" class="btn btn-primary">Postar</button>
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
        if (input.value.trim()) { await postComment(postId, input.value.trim()); input.value = ""; }
    });
    loadComments(postId);
  }

  function loadComments(postId) {
    const commentList = document.querySelector("#comment-modal .comment-list");
    firebase.firestore().collection("posts").doc(postId).collection("comments").orderBy("timestamp", "asc").onSnapshot((snapshot) => {
          if (snapshot.empty) { commentList.innerHTML = '<p class="comment-list-empty">Seja o primeiro a comentar!</p>'; return; }
          commentList.innerHTML = "";
          snapshot.forEach((doc) => {
            const comment = doc.data();
            const commentItem = document.createElement("li");
            commentItem.className = "comment-item";
            commentItem.innerHTML = `<img src="${comment.userPhotoURL || "assets/imagens/avatar-padrao.png"}" class="comment-avatar"><div class="comment-body"><span class="comment-author" onclick="window.location.href='perfil-usuario.html?id=${comment.userId}'">${comment.userName}</span><p class="comment-text">${comment.text}</p></div>`;
            commentList.appendChild(commentItem);
          });
    });
  }

  async function postComment(postId, text) {
    if (!currentUser || !currentUserData) return;
    const userName = currentUserData.nomeCompleto || currentUserData.nome || "Usuário";
    const commentData = { text: text, userId: currentUser.uid, userName: userName, userPhotoURL: currentUserData.photoURL || null, timestamp: firebase.firestore.FieldValue.serverTimestamp() };
    await firebase.firestore().collection("posts").doc(postId).collection("comments").add(commentData);
  }
});
