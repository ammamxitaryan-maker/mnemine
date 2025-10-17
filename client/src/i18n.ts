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
  const initialLang = isAdminPanel() ? 'en' : 'hy';
  console.log(`[i18n] getInitialLanguage: isAdminPanel=${isAdminPanel()}, returning=${initialLang}`);
  return initialLang;
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
      requestOptions: {
        cache: 'no-cache'
      }
    },
    react: {
      useSuspense: false,
    },
    interpolation: {
      escapeValue: false,
    },
  });

// Add event listeners after initialization
i18n.on('initialized', () => {
  console.log('[i18n] Initialized with language:', i18n.language);
});

i18n.on('loaded', (loaded: any) => {
  console.log('[i18n] Translation loaded:', loaded);
});

i18n.on('failedLoading', (lng: string, ns: string, msg: string) => {
  console.error('[i18n] Failed to load translation:', { lng, ns, msg });
});

i18n.on('languageChanged', (lng: string) => {
  console.log('[i18n] Language changed to:', lng);
});

// Override language for admin panel only
const originalChangeLanguage = i18n.changeLanguage;
i18n.changeLanguage = (lng, callback) => {
  console.log(`[i18n] changeLanguage called with: ${lng}, isAdminPanel: ${isAdminPanel()}`);
  if (isAdminPanel()) {
    console.log(`[i18n] Admin panel detected, forcing English`);
    return originalChangeLanguage('en', callback);
  }
  console.log(`[i18n] Regular app, changing to: ${lng}`);
  return originalChangeLanguage(lng, callback);
};

// Only set default language if no language is stored and not in admin panel
if (typeof window !== 'undefined' && !isAdminPanel()) {
  const storedLanguage = localStorage.getItem('mnemine-language');
  console.log(`[i18n] Stored language check: storedLanguage=${storedLanguage}, isAdminPanel=${isAdminPanel()}`);
  if (!storedLanguage) {
    // Only set Armenian as default if no language preference exists
    console.log(`[i18n] No stored language found, setting default to 'hy'`);
    localStorage.setItem('mnemine-language', 'hy');
    i18n.changeLanguage('hy');
  } else {
    console.log(`[i18n] Found stored language: ${storedLanguage}`);
  }
}

export default i18n;