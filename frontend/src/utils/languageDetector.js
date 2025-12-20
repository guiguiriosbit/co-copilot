/**
 * Language Detector based on Geographic Location
 * Maps country codes to languages
 */

const countryToLanguage = {
    // Spanish-speaking countries
    'CO': 'es', // Colombia
    'MX': 'es', // Mexico
    'ES': 'es', // Spain
    'AR': 'es', // Argentina
    'CL': 'es', // Chile
    'PE': 'es', // Peru
    'VE': 'es', // Venezuela
    'EC': 'es', // Ecuador
    'GT': 'es', // Guatemala
    'CU': 'es', // Cuba
    'BO': 'es', // Bolivia
    'DO': 'es', // Dominican Republic
    'HN': 'es', // Honduras
    'PY': 'es', // Paraguay
    'SV': 'es', // El Salvador
    'NI': 'es', // Nicaragua
    'CR': 'es', // Costa Rica
    'PA': 'es', // Panama
    'UY': 'es', // Uruguay

    // English-speaking countries
    'US': 'en', // United States
    'GB': 'en', // United Kingdom
    'CA': 'en', // Canada
    'AU': 'en', // Australia
    'NZ': 'en', // New Zealand
    'IE': 'en', // Ireland
    'ZA': 'en', // South Africa
    'IN': 'en', // India
    'SG': 'en', // Singapore

    // Portuguese-speaking countries
    'BR': 'pt', // Brazil
    'PT': 'pt', // Portugal
    'AO': 'pt', // Angola
    'MZ': 'pt', // Mozambique
};

/**
 * Detect language from geocoding address data
 * @param {Object} addressData - Address data from reverse geocoding
 * @returns {string} Language code (es, en, pt)
 */
export const detectLanguageFromAddress = (addressData) => {
    if (!addressData || !addressData.address) {
        return 'es'; // Default to Spanish
    }

    const countryCode = addressData.address.country_code?.toUpperCase();

    if (countryCode && countryToLanguage[countryCode]) {
        return countryToLanguage[countryCode];
    }

    // Fallback to Spanish
    return 'es';
};

/**
 * Detect language from browser settings
 * @returns {string} Language code (es, en, pt)
 */
export const detectLanguageFromBrowser = () => {
    const browserLang = navigator.language || navigator.userLanguage;

    if (browserLang.startsWith('en')) return 'en';
    if (browserLang.startsWith('pt')) return 'pt';
    if (browserLang.startsWith('es')) return 'es';

    return 'es'; // Default
};

export default {
    detectLanguageFromAddress,
    detectLanguageFromBrowser
};
