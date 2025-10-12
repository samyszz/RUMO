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
  }

  // Mapping from language codes to actual filenames in locales/
  getTranslationFileName(langCode) {
    const fileMap = {
      'pt-brasil': 'brasil.json',
      'pt-portugal': 'portugues.json',
      'pt-angola': 'portugues.json', // fallback to portugues.json
      'pt-mocambique': 'portugues.json', // fallback
      'pt-cabo-verde': 'portugues.json', // fallback
      'pt-guine-bissau': 'portugues.json', // fallback
      'pt-timor-leste': 'portugues.json', // fallback
      'es-venezuela': 'venezuela.json',
      'es-bolivia': 'espanhol.json', // fallback
      'es-paraguai': 'espanhol.json', // fallback
      'es-peru': 'espanhol.json', // fallback
      'es-argentina': 'espanhol.json', // fallback
      'es-colombia': 'espanhol.json', // fallback
      'es-chile': 'espanhol.json', // fallback
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

    return fileMap[langCode] || 'brasil.json'; // fallback to default
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
}

// Global i18n instance
const i18n = new I18N();

// Global setLanguage function for main-menu.js
window.setLanguage = (value) => {
  if (!value) return;
  i18n.currentLang = value;
  i18n.loadTranslations(value).then(() => {
    i18n.applyTranslations();
  });
};

// Initialize i18n
document.addEventListener('DOMContentLoaded', () => {
  // i18n is already initialized above
});
