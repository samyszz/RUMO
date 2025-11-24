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

    // A. ESTATÍSTICAS DE USUÁRIOS (Nacionalidade e Contadores)
    // Ouvimos a coleção 'users' para contar PF
    db.collection('users').where('userType', '==', 'pf').onSnapshot(snapshot => {
        const totalUsers = snapshot.size;
        let newUsersCount = 0;
        const nacionalidades = {};
        
        // 30 dias atrás
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        snapshot.forEach(doc => {
            const data = doc.data();
            
            // Nacionalidade
            const nac = data.nacionalidade || 'Não informado';
            nacionalidades[nac] = (nacionalidades[nac] || 0) + 1;

            // Novos usuários (criados nos últimos 30 dias)
            // Verifica se existe o campo createdAt e se é Timestamp
            if (data.createdAt && data.createdAt.toDate) {
                if (data.createdAt.toDate() > thirtyDaysAgo) {
                    newUsersCount++;
                }
            }
        });

        // Atualiza UI
        updateNationalityList(nacionalidades, totalUsers);
        updateFollowerStats(totalUsers, newUsersCount);
        
        // Gráfico de pizza (Simulação: assumindo 40% de retenção como seguidores)
        if(pieChart) {
            pieChart.data.datasets[0].data = [Math.floor(totalUsers * 0.4), Math.floor(totalUsers * 0.6)];
            pieChart.update();
        }
    });

    // B. POSTS E ENGAJAMENTO DO PJ
    db.collection('posts').where('userId', '==', pjUserId).onSnapshot(snapshot => {
        let totalLikes = 0;
        let totalComments = 0;
        const postsData = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            const likes = data.likes ? data.likes.length : 0;
            const comments = data.comments ? data.comments.length : 0; // Se existir array de comments
            
            totalLikes += likes;
            totalComments += comments;

            postsData.push({
                id: doc.id,
                ...data,
                likesCount: likes
            });
        });

        // Ordena posts por likes (maior para menor) e pega Top 4
        postsData.sort((a, b) => b.likesCount - a.likesCount);
        const topPosts = postsData.slice(0, 4);

        // Atualiza Cards de Interação
        updateInteractionCards(totalLikes, totalComments);
        
        // Renderiza Top Posts
        renderTopPosts(topPosts);
    });
}

/* --- Atualizadores de UI --- */

function updateFollowerStats(total, novos) {
    // Anima os números do zero até o valor final
    animateValue(document.getElementById('count-total'), 0, total, 1500);
    animateValue(document.getElementById('count-new'), 0, novos, 1500);
    animateValue(document.getElementById('visitsNumber'), 0, total * 3, 2000); // Simulação de visitas = 3x usuários
    
    // Barra de progresso
    const fill = document.getElementById('followersFill');
    if(fill) fill.style.width = '70%'; // Valor fixo simulado ou calculado
}

function updateNationalityList(counts, total) {
    const listElement = document.querySelector('.nationality-list');
    if (!listElement) return;
    listElement.innerHTML = '';

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    sorted.forEach(([pais, count]) => {
        const percent = total > 0 ? Math.round((count / total) * 100) : 0;
        
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${pais}</span> 
            <div style="display:flex; align-items:center; gap:10px; width:60%;">
                <div style="flex-grow:1; background:#e0f4f2; height:10px; border-radius:5px; overflow:hidden;">
                    <div style="width:${percent}%; background:#083b3b; height:100%;"></div>
                </div>
                <span style="font-size:0.8rem; width:30px;">${percent}%</span>
            </div>
        `;
        listElement.appendChild(li);
    });
}

function updateInteractionCards(likes, comments) {
    animateValue(document.getElementById('stat-likes'), 0, likes, 1000);
    animateValue(document.getElementById('stat-comments'), 0, comments, 1000);
    // Shares, Saved e Clicks simulados ou zerados
    document.getElementById('stat-shares').innerText = "0";
    document.getElementById('stat-saved').innerText = "0";
    document.getElementById('stat-clicks').innerText = "0";
}

function renderTopPosts(posts) {
    const container = document.getElementById('top-posts-container');
    if(!container) return;
    container.innerHTML = '';

    if(posts.length === 0) {
        container.innerHTML = '<div class="post-tile-empty">Nenhum post encontrado.</div>';
        return;
    }

    posts.forEach(post => {
        const div = document.createElement('div');
        div.className = 'post-tile';
        
        // Se tiver imagem, mostra. Se não, mostra texto resumido.
        let contentHtml = '';
        if(post.imageUrl) {
            contentHtml = `<img src="${post.imageUrl}" alt="Post imagem">`;
        } else {
            contentHtml = `<div style="padding:20px; text-align:center; display:flex; align-items:center; justify-content:center; height:100%; font-size:0.9rem;">${post.texto || 'Sem conteúdo'}</div>`;
        }

        div.innerHTML = `
            ${contentHtml}
            <div class="post-overlay">
                <div class="post-stats"><i class="fas fa-heart"></i> ${post.likesCount}</div>
                <div class="post-stats"><i class="fas fa-comment"></i> ${post.comments ? post.comments.length : 0}</div>
            </div>
        `;
        container.appendChild(div);
    });
}

// Inicializa
document.addEventListener('DOMContentLoaded', checkAccessAndInit);