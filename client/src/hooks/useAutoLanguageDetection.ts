import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

// Международные языки и их коды регионов
const INTERNATIONAL_LANGUAGES = {
  'en': ['US', 'GB', 'AU', 'CA', 'NZ', 'IE', 'ZA'], // English
  'ru': ['RU', 'BY', 'KZ', 'KG', 'TJ', 'UZ', 'AM', 'AZ', 'GE', 'MD', 'UA'], // Russian
  'hy': ['AM'], // Armenian
  'es': ['ES', 'MX', 'AR', 'CO', 'PE', 'VE', 'CL', 'EC', 'GT', 'CU', 'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY'], // Spanish
  'fr': ['FR', 'BE', 'CH', 'CA', 'LU', 'MC', 'SN', 'CI', 'CM', 'MG', 'ML', 'BF', 'NE', 'TD', 'CF', 'GA', 'CG', 'CD', 'BI', 'RW'], // French
  'de': ['DE', 'AT', 'CH', 'LI', 'BE', 'LU'], // German
  'it': ['IT', 'CH', 'SM', 'VA'], // Italian
  'pt': ['PT', 'BR', 'AO', 'MZ', 'CV', 'GW', 'ST', 'TL'], // Portuguese
  'zh': ['CN', 'TW', 'HK', 'MO', 'SG'], // Chinese
  'ja': ['JP'], // Japanese
  'ko': ['KR'], // Korean
  'ar': ['SA', 'AE', 'EG', 'JO', 'LB', 'KW', 'QA', 'BH', 'OM', 'IQ', 'SY', 'YE', 'LY', 'TN', 'DZ', 'MA', 'SD', 'PS'], // Arabic
  'hi': ['IN'], // Hindi
  'tr': ['TR', 'CY'], // Turkish
  'pl': ['PL'], // Polish
  'nl': ['NL', 'BE', 'SR'], // Dutch
  'sv': ['SE', 'FI'], // Swedish
  'no': ['NO'], // Norwegian
  'da': ['DK'], // Danish
  'fi': ['FI'], // Finnish
  'cs': ['CZ'], // Czech
  'sk': ['SK'], // Slovak
  'hu': ['HU'], // Hungarian
  'ro': ['RO', 'MD'], // Romanian
  'bg': ['BG'], // Bulgarian
  'hr': ['HR'], // Croatian
  'sr': ['RS', 'BA', 'ME'], // Serbian
  'sl': ['SI'], // Slovenian
  'et': ['EE'], // Estonian
  'lv': ['LV'], // Latvian
  'lt': ['LT'], // Lithuanian
  'el': ['GR', 'CY'], // Greek
  'he': ['IL'], // Hebrew
  'th': ['TH'], // Thai
  'vi': ['VN'], // Vietnamese
  'id': ['ID'], // Indonesian
  'ms': ['MY', 'BN'], // Malay
  'tl': ['PH'], // Filipino
  'uk': ['UA'], // Ukrainian
  'be': ['BY'], // Belarusian
  'kk': ['KZ'], // Kazakh
  'uz': ['UZ'], // Uzbek
  'ky': ['KG'], // Kyrgyz
  'tg': ['TJ'], // Tajik
  'mn': ['MN'], // Mongolian
  'ka': ['GE'], // Georgian
  'az': ['AZ'], // Azerbaijani
  'fa': ['IR', 'AF', 'TJ'], // Persian
  'ur': ['PK', 'IN'], // Urdu
  'bn': ['BD', 'IN'], // Bengali
  'ta': ['IN', 'LK', 'SG'], // Tamil
  'te': ['IN'], // Telugu
  'ml': ['IN'], // Malayalam
  'kn': ['IN'], // Kannada
  'gu': ['IN'], // Gujarati
  'pa': ['IN', 'PK'], // Punjabi
  'or': ['IN'], // Odia
  'as': ['IN'], // Assamese
  'ne': ['NP'], // Nepali
  'si': ['LK'], // Sinhala
  'my': ['MM'], // Burmese
  'km': ['KH'], // Khmer
  'lo': ['LA'], // Lao
  'am': ['ET'], // Amharic
  'sw': ['KE', 'TZ', 'UG', 'RW', 'BI', 'CD', 'SO', 'MW', 'ZM', 'ZW', 'MZ', 'AO'], // Swahili
  'yo': ['NG'], // Yoruba
  'ig': ['NG'], // Igbo
  'ha': ['NG', 'NE'], // Hausa
  'zu': ['ZA'], // Zulu
  'af': ['ZA'], // Afrikaans
  'xh': ['ZA'], // Xhosa
  'st': ['ZA'], // Sesotho
  'tn': ['ZA', 'BW'], // Tswana
  'ss': ['ZA'], // Swati
  've': ['ZA'], // Venda
  'ts': ['ZA'], // Tsonga
  'nr': ['ZA'], // Ndebele
  'nso': ['ZA'], // Northern Sotho
};

// Приоритет языков (если несколько языков подходят)
const LANGUAGE_PRIORITY = ['en', 'ru', 'hy', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar'];

interface AutoLanguageDetectionResult {
  detectedLanguage: string | null;
  detectedRegion: string | null;
  confidence: number;
  isAutoDetected: boolean;
}

export const useAutoLanguageDetection = () => {
  const { i18n } = useTranslation();
  const [detectionResult, setDetectionResult] = useState<AutoLanguageDetectionResult>({
    detectedLanguage: null,
    detectedRegion: null,
    confidence: 0,
    isAutoDetected: false
  });

  // Функция для получения региона из Telegram Web App
  const getTelegramRegion = (): string | null => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const initData = window.Telegram.WebApp.initData;
      if (initData) {
        try {
          const params = new URLSearchParams(initData);
          const userData = params.get('user');
          if (userData) {
            const user = JSON.parse(decodeURIComponent(userData));
            return user.language_code?.toUpperCase() || null;
          }
        } catch (error) {
          console.warn('Error parsing Telegram user data:', error);
        }
      }
    }
    return null;
  };

  // Функция для получения региона из браузера
  const getBrowserRegion = (): string | null => {
    if (typeof window !== 'undefined' && navigator.language) {
      // Получаем код языка из браузера (например, 'en-US' -> 'US')
      const parts = navigator.language.split('-');
      return parts.length > 1 ? parts[1].toUpperCase() : null;
    }
    return null;
  };

  // Функция для получения языка из браузера
  const getBrowserLanguage = (): string | null => {
    if (typeof window !== 'undefined' && navigator.language) {
      // Получаем код языка из браузера (например, 'en-US' -> 'en')
      const parts = navigator.language.split('-');
      return parts[0].toLowerCase();
    }
    return null;
  };

  // Функция для определения языка по региону
  const detectLanguageByRegion = (region: string): string | null => {
    for (const [language, regions] of Object.entries(INTERNATIONAL_LANGUAGES)) {
      if (regions.includes(region)) {
        return language;
      }
    }
    return null;
  };

  // Функция для определения языка по коду языка браузера
  const detectLanguageByCode = (languageCode: string): string | null => {
    // Проверяем точное совпадение
    if (Object.prototype.hasOwnProperty.call(INTERNATIONAL_LANGUAGES, languageCode)) {
      return languageCode;
    }

    // Проверяем похожие коды (например, 'en-US' -> 'en')
    const baseLanguage = languageCode.split('-')[0];
    if (Object.prototype.hasOwnProperty.call(INTERNATIONAL_LANGUAGES, baseLanguage)) {
      return baseLanguage;
    }

    return null;
  };

  // Основная функция детекции
  const detectLanguage = (): AutoLanguageDetectionResult => {
    let detectedLanguage: string | null = null;
    let detectedRegion: string | null = null;
    let confidence = 0;
    let isAutoDetected = false;

    // 1. Пробуем получить регион из Telegram Web App
    const telegramRegion = getTelegramRegion();
    if (telegramRegion) {
      detectedRegion = telegramRegion;
      detectedLanguage = detectLanguageByRegion(telegramRegion);
      if (detectedLanguage) {
        confidence = 0.9; // Высокая уверенность для Telegram
        isAutoDetected = true;
      }
    }

    // 2. Если не получилось, пробуем браузер
    if (!detectedLanguage) {
      const browserLanguage = getBrowserLanguage();
      const browserRegion = getBrowserRegion();

      if (browserLanguage) {
        detectedLanguage = detectLanguageByCode(browserLanguage);
        if (detectedLanguage) {
          confidence = 0.7; // Средняя уверенность для браузера
          isAutoDetected = true;
        }
      }

      if (browserRegion && !detectedLanguage) {
        detectedRegion = browserRegion;
        detectedLanguage = detectLanguageByRegion(browserRegion);
        if (detectedLanguage) {
          confidence = 0.6; // Низкая уверенность для региона браузера
          isAutoDetected = true;
        }
      }
    }

    // 3. Если ничего не определили, используем английский как fallback
    if (!detectedLanguage) {
      detectedLanguage = 'en';
      confidence = 0.1;
      isAutoDetected = false;
    }

    return {
      detectedLanguage,
      detectedRegion,
      confidence,
      isAutoDetected
    };
  };

  // Функция для применения автоматически определенного языка
  const applyAutoLanguage = async (): Promise<boolean> => {
    const result = detectLanguage();
    
    if (result.detectedLanguage && result.isAutoDetected && result.confidence > 0.5) {
      // Проверяем, не установлен ли уже этот язык
      if (i18n.language !== result.detectedLanguage) {
        try {
          await i18n.changeLanguage(result.detectedLanguage);
          setDetectionResult(result);
          console.log(`🌍 Auto-detected language: ${result.detectedLanguage} (region: ${result.detectedRegion}, confidence: ${result.confidence})`);
          return true;
        } catch (error) {
          console.error('Error applying auto-detected language:', error);
        }
      }
    }
    
    setDetectionResult(result);
    return false;
  };

  // Функция для ручного переопределения языка
  const overrideLanguage = (language: string) => {
    setDetectionResult(prev => ({
      ...prev,
      isAutoDetected: false,
      confidence: 1.0
    }));
  };

  // Автоматическое определение при загрузке
  useEffect(() => {
    const initializeAutoDetection = async () => {
      // Ждем немного, чтобы i18n успел инициализироваться
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Проверяем, есть ли сохраненный язык в localStorage
      const savedLanguage = localStorage.getItem('i18nextLng');
      if (savedLanguage) {
        // Если язык уже сохранен, не меняем его автоматически
        const result = detectLanguage();
        setDetectionResult({
          ...result,
          isAutoDetected: false,
          confidence: 1.0
        });
        return;
      }

      // Применяем автоматическое определение
      await applyAutoLanguage();
    };

    initializeAutoDetection();
  }, []); // Remove dependencies to prevent infinite loop

  return {
    ...detectionResult,
    applyAutoLanguage,
    overrideLanguage,
    detectLanguage
  };
};
