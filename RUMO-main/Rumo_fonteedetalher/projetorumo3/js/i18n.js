// Sistema de Internacionalização (I18N) com Troca de Banner
class I18N {
  constructor() {
    this.translations = {};
    // Tenta recuperar o idioma salvo no navegador ou usa o padrão
    this.currentLang = localStorage.getItem('rumo_lang') || 'pt-brasil';
    this.init();
  }

  async init() {
    await this.loadTranslations(this.currentLang);
    this.applyTranslations();
    this.updateDropdowns(); // Sincroniza os seletores visuais na tela
    this.updateBannerImage(this.currentLang); // Define o banner inicial
  }

  // Mapeamento de códigos de idioma para arquivos JSON reais
  getTranslationFileName(langCode) {
    const fileMap = {
      'pt-brasil': 'brasil.json',
      'pt-portugal': 'portugues.json',
      'pt-angola': 'portugues.json',
      'pt-mocambique': 'portugues.json',
      'pt-cabo-verde': 'portugues.json',
      'pt-guine-bissau': 'portugues.json',
      'pt-timor-leste': 'portugues.json',
      'es-venezuela': 'venezuela.json',
      'es-bolivia': 'espanhol.json',
      'es-paraguai': 'espanhol.json',
      'es-peru': 'espanhol.json',
      'es-argentina': 'espanhol.json',
      'es-colombia': 'espanhol.json',
      'es-chile': 'espanhol.json',
      'en-nigeria': 'ingles.json',
      'en-ghana': 'ingles.json',
      'en-africa-do-sul': 'ingles.json',
      'en-estados-unidos': 'ingles.json',
      'en-reino-unido': 'ingles.json',
      'fr-haiti': 'frances.json',
      'fr-republica-democratica-do-congo': 'frances.json',
      'fr-senegal': 'frances.json',
      'fr-africa-ocidental': 'frances.json',
      'fr-franca': 'frances.json',
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

    // Se não achar o específico, tenta fallback ou retorna brasil.json
    return fileMap[langCode] || 'brasil.json'; 
  }

  // Helper para obter bandeiras (Unicode) baseado no código
  getFlag(langCode) {
    if (langCode.includes('brasil')) return '🇧🇷';
    if (langCode.includes('portugal')) return '🇵🇹';
    if (langCode.includes('estados-unidos')) return '🇺🇸';
    if (langCode.includes('reino-unido')) return '🇬🇧';
    if (langCode.includes('espanha')) return '🇪🇸';
    if (langCode.includes('argentina')) return '🇦🇷';
    if (langCode.includes('franca')) return '🇫🇷';
    if (langCode.includes('china')) return '🇨🇳';
    if (langCode.includes('japao')) return '🇯🇵';
    if (langCode.includes('coreia')) return '🇰🇷';
    
    // Fallbacks genéricos
    if (langCode.startsWith('pt')) return '🇵🇹';
    if (langCode.startsWith('en')) return '🇺🇸';
    if (langCode.startsWith('es')) return '🇪🇸';
    
    return '🌐'; 
  }

  async loadTranslations(langCode) {
    try {
      const fileName = this.getTranslationFileName(langCode);
      // Correção: uso de crases para template string
      const response = await fetch(`locales/${fileName}`);
      if (response.ok) {
        this.translations = await response.json();
        
        // Salva a preferência para a próxima visita
        localStorage.setItem('rumo_lang', langCode);
        
        // Define o atributo lang no HTML para acessibilidade
        document.documentElement.lang = langCode;
      } else {
        console.warn(`Falha ao carregar ${fileName}, usando fallback.`);
        if (langCode !== 'pt-brasil') {
          await this.loadTranslations('pt-brasil');
        }
      }
    } catch (error) {
      console.warn('Erro ao carregar traduções:', error);
      if (langCode !== 'pt-brasil') {
        await this.loadTranslations('pt-brasil');
      }
    }
  }

  applyTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (this.translations[key]) {
        // Aplica a tradução correta dependendo do tipo de elemento
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = this.translations[key];
        } else {
          el.innerHTML = this.translations[key];
        }
      }
    });
  }

  updateDropdowns() {
    // Mantém os selects visuais sincronizados com o estado interno
    const dropdowns = document.querySelectorAll('select[id^="language-select"]');
    dropdowns.forEach(select => {
      if (select.querySelector(`option[value="${this.currentLang}"]`)) {
        select.value = this.currentLang;
      }
    });
  }

  // --- NOVA FUNÇÃO PARA TROCAR O BANNER ---
  updateBannerImage(langCode) {
    const bannerImageMap = {
      'pt-brasil': 'banner3 (2).png',
      'pt-portugal': 'banner3 (2).png',
      'pt-angola': 'banner3 (2).png',
      'pt-mocambique': 'banner3 (2).png',
      'pt-cabo-verde': 'banner3 (2).png',
      'pt-guine-bissau': 'banner3 (2).png',
      'pt-timor-leste': 'banner3 (2).png',

      'es-venezuela': 'banner-espanhol.png', 
      'es-bolivia': 'banner-espanhol.png',
      'es-paraguai': 'banner-espanhol.png',
      'es-peru': 'banner-espanhol.png',
      'es-argentina': 'banner-espanhol.png',
      'es-colombia': 'banner-espanhol.png',
      'es-chile': 'banner-espanhol.png',

      'en-nigeria': 'banner-ingles.png', 
      'en-ghana': 'banner-ingles.png',
      'en-africa-do-sul': 'banner-ingles.png',
      'en-estados-unidos': 'banner-ingles.png',
      'en-reino-unido': 'banner-ingles.png',

      'fr-haiti': 'banner-frances.png', 
      'fr-republica-democratica-do-congo': 'banner-frances.png',
      'fr-senegal': 'banner-frances.png',
      'fr-africa-ocidental': 'banner-frances.png',
      'fr-franca': 'banner-frances.png',

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

    // Pega o elemento da imagem do banner pelo ID
    const bannerImg = document.getElementById('main-banner-img');

    // Verifica se a imagem existe nesta página
    if (!bannerImg) {
      return;
    }

    // Define a nova imagem, ou usa o banner padrão se não encontrar
    const newImageSrc = bannerImageMap[langCode] || 'banner3 (2).png';

    // Atualiza o 'src'
    bannerImg.src = newImageSrc;
  }
}

// Inicializa a classe
const i18n = new I18N();

// --- FUNÇÃO GLOBAL PARA MUDANÇA DE IDIOMA ---
window.setLanguage = (value) => {
  if (!value) return;
  
  i18n.currentLang = value;
  
  i18n.loadTranslations(value).then(() => {
    i18n.applyTranslations();
    i18n.updateDropdowns();
    i18n.updateBannerImage(value); // Atualiza o banner aqui
    
    // Dispara evento para outros scripts (como o hub.js)
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: value }));
  });
};

// Inicialização básica
document.addEventListener('DOMContentLoaded', () => {
  // O construtor do I18N já cuida da carga inicial
});