/* js/i18n.js - Sistema de Internacionalização Completo */

class I18N {
    constructor() {
        this.translations = {};
        // Tenta recuperar o idioma salvo ou usa o padrão
        this.currentLang = localStorage.getItem('rumo_lang') || 'pt-brasil';
        
        // Mapeamento de Arquivos de Tradução (Redirecionamento)
        this.fileMap = {
            // PORTUGUÊS
            'pt-brasil': 'brasil.json',
            'pt-portugal': 'portugues.json',
            'pt-angola': 'portugues.json',
            'pt-mocambique': 'portugues.json',
            'pt-cabo-verde': 'portugues.json',
            'pt-guine-bissau': 'portugues.json',
            'pt-timor-leste': 'portugues.json',

            // ESPANHOL
            'es-espanha': 'espanhol.json',
            'es-mexico': 'mexico.json',       // Arquivo específico
            'es-venezuela': 'venezuela.json', // Arquivo específico
            'es-bolivia': 'espanhol.json',
            'es-paraguai': 'espanhol.json',
            'es-peru': 'espanhol.json',
            'es-argentina': 'espanhol.json',
            'es-colombia': 'espanhol.json',
            'es-chile': 'espanhol.json',

            // INGLÊS
            'en-estados-unidos': 'ingles.json',
            'en-reino-unido': 'ingles.json',
            'en-nigeria': 'ingles.json',
            'en-gana': 'ingles.json',
            'en-africa-do-sul': 'ingles.json',

            // FRANCÊS
            'fr-franca': 'frances.json',
            'fr-haiti': 'frances.json',
            'fr-rdc': 'frances.json',        // RDC (Congo)
            'fr-senegal': 'frances.json',
            'fr-africa-ocidental': 'frances.json',

            // OUTROS IDIOMAS
            'ht-haiti': 'crioulo-haitiano.json',
            'ar-siria': 'arabe.json',
            'ar-libano': 'arabe.json',
            'ar-palestina': 'arabe.json',
            'zh-china': 'mandarim.json',
            'ko-coreia-do-sul': 'coreano.json',
            'ja-japao': 'japones.json',
            'gn-paraguai': 'guarani.json',
            'gn-bolivia': 'guarani.json',
            'qu-bolivia': 'quechua.json',
            'qu-peru': 'quechua.json'
        };

        // Mapeamento de Banners (Imagens na raiz)
        this.bannerImageMap = {
            'pt-brasil': 'banner3 (2).png',
            'pt-portugal': 'banner3 (2).png',
            'pt-angola': 'banner3 (2).png',
            'pt-mocambique': 'banner3 (2).png',
            'pt-cabo-verde': 'banner3 (2).png',
            'pt-guine-bissau': 'banner3 (2).png',
            'pt-timor-leste': 'banner3 (2).png',

            'es-espanha': 'banner-espanhol.png',
            'es-venezuela': 'banner-espanhol.png',
            'es-mexico': 'banner-espanhol.png', 
            'es-bolivia': 'banner-espanhol.png',
            'es-paraguai': 'banner-espanhol.png',
            'es-peru': 'banner-espanhol.png',
            'es-argentina': 'banner-espanhol.png',
            'es-colombia': 'banner-espanhol.png',
            'es-chile': 'banner-espanhol.png',

            'en-estados-unidos': 'banner-ingles.png',
            'en-reino-unido': 'banner-ingles.png',
            'en-nigeria': 'banner-ingles.png',
            'en-gana': 'banner-ingles.png',
            'en-africa-do-sul': 'banner-ingles.png',

            'fr-franca': 'banner-frances.png',
            'fr-haiti': 'banner-frances.png',
            'fr-rdc': 'banner-frances.png',
            'fr-senegal': 'banner-frances.png',
            'fr-africa-ocidental': 'banner-frances.png',

            'ht-haiti': 'banner-crioulo.png',

            'ar-siria': 'banner-arabe.png',
            'ar-libano': 'banner-arabe.png',
            'ar-palestina': 'banner-arabe.png',

            'zh-china': 'banner-mandarim.png',
            'ko-coreia-do-sul': 'banner-coreano.png',
            'ja-japao': 'banner-japones.png',

            'gn-paraguai': 'banner-guarani.png',
            'gn-bolivia': 'banner-guarani.png',

            'qu-bolivia': 'banner-quechua.png',
            'qu-peru': 'banner-quechua.png'
        };

        this.init();
    }

    async init() {
        await this.loadTranslations(this.currentLang);
        this.applyTranslations();
        this.updateDropdowns();
        this.updateHeaderDisplay(this.currentLang); // Atualiza o texto "Idioma Atual: X"
        this.updateBannerImage(this.currentLang);
    }

    getTranslationFileName(langCode) {
        return this.fileMap[langCode] || 'brasil.json';
    }

    async loadTranslations(langCode) {
        try {
            const fileName = this.getTranslationFileName(langCode);
            // Busca o JSON na pasta locales
            const response = await fetch(`locales/${fileName}`);
            
            if (response.ok) {
                this.translations = await response.json();
                
                // Salva preferências
                localStorage.setItem('rumo_lang', langCode);
                document.documentElement.lang = langCode;
                
            } else {
                console.warn(`Arquivo de tradução não encontrado: ${fileName}`);
                // Fallback para Brasil se não for ele mesmo
                if (langCode !== 'pt-brasil') await this.loadTranslations('pt-brasil');
            }
        } catch (error) {
            console.error('Erro de rede/parse ao carregar traduções:', error);
            if (langCode !== 'pt-brasil') await this.loadTranslations('pt-brasil');
        }
    }

    applyTranslations() {
        if (!this.translations) return;
        
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            // Suporte a chaves aninhadas (ex: nav.home)
            const keys = key.split('.');
            let value = this.translations;
            keys.forEach(k => { value = value ? value[k] : null; });

            if (value) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = value;
                } else {
                    el.innerHTML = value;
                }
            }
        });
    }

    updateDropdowns() {
        const dropdowns = document.querySelectorAll('select[id^="language-select"]');
        dropdowns.forEach(select => {
            // Verifica se a opção existe antes de selecionar
            if (select.querySelector(`option[value="${this.currentLang}"]`)) {
                select.value = this.currentLang;
            }
        });
    }

    updateHeaderDisplay(langCode) {
        // Atualiza o texto do menu superior (Ex: "Idioma atual: Angola")
        const displayElement = document.querySelector('[data-i18n="header.lang.current"] strong');
        if (displayElement) {
            const parts = langCode.split('-');
            if (parts.length > 1) {
                // Remove o código do idioma (pt) e formata o país (angola -> Angola)
                let country = parts.slice(1).join(' ').replace(/-/g, ' ');
                country = country.replace(/\b\w/g, l => l.toUpperCase());
                displayElement.textContent = country;
            } else {
                displayElement.textContent = langCode.toUpperCase(); // Casos como 'ar', 'ja'
            }
        }
    }

    updateBannerImage(langCode) {
        const bannerImg = document.getElementById('main-banner-img');
        if (!bannerImg) return;

        // Pega a imagem do mapa ou usa o padrão
        const newImageSrc = this.bannerImageMap[langCode] || 'banner3 (2).png';
        bannerImg.src = newImageSrc;
    }
}

// Inicializa a classe
const i18n = new I18N();

// --- FUNÇÃO GLOBAL PARA MUDANÇA DE IDIOMA ---
// Chamada pelos selects no HTML (onchange="setLanguage(this.value)")
window.setLanguage = (value) => {
    if (!value) return;

    i18n.currentLang = value;

    i18n.loadTranslations(value).then(() => {
        i18n.applyTranslations();
        i18n.updateDropdowns();
        i18n.updateHeaderDisplay(value);
        i18n.updateBannerImage(value);

        // Avisa outros scripts (Hub, etc) que mudou
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: value }));
    });
};

// Evento ao carregar para garantir que o select do header funcione
document.addEventListener('DOMContentLoaded', () => {
    const headerSelect = document.getElementById('language-select-header');
    if (headerSelect) {
        headerSelect.addEventListener('change', (e) => {
            window.setLanguage(e.target.value);
        });
    }
});