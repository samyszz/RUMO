// sw.js (Versão 2 - Ignora o Firebase)

const CACHE_NAME = 'rumo-v1';
const URLS_TO_CACHE = [
    '/',
    '/index.html',
    '/hub.html',
    '/utilitarios.html',
    '/sobre.html',
    '/auth.html',
    '/perfil.html',
    '/css/base.css',
    '/css/home.css',
    '/css/hub.css',
    '/css/auth-style.css',
    '/css/profile.css',
    '/js/main-menu.js',
    '/js/dark-mode.js',
    '/js/auth-state.js',
    '/js/i18n.js',
    '/logo.png',
    '/banner3 (2).png',
    '/assets/imagens/avatar-padrao.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache aberto: ', CACHE_NAME);
                return cache.addAll(URLS_TO_CACHE);
            })
    );
});

self.addEventListener('fetch', (event) => {
    // Se for uma requisição para o Firebase, vá direto para a rede.
    if (event.request.url.includes('firebase') || event.request.url.includes('gstatic')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Para todo o resto, use a estratégia Cache-First
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});