import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import es from './locales/es.json';
import en from './locales/en.json';
import pt from './locales/pt.json';

// Configure i18n
i18n
    .use(LanguageDetector) // Detect browser language as fallback
    .use(initReactI18next) // Pass i18n instance to react-i18next
    .init({
        resources: {
            es: { translation: es },
            en: { translation: en },
            pt: { translation: pt }
        },
        fallbackLng: 'es', // Default language
        lng: 'es', // Initial language
        debug: false, // Set to true for debugging

        interpolation: {
            escapeValue: false // React already escapes values
        },

        detection: {
            // Order of language detection
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'i18nextLng'
        }
    });

export default i18n;
