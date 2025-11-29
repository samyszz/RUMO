/* dashboard.js - Lógica do Painel PJ */

/* ---------- Animação de Números (Counter Up) ---------- */
function animateValue(obj, start, end, duration) {
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = end; // Garante valor final exato
        }
    };
    window.requestAnimationFrame(step);
}

/* ---------- Inicialização e Acesso ---------- */
async function checkAccessAndInit() {
    const loading = document.getElementById('loading-screen');
    
    firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
            showDenied();
            if(loading) loading.classList.add('hide');
            return;
        }

        const db = firebase.firestore();
        try {
            const doc = await db.collection('users').doc(user.uid).get();
            if(doc.exists && doc.data().userType === 'pj') {
                // Acesso Permitido
                const pjDashboard = document.getElementById('pj-dashboard');
                const accessDenied = document.getElementById('access-denied');
                
                if(accessDenied) accessDenied.style.display = 'none';
                if(pjDashboard) pjDashboard.style.display = 'block';
                if(loading) loading.classList.add('hide');

                // Inicializa Componentes
                initTabs();
                initCharts(); 
                initRealTimeListeners(user.uid); // Dados Reais
                
            } else {
                showDenied();
                if(loading) loading.classList.add('hide');
            }
        } catch (e) {
            console.error("Erro ao verificar acesso dashboard:", e);
            showDenied();
            if(loading) loading.classList.add('hide');
        }
    });
}

function showDenied() {
    const accessDenied = document.getElementById('access-denied');
    const pjDashboard = document.getElementById('pj-dashboard');
    if(pjDashboard) pjDashboard.style.display = 'none';
    if(accessDenied) accessDenied.style.display = 'block';
}

/* ---------- Abas ---------- */
function initTabs() {
    const btnPerfil = document.getElementById('tab-perfil');
    const btnPublic = document.getElementById('tab-publicacoes');
    const viewPerfil = document.getElementById('view-perfil');
    const viewPublic = document.getElementById('view-publicacoes');

    if(!btnPerfil || !btnPublic) return;

    function activate(tab) {
        if (tab === 'perfil') {
            btnPerfil.classList.add('active');
            btnPublic.classList.remove('active');
            viewPerfil.style.display = 'block';
            viewPublic.style.display = 'none';
        } else {
            btnPublic.classList.add('active');
            btnPerfil.classList.remove('active');
            viewPublic.style.display = 'block';
            viewPerfil.style.display = 'none';
        }
    }

    btnPerfil.addEventListener('click', () => activate('perfil'));
    btnPublic.addEventListener('click', () => activate('publicacoes'));
    activate('perfil'); // Default
}

/* ---------- Charts (Chart.js) ---------- */
let pieChart, ageChart, stackChart;

function initCharts() {
    // 1. Pizza (Seguidores)
    const ctxPie = document.getElementById('pieChart');
    if(ctxPie) {
        pieChart = new Chart(ctxPie.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Seguidores', 'Outros'],
                datasets: [{ data: [0, 100], backgroundColor: ['#083b3b', '#e0e0e0'], borderWidth: 0 }]
            },
            options: {
                plugins: { legend: { display: false } },
                cutout: '65%'
            }
        });
    }

    // 2. Barras (Idade) - Mockado (necessitaria data de nascimento no cadastro)
    const ctxAge = document.getElementById('ageChart');
    if(ctxAge) {
        ageChart = new Chart(ctxAge.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['18-24','25-34','35-44','45+'],
                datasets: [{ label: 'Usuários', data: [12, 45, 30, 15], backgroundColor: '#2ecc71', borderRadius: 6 }]
            },
            options: {
                plugins:{ legend:{ display:false }},
                scales:{ y:{ beginAtZero:true } },
                maintainAspectRatio: false
            }
        });
    }

    // 3. Stacked (Alcance)
    const ctxStack = document.getElementById('stackChart');
    if(ctxStack) {
        stackChart = new Chart(ctxStack.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Seg','Ter','Qua','Qui','Sex'],
                datasets: [
                    { label: 'Alcance', data: [50, 80, 120, 90, 60], backgroundColor: '#083b3b' },
                    { label: 'Interações', data: [10, 20, 40, 30, 15], backgroundColor: '#59bcbc' }
                ]
            },
            options: {
                plugins:{ legend:{ position:'top' } },
                scales: { x:{ stacked:true }, y:{ stacked:true, beginAtZero:true } },
                maintainAspectRatio: false
            }
        });
    }
}

/* ---------- Dados Reais (Firestore) ---------- */
function initRealTimeListeners(pjUserId) {
    const db = firebase.firestore();

    // 1. DADOS DO PERFIL (Seguidores)
    db.collection('users').doc(pjUserId).onSnapshot(doc => {
        if (!doc.exists) return;
        const data = doc.data();
        
        // Seguidores Reais (baseado no array followers)
        const followersList = data.followers || [];
        const totalFollowers = followersList.length;
        
        // Simulação de "Novos" (Como o array não tem data, estimamos ou deixamos 0 por enquanto)
        // Para ser exato, precisaria de uma sub-coleção 'followers_history'
        const newFollowers = 0; 

        // Atualiza UI de Seguidores
        animateValue(document.getElementById('count-total'), 0, totalFollowers, 1500);
        animateValue(document.getElementById('count-new'), 0, newFollowers, 1500);
        
        // Barra de progresso (Ex: Meta de 1000 seguidores)
        const fill = document.getElementById('followersFill');
        const meta = 1000; 
        if(fill) fill.style.width = `${Math.min((totalFollowers / meta) * 100, 100)}%`;
    });

    // 2. DADOS DOS POSTS (Alcance, Engajamento, Palavras-Chave)
    db.collection('posts').where('creatorId', '==', pjUserId).onSnapshot(snapshot => {
        let totalLikes = 0;
        let totalComments = 0;
        let totalViews = 0; // Alcance
        let allTextContent = "";
        const postsData = [];
        const viewsByDay = {}; // Para o gráfico

        snapshot.forEach(doc => {
            const post = doc.data();
            const likes = post.likes ? post.likes.length : 0;
            // Se tiver subcoleção de comments, o contador idealmente deveria estar no doc do post (commentCount)
            // Se não tiver, usamos 0 ou o que tiver disponível
            const comments = post.commentCount || 0; 
            const views = post.views || 0;

            totalLikes += likes;
            totalComments += comments;
            totalViews += views;

            // Acumular texto para palavras-chave
            allTextContent += ` ${post.title} ${post.description}`;

            // Dados para o Gráfico de Alcance (Agrupado por dia da semana)
            if (post.createdAt) {
                const date = post.createdAt.toDate();
                const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
                // Soma views neste dia (simplificado para dias da semana)
                if (!viewsByDay[dayName]) viewsByDay[dayName] = { views: 0, interactions: 0 };
                viewsByDay[dayName].views += views;
                viewsByDay[dayName].interactions += (likes + comments);
            }

            postsData.push({
                id: doc.id,
                ...post,
                likesCount: likes,
                commentsCount: comments
            });
        });

        // A. Atualizar Cards de Engajamento e Alcance
        updateInteractionCards(totalLikes, totalComments, totalViews);
        animateValue(document.getElementById('visitsNumber'), 0, totalViews, 2000); // Usando Views como "Visitas"

        // B. Palavras-Chaves
        calculateAndRenderKeywords(allTextContent);

        // C. Top Posts
        postsData.sort((a, b) => b.likesCount - a.likesCount);
        renderTopPosts(postsData.slice(0, 4));

        // D. Atualizar Gráfico de Alcance (StackChart)
        updateStackChart(viewsByDay);
    });
}

/* --- Novas Funções Auxiliares --- */

function calculateAndRenderKeywords(text) {
    const listElement = document.querySelector('.keywords-list');
    if (!listElement || !text) return;

    // Palavras irrelevantes para ignorar
    const stopwords = ['de', 'a', 'o', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'foi', 'ao', 'ele', 'das', 'tem', 'à', 'seu', 'sua', 'ou', 'ser', 'quando', 'muito', 'há', 'nos', 'já', 'está', 'eu', 'também', 'só', 'pelo', 'pela', 'até', 'isso', 'ela', 'entre', 'depois', 'sem', 'mesmo', 'aos', 'seus', 'quem', 'nas', 'me', 'esse', 'eles', 'você', 'essa', 'num', 'nem', 'suas', 'meu', 'às', 'minha', 'têm', 'numa', 'pelos', 'elas', 'qual', 'nós', 'lhe', 'deles', 'essas', 'esses', 'pelas', 'este', 'dele', 'tu', 'te', 'vocês', 'vos', 'lhes', 'meus', 'minhas', 'teu', 'tua', 'teus', 'tuas', 'nosso', 'nossa', 'nossos', 'nossas', 'dela', 'delas', 'esta', 'estes', 'estas', 'aquele', 'aquela', 'aqueles', 'aquelas', 'isto', 'aquilo', 'estou', 'está', 'estamos', 'estão', 'estive', 'esteve', 'estivemos', 'estiveram', 'estava', 'estávamos', 'estavam', 'estivera', 'estivéramos', 'haja', 'hajamos', 'hajam', 'houve', 'houvemos', 'houveram', 'houvera', 'houvéramos', 'haja', 'hajamos', 'hajam', 'he', 'hei', 'havemos', 'hão', 'houve', 'houvemos', 'houveram', 'houvera', 'houvéramos', 'tinha', 'tínhamos', 'tinham', 'tivera', 'tivéramos', 'tenha', 'tenhamos', 'tenham', 'tivesse', 'tivéssemos', 'tivessem', 'tiver', 'tivermos', 'tiverem', 'farei', 'fará', 'faremos', 'farão', 'faria', 'faríamos', 'fariam', 'fez', 'fizeram', 'fizesse', 'fizessem'];

    const words = text.toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")
        .split(/\s+/)
        .filter(w => w.length > 3 && !stopwords.includes(w));

    const frequency = {};
    words.forEach(w => { frequency[w] = (frequency[w] || 0) + 1; });

    const sortedWords = Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4); // Top 4

    listElement.innerHTML = '';
    
    // Encontrar a maior frequência para calcular a % da barra
    const maxFreq = sortedWords.length > 0 ? sortedWords[0][1] : 1;

    sortedWords.forEach(([word, freq]) => {
        const widthPercent = (freq / maxFreq) * 100;
        const li = document.createElement('li');
        li.innerHTML = `
            ${word} <span style="font-size:0.8em; color:#777">(${freq})</span>
            <div class="kw-bar"><span class="kw-fill" style="width:${widthPercent}%"></span></div>
        `;
        listElement.appendChild(li);
    });
}

function updateStackChart(dataMap) {
    if (!stackChart) return;

    // Ordem fixa dos dias para o gráfico (opcional, pode ser dinâmico)
    const daysOrder = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];
    
    // Preparar arrays de dados
    const viewsData = [];
    const interactionsData = [];
    
    // Mapear os dados para a ordem correta
    daysOrder.forEach(day => {
        const dayData = dataMap[day] || { views: 0, interactions: 0 };
        viewsData.push(dayData.views);
        interactionsData.push(dayData.interactions);
    });

    stackChart.data.labels = daysOrder;
    stackChart.data.datasets[0].data = viewsData;      // Alcance
    stackChart.data.datasets[1].data = interactionsData; // Interações
    stackChart.update();
}

// Atualizar a função existente updateInteractionCards para aceitar Views
function updateInteractionCards(likes, comments, views) {
    animateValue(document.getElementById('stat-likes'), 0, likes, 1000);
    animateValue(document.getElementById('stat-comments'), 0, comments, 1000);
    // Views sendo usadas como "Clicks externos" ou criando um novo card se preferir
    // Aqui vou usar no lugar de clicks para aproveitar o layout
    animateValue(document.getElementById('stat-clicks'), 0, views, 1000); 
    
    // Shares e Saved continuam 0 se não houver dados no banco
    document.getElementById('stat-shares').innerText = "0";
    document.getElementById('stat-saved').innerText = "0";
}
// Adicione isso na última linha do arquivo dashboard.js
document.addEventListener('DOMContentLoaded', () => {
    checkAccessAndInit();
});