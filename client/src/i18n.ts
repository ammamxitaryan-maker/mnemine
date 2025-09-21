import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// Simple fallback translations to avoid loading issues
const fallbackTranslations = {
  hy: {
    translation: {
      "common": {
        "loading": "Բեռնվում է...",
        "error": "Սխալ"
      },
      "app": {
        "title": "Mnemine"
      }
    }
  },
  ru: {
    translation: {
      "common": {
        "loading": "Загрузка...",
        "error": "Ошибка"
      },
      "app": {
        "title": "Mnemine"
      }
    }
  },
  en: {
    translation: {
      "common": {
        "loading": "Loading...",
        "error": "Error"
      },
      "app": {
        "title": "Mnemine"
      }
    }
  }
};

i18n
  .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: ['hy', 'ru', 'en'],
    fallbackLng: 'hy',
    debug: false,
    resources: fallbackTranslations, // Add fallback resources
    detection: {
      order: ['queryString', 'cookie'],
      caches: ['cookie'],
    },
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    react: {
      useSuspense: false, // Disable suspense to avoid issues
    },
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;