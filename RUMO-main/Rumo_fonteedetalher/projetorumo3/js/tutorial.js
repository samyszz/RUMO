/* tutorial.js
   Carrossel com profundidade + Lógica de Auth do Firebase
*/

/* ========== CONFIGURAÇÃO DOS VÍDEOS ========== */

// Lista para Pessoa Física (e visitantes)
const videosPF = [
    { id: 'JBybPFLMF3c', title: 'Tutorial R.U.M.O - Tela Inicial', url: 'https://www.youtube.com/watch?v=JBybPFLMF3c' },
    { id: 'MIEYRhxXwbo', title: 'Tutorial R.U.M.O - Sobre nós', url: 'https://www.youtube.com/watch?v=MIEYRhxXwbo' },
    { id: 'y8BbwhljXs0', title: 'Tutorial R.U.M.O - Perfil de Usuário', url: 'https://youtu.be/y8BbwhljXs0?si=893kC-_qk6wifV5n' },
    { id: 'rsdLlE3s0VE', title: 'Tutorial R.U.M.O - Cadastro e Login', url: 'https://www.youtube.com/watch?v=ZQM1GS3uDz8' },
    { id: 'l_9WGFPuUTs', title: 'Tutorial R.U.M.O - HUB', url: 'https://youtu.be/l_9WGFPuUTs?si=GnRzG714T_oI9xxi' },
    { id: 'P2T2sFII_0k', title: 'Tutorial R.U.M.O - Editar Perfil', url: 'https://youtu.be/P2T2sFII_0k?si=ZplLjSG1KdIpD0i8' },
    { id: '7z_vkwg2Ois', title: 'Tutorial R.U.M.O - Utilidades', url: 'https://youtu.be/7z_vkwg2Ois?si=Zq0Rj-E0fIh7UCgY' }
   
];

// Lista para Pessoa Jurídica
const videosPJ = [
   { id: 'JBybPFLMF3c', title: 'Tutorial R.U.M.O - Tela Inicial', url: 'https://www.youtube.com/watch?v=JBybPFLMF3c' },
   { id: 'MIEYRhxXwbo', title: 'Tutorial R.U.M.O - Sobre nós', url: 'https://www.youtube.com/watch?v=MIEYRhxXwbo' },
     { id: 'yZV3h4tmyXQ', title: 'Tutorial R.U.M.O - Dashboard', url: 'https://youtu.be/yZV3h4tmyXQ?si=4S4ke3UI0GAXy5nQ' },
    { id: 'y8BbwhljXs0', title: 'Tutorial R.U.M.O - Perfil de Usuário', url: 'https://youtu.be/y8BbwhljXs0?si=893kC-_qk6wifV5n' },
     { id: 'tSZ9mWpzrCU', title: 'Tutorial R.U.M.O - Novo Post', url: 'https://youtu.be/tSZ9mWpzrCU?si=KAE48xI8rD2D_dnw' },
     { id: 'rsdLlE3s0VE', title: 'Tutorial R.U.M.O - Cadastro e Login', url: 'https://www.youtube.com/watch?v=ZQM1GS3uDz8' },
    { id: 'l_9WGFPuUTs', title: 'Tutorial R.U.M.O - HUB', url: 'https://youtu.be/l_9WGFPuUTs?si=GnRzG714T_oI9xxi' },
    { id: 'P2T2sFII_0k', title: 'Tutorial R.U.M.O - Editar Perfil', url: 'https://youtu.be/P2T2sFII_0k?si=ZplLjSG1KdIpD0i8' },
    { id: '7z_vkwg2Ois', title: 'Tutorial R.U.M.O - Utilidades', url: 'https://youtu.be/7z_vkwg2Ois?si=Zq0Rj-E0fIh7UCgY' }
];

// Variáveis globais
let slidesData = videosPF; // padrão inicial
let currentIndex = 0;
let slides = [];

const viewport = document.getElementById('depthViewport');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pagination = document.getElementById('depthPagination');
const greetingElement = document.getElementById('user-greeting');

/* Inicialização ao carregar a página */
document.addEventListener('DOMContentLoaded', () => {
    // Escuta o estado de autenticação do Firebase
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            // USUÁRIO LOGADO
            try {
                // Busca dados no Firestore (coleção 'users')
                const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();

                if (userDoc.exists) {
                    const userData = userDoc.data();
                    
                    // 1. Define o Nome
                    const nome = userData.nome || userData.displayName || user.displayName || "Usuário";
                    if(greetingElement) greetingElement.innerText = nome;

                    // 2. Define o Tipo de conta (PF ou PJ)
                    // Verifique se no seu banco o campo é 'tipo', 'type', 'accountType', etc.
                    // Vamos assumir que 'tipo' pode ser 'juridica', 'pj', 'company', etc.
                    const tipo = userData.tipo ? userData.tipo.toLowerCase() : 'fisica';
                    
                    if (tipo.includes('juridica') || tipo.includes('pj') || tipo.includes('empresa')) {
                        slidesData = videosPJ; // Usa lista PJ
                    } else {
                        slidesData = videosPF; // Usa lista PF
                    }

                } else {
                    // Documento não achado, usa padrão
                    if(greetingElement) greetingElement.innerText = "Usuário";
                    slidesData = videosPF;
                }
            } catch (error) {
                console.error("Erro ao buscar perfil:", error);
                if(greetingElement) greetingElement.innerText = "Usuário";
                slidesData = videosPF;
            }
        } else {
            // VISITANTE (não logado)
            if(greetingElement) greetingElement.innerText = "Visitante";
            slidesData = videosPF; // Mostra tutoriais padrão
        }

        // Após definir quem é e qual lista usar, constrói o carrossel
        buildSlides();
    });
});


/* Função para criar a thumbnail URL a partir do id */
function thumbFor(id) {
    // Se o ID for genérico (VIDEO_PF_1), retorna placeholder. Se for ID real do YT, retorna thumb.
    if(id.includes('VIDEO_')) return 'https://via.placeholder.com/640x360?text=Video+Tutorial';
    return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

/* Monta os slides DOM */
function buildSlides() {
    viewport.innerHTML = '';
    slides = [];
    currentIndex = 0; // Reinicia índice

    slidesData.forEach((s, i) => {
        const slide = document.createElement('div');
        slide.className = 'depth-slide out';
        slide.setAttribute('data-index', i);
        slide.setAttribute('role', 'group');
        slide.setAttribute('aria-roledescription', 'slide');
        slide.setAttribute('aria-label', `${i+1} de ${slidesData.length}`);
        slide.tabIndex = 0;

        const img = document.createElement('img');
        img.src = thumbFor(s.id);
        img.alt = s.title || `Tutorial ${i+1}`;

        slide.appendChild(img);
        
        // Legenda opcional (se quiser mostrar o título)
        // const caption = document.createElement('div');
        // caption.innerText = s.title;
        // caption.style.cssText = "position:absolute; bottom:10px; left:0; width:100%; text-align:center; color:white; background:rgba(0,0,0,0.5); padding:5px;";
        // slide.appendChild(caption);

        // clique abre o vídeo no YouTube (nova aba)
        slide.addEventListener('click', () => {
            window.open(s.url, '_blank', 'noopener');
        });

        // Teclado
        slide.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault();
                window.open(s.url, '_blank', 'noopener');
            }
        });

        viewport.appendChild(slide);
        slides.push(slide);
    });

    // dots
    pagination.innerHTML = '';
    slidesData.forEach((_, i) => {
        const d = document.createElement('span');
        d.className = 'depth-dot' + (i === currentIndex ? ' active' : '');
        d.dataset.index = i;
        d.addEventListener('click', () => goto(i));
        pagination.appendChild(d);
    });

    update(); // posiciona inicialmente
}

/* Move para índice (com limites) */
function goto(index) {
    if (index < 0) index = 0;
    if (index > slides.length - 1) index = slides.length - 1;
    if (index === currentIndex) return;
    currentIndex = index;
    update();
}

/* Atualiza classes/posicionamento */
function update() {
    slides.forEach((el, i) => {
        el.classList.remove('active', 'prev', 'next', 'out');
        if (i === currentIndex) {
            el.classList.add('active');
        } else if (i === currentIndex - 1) {
            el.classList.add('prev');
        } else if (i === currentIndex + 1) {
            el.classList.add('next');
        } else {
            el.classList.add('out');
        }
        
        // Acessibilidade
        el.setAttribute('aria-hidden', i === currentIndex ? 'false' : 'true');
    });

    // atualizar paginação
    const dots = pagination.querySelectorAll('.depth-dot');
    dots.forEach(d => d.classList.remove('active'));
    if (dots[currentIndex]) dots[currentIndex].classList.add('active');

    // controlar disabled das setas
    if(prevBtn) prevBtn.disabled = currentIndex === 0;
    if(nextBtn) nextBtn.disabled = currentIndex === slides.length - 1;
}

/* Eventos das setas */
if(prevBtn) prevBtn.addEventListener('click', () => goto(currentIndex - 1));
if(nextBtn) nextBtn.addEventListener('click', () => goto(currentIndex + 1));

/* Atalhos de teclado globais */
document.addEventListener('keydown', (e) => {
    // Só navega se o foco não estiver num input
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
    
    if (e.key === 'ArrowLeft') goto(currentIndex - 1);
    if (e.key === 'ArrowRight') goto(currentIndex + 1);
});

/* Reconstruir em resize para responsividade */
let resizeTimer = null;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        update();
    }, 120);
});

/* ===== FAQ DROPDOWN ===== */
document.querySelectorAll(".faq-question").forEach(btn => {
    btn.addEventListener("click", () => {
        const answer = btn.nextElementSibling;
        btn.classList.toggle("active");
        if (answer.style.display === "block") {
            answer.style.display = "none";
        } else {
            answer.style.display = "block";
        }
    });
});