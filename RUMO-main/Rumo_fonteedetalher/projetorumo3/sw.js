// sw.js (Versão 5 - Offline Completo)

const CACHE_NAME = 'rumo-v6'; // Versão atualizada
const URLS_TO_CACHE = [
    // --- PÁGINAS PRINCIPAIS (HTML) ---
    './',
    'index.html',
    'hub.html',
    'utilitarios.html',
    'sobre.html',
    'auth.html',
    'perfil.html',
    'editar-perfil.html',
    'novo-post.html',
    'perfil-usuario.html',
    'post-salvo.html',
    'sair-excluir-conta.html',
    'tutorial.html',
    'dashboard.html',
    'termosecondicoes.html',

    // --- ARQUIVOS DE CONFIGURAÇÃO ---
    'manifest.json',

    // --- ESTILOS (CSS) ---
    'css/base.css',
    'css/home.css',
    'css/hub.css',
    'css/auth-style.css',
    'css/profile.css',
    'css/editar-perfil.css',
    'css/forms.css',
    'css/loader.css',
    'css/novo-post.css',
    'css/perfil-usuario.css',
    'css/post-form.css',
    'css/postsalvo.css',
    'css/sair-excluir-conta.css',
    'css/sobre.css',
    'css/utils.css',
    'css/dashboard.css',
    'css/style.css',
    'css/tutorial.css',

    // --- SCRIPTS (JS) ---
    'js/main-menu.js',
    'js/dark-mode.js',
    'js/auth-state.js',
    'js/i18n.js',
    'js/script.js',
    'js/auth-guard.js',
    'js/auth-slider.js',
    'js/cadastro.js',
    'js/editar-perfil.js',
    'js/firebase-config.js',
    'js/hub.js',
    'js/login.js',
    'js/map-widget.js',
    'js/novo-post.js',
    'js/perfil-usuario.js',
    'js/perfil.js',
    'js/post-salvo.js',
    'js/sair-excluir-conta.js',
    'js/utilitarios.js',
    'js/dashboard.js',
    'js/loader.js',
    'js/tutorial.js',

    // --- IMAGENS NA RAIZ ---
    'logo.png',
    'banner3 (2).png',
    'banner3.png',
    'tutorial.png',
    'icarocurioso.png',
    'Design sem nome.gif',
    'fundosite.png',
    'file.svg',
    
    // --- ONDAS E DECORAÇÕES (Incluindo Dark Mode) ---
    'ondacima.png',
    'ondabaixo.png',
    'ondacimadark.png',
    'ondabaixodark.png',
    'ondacimamenor.png',
    'ondabaixomenor.png',

    // --- BANNERS DE IDIOMAS ---
    'banner-arabe.png',
    'banner-coreano.png',
    'banner-crioulo.png',
    'banner-espanhol.png',
    'banner-frances.png',
    'banner-guarani.png',
    'banner-ingles.png',
    'banner-japones.png',
    'banner-mandarim.png',
    'banner-quechua.png',
    // Adicione outros banners de idioma se existirem na pasta raiz

    // --- ASSETS/IMAGENS ---
    'assets/imagens/avatar-padrao.png',
    'assets/imagens/isologo BRAVO.png',
    'assets/imagens/COMUNIDADE.png',
    'assets/imagens/file.svg',
    'assets/imagens/logo.png',
    'assets/imagens/tutorial.png',
    
    // --- MEMBROS ---
    'membros/kaua.jpeg',
    'membros/lucas.jpeg',
    'membros/michelly.jpg',
    'membros/samyra.jpeg',

    // --- FONTES (Nunito) ---
    // Adicionei as principais variações para garantir carregamento
    'assets/fonts/Nunito/static/Nunito-Black.ttf',
    'assets/fonts/Nunito/static/Nunito-Bold.ttf',
    'assets/fonts/Nunito/static/Nunito-Regular.ttf',
    'assets/fonts/Nunito/static/Nunito-SemiBold.ttf',

    // --- TRADUÇÕES (JSON) ---
    'locales/brasil.json', // Corrigido de portugues.json para brasil.json conforme seus arquivos
    'locales/ingles.json',
    'locales/espanhol.json',
    'locales/crioulo-haitiano.json',
    'locales/arabe.json',
    'locales/coreano.json',
    'locales/frances.json',
    'locales/guarani.json',
    'locales/japones.json',
    'locales/mandarim.json',
    'locales/quechua.json'
    // Adicione outros jsons da pasta locales se houver
];

// 1. Evento de Instalação
self.addEventListener('install', (event) => {
    self.skipWaiting();

    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        console.log('SW install - cacheando arquivos...');
        
        const results = await Promise.allSettled(URLS_TO_CACHE.map(async (url) => {
            try {
                // Tenta buscar o arquivo
                const response = await fetch(url, { cache: 'no-cache' });
                if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
                
                await cache.put(url, response.clone());
                return { url, ok: true };
            } catch (err) {
                // Loga o erro mas não quebra a instalação inteira
                console.warn(`Falha ao cachear ${url}:`, err.message);
                return { url, ok: false, err };
            }
        }));
        
        // Relatório opcional de falhas
        const failed = results.filter(r => r.status === 'fulfilled' && !r.value.ok);
        if (failed.length > 0) {
            console.log('Arquivos que não puderam ser cacheados:', failed.map(f => f.value.url));
        }
    })());
});

// 2. Evento de Ativação
self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
                console.log('Removendo cache antigo:', cacheName);
                return caches.delete(cacheName);
            }
        }));
        await clients.claim();
    })());
});

// 3. Evento de Fetch
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    // Ignora requests do Firebase/Google (não funcionam offline mesmo)
    const url = event.request.url;
    if (url.includes('firebase') || url.includes('gstatic') || url.includes('googleapis')) {
        return; 
    }

    // Estratégia para Navegação (HTML): Network First, depois Cache
    if (event.request.mode === 'navigate') {
        event.respondWith((async () => {
            try {
                const networkResponse = await fetch(event.request);
                const cache = await caches.open(CACHE_NAME);
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
            } catch (error) {
                const cached = await caches.match(event.request);
                return cached || caches.match('index.html') || caches.match('./');
            }
        })());
        return;
    }

    // Estratégia para Assets (Imagens, CSS, JS): Cache First, depois Network (com atualização em background)
    event.respondWith((async () => {
        const cachedResponse = await caches.match(event.request);
        
        const fetchPromise = fetch(event.request).then(async (networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
                const cache = await caches.open(CACHE_NAME);
                cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
        }).catch(() => null);

        return cachedResponse || await fetchPromise;
    })());
});

// Escuta mensagem para pular espera (caso precise forçar update via JS)
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});