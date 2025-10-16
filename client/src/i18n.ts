import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// Check if we're in admin panel
const isAdminPanel = () => {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/admin') && !window.location.pathname.includes('/admin-login');
};

// Force English for admin panel
const getInitialLanguage = () => {
  if (isAdminPanel()) {
    return 'en';
  }
  return 'hy'; // Default for regular app
};

i18n
  .use(HttpApi)
  .use(initReactI18next)
  .init({
    supportedLngs: ['hy', 'ru', 'en'],
    fallbackLng: 'hy',
    lng: getInitialLanguage(),
    debug: false,
    detection: {
      order: ['localStorage', 'queryString', 'cookie'],
      caches: ['localStorage', 'cookie'],
      lookupLocalStorage: 'mnemine-language',
    },
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    react: {
      useSuspense: false,
    },
    interpolation: {
      escapeValue: false,
    },
  });

// Override language for admin panel only
const originalChangeLanguage = i18n.changeLanguage;
i18n.changeLanguage = (lng, callback) => {
  if (isAdminPanel()) {
    return originalChangeLanguage('en', callback);
  }
  return originalChangeLanguage(lng, callback);
};

// Only set default language if no language is stored and not in admin panel
if (typeof window !== 'undefined' && !isAdminPanel()) {
  const storedLanguage = localStorage.getItem('mnemine-language');
  if (!storedLanguage) {
    // Only set Armenian as default if no language preference exists
    localStorage.setItem('mnemine-language', 'hy');
    i18n.changeLanguage('hy');
  }
}

export default i18n;