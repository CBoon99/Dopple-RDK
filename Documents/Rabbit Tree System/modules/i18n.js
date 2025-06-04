// scripts/i18n.js
/**
 * Room for Improvement – Hotel Management System
 * Internationalization Module
 */
const I18nModule = {
    currentLanguage: 'en',
    translations: {},
    
    async init() {
        await this.loadTranslations('en');
        await this.loadTranslations('id');
    },
    
    async loadTranslations(lang) {
        const response = await fetch(`${lang}.json`);
        this.translations[lang] = await response.json();
    },
    
    async setLanguage(lang) {
        if (!this.translations[lang]) {
            await this.loadTranslations(lang);
        }
        this.currentLanguage = lang;
        localStorage.setItem('language', lang);
        this.updateUI();
    },
    
    translate(key) {
        return this.translations[this.currentLanguage]?.[key] || key;
    },
    
    updateUI() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = this.translate(key);
        });
    },

    getState() {
        return { currentLanguage: this.currentLanguage };
    },

    handleQuery(query) {
        return { response: 'I18n query not supported' };
    }
};

// Export for use in browser
if (typeof window !== 'undefined') {
    window.I18nModule = I18nModule;
}

RoomForImprovementSystem.registerModule('i18n', I18nModule);