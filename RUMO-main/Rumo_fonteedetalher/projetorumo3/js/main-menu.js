/* js/main-menu.js - Menu Principal e Seletor de Idiomas (Desktop & Mobile) */

// =============================================
// 1. LÓGICA DO MENU PRINCIPAL (HAMBURGUER)
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const mainMenu = document.getElementById('main-nav');
    const header = document.getElementById('main-header');

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
                // Evita duplicar se já foi sincronizado
                if (mainMenu.dataset.mobileControlsSynced === 'true' || document.getElementById('mobile-header-controls')) return; 

                const li = document.createElement('li');
                li.id = 'mobile-header-controls';
                li.className = 'mobile-header-icons bottom';

                // Acessibilidade
                const accBtn = document.createElement('button');
                accBtn.className = 'mobile-accessibility-btn';
                accBtn.type = 'button';
                accBtn.innerHTML = '<i class="fas fa-universal-access"></i>';
                accBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const real = document.getElementById('accessibility-btn');
                    if (real) real.click();
                });
                li.appendChild(accBtn);

                // Idioma
                const langBtn = document.createElement('button');
                langBtn.className = 'mobile-lang-btn'; 
                langBtn.type = 'button';
                langBtn.innerHTML = '<i class="fas fa-language"></i>';
                li.appendChild(langBtn);

                // Tema
                const themeBtn = document.createElement('button');
                themeBtn.className = 'mobile-theme-btn';
                themeBtn.type = 'button';
                themeBtn.innerHTML = '<i class="fas fa-moon"></i><i class="fas fa-sun"></i>';
                themeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const real = document.getElementById('theme-toggle-btn-desktop');
                    if (real) { 
                        real.click(); 
                    } else {
                        // Fallback genérico
                        const themeToggle = document.querySelector('.theme-toggle-auth') || document.querySelector('.theme-toggle');
                        if(themeToggle) themeToggle.click();
                    }
                });
                li.appendChild(themeBtn);

                // Perfil
                const profileLink = document.createElement('a');
                profileLink.className = 'mobile-profile-link';
                profileLink.href = 'perfil.html';
                const bubble = document.getElementById('profile-bubble');
                if(bubble && bubble.getAttribute('href')) profileLink.href = bubble.getAttribute('href');
                
                profileLink.innerHTML = '<i class="fas fa-user-circle"></i>';
                li.appendChild(profileLink);

                ul.appendChild(li);
                mainMenu.dataset.mobileControlsSynced = 'true';
            } catch (err) {
                console.warn('syncHeaderControlsToMenu failed', err);
            }
        })();

        // Fechar ao clicar fora (Mobile)
        document.addEventListener('click', (e) => {
            if (!header.classList.contains('nav-open')) return;
            const mobileLangPanel = document.getElementById('mobile-lang-panel');
            const clickedInPanel = mobileLangPanel && mobileLangPanel.contains(e.target);
            
            if (mainMenu && !mainMenu.contains(e.target) && !hamburgerMenu.contains(e.target) && !clickedInPanel) {
                closeNav();
            }
        });

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
// 2. LÓGICA DO DROPDOWN DE IDIOMA NO HEADER (DESKTOP)
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    // Busca o container pai para garantir escopo
    const langContainer = document.getElementById('header-lang-container');
    
    // Se o container não existir, tenta rodar apenas a lógica do select direto (fallback)
    const langSelect = document.getElementById('language-select-header');
    
    // Elementos da UI Personalizada (Botão + Div)
    // Usamos ?. para evitar erro caso eles não existam no HTML
    const langBtn = langContainer ? langContainer.querySelector('#lang-dropdown-btn') : null;
    const langContent = langContainer ? langContainer.querySelector('#lang-dropdown-content') : null;

    // LISTA SIMPLIFICADA (Sem Regiões)
    const languages = [
        { code: "pt", name: "Português", flag: "🇧🇷" },
        { code: "es", name: "Espanhol",  flag: "🇪🇸" },
        { code: "en", name: "Inglês",    flag: "🇺🇸" },
        { code: "fr", name: "Francês",   flag: "🇫🇷" },
        { code: "zh", name: "Mandarim",  flag: "🇨🇳" },
        { code: "ja", name: "Japonês",   flag: "🇯🇵" },
        { code: "ht", name: "Crioulo",   flag: "🇭🇹" },
        { code: "qu", name: "Quéchua",   flag: "🇧🇴" },
        { code: "ar", name: "Árabe",     flag: "🇸🇾" },
        { code: "ko", name: "Coreano",   flag: "🇰🇷" },
        { code: "gn", name: "Guarani",   flag: "🇵🇾" }
    ];

    function populateHeaderDropdown() {
        if (!langSelect) return;
        langSelect.innerHTML = '';
        
        // Recupera idioma salvo ou padrão 'pt'
        let currentLang = localStorage.getItem('rumo_lang') || 'pt';
        if (currentLang.includes('-')) currentLang = currentLang.split('-')[0];

        languages.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang.code;
            option.textContent = `${lang.flag} ${lang.name}`;
            
            if (lang.code === currentLang) {
                option.selected = true;
            }
            langSelect.appendChild(option);
        });
    }
    
    populateHeaderDropdown();

    // --- LÓGICA DE INTERAÇÃO (ABRIR/FECHAR) ---
    if (langBtn && langContent) {
        // Toggle ao clicar no botão
        langBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Impede que o clique feche imediatamente
            const isVisible = langContent.style.display === 'block';
            langContent.style.display = isVisible ? 'none' : 'block';
            
            // Acessibilidade ARIA
            langBtn.setAttribute('aria-expanded', !isVisible);
        });

        // Fechar ao clicar fora
        document.addEventListener('click', (e) => {
            if (langContent.style.display === 'block' && !langContainer.contains(e.target)) {
                langContent.style.display = 'none';
                langBtn.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Evento ao trocar o idioma (Select)
    if (langSelect) {
        langSelect.addEventListener('change', () => {
            const val = langSelect.value;
            
            // Fecha o dropdown visual se ele existir
            if (langContent) {
                langContent.style.display = 'none';
                if(langBtn) langBtn.setAttribute('aria-expanded', 'false');
            }

            // Aplica mudança
            if (typeof window.setLanguage === 'function') {
                window.setLanguage(val);
            } else {
                localStorage.setItem('rumo_lang', val);
                location.reload();
            }
        });
    }
});


// =============================================
// 3. MOBILE LANGUAGE PANEL (Painel Deslizante)
// =============================================
(function createMobileLanguagePanel() {
    try {
        const mainMenu = document.getElementById('main-nav');
        if (!mainMenu) return;
        // Evita duplicidade
        if (document.getElementById('mobile-lang-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'mobile-lang-panel';
        panel.className = 'mobile-lang-panel';
        panel.style.background = 'rgba(133, 203, 203, 0.9)';

        panel.innerHTML = `
            <div class="mobile-lang-header">
                <button class="mobile-lang-back-btn" aria-label="Voltar">&larr;</button>
                <h3>Idioma</h3>
            </div>
            <div class="mobile-lang-content">
                <p>Selecione o idioma da plataforma:</p>
                <label for="mobile-language-select">Idioma</label>
                <select id="mobile-language-select" class="mobile-lang-select" aria-label="Selecione idioma"></select>
                <div style="display:flex;gap:8px;margin-top:12px;justify-content:center;">
                    <button id="mobile-lang-save" class="btn-save">Salvar</button>
                    <button id="mobile-lang-cancel" class="btn-cancel">Cancelar</button>
                </div>
            </div>
        `;
        mainMenu.appendChild(panel);

        const mobileSelect = panel.querySelector('#mobile-language-select');

        // Clona as opções do Header Desktop para manter consistência
        function cloneHeaderLanguages() {
            const headerSelect = document.querySelector('#language-select-header');
            if (headerSelect && headerSelect.options.length > 0) {
                mobileSelect.innerHTML = '';
                Array.from(headerSelect.options).forEach(opt => {
                    const clone = opt.cloneNode(true);
                    mobileSelect.appendChild(clone);
                });
                mobileSelect.value = headerSelect.value;
            } else {
                // Tenta novamente em breve se o header ainda não carregou
                setTimeout(cloneHeaderLanguages, 500);
            }
        }
        cloneHeaderLanguages();

        // Botões e Handlers Mobile
        const backBtn = panel.querySelector('.mobile-lang-back-btn');
        const saveBtn = panel.querySelector('#mobile-lang-save');
        const cancelBtn = panel.querySelector('#mobile-lang-cancel');

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
            // Atualiza seleção atual ao abrir
            const current = localStorage.getItem('rumo_lang') || 'pt';
            if(mobileSelect) mobileSelect.value = current.split('-')[0];
            
            panel.classList.add('open');
            mainMenu.classList.add('mobile-lang-active');
        }
        function closePanel() {
            panel.classList.remove('open');
            mainMenu.classList.remove('mobile-lang-active');
        }

        // Delegação de evento para o botão mobile (que é criado dinamicamente)
        document.addEventListener('click', (e) => {
            const target = e.target.closest && e.target.closest('.mobile-lang-btn');
            if (target) {
                e.preventDefault();
                openPanel();
            }
        });

        backBtn.addEventListener('click', (e) => { e.preventDefault(); closePanel(); });
        cancelBtn.addEventListener('click', (e) => { e.preventDefault(); closePanel(); });

        saveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const val = mobileSelect.value;
            if (typeof window.setLanguage === 'function') {
                window.setLanguage(val);
            } else {
                localStorage.setItem('rumo_lang', val);
                location.reload();
            }
            closePanel();
            
            // Fecha também o menu principal
            const header = document.getElementById('main-header');
            if (header) header.classList.remove('nav-open');
        });

    } catch (err) {
        console.warn('createMobileLanguagePanel failed', err);
    }
})();

// =============================================
// 4. ACESSIBILIDADE (UserWay)
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    const accBtn = document.getElementById('accessibility-btn');
    if (accBtn) {
        accBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof UserWay !== 'undefined' && UserWay.accessibilityWidget) {
                UserWay.accessibilityWidget.toggle();
            } else {
                const icon = document.querySelector('[id^="userway-accessibility-widget"]');
                if (icon) icon.click();
            }
        });
    }
});