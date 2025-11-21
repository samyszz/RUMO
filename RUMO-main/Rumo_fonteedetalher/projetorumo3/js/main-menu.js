// =============================================
// LÓGICA DO MENU PRINCIPAL (HAMBURGUER)
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const mainMenu = document.getElementById('main-nav');
    const header = document.getElementById('main-header');

    // Funções auxiliares: controlam apenas a classe do header
    function openNav() {
        if (!header) return;
        header.classList.add('nav-open');
        if (hamburgerMenu) hamburgerMenu.setAttribute('aria-expanded', 'true');
        if (mainMenu) mainMenu.setAttribute('aria-hidden', 'false');
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
        // Definições ARIA
        hamburgerMenu.setAttribute('aria-expanded', header.classList.contains('nav-open') ? 'true' : 'false');
        mainMenu.setAttribute('aria-hidden', header.classList.contains('nav-open') ? 'false' : 'true');

        hamburgerMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleNav();
        });

        // Sincroniza controles do header para o menu mobile
        (function syncHeaderControlsToMenu() {
            try {
                const ul = mainMenu.querySelector('ul');
                if (!ul) return;
                // Verificação para não duplicar
                if (mainMenu.dataset.mobileControlsSynced === 'true' || document.getElementById('mobile-header-controls')) return; 

                const li = document.createElement('li');
                li.id = 'mobile-header-controls';
                li.className = 'mobile-header-icons bottom';

                // Botão de Acessibilidade
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

                // Botão de Idioma (Ajustado para abrir o SEU painel mobile)
                const langBtn = document.createElement('button');
                langBtn.className = 'mobile-lang-btn'; // Classe usada pelo seu script
                langBtn.type = 'button';
                langBtn.setAttribute('aria-label', 'Alterar idioma (mobile)');
                langBtn.innerHTML = '<i class="fas fa-language"></i>';
                // Nota: O evento de click é gerenciado pela função createMobileLanguagePanel abaixo
                li.appendChild(langBtn);

                // Botão de Tema
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

                // Link de Perfil
                const profileLink = document.createElement('a');
                profileLink.className = 'mobile-profile-link';
                profileLink.href = document.getElementById('profile-bubble') ? document.getElementById('profile-bubble').getAttribute('href') || 'perfil.html' : 'perfil.html';
                profileLink.innerHTML = '<i class="fas fa-user-circle"></i>';
                li.appendChild(profileLink);

                ul.appendChild(li);
                mainMenu.dataset.mobileControlsSynced = 'true';
            } catch (err) {
                console.warn('syncHeaderControlsToMenu failed', err);
            }
        })();

        // Fechar ao clicar fora
        document.addEventListener('click', (e) => {
            if (!header.classList.contains('nav-open')) return;
            // Verifica se o clique não foi dentro do menu ou do painel de idioma mobile
            const mobileLangPanel = document.getElementById('mobile-lang-panel');
            const clickedInPanel = mobileLangPanel && mobileLangPanel.contains(e.target);
            
            if (mainMenu && !mainMenu.contains(e.target) && !hamburgerMenu.contains(e.target) && !clickedInPanel) {
                closeNav();
            }
        });

        // Fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && header.classList.contains('nav-open')) {
                closeNav();
            }
        });
    }
    
    // Trap Focus (Acessibilidade)
    function trapFocus(active) {
        if (!mainMenu) return;
        const focusableSelectors = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
        const focusable = Array.from(mainMenu.querySelectorAll(focusableSelectors)).filter(el => el.offsetParent !== null);

        if (active) {
            document._previouslyFocused = document.activeElement;
            if (focusable.length) focusable[0].focus();

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
            if (document._previouslyFocused) document._previouslyFocused.focus();
            document._previouslyFocused = null;
        }
    }
});


// =============================================
// LÓGICA DO DROPDOWN DE IDIOMA NO HEADER (COM BANDEIRAS)
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    const langContainer = document.getElementById('header-lang-container');
    if (!langContainer) return;

    const langBtn = langContainer.querySelector('#lang-dropdown-btn');
    const langContent = langContainer.querySelector('#lang-dropdown-content');
    const langSelect = langContainer.querySelector('#language-select-header');

    // LISTA DE IDIOMAS USANDO UNICODE ESCAPES
    const languages = {
        "Português": [
            { name: "Brasil", flag: "\uD83C\uDDE7\uD83C\uDDF7" },       // 🇧🇷
            { name: "Portugal", flag: "\uD83C\uDDF5\uD83C\uDDF9" },     // 🇵🇹
            { name: "Angola", flag: "\uD83C\uDDE6\uD83C\uDDF4" },       // 🇦🇴
            { name: "Moçambique", flag: "\uD83C\uDDF2\uD83C\uDDFF" },   // 🇲🇿
            { name: "Cabo Verde", flag: "\uD83C\uDDE8\uD83C\uDDFB" },   // 🇨🇻
            { name: "Guiné-Bissau", flag: "\uD83C\uDDEC\uD83C\uDDFC" }, // 🇬🇼
            { name: "Timor-Leste", flag: "\uD83C\uDDF9\uD83C\uDDF1" }   // 🇹🇱
        ],
        "Espanhol": [
            { name: "Espanha", flag: "\uD83C\uDDEA\uD83C\uDDF8" },      // 🇪🇸
            { name: "Venezuela", flag: "\uD83C\uDDFB\uD83C\uDDEA" },    // 🇻🇪
            { name: "Bolívia", flag: "\uD83C\uDDE7\uD83C\uDDF4" },      // 🇧🇴
            { name: "Paraguai", flag: "\uD83C\uDDF5\uD83C\uDDFE" },     // 🇵🇾
            { name: "Peru", flag: "\uD83C\uDDF5\uD83C\uDDEA" },         // 🇵🇪
            { name: "Argentina", flag: "\uD83C\uDDE6\uD83C\uDDF7" },    // 🇦🇷
            { name: "Colômbia", flag: "\uD83C\uDDE8\uD83C\uDDF4" },     // 🇨🇴
            { name: "Chile", flag: "\uD83C\uDDE8\uD83C\uDDF1" }         // 🇨🇱
        ],
        "Inglês": [
            { name: "Estados Unidos", flag: "\uD83C\uDDFA\uD83C\uDDF8" }, // 🇺🇸
            { name: "Reino Unido", flag: "\uD83C\uDDEC\uD83C\uDDE7" },    // 🇬🇧
            { name: "Nigéria", flag: "\uD83C\uDDF3\uD83C\uDDEC" },        // 🇳🇬
            { name: "Gana", flag: "\uD83C\uDDEC\uD83C\uDDED" },           // 🇬🇭
            { name: "África do Sul", flag: "\uD83C\uDDFF\uD83C\uDDE6" }   // 🇿🇦
        ],
        "Francês": [
            { name: "França", flag: "\uD83C\uDDEB\uD83C\uDDF7" },         // 🇫🇷
            { name: "Haiti", flag: "\uD83C\uDDED\uD83C\uDDF9" },          // 🇭🇹
            { name: "RDC", flag: "\uD83C\uDDE8\uD83C\uDDE9" },            // 🇨🇩
            { name: "Senegal", flag: "\uD83C\uDDF8\uD83C\uDDF3" },        // 🇸🇳
            { name: "África Ocidental", flag: "\uD83C\uDF0D" }            // 🌍
        ],
        "Crioulo Haitiano": [
            { name: "Haiti", flag: "\uD83C\uDDED\uD83C\uDDF9" }          // 🇭🇹
        ],
        "Árabe": [
            { name: "Síria", flag: "\uD83C\uDDF8\uD83C\uDDFE" },          // 🇸🇾
            { name: "Líbano", flag: "\uD83C\uDDF1\uD83C\uDDE7" },         // 🇱🇧
            { name: "Palestina", flag: "\uD83C\uDDF5\uD83C\uDDF8" }       // 🇵🇸
        ],
        "Mandarim (Chinês)": [
            { name: "China", flag: "\uD83C\uDDE8\uD83C\uDDF3" }           // 🇨🇳
        ],
        "Coreano": [
            { name: "Coreia do Sul", flag: "\uD83C\uDDF0\uD83C\uDDF7" }   // 🇰🇷
        ],
        "Japonês": [
            { name: "Japão", flag: "\uD83C\uDDEF\uD83C\uDDF5" }           // 🇯🇵
        ],
        "Guarani": [
            { name: "Paraguai", flag: "\uD83C\uDDF5\uD83C\uDDFE" },       // 🇵🇾
            { name: "Bolívia", flag: "\uD83C\uDDE7\uD83C\uDDF4" }         // 🇧🇴
        ],
        "Quéchua": [
            { name: "Bolívia", flag: "\uD83C\uDDE7\uD83C\uDDF4" },        // 🇧🇴
            { name: "Peru", flag: "\uD83C\uDDF5\uD83C\uDDEA" }            // 🇵🇪
        ]
    };

    // Mapeamento de nomes de idiomas para códigos
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
        
        const currentLang = localStorage.getItem('rumo_lang') || 'pt-brasil';
        let foundSelected = false;

        for (const languageName in languages) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = languageName;
            
            const langCodeBase = langCodeMap[languageName] || 'pt';

            languages[languageName].forEach(region => {
                // Normaliza o nome do país para criar o código (ex: pt-brasil)
                const regionSlug = region.name.toLowerCase()
                    .replace(/ /g, '-')
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove acentos
                
                const optionValue = `${langCodeBase}-${regionSlug}`;
                const option = document.createElement('option');
                option.value = optionValue;
                
                // Aplica o Emoji Seguro e o Nome
                option.textContent = `${region.flag} ${region.name}`;
                
                if (optionValue === currentLang) {
                    option.selected = true;
                    foundSelected = true; 
                }
                
                optgroup.appendChild(option);
            });
            langSelect.appendChild(optgroup);
        }

        // Fallback visual
        if (!foundSelected && langSelect.querySelector('option[value="pt-brasil"]')) {
             langSelect.value = 'pt-brasil';
        }
    }
    
    populateLanguageDropdown();

    // Evento ao trocar o idioma
    langSelect.addEventListener('change', () => {
        const selectedLangCode = langSelect.value;
        if (typeof window.setLanguage === 'function') {
            window.setLanguage(selectedLangCode);
        }
        langContent.style.display = 'none';
    });

    // Botão para abrir/fechar
    langBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = langContent.style.display === 'block';
        langContent.style.display = isVisible ? 'none' : 'block';
    });

    // Fechar ao clicar fora
    document.addEventListener('click', (e) => {
        if (langContent && !langContainer.contains(e.target)) {
            langContent.style.display = 'none';
        }
    });
});


// =============================================
// MENU DE ACESSIBILIDADE (COMPLETO)
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
                            <button id="decrease-font" type="button" aria-label="Diminuir fonte">-</button>
                            <button id="reset-font" type="button" aria-label="Resetar fonte">A</button>
                            <button id="increase-font" type="button" aria-label="Aumentar fonte">+</button>
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
                        <label for="saturate-colors-toggle">Saturar Cores</label>
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
                mobileSelect.value = headerSelect.value || localStorage.getItem('rumo_lang') || '';
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

        // Abre via botão mobile (adicionado dinamicamente no menu)
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
            
            if (typeof window.setLanguage === 'function') {
                window.setLanguage(value);
            } else {
                localStorage.setItem('rumo_lang', value);
                document.dispatchEvent(new CustomEvent('languageChanged', { detail: value }));
            }
            
            closePanel();
            
            // Fecha menu mobile também para refletir a mudança
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

        // sincroniza se o dropdown do header mudar (caso mude no desktop com resize)
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