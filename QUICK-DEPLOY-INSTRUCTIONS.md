# Быстрые инструкции по деплою исправлений

## 🚀 Что исправлено:
- ❌ Ошибка "ExchangeRate table does not exist" 
- ❌ WebSocket ошибки в продакшн
- ❌ Lottery API 500 ошибки
- ✅ Добавлена синхронизация базы данных в деплой
- ✅ Добавлена обработка ошибок WebSocket

## 📋 Шаги для деплоя:

### 1. Закоммитьте изменения:
```bash
git add .
git commit -m "Fix Render deployment: database schema and WebSocket errors"
git push origin main
```

### 2. Проверьте деплой в Render Dashboard:
- Зайдите в ваш сервис на Render
- Следите за логами сборки
- Убедитесь, что видите: "Setting up database..." и "Default exchange rate created"

### 3. Проверьте работу:
- Откройте Telegram приложение
- Проверьте, что нет ошибок в консоли браузера
- API endpoints должны работать без 500 ошибок

## 🔧 Если что-то пошло не так:

1. **Очистите кэш сборки** в Render Dashboard
2. **Проверьте переменные окружения** - особенно `DATABASE_URL`
3. **Принудительно пересоберите** проект

## ✅ Ожидаемый результат:
- Telegram приложение работает без ошибок
- WebSocket соединение стабильно
- Lottery API возвращает данные вместо 500 ошибок
- Нет ошибок Prisma в логах
