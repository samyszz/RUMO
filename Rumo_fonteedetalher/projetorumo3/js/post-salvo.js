document.addEventListener("DOMContentLoaded", () => {
    const savedPostsContainer = document.getElementById("saved-posts-container");

    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            if (!savedPostsContainer) return;
            savedPostsContainer.innerHTML = "<p>A carregar publicações salvas...</p>";

            const userRef = firebase.firestore().collection("users").doc(user.uid);
            const userDoc = await userRef.get();

            if (userDoc.exists) {
                const userData = userDoc.data();
                const savedPostIds = userData.savedPosts || [];

                if (savedPostIds.length === 0) {
                    savedPostsContainer.innerHTML = "<p>Você ainda não salvou nenhuma publicação.</p>";
                    return;
                }

                savedPostsContainer.innerHTML = ""; // Limpa a mensagem

                savedPostIds.forEach(async (postId) => {
                    const postRef = firebase.firestore().collection("posts").doc(postId);
                    const postDoc = await postRef.get();

                    if (postDoc.exists) {
                        const postData = postDoc.data();
                        const postElement = document.createElement("div");
                        postElement.className = "info-card-wrapper";

                        const postDate = postData.createdAt
                            ? new Date(postData.createdAt.seconds * 1000).toLocaleDateString()
                            : "Data indisponível";

                        // Remove tags HTML da descrição para o snippet
                        const descriptionSnippet = (postData.description || '').replace(/<[^>]*>?/gm, "").substring(0, 150);

                        postElement.innerHTML = `
                            <div class="info-card">
                                <div class="info-card-header">
                                    <span class="info-card-author">${postData.authorName || postData.fantasia || "Pessoa Jurídica"}</span>
                                    <span class="info-card-topic">${postData.category}</span>
                                </div>
                                <div class="info-card-body">
                                     <img src="${postData.image || 'https://placehold.co/600x300'}" alt="Imagem do post" class="card-image">
                                    <h3>${postData.title}</h3>
                                    <p>${descriptionSnippet}...</p>
                                </div>
                                <div class="info-card-footer">
                                    <span class="info-card-date">${postDate}</span>
                                </div>
                            </div>
                        `;
                        savedPostsContainer.appendChild(postElement);
                    }
                });
            }
        } else {
            window.location.href = "login.html";
        }
    });
});