# Language Switching Debug Guide

## Проблема
Языки интерфейса не переключаются в production на Render.

## Что было исправлено

### 1. Конфигурация i18n (`client/src/i18n.ts`)
- ✅ Добавлено правильное сохранение выбранного языка в localStorage
- ✅ Убрана принудительная установка армянского языка
- ✅ Добавлена отладочная информация для диагностики
- ✅ Добавлена проверка доступности файлов переводов

### 2. LanguageSwitcher (`client/src/components/LanguageSwitcher.tsx`)
- ✅ Добавлено немедленное сохранение в localStorage
- ✅ Добавлена отладочная информация
- ✅ Улучшена обработка ошибок

### 3. Тестовый компонент (`client/src/components/LanguageTestComponent.tsx`)
- ✅ Создан компонент для тестирования переключения языков
- ✅ Добавлен на страницу настроек
- ✅ Показывает текущий язык, переводы и localStorage

## Как протестировать

### В Production:
1. Откройте приложение в браузере
2. Перейдите в Settings (Настройки)
3. Найдите секцию "Language Test"
4. Попробуйте переключить языки кнопками:
   - Հայերեն (армянский)
   - Русский
   - English
5. Проверьте консоль браузера (F12) на наличие отладочных сообщений

### Отладочные сообщения в консоли:
```
[i18n] Initializing with language: hy
[i18n] Translation file for hy is accessible
[i18n] Successfully initialized with language: hy
[LanguageSwitcher] Changing language from hy to ru
[LanguageSwitcher] Saved language ru to localStorage
[LanguageSwitcher] Successfully changed language to ru
```

### Проверка localStorage:
1. Откройте DevTools (F12)
2. Перейдите в Application/Storage → Local Storage
3. Найдите ключ `mnemine-language`
4. Значение должно изменяться при переключении языков

## Возможные проблемы

### 1. Файлы переводов не загружаются
- Проверьте Network tab в DevTools
- Убедитесь, что запросы к `/locales/{lang}/translation.json` возвращают 200

### 2. localStorage заблокирован
- Проверьте, что localStorage доступен
- Попробуйте в режиме инкогнито

### 3. Кэширование
- Очистите кэш браузера
- Попробуйте жесткое обновление (Ctrl+F5)

## Следующие шаги

Если проблема все еще существует:
1. Проверьте отладочные сообщения в консоли
2. Убедитесь, что файлы переводов доступны
3. Проверьте, что localStorage работает
4. Сообщите о результатах тестирования

## Файлы для проверки

- `client/src/i18n.ts` - основная конфигурация i18n
- `client/src/components/LanguageSwitcher.tsx` - компонент переключения
- `client/src/components/LanguageTestComponent.tsx` - тестовый компонент
- `client/public/locales/` - файлы переводов
- `server/public/locales/` - файлы переводов в production
