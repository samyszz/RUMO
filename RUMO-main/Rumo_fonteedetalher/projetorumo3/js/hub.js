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
      const userDoc = await firebase
        .firestore()
        .collection("users")
        .doc(user.uid)
        .get();
      if (userDoc.exists) {
        currentUserData = userDoc.data();
      }
    } else {
      currentUserData = null;
    }
    updateUIBasedOnAuth(); // ATUALIZA A UI COM BASE NO USUÁRIO
    loadPosts(); // CARREGA OS POSTS
  });

  // --- CARREGAMENTO DE DADOS ---
  const loadPosts = () => {
    if (!hubFeedContainer) return;

    firebase
      .firestore()
      .collection("posts")
      .orderBy("createdAt", "desc")
      .onSnapshot(
        async (snapshot) => {
          hubFeedContainer.innerHTML = "";
          if (snapshot.empty) {
            hubFeedContainer.innerHTML =
              "<p>Ainda não há publicações. Que tal criar a primeira?</p>";
            return;
          }

          allPostsData = await Promise.all(
            snapshot.docs.map(async (doc) => {
              const commentsSnapshot = await firebase
                .firestore()
                .collection("posts")
                .doc(doc.id)
                .collection("comments")
                .get();
              return {
                id: doc.id,
                data: doc.data(),
                commentCount: commentsSnapshot.size,
              };
            })
          );

          renderFilteredAndSearchedPosts();
        },
        (error) => console.error("Erro ao carregar os posts: ", error)
      );
  };

  // --- RENDERIZAÇÃO E UI ---
  const renderFilteredAndSearchedPosts = () => {
    hubFeedContainer.innerHTML = "";
    const postsToRender = allPostsData.filter((postInfo) => {
      const post = postInfo.data;
      const matchesFilter =
        currentFilter === "all" ||
        (post.category || "noticia") === currentFilter;
      const searchTerm = currentSearchTerm.toLowerCase();
      const descriptionText = post.description
        ? post.description.replace(/<[^>]*>?/gm, "")
        : "";
      const matchesSearch =
        searchTerm === "" ||
        (post.title && post.title.toLowerCase().includes(searchTerm)) ||
        (descriptionText &&
          descriptionText.toLowerCase().includes(searchTerm)) ||
        // Verifica ambos os nomes para busca
        (post.authorName &&
          post.authorName.toLowerCase().includes(searchTerm)) ||
        (post.fantasia && post.fantasia.toLowerCase().includes(searchTerm));
      return matchesFilter && matchesSearch;
    });

    if (postsToRender.length === 0) {
      hubFeedContainer.innerHTML =
        "<p>Nenhuma publicação encontrada com os critérios selecionados.</p>";
    } else {
      postsToRender.forEach((postInfo) => renderPost(postInfo));
    }
  };

  const createSnippet = (htmlContent, maxLength = 150) => {
    if (!htmlContent) return "";
    const text = htmlContent.replace(/<[^>]*>?/gm, "");
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + "...";
  };

  const renderPost = (postInfo) => {
    const { id: postId, data: post, commentCount } = postInfo;
    const postElement = document.createElement("div");
    postElement.className = "info-card-wrapper";

    const managementButtons =
      currentUser && currentUser.uid === post.creatorId
        ? `
            <div class="post-actions">
                <button class="btn-edit" data-id="${postId}">Editar</button>
                <button class="btn-delete" data-id="${postId}">Apagar</button>
            </div>`
        : "";

    const postDate = post.createdAt
      ? new Date(post.createdAt.seconds * 1000).toLocaleDateString()
      : "Data indisponível";
    const likes = post.likes || [];
    const isLiked = currentUser && likes.includes(currentUser.uid);

    const savedPosts = (currentUserData && currentUserData.savedPosts) || [];
    const isSaved = savedPosts.includes(postId);

    const interactionsHTML = `
            <div class="info-card-interactions">
                <div class="interaction-item">
                    <button class="${
                      isLiked ? "btn-like liked" : "btn-like"
                    }" data-id="${postId}"><i class="${
      isLiked ? "fas fa-heart" : "far fa-heart"
    }"></i></button>
                    <span class="like-count">${likes.length}</span>
                </div>
                <div class="interaction-item">
                    <button class="btn-comment" data-id="${postId}"><i class="far fa-comment"></i></button>
                    <span class="comment-count">${commentCount}</span>
                </div>
                 <div class="interaction-item">
                    <button class="btn-save ${
                      isSaved ? "saved" : ""
                    }" data-id="${postId}"><i class="${
      isSaved ? "fas fa-bookmark" : "far fa-bookmark"
    }"></i></button>
                </div>
            </div>`;

    const descriptionPreview = createSnippet(post.description);

    // --- CORREÇÃO DO NOME DO AUTOR ---
    // Prioridade: Nome Fantasia (PJ) > Nome do Autor (PF) > Fallback Genérico
    const authorDisplayName = post.fantasia || post.authorName || "Organização/Usuário";
    // --- FIM DA CORREÇÃO ---

    postElement.innerHTML = `
            <div class="info-card">
                <div class="info-card-header">
                    <span class="info-card-author" style="cursor:pointer;" onclick="window.location.href='perfil-usuario.html?id=${
                      post.creatorId
                    }'">${
                      // USA A VARIÁVEL CORRIGIDA AQUI
                      authorDisplayName
                    }</span>
                    <span class="info-card-topic">${post.category}</span>
                </div>
                ${managementButtons}
                <div class="info-card-body">
                    <img src="${
                      post.image || "https://placehold.co/600x300"
                    }" alt="Imagem do post" class="card-image">
                    <h3>${post.title}</h3>
                    <p class="post-description-preview">${descriptionPreview}</p>
                    <button class="btn-ver-mais" data-id="${postId}">Ver mais</button>
                </div>
                <div class="info-card-footer">
                    <span class="info-card-date">${postDate}</span>
                    ${currentUser ? interactionsHTML : ""}
                </div>
            </div>`;
    hubFeedContainer.appendChild(postElement);
  };

  // Lógica para mostrar/esconder botão "Novo Post" (já correta)
  const updateUIBasedOnAuth = () => {
    const btnNewPost = document.getElementById("btn-new-post");
    if (!btnNewPost) return;

    if (currentUserData && currentUserData.userType === 'pj') {
      btnNewPost.style.display = "block";
    } else {
      btnNewPost.style.display = "none";
    }
  };


  // --- LÓGICA DE INTERAÇÃO (EVENT LISTENERS) ---
  hubFeedContainer.addEventListener("click", (e) => {
    const targetButton = e.target.closest("button");
    if (!targetButton) return;
    const postId = targetButton.dataset.id;

    if (targetButton.classList.contains("btn-delete")) {
      if (confirm("Tem certeza que deseja apagar esta publicação?"))
        firebase.firestore().collection("posts").doc(postId).delete();
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

  // --- LÓGICA DE PESQUISA E FILTRO ---
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearchTerm = e.target.value;
      renderFilteredAndSearchedPosts();
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
    if (filterOptions && filterOptions.classList.contains("active")) {
      filterOptions.classList.remove("active");
    }
  });

  // --- FUNÇÕES DE LÓGICA (CURTIR, SALVAR, COMENTAR E MODAIS) ---
  // ... (O resto das funções toggleLike, toggleSavePost, modais, etc., permanecem iguais) ...
    async function toggleLike(postId) {
        if (!currentUser) {
        alert("Você precisa estar logado para curtir.");
        return;
        }
        const postRef = firebase.firestore().collection("posts").doc(postId);
        const postDoc = await postRef.get();
        if (!postDoc.exists) return;
        const likes = postDoc.data().likes || [];
        const updateAction = likes.includes(currentUser.uid)
        ? "arrayRemove"
        : "arrayUnion";
        await postRef.update({
        likes: firebase.firestore.FieldValue[updateAction](currentUser.uid),
        });
    }

    async function toggleSavePost(postId, buttonElement) {
        if (!currentUser) {
            alert("Você precisa estar logado para salvar as publicações.");
            return;
        }
        const userRef = firebase.firestore().collection("users").doc(currentUser.uid);
        const userDoc = await userRef.get();
        if (!userDoc.exists) return;

        const savedPosts = userDoc.data().savedPosts || [];
        const isSaved = savedPosts.includes(postId);
        const updateAction = isSaved ? 'arrayRemove' : 'arrayUnion';

        await userRef.update({
            savedPosts: firebase.firestore.FieldValue[updateAction](postId)
        });

        // Atualiza a UI do botão
        buttonElement.classList.toggle("saved", !isSaved);
        const icon = buttonElement.querySelector("i");
        icon.classList.toggle("fas", !isSaved);
        icon.classList.toggle("far", isSaved);

        // Atualiza o estado local currentUserData (se ele existir)
        if (currentUserData) {
            if (isSaved) {
                currentUserData.savedPosts = currentUserData.savedPosts.filter(id => id !== postId);
            } else {
                if (!currentUserData.savedPosts) currentUserData.savedPosts = [];
                currentUserData.savedPosts.push(postId);
            }
        }
    }


    function openCommentSection(postId) {
        if (!currentUser) {
        alert("Você precisa estar logado para comentar.");
        return;
        }
        renderCommentModal(postId);
    }

    function openVerMaisModal(postId) {
        const postInfo = allPostsData.find((p) => p.id === postId);
        if (postInfo) {
        renderVerMaisModal(postInfo);
        }
    }

    function renderVerMaisModal(postInfo) {
        const { data: post } = postInfo;
        const existingModal = document.getElementById("ver-mais-modal");
        if (existingModal) existingModal.remove();

        const modalHTML = `
                <div class="ver-mais-modal-backdrop" id="ver-mais-modal">
                    <div class="ver-mais-modal-content">
                        <div class="ver-mais-modal-header">
                            <h4>${post.title}</h4>
                            <button class="close-modal-btn">&times;</button>
                        </div>
                        <div class="ver-mais-modal-body">
                            <img src="${
                            post.image || "https://placehold.co/600x300"
                            }" alt="Imagem do post" class="ver-mais-modal-image">
                            <div class="ql-snow"><div class="ql-editor">${ // Garante a renderização do Quill
                            post.description
                            }</div></div>
                        </div>
                        <div class="ver-mais-modal-footer">
                             ${post.sourceLink ? `<a href="${post.sourceLink}" target="_blank" class="btn btn-primary">Ver Fonte Oficial</a>` : ''}
                        </div>
                    </div>
                </div>`;
        document.body.insertAdjacentHTML("beforeend", modalHTML);

        const modal = document.getElementById("ver-mais-modal");
        setTimeout(() => modal.classList.add("active"), 10); // Adiciona classe para animação

        const closeModal = () => {
        modal.classList.remove("active");
        setTimeout(() => modal.remove(), 300); // Remove após animação
        };

        const closeButton = modal.querySelector(".ver-mais-modal-header .close-modal-btn");
        if (closeButton) {
        closeButton.addEventListener("click", closeModal);
        }
        modal.addEventListener("click", (e) => { // Fecha clicando fora
        if (e.target === modal) closeModal();
        });
    }


  function renderCommentModal(postId) {
    const existingModal = document.getElementById("comment-modal");
    if (existingModal) existingModal.remove();

    const modalHTML = `
            <div class="comment-modal-backdrop" id="comment-modal">
                <div class="comment-modal-content">
                    <div class="comment-modal-header"><h4>Comentários</h4><button class="close-modal-btn">&times;</button></div>
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

    const closeModal = () => {
      modal.classList.remove("active");
      setTimeout(() => modal.remove(), 300);
    };

    modal.querySelector(".close-modal-btn").addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    modal.querySelector(".comment-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const input = e.target.querySelector("input");
        const text = input.value.trim();
        if (text) {
          await postComment(postId, text);
          input.value = ""; // Limpa o input após postar
        }
      });
    loadComments(postId); // Carrega comentários existentes
  }

  function loadComments(postId) {
    const commentList = document.querySelector("#comment-modal .comment-list");
    if (!commentList) return;

    // Listener em tempo real para comentários
    firebase
      .firestore()
      .collection("posts")
      .doc(postId)
      .collection("comments")
      .orderBy("timestamp", "asc")
      .onSnapshot( // Usa onSnapshot para atualizações em tempo real
        (snapshot) => {
          if (snapshot.empty) {
            commentList.innerHTML =
              '<p class="comment-list-empty">Seja o primeiro a comentar!</p>';
            return;
          }
          commentList.innerHTML = ""; // Limpa a lista antes de re-renderizar
          snapshot.forEach((doc) => {
            const comment = doc.data();
            const commentItem = document.createElement("li");
            commentItem.className = "comment-item";
            // Link no nome do autor para o perfil
            commentItem.innerHTML = `
                        <img src="${
                          comment.userPhotoURL ||
                          "assets/imagens/avatar-padrao.png" // Fallback para avatar padrão
                        }" alt="avatar" class="comment-avatar">
                        <div class="comment-body">
                            <span class="comment-author" style="cursor:pointer;" onclick="window.location.href='perfil-usuario.html?id=${
                              comment.userId
                            }'">${comment.userName || 'Usuário'}</span>
                            <p class="comment-text">${comment.text}</p>
                        </div>`;
            commentList.appendChild(commentItem);
          });
        },
        (error) => {
          console.error("Erro ao carregar comentários:", error);
          commentList.innerHTML =
            '<p class="comment-list-empty">Erro ao carregar comentários.</p>';
        }
      );
  }


  async function postComment(postId, text) {
    if (!currentUser || !currentUserData) {
         alert("Você precisa estar logado para comentar.");
         return;
    }
    // Usa o nome correto (PF ou PJ)
    const userName = currentUserData.nomeCompleto || currentUserData.nome || "Usuário";
    const userPhotoURL = currentUserData.profilePicture || currentUser.photoURL || null; // Pega a foto

    const commentData = {
      text: text,
      userId: currentUser.uid,
      userName: userName,
      userPhotoURL: userPhotoURL,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    };
    try {
        await firebase
            .firestore()
            .collection("posts")
            .doc(postId)
            .collection("comments")
            .add(commentData);
         console.log("Comentário adicionado com sucesso!");
    } catch(error) {
        console.error("Erro ao postar comentário:", error);
        alert("Ocorreu um erro ao postar seu comentário.");
    }
  }

}); // Fim do DOMContentLoaded