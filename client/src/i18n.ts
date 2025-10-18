import i18n from 'i18next';
import HttpApi from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

// Check if we're in admin panel
const isAdminPanel = () => {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/admin') && !window.location.pathname.includes('/admin-login');
};

// Force English for admin panel, otherwise use stored language or default to Armenian
const getInitialLanguage = () => {
  if (isAdminPanel()) {
    // console.log(`[i18n] getInitialLanguage: isAdminPanel=true, returning=en`);
    return 'en';
  }

  // Check for stored language
  if (typeof window !== 'undefined') {
    const storedLanguage = localStorage.getItem('nonmine-language');
    if (storedLanguage) {
      // console.log(`[i18n] getInitialLanguage: found stored language=${storedLanguage}`);
      return storedLanguage;
    }
  }

  // console.log(`[i18n] getInitialLanguage: no stored language, returning=hy`);
  return 'hy';
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
  // console.log('[i18n] Initialized with language:', i18n.language);
});

i18n.on('loaded', (loaded: any) => {
  // console.log('[i18n] Translation loaded:', loaded);
});

i18n.on('failedLoading', (lng: string, ns: string, msg: string) => {
  console.error('[i18n] Failed to load translation:', { lng, ns, msg });
});

i18n.on('languageChanged', (lng: string) => {
  // console.log('[i18n] Language changed to:', lng);
});

// Override language for admin panel only
const originalChangeLanguage = i18n.changeLanguage;
i18n.changeLanguage = (lng, callback) => {
    // console.log(`[i18n] changeLanguage called with: ${lng}, isAdminPanel: ${isAdminPanel()}`);
    if (isAdminPanel()) {
      // console.log(`[i18n] Admin panel detected, forcing English`);
      return originalChangeLanguage('en', callback);
    }
    // console.log(`[i18n] Regular app, changing to: ${lng}`);
  return originalChangeLanguage(lng, callback);
};

// Set default language in localStorage if none exists and not in admin panel
if (typeof window !== 'undefined' && !isAdminPanel()) {
  const storedLanguage = localStorage.getItem('nonmine-language');
  if (!storedLanguage) {
    // console.log(`[i18n] No stored language found, setting default to 'hy'`);
    localStorage.setItem('nonmine-language', 'hy');
  }
}

export default i18n;