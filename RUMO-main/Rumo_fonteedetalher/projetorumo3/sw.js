// sw.js (Versão 4 - Offline Robust)

const CACHE_NAME = 'rumo-v4'; // Atualize a versão sempre que atualizar assets
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

    // --- ESTILOS PRINCIPAIS (CSS) ---
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

    // --- SCRIPTS PRINCIPAIS (JS) ---
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

    // --- IMAGENS E ATIVOS ---
    'logo.png',
    'banner3 (2).png',
    'tutorial.png',
    'ondacima.png',
    'ondabaixo.png',
    'assets/imagens/avatar-padrao.png',
    'assets/imagens/isologo BRAVO.png',
    'membros/kaua.jpeg',
    'membros/lucas.jpeg',
    'membros/michelly.jpg',
    'membros/samyra.jpeg',

    // --- FONTES ---
    'assets/fonts/Nunito/static/Nunito-Black.ttf',

    // --- TRADUÇÕES (JSON) ---
    'locales/portugues.json',
    'locales/ingles.json',
    'locales/espanhol.json',
    'locales/crioulo-haitiano.json',
    'locales/arabe.json',
    'locales/brasil.json',
    'locales/coreano.json',
    'locales/frances.json',
    'locales/guarani.json',
    'locales/japones.json',
    'locales/mandarim.json',
    'locales/mexico.json',
    'locales/quechua.json',
    'locales/venezuela.json'
];

// 1. Evento de Instalação: Salva todos os arquivos da lista.
self.addEventListener('install', (event) => {
    // Force the waiting worker to become the active worker
    self.skipWaiting();

    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        console.log('SW install - cache aberto:', CACHE_NAME);
        // Tenta adicionar todos os recursos, mas não falha totalmente se algum der 404
        const results = await Promise.allSettled(URLS_TO_CACHE.map(async (url) => {
            try {
                const response = await fetch(url, { cache: 'no-cache' });
                if (!response.ok) throw new Error('Fetch failed ' + response.status + ' ' + url);
                await cache.put(url, response.clone());
                return { url, ok: true };
            } catch (err) {
                console.warn('Não foi possível cachear', url, err);
                return { url, ok: false, err };
            }
        }));
        const failed = results.filter(r => r.status === 'fulfilled' && r.value && r.value.ok === false);
        if (failed.length) console.log('Alguns arquivos não foram cacheados (ok):', failed.map(f => f.value.url));
    })());
});

// Escuta mensagens do client (por exemplo, pedir para ativar imediatamente)
self.addEventListener('message', (event) => {
    if (!event.data) return;
    if (event.data.type === 'SKIP_WAITING') {
        console.log('SW: received SKIP_WAITING message');
        self.skipWaiting();
    }
});

// 2. Evento de Ativação: Limpa caches antigos e toma controle dos clients.
self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        // Remove caches antigos
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
                console.log('Ativação: apagando cache antigo', cacheName);
                return caches.delete(cacheName);
            }
            return null;
        }));

        // Toma controle imediato dos clients
        if (self.clients && clients.claim) {
            await clients.claim();
            console.log('Clients claimed');
        }
    })());
});

// 3. Evento de Fetch: Estratégia híbrida (network-first para navegações, cache-first para assets)
self.addEventListener('fetch', (event) => {
    // Apenas intercepte requisições GET
    if (event.request.method !== 'GET') return;

    // Se for uma requisição para o Firebase ou gstatic, vá direto para a rede
    if (event.request.url.includes('firebase') || event.request.url.includes('gstatic')) {
        return event.respondWith(fetch(event.request));
    }

    // Para navegações (entradas do app) aplicamos network-first para garantir atualizações
    if (event.request.mode === 'navigate') {
        event.respondWith((async () => {
            try {
                const networkResponse = await fetch(event.request);
                // Atualiza o cache da página de navegação
                const cache = await caches.open(CACHE_NAME);
                if (networkResponse && networkResponse.status === 200) await cache.put(event.request, networkResponse.clone());
                return networkResponse;
            } catch (err) {
                const cached = await caches.match(event.request);
                if (cached) return cached;
                // fallback para index.html se disponível
                const fallback = await caches.match('index.html') || await caches.match('./');
                return fallback || new Response('Offline', { status: 503, statusText: 'Offline' });
            }
        })());
        return;
    }

    // Para assets estáticos: cache-first com atualização em background (stale-while-revalidate)
    event.respondWith((async () => {
        const cachedResponse = await caches.match(event.request);
        const fetchPromise = fetch(event.request).then(async (networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
                const cache = await caches.open(CACHE_NAME);
                cache.put(event.request, networkResponse.clone()).catch(() => { /* ignore */ });
            }
            return networkResponse;
        }).catch(() => null);

        // Se existir em cache, retorna imediatamente e atualiza em background
        if (cachedResponse) {
            // dispara atualização em background
            fetchPromise;
            return cachedResponse;
        }

        // Se não tem no cache, aguarda a rede e tenta retornar
        const net = await fetchPromise;
        if (net) return net;

        // última tentativa: retorna alguma coisa do cache (p.ex. index.html)
        return await caches.match('index.html') || await caches.match('./') || new Response('Offline', { status: 503, statusText: 'Offline' });
    })());
});