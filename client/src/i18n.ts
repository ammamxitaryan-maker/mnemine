import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// Check if we're in admin panel
const isAdminPanel = () => {
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
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: ['hy', 'ru', 'en'],
    fallbackLng: 'hy',
    lng: getInitialLanguage(),
    debug: false,
    detection: {
      order: ['localStorage', 'queryString', 'cookie', 'navigator'],
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

// Override language for admin panel
const originalChangeLanguage = i18n.changeLanguage;
i18n.changeLanguage = (lng, callback) => {
  if (isAdminPanel()) {
    return originalChangeLanguage('en', callback);
  }
  return originalChangeLanguage(lng, callback);
};

export default i18n;