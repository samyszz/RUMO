// sw.js (Versão 3 - Offline Total)

const CACHE_NAME = 'rumo-v2'; // Mude a versão se atualizar os arquivos
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
    '/css/base.css',
    '/css/home.css',
    '/css/hub.css',
    '/css/auth-style.css',
    '/css/profile.css',
    '/css/editar-perfil.css',
    '/css/forms.css',
    '/css/loader.css',
    '/css/novo-post.css',
    '/css/perfil-usuario.css',
    '/css/post-form.css',
    '/css/postsalvo.css',
    '/css/sair-excluir-conta.css',
    '/css/sobre.css',
    '/css/utils.css',

    // --- SCRIPTS PRINCIPAIS (JS) ---
    '/js/main-menu.js',
    '/js/dark-mode.js',
    '/js/auth-state.js',
    '/js/i18n.js',
    '/js/script.js',
    '/js/auth-guard.js',
    '/js/auth-slider.js',
    '/js/cadastro.js',
    '/js/editar-perfil.js',
    '/js/firebase-config.js',
    '/js/hub.js',
    '/js/login.js',
    '/js/map-widget.js',
    '/js/novo-post.js',
    '/js/perfil-usuario.js',
    '/js/perfil.js',
    '/js/post-salvo.js',
    '/js/sair-excluir-conta.js',
    '/js/utilitarios.js',

    // --- IMAGENS E ATIVOS ---
    '/logo.png',
    '/banner3 (2).png',
    '/tutorial.png',
    '/ondacima.png',
    '/ondabaixo.png',
    '/assets/imagens/avatar-padrao.png',
    '/assets/imagens/isologo BRAVO.png',
    '/membros/kaua.jpeg',
    '/membros/lucas.jpeg',
    '/membros/michelly.jpg',
    '/membros/samyra.jpeg',

    // --- FONTES ---
    '/assets/fonts/Nunito/static/Nunito-Black.ttf',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',

    // --- TRADUÇÕES (JSON) ---
    '/locales/portugues.json',
    '/locales/ingles.json',
    '/locales/espanhol.json',
    '/locales/crioulo-haitiano.json',
    '/locales/arabe.json',
    '/locales/brasil.json',
    '/locales/coreano.json',
    '/locales/frances.json',
    '/locales/guarani.json',
    '/locales/japones.json',
    '/locales/mandarim.json',
    '/locales/mexico.json',
    '/locales/quechua.json',
    '/locales/venezuela.json'
];

// 1. Evento de Instalação: Salva todos os arquivos da lista.
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache aberto: ', CACHE_NAME);
                return cache.addAll(URLS_TO_CACHE);
            })
            .catch(err => {
                console.error('Falha ao adicionar arquivos ao cache:', err);
                // Mesmo que um arquivo falhe (ex: 404), não quebra a instalação
                return Promise.resolve(); 
            })
    );
});

// 2. Evento de Ativação: Limpa caches antigos.
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Limpando cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 3. Evento de Fetch: Estratégia "Cache, depois Rede" (Cache-First)
self.addEventListener('fetch', (event) => {
    // Se for uma requisição para o Firebase, vá direto para a rede.
    // O Firebase cuidará do seu próprio cache offline (veja Parte 2).
    if (event.request.url.includes('firebase') || event.request.url.includes('gstatic')) {
        return event.respondWith(fetch(event.request));
    }

    // Para todo o resto, use a estratégia Cache-First
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // 1. Tenta pegar do cache
                if (cachedResponse) {
                    return cachedResponse;
                }

                // 2. Não está no cache? Busca na rede.
                return fetch(event.request).then(
                    (networkResponse) => {
                        // 3. Resposta válida? Clona, armazena no cache e retorna.
                        // Isso salva dinamicamente qualquer coisa que esquecemos na lista.
                        if (networkResponse && networkResponse.status === 200) {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });
                        }
                        return networkResponse;
                    }
                ).catch(() => {
                    // 4. Falha total (offline e não está no cache)
                    // Você pode criar uma página offline.html e retorná-la aqui
                    // return caches.match('/offline.html');
                });
            })
    );
});