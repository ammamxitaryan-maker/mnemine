import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// Enhanced fallback translations with more comprehensive coverage
const fallbackTranslations = {
  hy: {
    translation: {
      "common": {
        "loading": "Բեռնվում ենք...",
        "error": "Սխալ",
        "back": "Վերադառնալ",
        "close": "Փակել",
        "cancel": "Չեղարկել",
        "confirm": "Հաստատել",
        "save": "Պահպանել",
        "delete": "Ջնջել",
        "edit": "Խմբագրել",
        "view": "Դիտել",
        "next": "Հաջորդ",
        "previous": "Նախորդ",
        "done": "Ավարտված",
        "success": "Հաջողվեց",
        "failed": "Չհաջողվեց",
        "retry": "Նորից փորձել",
        "refresh": "Թարմացնել",
        "search": "Փնտրել",
        "filter": "Զտել",
        "sort": "Դասակարգել",
        "all": "Բոլորը",
        "none": "Ոչ մեկը",
        "yes": "Այո",
        "no": "Ոչ",
        "ok": "Լավ",
        "continue": "Շարունակել",
        "skip": "Բաց թողնել",
        "more": "Ավելին",
        "less": "Պակաս",
        "total": "Ընդամենը",
        "balance": "Հաշվեկշիռ",
        "amount": "Գումար",
        "price": "Գին",
        "rate": "Կուրս",
        "time": "Ժամանակ",
        "date": "Ամսաթիվ",
        "status": "Կարգավիճակ",
        "type": "Տեսակ",
        "name": "Անուն",
        "description": "Նկարագրություն",
        "details": "Մանրամասներ"
      },
      "app": {
        "title": "Mnemine",
        "subtitle": "Պրոֆեսիոնալ ֆինանսական սիմուլյատոր",
        "welcome": "Բարի գալուստ",
        "loading": "Բեռնվում է...",
        "error": "Սխալ է տեղի ունեցել",
        "offline": "Անցանց ռեժիմ",
        "online": "Առցանց"
      },
      "navigation": {
        "home": "Գլխավոր",
        "wallet": "Դրամապանակ",
        "mining": "Հանույթ",
        "referrals": "Ներգրավումներ",
        "tasks": "Առաջադրանքներ",
        "lottery": "Լոտո",
        "leaderboard": "Լավագույններ",
        "swap": "Փոխանակում",
        "settings": "Կարգավորումներ",
        "profile": "Պրոֆիլ",
        "logout": "Ելք",
        "menu": "Մենյու"
      },
      "swap": {
        "title": "CFM ↔ CFMT Փոխանակում",
        "subtitle": "Փոխանակեք ձեր արժույթները",
        "from": "Որից",
        "to": "Որին",
        "amount": "Գումար",
        "rate": "Կուրս",
        "fee": "Միջնորդավճար",
        "total": "Ընդամենը",
        "swap": "Փոխանակել",
        "confirm": "Հաստատել",
        "cfmBalance": "CFM Հաշվեկշիռ",
        "cfmtBalance": "CFMT Հաշվեկշիռ",
        "howItWorks": "Ինչպես է աշխատում",
        "minimum": "Նվազագույն",
        "maximum": "Առավելագույն",
        "available": "Հասանելի",
        "insufficient": "Անբավարար միջոցներ"
      }
    }
  },
  ru: {
    translation: {
      "common": {
        "loading": "Загрузка...",
        "error": "Ошибка",
        "back": "Назад",
        "close": "Закрыть",
        "cancel": "Отмена",
        "confirm": "Подтвердить",
        "save": "Сохранить",
        "delete": "Удалить",
        "edit": "Редактировать",
        "view": "Просмотр",
        "next": "Далее",
        "previous": "Назад",
        "done": "Готово",
        "success": "Успешно",
        "failed": "Не удалось",
        "retry": "Повторить",
        "refresh": "Обновить",
        "search": "Поиск",
        "filter": "Фильтр",
        "sort": "Сортировка",
        "all": "Все",
        "none": "Ничего",
        "yes": "Да",
        "no": "Нет",
        "ok": "ОК",
        "continue": "Продолжить",
        "skip": "Пропустить",
        "more": "Больше",
        "less": "Меньше",
        "total": "Всего",
        "balance": "Баланс",
        "amount": "Сумма",
        "price": "Цена",
        "rate": "Курс",
        "time": "Время",
        "date": "Дата",
        "status": "Статус",
        "type": "Тип",
        "name": "Имя",
        "description": "Описание",
        "details": "Детали"
      },
      "app": {
        "title": "Mnemine",
        "subtitle": "Профессиональный финансовый симулятор",
        "welcome": "Добро пожаловать",
        "loading": "Загрузка...",
        "error": "Произошла ошибка",
        "offline": "Офлайн режим",
        "online": "Онлайн"
      },
      "navigation": {
        "home": "Главная",
        "wallet": "Кошелек",
        "mining": "Майнинг",
        "referrals": "Рефералы",
        "tasks": "Задания",
        "lottery": "Лотерея",
        "leaderboard": "Рейтинг",
        "swap": "Обмен",
        "settings": "Настройки",
        "profile": "Профиль",
        "logout": "Выход",
        "menu": "Меню"
      },
      "swap": {
        "title": "CFM ↔ CFMT Обмен",
        "subtitle": "Обменивайте свои валюты",
        "from": "Из",
        "to": "В",
        "amount": "Сумма",
        "rate": "Курс",
        "fee": "Комиссия",
        "total": "Всего",
        "swap": "Обменять",
        "confirm": "Подтвердить",
        "cfmBalance": "CFM Баланс",
        "cfmtBalance": "CFMT Баланс",
        "howItWorks": "Как это работает",
        "minimum": "Минимум",
        "maximum": "Максимум",
        "available": "Доступно",
        "insufficient": "Недостаточно средств"
      }
    }
  },
  en: {
    translation: {
      "common": {
        "loading": "Loading...",
        "error": "Error",
        "back": "Back",
        "close": "Close",
        "cancel": "Cancel",
        "confirm": "Confirm",
        "save": "Save",
        "delete": "Delete",
        "edit": "Edit",
        "view": "View",
        "next": "Next",
        "previous": "Previous",
        "done": "Done",
        "success": "Success",
        "failed": "Failed",
        "retry": "Retry",
        "refresh": "Refresh",
        "search": "Search",
        "filter": "Filter",
        "sort": "Sort",
        "all": "All",
        "none": "None",
        "yes": "Yes",
        "no": "No",
        "ok": "OK",
        "continue": "Continue",
        "skip": "Skip",
        "more": "More",
        "less": "Less",
        "total": "Total",
        "balance": "Balance",
        "amount": "Amount",
        "price": "Price",
        "rate": "Rate",
        "time": "Time",
        "date": "Date",
        "status": "Status",
        "type": "Type",
        "name": "Name",
        "description": "Description",
        "details": "Details"
      },
      "app": {
        "title": "Mnemine",
        "subtitle": "Professional Financial Simulator",
        "welcome": "Welcome",
        "loading": "Loading...",
        "error": "An error occurred",
        "offline": "Offline mode",
        "online": "Online"
      },
      "navigation": {
        "home": "Home",
        "wallet": "Wallet",
        "mining": "Mining",
        "referrals": "Referrals",
        "tasks": "Tasks",
        "lottery": "Lottery",
        "leaderboard": "Leaderboard",
        "swap": "Swap",
        "settings": "Settings",
        "profile": "Profile",
        "logout": "Logout",
        "menu": "Menu"
      },
      "swap": {
        "title": "CFM ↔ CFMT Swap",
        "subtitle": "Exchange your currencies",
        "from": "From",
        "to": "To",
        "amount": "Amount",
        "rate": "Rate",
        "fee": "Fee",
        "total": "Total",
        "swap": "Swap",
        "confirm": "Confirm",
        "cfmBalance": "CFM Balance",
        "cfmtBalance": "CFMT Balance",
        "howItWorks": "How it works",
        "minimum": "Minimum",
        "maximum": "Maximum",
        "available": "Available",
        "insufficient": "Insufficient funds"
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
    debug: process.env.NODE_ENV === 'development',
    resources: fallbackTranslations, // Enhanced fallback resources
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
      addPath: '/locales/{{lng}}/translation.json',
    },
    react: {
      useSuspense: false, // Disable suspense to avoid issues
    },
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    // Add namespace support for better organization
    defaultNS: 'translation',
    ns: ['translation'],
    // Improve loading experience
    load: 'languageOnly',
    preload: ['hy', 'ru', 'en'],
    // Better error handling
    saveMissing: process.env.NODE_ENV === 'development',
    missingKeyHandler: (lng, ns, key) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Missing translation key: ${key} for language: ${lng}`);
      }
    },
  });

export default i18n;