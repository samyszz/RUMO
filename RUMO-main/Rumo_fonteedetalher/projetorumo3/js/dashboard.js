/* dashboard.js - Painel PJ Coeso e Funcional */

// Variáveis Globais para Cache de Dados
let globalAllPosts = [];
let globalFollowersIDs = [];
let globalInteractedUsersData = {}; // Cache de usuários carregados para evitar leituras repetidas
let pjUserDocData = null;

// Instâncias dos Gráficos
let charts = {
    pie: null,
    age: null,
    stack: null
};

/* ---------- Inicialização ---------- */
document.addEventListener('DOMContentLoaded', () => {
    checkAccessAndInit();

    // Listeners de Filtros
    const rangeSelect = document.getElementById('rangeSelect');
    if(rangeSelect) {
        rangeSelect.addEventListener('change', () => processDataAndRender());
    }
    
    // O select de interações pode usar a mesma lógica
    const interRange = document.getElementById('interRange');
    if(interRange) {
        interRange.addEventListener('change', () => processDataAndRender()); 
    }
});

/* ---------- Verificação de Acesso e Listeners ---------- */
async function checkAccessAndInit() {
    const loading = document.getElementById('loading-screen'); // Se houver loader global
    
    firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'index.html';
            return;
        }

        const db = firebase.firestore();
        try {
            const doc = await db.collection('users').doc(user.uid).get();
            if(doc.exists && (doc.data().userType === 'pj' || doc.data().userType === 'ong' || doc.data().userType === 'gov')) {
                
                // Exibe Dashboard
                document.getElementById('pj-dashboard').style.display = 'block';
                document.getElementById('access-denied').style.display = 'none';
                
                // Salva dados do PJ
                pjUserDocData = doc.data();
                globalFollowersIDs = pjUserDocData.followers || [];

                initTabs();
                initChartsInstances(); // Cria os gráficos vazios
                initRealTimeListeners(user.uid); // Começa a puxar dados
                
            } else {
                document.getElementById('pj-dashboard').style.display = 'none';
                document.getElementById('access-denied').style.display = 'block';
            }
        } catch (e) {
            console.error("Erro no dashboard:", e);
        }
    });
}

/* ---------- Listener em Tempo Real (Posts) ---------- */
function initRealTimeListeners(userId) {
    const db = firebase.firestore();

    // Listener de POSTS (onde tudo acontece)
    db.collection('posts')
        .where('creatorId', '==', userId)
        .onSnapshot(async (snapshot) => {
            globalAllPosts = [];
            
            snapshot.forEach(doc => {
                globalAllPosts.push({
                    id: doc.id,
                    ...doc.data(),
                    createdAtDate: doc.data().createdAt ? doc.data().createdAt.toDate() : new Date()
                });
            });

            // Após receber posts, precisamos buscar dados demográficos dos usuários que interagiram
            // para preencher os gráficos de Idade e Nacionalidade corretamente.
            await fetchAudienceDemographics(globalAllPosts);

            // Processa e Renderiza tudo
            processDataAndRender();
        });
        
    // Listener simples para contagem de seguidores em tempo real
    db.collection('users').doc(userId).onSnapshot(doc => {
        if(doc.exists) {
            globalFollowersIDs = doc.data().followers || [];
            updateFollowersCard(globalFollowersIDs.length);
            // Se mudar seguidores, reprocessa os gráficos (ex: Pizza)
            processDataAndRender(); 
        }
    });
}

/* ---------- Processamento Central de Dados ---------- */
function processDataAndRender() {
    const daysFilter = parseInt(document.getElementById('rangeSelect').value) || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysFilter);

    // 1. Filtra posts pela data selecionada
    const filteredPosts = globalAllPosts.filter(p => p.createdAtDate >= cutoffDate);

    // 2. Calcula Métricas Gerais
    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let allInteractingUserIDs = new Set(); // IDs únicos que deram like

    filteredPosts.forEach(post => {
        const views = post.views || 0;
        const likesList = post.likes || [];
        const comments = post.commentCount || 0;

        totalViews += views;
        totalLikes += likesList.length;
        totalComments += comments;

        likesList.forEach(uid => allInteractingUserIDs.add(uid));
    });

    // 3. Atualiza Cards de Números
    animateValue(document.getElementById('visitsNumber'), parseInt(document.getElementById('visitsNumber').innerText), totalViews, 1000);
    updateInteractionCards(totalLikes, totalComments, totalViews);

    // 4. Atualiza Gráficos
    updatePieChart(allInteractingUserIDs);
    updateAgeAndNationalityCharts(allInteractingUserIDs); // Usa dados cacheados
    updateStackChart(filteredPosts);

    // 5. Palavras-Chave e Top Posts
    renderKeywords(filteredPosts);
    renderTopPosts(filteredPosts);
}

/* ---------- Busca Inteligente de Dados de Usuários (Demografia) ---------- */
async function fetchAudienceDemographics(posts) {
    const db = firebase.firestore();
    let userIdsToFetch = new Set();

    // Coleta IDs de todos os posts (historicamente) para ter uma base de dados
    posts.forEach(p => {
        if(p.likes) p.likes.forEach(uid => userIdsToFetch.add(uid));
    });

    // Filtra IDs que já temos em cache
    const idsNeedFetching = [...userIdsToFetch].filter(uid => !globalInteractedUsersData[uid]);

    // Firestore limita 'in' queries a 10. Vamos fazer em lotes de 10.
    // Limitamos a buscar no máximo 30 novos perfis por vez para não estourar cota no front.
    const chunks = [];
    const CHUNK_SIZE = 10;
    const MAX_FETCH = 50; 
    
    let toFetch = idsNeedFetching.slice(0, MAX_FETCH);

    for (let i = 0; i < toFetch.length; i += CHUNK_SIZE) {
        chunks.push(toFetch.slice(i, i + CHUNK_SIZE));
    }

    // Executa buscas
    await Promise.all(chunks.map(async (chunkIds) => {
        if(chunkIds.length === 0) return;
        try {
            const q = await db.collection('users').where(firebase.firestore.FieldPath.documentId(), 'in', chunkIds).get();
            q.forEach(doc => {
                globalInteractedUsersData[doc.id] = doc.data();
            });
        } catch (err) {
            console.error("Erro ao buscar detalhes de usuários:", err);
        }
    }));
}

/* ---------- Atualização de Gráficos ---------- */

function updatePieChart(interactingIDsSet) {
    if(!charts.pie) return;

    let followersInteraction = 0;
    let othersInteraction = 0;

    interactingIDsSet.forEach(uid => {
        if (globalFollowersIDs.includes(uid)) {
            followersInteraction++;
        } else {
            othersInteraction++;
        }
    });

    // Se ninguém interagiu, mostra 0/0 ou um placeholder
    if (followersInteraction === 0 && othersInteraction === 0) {
        // Fallback visual
        charts.pie.data.datasets[0].data = [0, 1]; 
        charts.pie.data.datasets[0].backgroundColor = ['#083b3b', '#eee'];
    } else {
        charts.pie.data.datasets[0].data = [followersInteraction, othersInteraction];
        charts.pie.data.datasets[0].backgroundColor = ['#083b3b', '#e0e0e0'];
    }
    charts.pie.update();

    // Texto de porcentagem
    const total = followersInteraction + othersInteraction;
    const pFollowers = total === 0 ? 0 : Math.round((followersInteraction / total) * 100);
    const pOthers = total === 0 ? 0 : 100 - pFollowers;

    const statsDiv = document.querySelector('.followers-stats');
    if(statsDiv) {
        statsDiv.innerHTML = `
            <p><span>Seguidores</span> <span class="percent">${pFollowers}%</span></p>
            <p class="muted"><span>Outros</span> <span class="percent-muted">${pOthers}%</span></p>
        `;
    }
}

/* js/dashboard.js */

// --- Substitua a função updateAgeAndNationalityCharts por esta: ---

function updateAgeAndNationalityCharts(interactingIDsSet) {
    // Agora processamos IDIOMAS em vez de nacionalidades puras
    const idiomas = {};
    const faixasEtarias = { '18-24': 0, '25-34': 0, '35-44': 0, '45+': 0 };

    interactingIDsSet.forEach(uid => {
        const userData = globalInteractedUsersData[uid];
        if (userData) {
            // 1. Lógica de Idioma
            // Tenta pegar nacionalidade ou país de origem
            const pais = userData.nacionalidade || userData.paisOrigem || 'Desconhecido';
            const lingua = getLanguageFromCountry(pais);
            idiomas[lingua] = (idiomas[lingua] || 0) + 1;

            // 2. Lógica de Idade (Mantida)
            if (userData.dataNascimento) {
                const age = calculateAge(userData.dataNascimento);
                if (age >= 18 && age <= 24) faixasEtarias['18-24']++;
                else if (age >= 25 && age <= 34) faixasEtarias['25-34']++;
                else if (age >= 35 && age <= 44) faixasEtarias['35-44']++;
                else if (age >= 45) faixasEtarias['45+']++;
            }
        }
    });

    // --- Atualiza Lista de Idiomas (HTML) ---
    // Note que mudamos a classe no HTML para .language-list para ficar semântico, 
    // mas se não mudou no CSS, pode manter .nationality-list no querySelector se preferir.
    const langListElement = document.querySelector('.language-list') || document.querySelector('.nationality-list');
    
    if (langListElement) {
        langListElement.innerHTML = '';
        
        // Ordena do mais falado para o menos falado
        const sortedLangs = Object.entries(idiomas).sort((a,b) => b[1] - a[1]).slice(0, 5);
        
        // Calcula o total para fazer a barra de porcentagem
        const totalInteracoes = Object.values(idiomas).reduce((a, b) => a + b, 0);

        if(sortedLangs.length === 0) {
            langListElement.innerHTML = '<li style="color:#666">Sem dados suficientes.</li>';
        } else {
            sortedLangs.forEach(([lang, count]) => {
                const percent = totalInteracoes > 0 ? Math.round((count / totalInteracoes) * 100) : 0;
                
                // Cria o elemento visual com barra de progresso
                const li = document.createElement('li');
                li.style.marginBottom = '10px';
                li.innerHTML = `
                    <div style="display:flex; justify-content:space-between; font-weight:bold; color:#083b3b; margin-bottom:2px;">
                        <span>${lang}</span> 
                        <span>${percent}%</span>
                    </div>
                    <div class="kw-bar" style="background:#eee; height:6px; border-radius:3px; overflow:hidden;">
                        <div style="width:${percent}%; background:#083b3b; height:100%;"></div>
                    </div>
                    <div style="font-size:0.75em; color:#888; text-align:right;">${count} leitores</div>
                `;
                langListElement.appendChild(li);
            });
        }
    }

    // --- Atualiza Gráfico de Idade (Mantido) ---
    if (charts.age) {
        charts.age.data.datasets[0].data = [
            faixasEtarias['18-24'], 
            faixasEtarias['25-34'], 
            faixasEtarias['35-44'], 
            faixasEtarias['45+']
        ];
        charts.age.update();
    }
}

// --- Adicione esta nova função auxiliar no final do arquivo: ---

function getLanguageFromCountry(pais) {
    if (!pais) return 'Desconhecido';
    
    const p = pais.toLowerCase().trim();

    // Mapeamento de Países para Idiomas (Baseado no público alvo do RUMO)
    if (['brasil', 'portugal', 'angola', 'moçambique', 'mocambique', 'cabo verde', 'guiné-bissau', 'guine-bissau', 'são tomé', 'timor-leste'].some(x => p.includes(x))) {
        return 'Português';
    }
    if (['haiti'].some(x => p.includes(x))) {
        return 'Crioulo Haitiano';
    }
    if (['venezuela', 'colômbia', 'colombia', 'argentina', 'bolívia', 'bolivia', 'chile', 'peru', 'equador', 'uruguai', 'méxico', 'mexico', 'espanha', 'paraguai', 'cuba'].some(x => p.includes(x))) {
        // Paraguai fala Guarani também, mas Espanhol é seguro para interface geral
        return 'Espanhol'; 
    }
    if (['eua', 'estados unidos', 'usa', 'reino unido', 'inglaterra', 'áfrica do sul', 'africa do sul', 'nigéria', 'nigeria', 'gana'].some(x => p.includes(x))) {
        return 'Inglês';
    }
    if (['frança', 'franca', 'congo', 'senegal', 'costa do marfim'].some(x => p.includes(x))) {
        return 'Francês';
    }
    if (['síria', 'siria', 'líbano', 'libano', 'egito', 'marrocos', 'arábia', 'arabia', 'iemen', 'palestina'].some(x => p.includes(x))) {
        return 'Árabe';
    }
    if (['china', 'taiwan'].some(x => p.includes(x))) {
        return 'Mandarim';
    }
    if (['japão', 'japao'].some(x => p.includes(x))) {
        return 'Japonês';
    }
    if (['coreia', 'korea'].some(x => p.includes(x))) {
        return 'Coreano';
    }
    if (['ucrânia', 'ucrania'].some(x => p.includes(x))) {
        return 'Ucraniano'; // Ou Russo, dependendo da região
    }
    if (['rússia', 'russia'].some(x => p.includes(x))) {
        return 'Russo';
    }

    // Fallback: Retorna o próprio país se não mapeado (ex: "Alemanha" -> "Alemão" seria ideal, mas "Outros" serve)
    return 'Outros (' + (pais.charAt(0).toUpperCase() + pais.slice(1)) + ')';
}

function updateStackChart(posts) {
    if(!charts.stack) return;
    
    // Agrupar visualizações e interações por dia da semana (ou data)
    // Para simplificar, vamos agrupar pelos últimos 5-7 dias da semana
    const daysMap = { 'Dom':0, 'Seg':0, 'Ter':0, 'Qua':0, 'Qui':0, 'Sex':0, 'Sab':0 };
    const interactMap = { 'Dom':0, 'Seg':0, 'Ter':0, 'Qua':0, 'Qui':0, 'Sex':0, 'Sab':0 };
    const daysLookup = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

    posts.forEach(post => {
        const dayName = daysLookup[post.createdAtDate.getDay()];
        daysMap[dayName] += (post.views || 0);
        interactMap[dayName] += ((post.likes ? post.likes.length : 0) + (post.commentCount || 0));
    });

    // Ordenar eixo X baseado no dia de hoje (para ficar cronológico)
    // Simplificação: Fixo Dom -> Sab para o gráfico não ficar pulando
    charts.stack.data.datasets[0].data = daysLookup.map(d => daysMap[d]);
    charts.stack.data.datasets[1].data = daysLookup.map(d => interactMap[d]);
    charts.stack.update();
}

function renderTopPosts(posts) {
    const container = document.getElementById('top-posts-container');
    if(!container) return;

    // Calcular Engajamento
    const rankedPosts = posts.map(p => {
        const likes = p.likes ? p.likes.length : 0;
        const comments = p.commentCount || 0;
        const score = likes + comments + ((p.views || 0) * 0.05);
        return { ...p, score, likesCount: likes, commentsCount: comments };
    }).sort((a, b) => b.score - a.score);

    container.innerHTML = '';
    
    // Adiciona a classe de grid para o CSS funcionar
    container.className = 'posts-tiles grid-cards'; 

    if (rankedPosts.length === 0) {
        container.innerHTML = '<div class="post-tile-empty">Nenhum post no período selecionado.</div>';
        return;
    }

    // Pega apenas os top 4 para não poluir
    rankedPosts.slice(0, 4).forEach((post, index) => {
        const rankClass = index === 0 ? 'rank-1' : (index === 1 ? 'rank-2' : (index === 2 ? 'rank-3' : ''));
        const img = post.image || 'assets/imagens/banner3 (2).png';
        const dateStr = post.createdAtDate ? post.createdAtDate.toLocaleDateString() : '';
        
        // Limpa HTML da descrição para o preview
        const cleanDesc = post.description ? post.description.replace(/<[^>]*>?/gm, "") : "";
        const preview = cleanDesc.substring(0, 80) + (cleanDesc.length > 80 ? "..." : "");

        const cardHTML = `
            <div class="info-card-wrapper" style="position: relative;">
                <div class="rank-badge ${rankClass}">#${index + 1}</div>

                <div class="info-card">
                    <div class="info-card-header">
                        <span class="info-card-author">${post.category || "Geral"}</span>
                        <span class="info-card-topic" style="font-size:0.8em; color:#083b3b; font-weight:bold;">${Math.floor(post.score)} pts</span>
                    </div>
                    
                    <div class="info-card-body">
                        <img src="${img}" alt="Imagem do post" class="card-image" style="height: 150px; object-fit: cover;" onerror="this.src='assets/imagens/banner3 (2).png'">
                        <h3 style="font-size: 1.1rem; margin: 10px 0 5px;">${post.title}</h3>
                        <p class="post-description-preview" style="font-size: 0.9rem; color: #666;">${preview}</p>
                    </div>

                    <div class="info-card-footer">
                        <span class="info-card-date">${dateStr}</span>
                        <div class="info-card-interactions">
                            <div class="interaction-item" title="Curtidas">
                                <i class="fas fa-heart" style="color: #e74c3c;"></i>
                                <span class="like-count">${post.likesCount}</span>
                            </div>
                            <div class="interaction-item" title="Comentários">
                                <i class="far fa-comment"></i>
                                <span class="comment-count">${post.commentsCount}</span>
                            </div>
                            <div class="interaction-item" title="Visualizações">
                                <i class="fas fa-eye" style="color: #083b3b;"></i>
                                <span>${post.views || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', cardHTML);
    });
}

/* js/dashboard.js - Adicione ou substitua esta função */

function renderKeywords(posts) {
    // 1. Concatena todo texto (Título + Descrição) de todos os posts
    let fullText = "";
    posts.forEach(p => {
        // Pega título e descrição, garantindo que não sejam undefined
        const title = p.title || "";
        const desc = p.description || ""; 
        // Remove tags HTML da descrição se houver
        const cleanDesc = desc.replace(/<[^>]*>?/gm, " ");
        fullText += ` ${title} ${cleanDesc}`;
    });

    const listElement = document.querySelector('.keywords-list');
    if (!listElement) return;

    // 2. Lista Robusta de Stop Words (Conectivos) em Português
    const stopwords = [
        'de', 'a', 'o', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 
        'as', 'dos', 'como', 'mas', 'ao', 'ele', 'das', 'tem', 'seu', 'sua', 'ou', 'ser', 'quando', 'muito', 'nos', 'já', 'está', 
        'eu', 'também', 'só', 'pelo', 'pela', 'até', 'isso', 'ela', 'entre', 'depois', 'sem', 'mesmo', 'aos', 'seus', 'quem', 'nas', 
        'me', 'esse', 'eles', 'você', 'essa', 'num', 'nem', 'suas', 'meu', 'minha', 'têm', 'numa', 'pelos', 'elas', 'qual', 'nós', 
        'lhe', 'deles', 'essas', 'esses', 'pelas', 'este', 'dele', 'tu', 'te', 'vocês', 'vos', 'lhes', 'meus', 'minhas', 'teu', 'tua', 
        'teus', 'tuas', 'nosso', 'nossa', 'nossos', 'nossas', 'dela', 'delas', 'esta', 'estes', 'estas', 'aquele', 'aquela', 'aqueles', 
        'aquelas', 'isto', 'aquilo', 'estou', 'está', 'estamos', 'estão', 'estive', 'esteve', 'estivemos', 'estiveram', 'estava', 
        'estávamos', 'estavam', 'estivera', 'estivéramos', 'haja', 'hajamos', 'hajam', 'houve', 'houvemos', 'houveram', 'houvera', 
        'houvéramos', 'tinha', 'tínhamos', 'tinham', 'tivera', 'tivéramos', 'tenha', 'tenhamos', 'tenham', 'tivesse', 'tivéssemos', 
        'tivessem', 'tiver', 'tivermos', 'tiverem', 'fui', 'foi', 'fomos', 'foram', 'era', 'eramos', 'eram', 'vai', 'vão', 'vou',
        'br', 'div', 'strong', 'span', 'class', 'style', 'href', 'http', 'https', 'www', 'com', 'img', 'src', 'p', 'b', 'i', 'li', 'ul' // Tags técnicas
    ];

    // 3. Processamento do Texto
    const words = fullText.toLowerCase()
        // Remove pontuação, caracteres especiais, emojis, mas mantém acentos (à-ú)
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'|\[\]]/g," ")
        .replace(/\s{2,}/g," ") // Remove espaços duplos
        .split(" ")
        .filter(w => w.length > 2 && !stopwords.includes(w)); // Remove palavras curtas (<2 chars) e stopwords

    // 4. Contagem de Frequência
    const freq = {};
    words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });

    // 5. Ordenação (Do maior para o menor)
    const sorted = Object.entries(freq)
        .sort((a, b) => b[1] - a[1]) // Ordena pelo valor (count)
        .slice(0, 5); // Pega o Top 5

    // 6. Renderização no HTML
    listElement.innerHTML = '';
    
    // Se não tiver palavras suficientes
    if (sorted.length === 0) {
        listElement.innerHTML = '<li style="color: #666;">Sem dados de texto suficientes.</li>';
        return;
    }

    // Pega a frequência da palavra mais usada para calcular a % da barra (regra de três)
    const maxVal = sorted[0][1]; 

    sorted.forEach(([word, count]) => {
        const percent = (count / maxVal) * 100;
        
        // Capitaliza a primeira letra da palavra (ex: "refugiados" -> "Refugiados")
        const displayWord = word.charAt(0).toUpperCase() + word.slice(1);

        listElement.innerHTML += `
            <li>
                <div style="display:flex; justify-content:space-between; margin-bottom: 5px;">
                    <span>${displayWord}</span>
                    <span style="font-size:0.8em; color:#666;">(${count}x)</span>
                </div>
                <div class="kw-bar">
                    <span class="kw-fill" style="width:${percent}%; background-color: #083b3b;"></span>
                </div>
            </li>
        `;
    });
}

/* ---------- Helpers ---------- */
function initChartsInstances() {
    // 1. Pizza
    const ctxPie = document.getElementById('pieChart');
    if(ctxPie) {
        charts.pie = new Chart(ctxPie.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Seguidores', 'Outros'],
                datasets: [{ data: [0, 0], backgroundColor: ['#083b3b', '#e0e0e0'], borderWidth: 0 }]
            },
            options: { plugins: { legend: { display: false } }, cutout: '65%' }
        });
    }

    // 2. Barras (Idade)
    const ctxAge = document.getElementById('ageChart');
    if(ctxAge) {
        charts.age = new Chart(ctxAge.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['18-24','25-34','35-44','45+'],
                datasets: [{ label: 'Usuários', data: [0,0,0,0], backgroundColor: '#2ecc71', borderRadius: 4 }]
            },
            options: { plugins:{ legend:{ display:false }}, maintainAspectRatio: false, scales:{y:{beginAtZero:true}} }
        });
    }

    // 3. Stacked (Dias)
    const ctxStack = document.getElementById('stackChart');
    if(ctxStack) {
        charts.stack = new Chart(ctxStack.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'],
                datasets: [
                    { label: 'Alcance (Views)', data: [], backgroundColor: '#083b3b' },
                    { label: 'Interações', data: [], backgroundColor: '#59bcbc' }
                ]
            },
            options: { plugins:{ legend:{ position:'top' } }, scales: { x:{ stacked:true }, y:{ stacked:true } }, maintainAspectRatio: false }
        });
    }
}

function updateFollowersCard(count) {
    animateValue(document.getElementById('count-total'), 0, count, 1000);
    // Barra de progresso visual baseada numa meta fictícia de 1000
    const fill = document.getElementById('followersFill');
    if(fill) fill.style.width = `${Math.min((count/1000)*100, 100)}%`;
}

function updateInteractionCards(likes, comments, views) {
    document.getElementById('stat-likes').innerText = likes;
    document.getElementById('stat-comments').innerText = comments;
    document.getElementById('stat-clicks').innerText = views; // Usando clicks como Views
}

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
            obj.innerHTML = end;
        }
    };
    window.requestAnimationFrame(step);
}

function calculateAge(timestampOrString) {
    if(!timestampOrString) return 0;
    // Tenta converter se for timestamp do firestore
    let birthDate;
    if (timestampOrString.toDate) birthDate = timestampOrString.toDate();
    else birthDate = new Date(timestampOrString);

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

function initTabs() {
    const btnPerfil = document.getElementById('tab-perfil');
    const btnPublic = document.getElementById('tab-publicacoes');
    const viewPerfil = document.getElementById('view-perfil');
    const viewPublic = document.getElementById('view-publicacoes');

    if(!btnPerfil) return;

    btnPerfil.addEventListener('click', () => {
        btnPerfil.classList.add('active');
        btnPublic.classList.remove('active');
        viewPerfil.style.display = 'block';
        viewPublic.style.display = 'none';
    });

    btnPublic.addEventListener('click', () => {
        btnPublic.classList.add('active');
        btnPerfil.classList.remove('active');
        viewPublic.style.display = 'block';
        viewPerfil.style.display = 'none';
    });
}