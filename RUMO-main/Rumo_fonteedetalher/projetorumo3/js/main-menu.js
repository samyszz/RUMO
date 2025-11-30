/* js/main-menu.js - Menu Principal e Seletor de Idiomas Completo */

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

                // Botão de Idioma (Ajustado para abrir o painel mobile)
                const langBtn = document.createElement('button');
                langBtn.className = 'mobile-lang-btn'; 
                langBtn.type = 'button';
                langBtn.setAttribute('aria-label', 'Alterar idioma (mobile)');
                langBtn.innerHTML = '<i class="fas fa-language"></i>';
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

    // LISTA COMPLETA DE IDIOMAS (Sincronizada com i18n.js)
    const languages = {
        "Português": [
            { name: "Brasil", flag: "🇧🇷" },
            { name: "Portugal", flag: "🇵🇹" },
            { name: "Angola", flag: "🇦🇴" },
            { name: "Moçambique", flag: "🇲🇿" },
            { name: "Cabo Verde", flag: "🇨🇻" },
            { name: "Guiné-Bissau", flag: "🇬🇼" },
            { name: "Timor-Leste", flag: "🇹🇱" }
        ],
        "Espanhol": [
            { name: "Espanha", flag: "🇪🇸" },
            { name: "México", flag: "🇲🇽" },
            { name: "Venezuela", flag: "🇻🇪" },
            { name: "Bolívia", flag: "🇧🇴" },
            { name: "Paraguai", flag: "🇵🇾" },
            { name: "Peru", flag: "🇵🇪" },
            { name: "Argentina", flag: "🇦🇷" },
            { name: "Colômbia", flag: "🇨🇴" },
            { name: "Chile", flag: "🇨🇱" }
        ],
        "Inglês": [
            { name: "Estados Unidos", flag: "🇺🇸" },
            { name: "Reino Unido", flag: "🇬🇧" },
            { name: "Nigéria", flag: "🇳🇬" },
            { name: "Gana", flag: "🇬🇭" },
            { name: "África do Sul", flag: "🇿🇦" }
        ],
        "Francês": [
            { name: "França", flag: "🇫🇷" },
            { name: "Haiti", flag: "🇭🇹" },
            { name: "RDC", flag: "🇨🇩" },
            { name: "Senegal", flag: "🇸🇳" },
            { name: "África Ocidental", flag: "🌍" }
        ],
        "Crioulo Haitiano": [
            { name: "Haiti", flag: "🇭🇹" }
        ],
        "Árabe": [
            { name: "Síria", flag: "🇸🇾" },
            { name: "Líbano", flag: "🇱🇧" },
            { name: "Palestina", flag: "🇵🇸" }
        ],
        "Mandarim (Chinês)": [
            { name: "China", flag: "🇨🇳" }
        ],
        "Coreano": [
            { name: "Coreia do Sul", flag: "🇰🇷" }
        ],
        "Japonês": [
            { name: "Japão", flag: "🇯🇵" }
        ],
        "Guarani": [
            { name: "Paraguai", flag: "🇵🇾" },
            { name: "Bolívia", flag: "🇧🇴" }
        ],
        "Quéchua": [
            { name: "Bolívia", flag: "🇧🇴" },
            { name: "Peru", flag: "🇵🇪" }
        ]
    };

    // Mapeamento de nomes de idiomas para códigos (Sincronizado com i18n.js)
    const langCodeMap = {
        "Português": "pt", "Espanhol": "es", "Inglês": "en", "Francês": "fr",
        "Crioulo Haitiano": "ht", "Árabe": "ar", "Mandarim (Chinês)": "zh",
        "Coreano": "ko", "Japonês": "ja", "Guarani": "gn", "Quéchua": "qu"
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
                
                // Aplica Bandeira + Nome
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
                // console.log('Idiomas carregados no painel mobile ✅');
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
// =============================================
// LÓGICA DO BOTÃO DE ACESSIBILIDADE (Integração UserWay)
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    const accBtn = document.getElementById('accessibility-btn');
    
    if (accBtn) {
        accBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Tenta encontrar o widget do UserWay na página
            // O UserWay geralmente cria elementos com IDs ou classes específicas
            // A API pública 'UserWay.accessibilityWidget.toggle()' funciona na maioria das versões
            
            if (typeof UserWay !== 'undefined' && UserWay.accessibilityWidget) {
                UserWay.accessibilityWidget.toggle();
            } else {
                // Fallback: Tenta clicar no ícone padrão do UserWay se a API não estiver exposta
                const userWayIcon = document.querySelector('[id^="userway-accessibility-widget"]');
                if (userWayIcon) {
                    userWayIcon.click();
                } else {
                    console.warn("Widget UserWay ainda não carregou ou não foi encontrado.");
                }
            }
        });
    }
});