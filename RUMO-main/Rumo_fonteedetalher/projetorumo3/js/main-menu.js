

// =============================================
// LÓGICA DO MENU PRINCIPAL (HAMBURGUER)
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const mainMenu = document.getElementById('main-nav');
    // closeMenu removed: we use the hamburger button that animates to X
    const header = document.getElementById('main-header');

    // Helper functions: control only the header class (CSS expects header.nav-open)
    function openNav() {
        if (!header) return;
        header.classList.add('nav-open');
        if (hamburgerMenu) hamburgerMenu.setAttribute('aria-expanded', 'true');
        if (mainMenu) mainMenu.setAttribute('aria-hidden', 'false');
        // focus management: focus first focusable element inside mainMenu
        trapFocus(true);
    }

  function closeNav() {
    if (!header) return;
    header.classList.remove('nav-open');
    if (hamburgerMenu) hamburgerMenu.setAttribute('aria-expanded', 'false');

    // CORREÇÃO: Move o foco para fora ANTES de esconder o menu
    trapFocus(false); 

    if (mainMenu) mainMenu.setAttribute('aria-hidden', 'true');
}

    function toggleNav() {
        if (!header) return;
        if (header.classList.contains('nav-open')) closeNav(); else openNav();
    }

    if (hamburgerMenu && mainMenu && header) {
        // set sensible ARIA defaults
        hamburgerMenu.setAttribute('aria-expanded', header.classList.contains('nav-open') ? 'true' : 'false');
        mainMenu.setAttribute('aria-hidden', header.classList.contains('nav-open') ? 'false' : 'true');

        hamburgerMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleNav();
        });

        // No close-menu element anymore; instead ensure header controls are available inside the mobile menu
        // Create mobile-friendly triggers that delegate to the header controls (avoids duplicating IDs/event handlers)
        (function syncHeaderControlsToMenu() {
            try {
                const ul = mainMenu.querySelector('ul');
                if (!ul) return;
                // stronger idempotency guard: check dataset flag or existing element id
                if (mainMenu.dataset.mobileControlsSynced === 'true' || document.getElementById('mobile-header-controls')) return; // already synced

                const li = document.createElement('li');
                li.id = 'mobile-header-controls';
                li.className = 'mobile-header-icons bottom';


// ================================
// Mobile language panel (inline)
// ================================
(function createMobileLanguagePanel() {
    try {
        const mainMenu = document.getElementById('main-nav');
        if (!mainMenu) return;
        if (document.getElementById('mobile-lang-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'mobile-lang-panel';
        panel.className = 'mobile-lang-panel';
        panel.innerHTML = `
            <div class="mobile-lang-header">
                <button class="mobile-lang-back-btn" aria-label="Voltar">&larr;</button>
                <h3>Idioma</h3>
            </div>
            <div class="mobile-lang-content">
                <p>Selecione um idioma e variante regional:</p>
                <label for="mobile-language-select">Idioma</label>
                <select id="mobile-language-select" class="mobile-lang-select" aria-label="Selecione idioma"></select>
                <div class="mobile-lang-actions">
                    <button id="mobile-lang-save" class="btn-save">Salvar</button>
                    <button id="mobile-lang-cancel" class="btn-cancel">Cancelar</button>
                </div>
            </div>
        `;
        mainMenu.appendChild(panel);

        // Clona o dropdown existente do header (com idiomas e países)
        const headerSelect = document.querySelector('#language-select-header');
        const mobileSelect = panel.querySelector('#mobile-language-select');

        if (headerSelect && headerSelect.options.length) {
            Array.from(headerSelect.children).forEach(child => {
                mobileSelect.appendChild(child.cloneNode(true));
            });
            mobileSelect.value = headerSelect.value || localStorage.getItem('language') || '';
        } else {
            console.warn('Nenhum dropdown de idioma encontrado no header.');
        }

        // Elementos
        const backBtn = panel.querySelector('.mobile-lang-back-btn');
        const saveBtn = panel.querySelector('#mobile-lang-save');
        const cancelBtn = panel.querySelector('#mobile-lang-cancel');

        function openPanel() {
            panel.classList.add('open');
            mainMenu.classList.add('mobile-lang-active');
            setTimeout(() => mobileSelect.focus(), 100);
        }
        function closePanel() {
            panel.classList.remove('open');
            mainMenu.classList.remove('mobile-lang-active');
        }

        // Abertura via botão mobile
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.mobile-lang-btn');
            if (btn) {
                e.preventDefault();
                openPanel();
            }
        });

        backBtn.addEventListener('click', (e) => { e.preventDefault(); closePanel(); });
        cancelBtn.addEventListener('click', (e) => { e.preventDefault(); closePanel(); });

        saveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const value = mobileSelect.value;
            if (typeof setLanguage === 'function') {
                setLanguage(value);
            } else {
                localStorage.setItem('language', value);
                document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: value } }));
            }
            closePanel();
            // Fecha menu hamburguer junto
            const header = document.getElementById('main-header');
            if (header && header.classList.contains('nav-open')) {
                header.classList.remove('nav-open');
                const hamburger = document.getElementById('hamburger-menu');
                if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && panel.classList.contains('open')) closePanel();
        });

    } catch (err) {
        console.warn('createMobileLanguagePanel failed', err);
    }
})();


                
           // Accessibility button -> triggers existing accessibility button
const accBtn = document.createElement('button');
accBtn.className = 'mobile-accessibility-btn';
accBtn.type = 'button';
accBtn.setAttribute('aria-label', 'Abrir menu de acessibilidade (mobile)');
accBtn.innerHTML = '<i class="fas fa-universal-access"></i>';
accBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const real = document.getElementById('accessibility-btn');
    if (real) real.click();
    closeNav(); // <-- ADICIONE ESTA LINHA AQUI
});

li.appendChild(accBtn);

                // Language button -> delegates to header language button
                const langBtn = document.createElement('button');
                langBtn.className = 'mobile-lang-btn';
                langBtn.type = 'button';
                langBtn.setAttribute('aria-label', 'Alterar idioma (mobile)');
                langBtn.innerHTML = '<i class="fas fa-language"></i>';
                langBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const real = document.getElementById('lang-dropdown-btn');
                    if (real) real.click();
                });
                li.appendChild(langBtn);

                // Theme toggle -> delegates to desktop toggle
                const themeBtn = document.createElement('button');
                themeBtn.className = 'mobile-theme-btn';
                themeBtn.type = 'button';
                themeBtn.setAttribute('aria-label', 'Alternar tema (mobile)');
                themeBtn.innerHTML = '<i class="fas fa-moon"></i><i class="fas fa-sun"></i>';
                themeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const real = document.getElementById('theme-toggle-btn-desktop');
                    if (real) real.click();
                });
                li.appendChild(themeBtn);

                // Profile bubble -> link to profile page
                const profileLink = document.createElement('a');
                profileLink.className = 'mobile-profile-link';
                profileLink.href = document.getElementById('profile-bubble') ? document.getElementById('profile-bubble').getAttribute('href') || 'perfil.html' : 'perfil.html';
                profileLink.innerHTML = '<i class="fas fa-user-circle"></i>';
                li.appendChild(profileLink);

                // Insert at the end of the menu so we can push it to the bottom via CSS (margin-top: auto)
                ul.appendChild(li);
                // mark as synced so repeated calls won't re-insert the controls
                mainMenu.dataset.mobileControlsSynced = 'true';
            } catch (err) {
                console.warn('syncHeaderControlsToMenu failed', err);
            }
        })();
        

        // Close when clicking outside the nav (on small screens)
        document.addEventListener('click', (e) => {
            if (!header.classList.contains('nav-open')) return;
            if (mainMenu && !mainMenu.contains(e.target) && !hamburgerMenu.contains(e.target)) {
                closeNav();
            }
        });

        // Close with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && header.classList.contains('nav-open')) {
                closeNav();
            }
        });
    }
    
    // Simple focus trap: when active=true, keep focus within the #main-nav element
    function trapFocus(active) {
        if (!mainMenu) return;
        const focusableSelectors = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
        const focusable = Array.from(mainMenu.querySelectorAll(focusableSelectors)).filter(el => el.offsetParent !== null);

        if (active) {
            // save previously focused element
            document._previouslyFocused = document.activeElement;
            if (focusable.length) focusable[0].focus();

            // keydown listener to keep focus inside
            mainMenu._focusHandler = (e) => {
                if (e.key !== 'Tab') return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            };
            mainMenu.addEventListener('keydown', mainMenu._focusHandler);
        } else {
            if (mainMenu._focusHandler) {
                mainMenu.removeEventListener('keydown', mainMenu._focusHandler);
                mainMenu._focusHandler = null;
            }
            // restore focus
            if (document._previouslyFocused) document._previouslyFocused.focus();
            document._previouslyFocused = null;
        }
    }
});

// Registro do Service Worker: garante que todas as páginas que carregam main-menu.js registrem o SW
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registrado (via main-menu.js):', reg.scope))
            .catch(err => console.warn('Falha ao registrar Service Worker:', err));
    });
}

// --- VERIFICAÇÃO DE VERSÃO DO APP (mostrar banner quando houver nova versão) ---
(function setupVersionChecker() {
    const VERSION_FILE = './version.json';
    const STORAGE_KEY = 'appVersion';
    const CHECK_INTERVAL = 60 * 1000; // 60s

    function createBanner() {
        const existing = document.getElementById('update-banner');
        if (existing) return existing;

        const banner = document.createElement('div');
        banner.id = 'update-banner';
        banner.className = 'update-banner update-banner-hidden';
        banner.innerHTML = `
            <div class="update-message">Nova versão disponível — clique para atualizar</div>
            <div class="update-actions">
                <button id="btn-update-now">Atualizar</button>
                <button id="btn-update-ignore" class="secondary">Ignorar</button>
            </div>
        `;
        document.body.appendChild(banner);
        return banner;
    }

    async function fetchVersion() {
        try {
            const res = await fetch(VERSION_FILE, { cache: 'no-cache' });
            if (!res.ok) throw new Error('Não foi possível buscar version.json');
            return await res.json();
        } catch (err) {
            console.warn('fetchVersion failed', err);
            return null;
        }
    }

    async function checkForUpdate() {
        const data = await fetchVersion();
        if (!data || !data.version) return;
        const remote = data.version;
        const local = localStorage.getItem(STORAGE_KEY) || null;
        if (!local) {
            localStorage.setItem(STORAGE_KEY, remote);
            return;
        }
        if (remote !== local) {
            // show banner
            const banner = createBanner();
            banner.classList.remove('update-banner-hidden');

            const btnNow = document.getElementById('btn-update-now');
            const btnIgnore = document.getElementById('btn-update-ignore');

            function doUpdate() {
                // Try to activate waiting service worker first
                if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) {
                    navigator.serviceWorker.getRegistration().then(reg => {
                        if (reg && reg.waiting) {
                            // Ask SW to skipWaiting
                            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                        }
                        // listen for controller change and reload
                        navigator.serviceWorker.addEventListener('controllerchange', () => {
                            window.location.reload();
                        });
                        // if no waiting SW, just reload to fetch new assets
                        if (!(reg && reg.waiting)) {
                            window.location.reload();
                        }
                    }).catch(() => window.location.reload());
                } else {
                    window.location.reload();
                }
            }

            btnNow.addEventListener('click', () => {
                // set local version to remote to avoid re-showing after update
                localStorage.setItem(STORAGE_KEY, remote);
                doUpdate();
            });

            btnIgnore.addEventListener('click', () => {
                banner.classList.add('update-banner-hidden');
                // user ignored; update stored version so we won't nag until next version
                localStorage.setItem(STORAGE_KEY, remote);
            });
        }
    }

    // Run on load and periodically
    window.addEventListener('load', () => {
        checkForUpdate();
        setInterval(checkForUpdate, CHECK_INTERVAL);
    });
})();


// =============================================
// LÓGICA ATUALIZADA PARA DROPDOWN DE IDIOMA NO HEADER (COM REGIONALIDADE COMPLETA)
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    const langContainer = document.getElementById('header-lang-container');
    if (!langContainer) return;

    const langBtn = langContainer.querySelector('#lang-dropdown-btn');
    const langContent = langContainer.querySelector('#lang-dropdown-content');
    const langSelect = langContainer.querySelector('#language-select-header');

    // LISTA COMPLETA DE IDIOMAS E PAÍSES FORNECIDA
    const languages = {
        "Português": ["Brasil", "Portugal", "Angola", "Moçambique", "Cabo Verde", "Guiné-Bissau", "Timor-Leste"],
        "Espanhol": ["Venezuela", "Bolívia", "Paraguai", "Peru", "Argentina", "Colômbia", "Chile"],
        "Inglês": ["Nigéria", "Gana", "África do Sul", "Estados Unidos", "Reino Unido"],
        "Francês": ["Haiti", "República Democrática do Congo", "Senegal", "África Ocidental", "França"],
        "Crioulo Haitiano": ["Haiti"],
        "Árabe": ["Síria", "Líbano", "Palestina"],
        "Mandarim (Chinês)": ["China"],
        "Coreano": ["Coreia do Sul"],
        "Japonês": ["Japão"],
        "Guarani": ["Paraguai", "Bolívia"],
        "Quéchua": ["Bolívia", "Peru"]
    };

    // Mapeamento de nomes de idiomas para códigos de 2 letras para o i18n
    const langCodeMap = {
        "Português": "pt",
        "Espanhol": "es",
        "Inglês": "en",
        "Francês": "fr",
        "Crioulo Haitiano": "ht",
        "Árabe": "ar",
        "Mandarim (Chinês)": "zh",
        "Coreano": "ko",
        "Japonês": "ja",
        "Guarani": "gn",
        "Quéchua": "qu"
    };

    function populateLanguageDropdown() {
        if (!langSelect) return;
        langSelect.innerHTML = '<option value="" disabled>Selecione um idioma</option>';
        const currentLang = localStorage.getItem('language') || 'pt-brasil';
        let foundSelected = false;

        for (const language in languages) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = language;
            
            const langCode = langCodeMap[language] || 'pt';

            languages[language].forEach(country => {
                const regionCode = country.toLowerCase().replace(/ /g, '-').replace(/á/g, 'a').replace(/ç/g, 'c').replace(/ã/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ñ/g, 'n');
                const optionValue = `${langCode}-${regionCode}`;
                const option = document.createElement('option');
                option.value = optionValue;
                option.textContent = `${language} - ${country}`;
                
                // Marca como selecionado se matches current
                if (optionValue === currentLang && !foundSelected) {
                    option.selected = true;
                    foundSelected = true; 
                }
                
                optgroup.appendChild(option);
            });
            langSelect.appendChild(optgroup);
        }
    }
    
    populateLanguageDropdown();

    // Evento que efetivamente muda o idioma do site
    langSelect.addEventListener('change', () => {
        const selectedLangCode = langSelect.value;
        setLanguage(selectedLangCode);
        langContent.style.display = 'none';
    });

    // Lógica para abrir/fechar o menu
    langBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = langContent.style.display === 'block';
        langContent.style.display = isVisible ? 'none' : 'block';
    });

    document.addEventListener('click', (e) => {
        if (langContent && !langContainer.contains(e.target)) {
            langContent.style.display = 'none';
        }
    });
});

// ================================
// Mobile language panel (inline)
// ================================
(function createMobileLanguagePanel() {
    try {
        const mainMenu = document.getElementById('main-nav');
        if (!mainMenu) return;
        // evita recriar
        if (document.getElementById('mobile-lang-panel')) return;

        // cria o painel
        const panel = document.createElement('div');
        panel.id = 'mobile-lang-panel';
        panel.className = 'mobile-lang-panel';
        panel.style.background = 'rgba(133, 203, 203, 0.9)'; // fundo atualizado

        panel.innerHTML = `
            <div class="mobile-lang-header">
                <button class="mobile-lang-back-btn" aria-label="Voltar">&larr;</button>
                <h3>Idioma</h3>
            </div>
            <div class="mobile-lang-content">
                <p>Selecione um idioma e variante regional:</p>
                <label for="mobile-language-select">Idioma</label>
                <select id="mobile-language-select" class="mobile-lang-select" aria-label="Selecione idioma"></select>
                <div style="display:flex;gap:8px;margin-top:12px;justify-content:center;">
                    <button id="mobile-lang-save" class="btn-save" aria-label="Salvar idioma">Salvar</button>
                    <button id="mobile-lang-cancel" class="btn-cancel" aria-label="Cancelar">Cancelar</button>
                </div>
            </div>
        `;
        mainMenu.appendChild(panel);

        const mobileSelect = panel.querySelector('#mobile-language-select');

        // ======== 🔁 Aguarda o header carregar idiomas ========
        function cloneHeaderLanguages() {
            const headerSelect = document.querySelector('#language-select-header');
            if (headerSelect && headerSelect.options.length > 1) {
                mobileSelect.innerHTML = '';
                Array.from(headerSelect.children).forEach(child => {
                    mobileSelect.appendChild(child.cloneNode(true));
                });
                mobileSelect.value = headerSelect.value || localStorage.getItem('language') || '';
                console.log('Idiomas carregados no painel mobile ✅');
            } else {
                // tenta novamente até o header estar pronto
                setTimeout(cloneHeaderLanguages, 250);
            }
        }
        cloneHeaderLanguages();
        // ======================================================

        // Botões e handlers
        const backBtn = panel.querySelector('.mobile-lang-back-btn');
        const saveBtn = panel.querySelector('#mobile-lang-save');
        const cancelBtn = panel.querySelector('#mobile-lang-cancel');

        // aplica o estilo dos botões
        [saveBtn, cancelBtn].forEach(btn => {
            btn.style.backgroundColor = '#ade6ec';
            btn.style.color = '#0a4849';
            btn.style.fontWeight = '800';
            btn.style.padding = '8px 20px';
            btn.style.borderRadius = '20px';
            btn.style.border = '3px solid #5a9a9a';
            btn.style.cursor = 'pointer';
        });

        function openPanel() {
            panel.classList.add('open');
            mainMenu.classList.add('mobile-lang-active');
            setTimeout(() => {
                const s = panel.querySelector('#mobile-language-select');
                if (s) s.focus();
            }, 80);
        }
        function closePanel() {
            panel.classList.remove('open');
            mainMenu.classList.remove('mobile-lang-active');
        }

        // Abre via botão mobile
        document.addEventListener('click', (e) => {
            const target = e.target.closest && e.target.closest('.mobile-lang-btn');
            if (target) {
                e.preventDefault();
                openPanel();
            }
        });

        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closePanel();
        });

        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closePanel();
        });

        saveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const sel = panel.querySelector('#mobile-language-select');
            if (!sel) return;
            const value = sel.value;
            if (typeof setLanguage === 'function') {
                setLanguage(value);
            } else {
                localStorage.setItem('language', value);
                document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: value } }));
            }
            closePanel();
            // Fecha menu mobile também
            const header = document.getElementById('main-header');
            if (header && header.classList.contains('nav-open')) {
                header.classList.remove('nav-open');
                const hamburger = document.getElementById('hamburger-menu');
                if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
                const mainNav = document.getElementById('main-nav');
                if (mainNav) mainNav.setAttribute('aria-hidden', 'true');
            }
        });

        // Fecha painel com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && panel.classList.contains('open')) {
                closePanel();
            }
        });

        // sincroniza se o dropdown do header mudar
        const desktopSelect = document.querySelector('#language-select-header');
        if (desktopSelect) {
            desktopSelect.addEventListener('change', () => {
                const ms = document.querySelector('#mobile-language-select');
                if (ms) ms.value = desktopSelect.value;
            });
        }

    } catch (err) {
        console.warn('createMobileLanguagePanel failed', err);
    }
})();
