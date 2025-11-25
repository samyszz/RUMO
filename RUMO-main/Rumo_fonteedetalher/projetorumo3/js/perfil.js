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

    // Função para carregar posts do usuário
    const loadUserPosts = async (userId) => {
        if (!userId || !userPostsContainer) return;
        userPostsContainer.innerHTML = "A carregar publicações..."; 

        try {
            const postsRef = firebase.firestore().collection("posts");
            const querySnapshot = await postsRef
                .where("creatorId", "==", userId)
                .orderBy("createdAt", "desc")
                .get();

            if (querySnapshot.empty) {
                userPostsContainer.innerHTML = "<p>Você ainda não fez nenhuma publicação.</p>";
                return;
            }

            userPostsContainer.innerHTML = ""; 

            querySnapshot.forEach((doc) => {
                const post = doc.data();
                const postId = doc.id;
                const postElement = document.createElement("div");
                postElement.classList.add("info-card-wrapper", "simple-card");

                // Alterado para usar a mesma estrutura de classes do HUB
                postElement.innerHTML = `
                    <div class="info-card">
                         <img src="${post.image || 'https://placehold.co/300x150'}" alt="Imagem do post" class="card-image-small">
                         <div class="card-content-small">
                             <h5>${post.title || 'Sem Título'}</h5>
                             
                             <div class="post-actions">
                                <button class="btn-edit" data-id="${postId}">Editar</button>
                                <button class="btn-delete" data-id="${postId}">Apagar</button>
                             </div>
                         </div>
                    </div>
                `;
                userPostsContainer.appendChild(postElement);
            });

             // Listeners atualizados para as novas classes
             userPostsContainer.querySelectorAll('.btn-edit').forEach(btn => {
                btn.onclick = () => window.location.href = `novo-post.html?id=${btn.dataset.id}`;
            });
            userPostsContainer.querySelectorAll('.btn-delete').forEach(btn => {
                btn.onclick = () => {
                    if (confirm('Tem certeza que deseja apagar esta publicação?')) {
                        firebase.firestore().collection('posts').doc(btn.dataset.id).delete()
                          .then(() => btn.closest('.info-card-wrapper').remove())
                          .catch(err => alert('Erro ao apagar: ' + err.message));
                    }
                };
            });

        } catch (error) {
            console.error("Erro ao carregar posts do usuário:", error);
            userPostsContainer.innerHTML = "<p>Erro ao carregar publicações.</p>";
        }
    };

    // --- RENDERIZAÇÃO DO PERFIL ---
    const renderUserProfile = (user, userData) => {
        const firestoreName = userData?.nomeCompleto || userData?.nome;
        const authName = user.displayName;
        const displayName = firestoreName || authName || "Nome não definido";
        if (profileName) profileName.textContent = displayName;

        if (profileUsername) {
            profileUsername.textContent = userData?.username ? `@${userData.username}` : "@indefinido";
        }

         if (profilePicture) {
            profilePicture.src = userData?.photoURL || user.photoURL || 'assets/imagens/avatar-padrao.png';
        }

        if (profileBio) {
            profileBio.textContent = userData?.bio || 'Edite o seu perfil para adicionar uma biografia.';
        }

        let userTypeText = "";
        let badgeClass = "";
        let showPosts = false;
        let finalUserType = userData?.userType; 

        const isSocialLogin = user.providerData.some(provider => 
            provider.providerId === 'google.com' || provider.providerId === 'facebook.com'
        );

        if (isSocialLogin) {
            finalUserType = 'pf';
        } 
        
        if (finalUserType === 'pf') {
            userTypeText = 'Pessoa Física';
            badgeClass = 'badge-pf';
            showPosts = false;
        } else if (finalUserType === 'pj') {
            userTypeText = 'Pessoa Jurídica';
            badgeClass = 'badge-pj';
            showPosts = true;
        } else {
            userTypeText = 'Tipo Indefinido';
            showPosts = false; 
             if (!userData?.userType) {
                const userDocRef = firebase.firestore().collection('users').doc(user.uid);
                userDocRef.set({ userType: 'pf' }, { merge: true })
                  .catch(err => console.error("Erro ao definir userType padrão:", err));
             }
        }

        if (profileUserType) {
            profileUserType.textContent = userTypeText;
            profileUserType.className = `user-type-badge ${badgeClass}`;
        }

        if (myPostsSection) {
            const isCurrentlyShowing = myPostsSection.style.display === 'block';
            if (showPosts && !isCurrentlyShowing) {
                 myPostsSection.style.display = 'block';
                 loadUserPosts(user.uid); 
            } else if (!showPosts) {
                 myPostsSection.style.display = 'none';
            }
        }
    };

    // --- INICIALIZAÇÃO ---
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            const userDocRef = firebase.firestore().collection('users').doc(user.uid);
            userDocRef.onSnapshot((docSnap) => {
                let userData = null;
                if (docSnap.exists) {
                    userData = docSnap.data();
                } 
                renderUserProfile(user, userData);
            }, (error) => {
                console.error("Erro ao carregar perfil:", error);
            });
        } else {
            window.location.href = 'auth.html'; 
        }
    });

     const logoutButton = document.getElementById('logout-button');
     if(logoutButton) {
         logoutButton.addEventListener('click', () => {
             auth.signOut().then(() => {
                 window.location.href = 'index.html';
             });
         });
     }
});
// --- LÓGICA DO DASHBOARD ---

async function carregarDashboard(user) {
    if (!user) return;
    
    // Elementos HTML onde os dados serão mostrados (Crie esses IDs no seu HTML)
    const elSeguidores = document.getElementById('dash-seguidores');
    const elAlcance = document.getElementById('dash-alcance');
    const elEngajamento = document.getElementById('dash-engajamento');
    const elPalavras = document.getElementById('dash-palavras');
    const elPeriodo = document.getElementById('dash-periodo');

    // 1. Buscar dados do Usuário (Para Seguidores)
    const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
    const userData = userDoc.data();
    const numSeguidores = userData.followers ? userData.followers.length : 0;
    
    if(elSeguidores) elSeguidores.innerText = numSeguidores;

    // 2. Buscar Posts do Usuário (Para Alcance, Engajamento e Palavras)
    const postsSnapshot = await firebase.firestore().collection('posts')
        .where('creatorId', '==', user.uid)
        .get();

    let totalAlcance = 0;
    let totalEngajamento = 0;
    let textoCompleto = "";
    let postsPorData = {}; // Para calcular período de maior alcance

    // Iterar sobre todos os posts do usuário
    postsSnapshot.forEach(doc => {
        const post = doc.data();
        
        // Alcance (Se você implementou o campo 'views', senão será 0)
        const views = post.views || 0;
        totalAlcance += views;

        // Engajamento (Likes + Comentários)
        // Nota: Para comentários exatos, seria ideal ter um campo 'commentCount' no post.
        // Aqui usamos apenas likes se commentCount não existir.
        const likes = post.likes ? post.likes.length : 0;
        const comments = post.commentCount || 0; 
        totalEngajamento += (likes + comments);

        // Juntar texto para análise de palavras-chave
        textoCompleto += ` ${post.title} ${post.description}`;

        // Agrupar por Mês/Ano para "Período com maior alcance"
        if (post.createdAt) {
            const data = new Date(post.createdAt.seconds * 1000);
            const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`;
            if (!postsPorData[mesAno]) postsPorData[mesAno] = 0;
            postsPorData[mesAno] += views; // Ou += 1 se quiser contar volume de posts
        }
    });

    // Atualizar HTML
    if(elAlcance) elAlcance.innerText = totalAlcance;
    
    // Exibir post com maior engajamento (Exemplo simples)
    if(elEngajamento) elEngajamento.innerText = totalEngajamento;

    // 3. Calcular Palavras-Chaves Mais Usadas
    if(elPalavras && textoCompleto) {
        const palavrasIgnoradas = ['de', 'a', 'o', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'foi', 'ao', 'ele', 'das', 'tem', 'à', 'seu', 'sua', 'ou', 'ser', 'quando', 'muito', 'há', 'nos', 'já', 'está', 'eu', 'também', 'só', 'pelo', 'pela', 'até', 'isso', 'ela', 'entre', 'depois', 'sem', 'mesmo', 'aos', 'seus', 'quem', 'nas', 'me', 'esse', 'eles', 'você', 'essa', 'num', 'nem', 'suas', 'meu', 'às', 'minha', 'têm', 'numa', 'pelos', 'elas', 'qual', 'nós', 'lhe', 'deles', 'essas', 'esses', 'pelas', 'este', 'dele', 'tu', 'te', 'vocês', 'vos', 'lhes', 'meus', 'minhas', 'teu', 'tua', 'teus', 'tuas', 'nosso', 'nossa', 'nossos', 'nossas', 'dela', 'delas', 'esta', 'estes', 'estas', 'aquele', 'aquela', 'aqueles', 'aquelas', 'isto', 'aquilo', 'estou', 'está', 'estamos', 'estão', 'estive', 'esteve', 'estivemos', 'estiveram', 'estava', 'estávamos', 'estavam', 'estivera', 'estivéramos', 'haja', 'hajamos', 'hajam', 'houve', 'houvemos', 'houveram', 'houvera', 'houvéramos', 'haja', 'hajamos', 'hajam', 'he', 'hei', 'havemos', 'hão', 'houve', 'houvemos', 'houveram', 'houvera', 'houvéramos', 'tinha', 'tínhamos', 'tinham', 'tivera', 'tivéramos', 'tenha', 'tenhamos', 'tenham', 'tivesse', 'tivéssemos', 'tivessem', 'tiver', 'tivermos', 'tiverem', 'farei', 'fará', 'faremos', 'farão', 'faria', 'faríamos', 'fariam', 'fez', 'fizeram', 'fizesse', 'fizessem'];
        
        // Limpar texto e transformar em array
        const palavras = textoCompleto.toLowerCase()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")
            .split(/\s+/)
            .filter(p => p.length > 3 && !palavrasIgnoradas.includes(p));

        const contagem = {};
        palavras.forEach(p => { contagem[p] = (contagem[p] || 0) + 1; });

        // Ordenar e pegar as top 3
        const topPalavras = Object.entries(contagem)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(p => p[0])
            .join(", ");

        elPalavras.innerText = topPalavras || "Nenhuma palavra relevante encontrada.";
    }

    // 4. Calcular Período com Maior Alcance
    if(elPeriodo) {
        const topPeriodo = Object.entries(postsPorData)
            .sort((a, b) => b[1] - a[1])[0]; // Pega o maior
        
        elPeriodo.innerText = topPeriodo ? `${topPeriodo[0]} (${topPeriodo[1]} views)` : "Sem dados";
    }
}

// Chamar essa função quando o auth confirmar o usuário
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        carregarDashboard(user);
    }
});