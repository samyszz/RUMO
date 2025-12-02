/* js/i18n.js - Sistema de Internacionalização Simplificado */

class I18N {
    constructor() {
        this.translations = {};
        // Padrão: pt (Português) se não houver nada salvo
        this.currentLang = localStorage.getItem('rumo_lang') || 'pt';
        
        // Mapeamento Direto: Código -> Arquivo JSON
        this.fileMap = {
            'pt': 'brasil.json',          // Português (Base Brasil)
            'es': 'espanhol.json',        // Espanhol
            'en': 'ingles.json',          // Inglês
            'fr': 'frances.json',         // Francês
            'zh': 'mandarim.json',        // Mandarim
            'ja': 'japones.json',         // Japonês
            'ht': 'crioulo-haitiano.json',// Crioulo Haitiano
            'ar': 'arabe.json',           // Árabe
            'ko': 'coreano.json',         // Coreano
            'gn': 'guarani.json',         // Guarani
            'qu': 'quechua.json'          // Quechua
        };

        // Mapeamento de Banners
        this.bannerImageMap = {
            'pt': 'banner3 (2).png',
            'es': 'banner-espanhol.png',
            'en': 'banner-ingles.png',
            'fr': 'banner-frances.png',
            'zh': 'banner-mandarim.png',
            'ja': 'banner-japones.png',
            'ht': 'banner-crioulo.png',
            'ar': 'banner-arabe.png',
            'ko': 'banner-coreano.png',
            'gn': 'banner-guarani.png',
            'qu': 'banner-quechua.png'
        };

        this.init();
    }

    async init() {
        // Se o localStorage tiver códigos antigos (ex: pt-brasil), converte para o novo (pt)
        if (this.currentLang.includes('-') && this.currentLang !== 'pt-br') { 
             // Lógica simples de fallback se necessário, mas vamos forçar a limpeza:
             const simpleCode = this.currentLang.split('-')[0];
             if (this.fileMap[simpleCode]) this.currentLang = simpleCode;
        }
        // Fallback específico para pt-brasil antigo virar pt
        if (this.currentLang === 'pt-brasil') this.currentLang = 'pt';

        await this.loadTranslations(this.currentLang);
        this.applyTranslations();
        this.updateDropdowns();
        this.updateHeaderDisplay(this.currentLang);
        this.updateBannerImage(this.currentLang);
    }

    getTranslationFileName(langCode) {
        return this.fileMap[langCode] || 'brasil.json';
    }

    async loadTranslations(langCode) {
        try {
            const fileName = this.getTranslationFileName(langCode);
            const response = await fetch(`locales/${fileName}`);
            
            if (response.ok) {
                this.translations = await response.json();
                localStorage.setItem('rumo_lang', langCode);
                document.documentElement.lang = langCode;
            } else {
                console.warn(`Arquivo ${fileName} não encontrado. Voltando para PT.`);
                if (langCode !== 'pt') await this.loadTranslations('pt');
            }
        } catch (error) {
            console.error('Erro ao carregar traduções:', error);
        }
    }

    applyTranslations() {
        if (!this.translations) return;
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
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
        // Popula e atualiza todos os selects de idioma presentes na página
        const dropdowns = document.querySelectorAll('.language-selector, #language-select-header, #language-select-pf, #language-select-pj, #language-select-utils');
        
        dropdowns.forEach(select => {
            // Se o select está vazio, popula com as opções
            if (select.options.length === 0) {
                this.populateLanguageSelect(select);
            }
            // Define o valor atual
            select.value = this.currentLang;
        });
    }

    populateLanguageSelect(select) {
        // Limpa o select
        select.innerHTML = '';
        
        // Mapeamento de idiomas com seus nomes em português
        const langNames = {
            'pt': 'Português (Brasil)',
            'es': 'Español (Español)',
            'en': 'English (English)',
            'fr': 'Français (Français)',
            'zh': '中文 (Mandarim)',
            'ja': '日本語 (Japonês)',
            'ht': 'Kreyòl (Crioulo Haitiano)',
            'ar': 'العربية (Árabe)',
            'ko': '한국어 (Coreano)',
            'gn': 'Guarani (Guarani)',
            'qu': 'Quechua (Quechua)'
        };

        // Adiciona as opções ao select
        for (const [code, name] of Object.entries(langNames)) {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = name;
            select.appendChild(option);
        }
    }

    updateHeaderDisplay(langCode) {
        // Atualiza texto visual no header (ex: "PT", "EN")
        const displayElement = document.querySelector('[data-i18n="header.lang.current"] strong');
        if (displayElement) {
            displayElement.textContent = langCode.toUpperCase();
        }
    }

    updateBannerImage(langCode) {
        const bannerImg = document.getElementById('main-banner-img');
        if (!bannerImg) return;
        const newImageSrc = `assets/imagens/${this.bannerImageMap[langCode] || 'banner3 (2).png'}`;
        // Ajuste de caminho caso a imagem esteja na raiz ou pasta assets (verifiquei sua estrutura)
        // Se suas imagens estao na raiz (como no código antigo), use:
        // bannerImg.src = this.bannerImageMap[langCode] || 'banner3 (2).png';
        
        // Baseado no seu TREE, as imagens estão soltas na raiz DE FATO? 
        // No tree aparece "projetorumo3/banner-arabe.png".
        // Então o src direto deve funcionar se o HTML estiver na mesma pasta.
        bannerImg.src = this.bannerImageMap[langCode] || 'banner3 (2).png'; 
    }
}

const i18n = new I18N();

window.setLanguage = (value) => {
    if (!value) return;
    i18n.currentLang = value;
    i18n.loadTranslations(value).then(() => {
        i18n.applyTranslations();
        i18n.updateDropdowns();
        i18n.updateHeaderDisplay(value);
        i18n.updateBannerImage(value);
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: value }));
    });
};