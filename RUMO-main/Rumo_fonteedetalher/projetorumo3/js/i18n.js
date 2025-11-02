// Simple i18n implementation for testing
class I18N {
  constructor() {
    this.translations = {};
    this.currentLang = 'pt-brasil'; // Default to Portuguese Brazil
    this.init();
  }

  async init() {
    // Load default translations
    await this.loadTranslations('pt-brasil');
    this.applyTranslations();
    this.updateBannerImage(this.currentLang); // <-- ADICIONADO: Define o banner no carregamento
  }

  // Mapping from language codes to actual filenames in locales/
  getTranslationFileName(langCode) {
    const fileMap = {
      'pt-brasil': 'portugues.json',
      'pt-portugal': 'portugues.json',
      'pt-angola': 'portugues.json', // fallback to portugues.json
      'pt-mocambique': 'portugues.json', // fallback
      'pt-cabo-verde': 'portugues.json', // fallback
      'pt-guine-bissau': 'portugues.json', // fallback
      'pt-timor-leste': 'portugues.json', // fallback
      'es-venezuela': 'espanhol.json',
      'es-bolivia': 'espanhol.json',
      'es-paraguai': 'espanhol.json',
      'es-peru': 'espanhol.json',
      'es-argentina': 'espanhol.json',
      'es-colombia': 'espanhol.json',
      'es-chile': 'espanhol.json',
      'en-nigeria': 'ingles.json',
      'en-ghana': 'ingles.json', // fallback
      'en-africa-do-sul': 'ingles.json', // fallback
      'en-estados-unidos': 'ingles.json', // fallback
      'en-reino-unido': 'ingles.json', // fallback
      'fr-haiti': 'frances.json',
      'fr-republica-democratica-do-congo': 'frances.json', // fallback
      'fr-senegal': 'frances.json', // fallback
      'fr-africa-ocidental': 'frances.json', // fallback
      'fr-franca': 'frances.json', // fallback
      'ht-haiti': 'crioulo-haitiano.json',
      'ar-siria': 'arabe.json',
      'ar-libano': 'arabe.json', // fallback
      'ar-palestina': 'arabe.json', // fallback
      'zh-china': 'mandarim.json',
      'ko-coreia-do-sul': 'coreano.json',
      'ja-japao': 'japones.json',
      'gn-paraguai': 'guarani.json',
      'gn-bolivia': 'guarani.json', // fallback
      'qu-bolivia': 'quechua.json',
      'qu-peru': 'quechua.json' // fallback
    };

    return fileMap[langCode] || 'portugues.json'; // fallback to default
  }

  async loadTranslations(langCode) {
    try {
      const fileName = this.getTranslationFileName(langCode);
      const response = await fetch(`locales/${fileName}`);
      if (response.ok) {
        this.translations = await response.json();
        console.log(`Loaded translations for ${langCode} from ${fileName}`);
      } else {
        console.warn(`Failed to load translations for ${langCode} from ${fileName}, falling back to default`);
        // Try to load default translations
        if (langCode !== 'pt-brasil') {
          await this.loadTranslations('pt-brasil');
        }
      }
    } catch (error) {
      console.warn('Error loading translations:', error);
      // Try to load default translations
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
        el.textContent = this.translations[key];
      }
    });
  }



  // ==========================================================
  // ===== NOVA FUNÇÃO PARA ATUALIZAR O BANNER (INÍCIO) =====
  // ==========================================================
  updateBannerImage(langCode) {
    
    // *** CRIE SUAS IMAGENS E COLOQUE OS NOMES AQUI ***
    // (Eu completei a lista baseado no seu i18n.js)
    const bannerImageMap = {
      // Banners para Português (o padrão)
      'pt-brasil': 'banner3 (2).png',
      'pt-portugal': 'banner3 (2).png',
      'pt-angola': 'banner3 (2).png',
      'pt-mocambique': 'banner3 (2).png',
      'pt-cabo-verde': 'banner3 (2).png',
      'pt-guine-bissau': 'banner3 (2).png',
      'pt-timor-leste': 'banner3 (2).png',

      // Banners para Espanhol
      'es-venezuela': 'banner-espanhol.png', // <-- Crie este arquivo
      'es-bolivia': 'banner-espanhol.png',
      'es-paraguai': 'banner-espanhol.png',
      'es-peru': 'banner-espanhol.png',
      'es-argentina': 'banner-espanhol.png',
      'es-colombia': 'banner-espanhol.png',
      'es-chile': 'banner-espanhol.png',

      // Banners para Inglês
      'en-nigeria': 'banner-ingles.png', // <-- Crie este arquivo
      'en-ghana': 'banner-ingles.png',
      'en-africa-do-sul': 'banner-ingles.png',
      'en-estados-unidos': 'banner-ingles.png',
      'en-reino-unido': 'banner-ingles.png',

      // Banners para Francês
      'fr-haiti': 'banner-frances.png', // <-- Crie este arquivo
      'fr-republica-democratica-do-congo': 'banner-frances.png',
      'fr-senegal': 'banner-frances.png',
      'fr-africa-ocidental': 'banner-frances.png',
      'fr-franca': 'banner-frances.png',

      // Banner para Crioulo Haitiano
      'ht-haiti': 'banner-crioulo.png', // <-- Crie este arquivo

      // Banners para Árabe
      'ar-siria': 'banner-arabe.png', // <-- Crie este arquivo
      'ar-libano': 'banner-arabe.png',
      'ar-palestina': 'banner-arabe.png',

      // Banner para Mandarim
      'zh-china': 'banner-mandarim.png', // <-- Crie este arquivo

      // Banner para Coreano
      'ko-coreia-do-sul': 'banner-coreano.png', // <-- Crie este arquivo

      // Banner para Japonês
      'ja-japao': 'banner-japones.png', // <-- Crie este arquivo

      // Banners para Guarani
      'gn-paraguai': 'banner-guarani.png', // <-- Crie este arquivo
      'gn-bolivia': 'banner-guarani.png',

      // Banners para Quéchua
      'qu-bolivia': 'banner-quechua.png', // <-- Crie este arquivo
      'qu-peru': 'banner-quechua.png'
    };

    // Pega o elemento da imagem do banner pelo ID
    const bannerImg = document.getElementById('main-banner-img');

    // Verifica se a imagem existe nesta página (só existe na index.html)
    if (!bannerImg) {
      return;
    }

    // Define a nova imagem, ou usa o banner padrão (Português) se não encontrar um
    const newImageSrc = bannerImageMap[langCode] || 'banner3 (2).png';

    // Atualiza o 'src' (fonte) da imagem
    bannerImg.src = newImageSrc;
  }
  // ==========================================================
  // ===== NOVA FUNÇÃO PARA ATUALIZAR O BANNER (FIM) ======
  // ==========================================================
}

// Global i18n instance
const i18n = new I18N();

// Global setLanguage function for main-menu.js
window.setLanguage = (value) => {
  if (!value) return;
  i18n.currentLang = value;
  i18n.loadTranslations(value).then(() => {
    i18n.applyTranslations();
    i18n.updateBannerImage(value); // <-- ADICIONADO: Troca o banner
  });
};

// Initialize i18n
document.addEventListener('DOMContentLoaded', () => {
  // i18n is already initialized above
});