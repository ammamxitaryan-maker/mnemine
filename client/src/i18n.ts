import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';

// Check if we're in admin panel
const isAdminPanel = () => {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/admin') && !window.location.pathname.includes('/admin-login');
};

// Force English for admin panel, Armenian for regular app
const getInitialLanguage = () => {
  if (isAdminPanel()) {
    return 'en';
  }
  return 'hy'; // Always Armenian for regular app
};

i18n
  .use(HttpApi)
  .use(initReactI18next)
  .init({
    supportedLngs: ['hy', 'ru', 'en'],
    fallbackLng: 'hy',
    lng: getInitialLanguage(),
    debug: false,
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

// Set Armenian as default language for regular app
if (typeof window !== 'undefined' && !isAdminPanel()) {
  localStorage.setItem('mnemine-language', 'hy');
  i18n.changeLanguage('hy');
}

export default i18n;