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
        if (mainMenu) mainMenu.setAttribute('aria-hidden', 'true');
        trapFocus(false);
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


// =============================================
// LÓGICA ATUALIZADA PARA O MENU DE ACESSIBILIDADE
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    const accessibilityBtn = document.getElementById('accessibility-btn');
    if (!accessibilityBtn) return;

    let modal = null;
    const ACCESS_PREFERENCES = 'accessibilityPreferences';

    let preferences = {
        fontSize: 16,
        highContrast: false,
        grayscale: false,
        saturateColors: false,
        underlineLinks: false,
        readableFont: false,
    };

    function applyPreferences() {
        document.documentElement.style.fontSize = preferences.fontSize + 'px';
        document.body.classList.toggle('high-contrast', preferences.highContrast);
        document.body.classList.toggle('grayscale', preferences.grayscale);
        document.body.classList.toggle('saturate-colors', preferences.saturateColors);
        document.body.classList.toggle('underline-links', preferences.underlineLinks);
        document.body.classList.toggle('readable-font', preferences.readableFont);
    }

    function savePreferences() {
        localStorage.setItem(ACCESS_PREFERENCES, JSON.stringify(preferences));
    }

    function loadPreferences() {
        const saved = localStorage.getItem(ACCESS_PREFERENCES);
        if (saved) {
            preferences = { ...preferences, ...JSON.parse(saved) };
        }
        applyPreferences();
    }

    function createAccessibilityModal() {
        const modalBackdrop = document.createElement('div');
        modalBackdrop.className = 'accessibility-modal-backdrop';
        modalBackdrop.innerHTML = `
            <div class="accessibility-modal-content">
                <div class="accessibility-modal-header">
                    <h4>Acessibilidade</h4>
                    <button class="close-modal-btn">&times;</button>
                </div>
                <div class="accessibility-modal-body">
                    <div class="accessibility-option">
                        <label>Tamanho da Fonte</label>
                        <div class="font-size-controls">
                            <button id="decrease-font" aria-label="Diminuir fonte">-</button>
                            <button id="reset-font" aria-label="Resetar fonte">A</button>
                            <button id="increase-font" aria-label="Aumentar fonte">+</button>
                        </div>
                    </div>
                    <div class="accessibility-option">
                        <label for="high-contrast-toggle">Alto Contraste</label>
                        <label class="toggle-switch"><input type="checkbox" id="high-contrast-toggle"><span class="slider"></span></label>
                    </div>
                    <div class="accessibility-option">
                        <label for="grayscale-toggle">Tons de Cinza</label>
                        <label class="toggle-switch"><input type="checkbox" id="grayscale-toggle"><span class="slider"></span></label>
                    </div>
                    <div class="accessibility-option">
                        <label for="saturate-colors-toggle">Saturar Cores (Daltónicos)</label>
                        <label class="toggle-switch"><input type="checkbox" id="saturate-colors-toggle"><span class="slider"></span></label>
                    </div>
                    <div class="accessibility-option">
                        <label for="underline-links-toggle">Sublinhar Links</label>
                        <label class="toggle-switch"><input type="checkbox" id="underline-links-toggle"><span class="slider"></span></label>
                    </div>
                    <div class="accessibility-option">
                        <label for="readable-font-toggle">Fonte Legível</label>
                        <label class="toggle-switch"><input type="checkbox" id="readable-font-toggle"><span class="slider"></span></label>
                    </div>
                    <button id="reset-all-accessibility" class="btn-reset-accessibility">Restaurar Padrões</button>
                </div>
            </div>
        `;
        document.body.appendChild(modalBackdrop);
        return modalBackdrop;
    }
    
    function openModal() {
        if (!modal) {
            modal = createAccessibilityModal();
            setupModalEventListeners();
        }
        updateModalControls();
        modal.style.display = 'flex';
    }

    function closeModal() {
        if (modal) {
            modal.style.display = 'none';
        }
    }

    function updateModalControls() {
        modal.querySelector('#high-contrast-toggle').checked = preferences.highContrast;
        modal.querySelector('#grayscale-toggle').checked = preferences.grayscale;
        modal.querySelector('#saturate-colors-toggle').checked = preferences.saturateColors;
        modal.querySelector('#underline-links-toggle').checked = preferences.underlineLinks;
        modal.querySelector('#readable-font-toggle').checked = preferences.readableFont;
    }

    function setupModalEventListeners() {
        const increaseFontBtn = modal.querySelector('#increase-font');
        const decreaseFontBtn = modal.querySelector('#decrease-font');
        const resetFontBtn = modal.querySelector('#reset-font');
        const highContrastToggle = modal.querySelector('#high-contrast-toggle');
        const grayscaleToggle = modal.querySelector('#grayscale-toggle');
        const saturateColorsToggle = modal.querySelector('#saturate-colors-toggle');
        const underlineLinksToggle = modal.querySelector('#underline-links-toggle');
        const readableFontToggle = modal.querySelector('#readable-font-toggle');
        const resetAllBtn = modal.querySelector('#reset-all-accessibility');
        const closeModalBtn = modal.querySelector('.close-modal-btn');

        increaseFontBtn.addEventListener('click', () => { preferences.fontSize = Math.min(preferences.fontSize + 1, 24); applyAndSave(); });
        decreaseFontBtn.addEventListener('click', () => { preferences.fontSize = Math.max(preferences.fontSize - 1, 12); applyAndSave(); });
        resetFontBtn.addEventListener('click', () => { preferences.fontSize = 16; applyAndSave(); });
        
        highContrastToggle.addEventListener('change', () => { preferences.highContrast = highContrastToggle.checked; applyAndSave(); });
        grayscaleToggle.addEventListener('change', () => { preferences.grayscale = grayscaleToggle.checked; applyAndSave(); });
        saturateColorsToggle.addEventListener('change', () => { preferences.saturateColors = saturateColorsToggle.checked; applyAndSave(); });
        underlineLinksToggle.addEventListener('change', () => { preferences.underlineLinks = underlineLinksToggle.checked; applyAndSave(); });
        readableFontToggle.addEventListener('change', () => { preferences.readableFont = readableFontToggle.checked; applyAndSave(); });

        resetAllBtn.addEventListener('click', () => {
            preferences = { fontSize: 16, highContrast: false, grayscale: false, saturateColors: false, underlineLinks: false, readableFont: false };
            applyAndSave();
            updateModalControls();
        });
        
        function applyAndSave() {
            applyPreferences();
            savePreferences();
        }

        closeModalBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    }

    accessibilityBtn.addEventListener('click', openModal);
    loadPreferences();
});