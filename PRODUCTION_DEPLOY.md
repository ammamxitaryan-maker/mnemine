# 🚀 Продакшн Деплой - Готово к запуску!

Проект полностью настроен для деплоя на Render с PostgreSQL базой данных.

## ✅ Что уже настроено

### 🔧 Конфигурация Render (render.yaml)
- **Все переменные окружения** настроены с вашими значениями
- **PostgreSQL база данных** подключена
- **Telegram Bot** настроен с токеном `8422118658:AAHQHHJbO8CszCJRY8J0Rk8AQKVmqFp6HbE`
- **Webhook** настроен на `https://mnemine-backend-7b4y.onrender.com/api/webhook`
- **Админ ID** установлен как `6760298907`

### 🗄️ База данных
- **PostgreSQL** на Render (не SQLite!)
- **URL**: `postgresql://mnemine_user:2DpMhmihzMUXfaVlksxOaWvYvNlB2YtL@dpg-d38dq93e5dus73a34u3g-a.oregon-postgres.render.com/mnemine_zupy`
- **Prisma** настроена для работы с PostgreSQL в продакшне
- **Автоматическое создание схемы** при деплое

### 🔐 Безопасность
- **JWT_SECRET**: `+j/7gDO4Fd/P7DPpLrCbm1YgW4GwDP+9cn3p8g7GpOo=`
- **ENCRYPTION_KEY**: `j5TiqOnGr1ngVls/fvUQu8swXo7yvwYc2icBpLK7Q7E=`
- **SESSION_SECRET**: `WWJZPa9U1cIvLIi414eEpdx6TNLMNjAT6NhDF/vQAs0=`
- **WEBHOOK_SECRET**: `B2G+wMe2fs5Hy/o9cao44CDnISMjcdMFh242yBjJ2L8=`

## 🚀 Как деплоить

### Вариант 1: Через Render Dashboard
1. Зайдите в [Render Dashboard](https://dashboard.render.com)
2. Нажмите **"New +"** → **"Web Service"**
3. Подключите ваш GitHub репозиторий
4. Render автоматически обнаружит `render.yaml` и применит все настройки
5. Нажмите **"Create Web Service"**

### Вариант 2: Через CLI
```bash
# 1. Установите Render CLI
npm install -g @render/cli

# 2. Войдите в аккаунт
render login

# 3. Деплой
render deploy
```

### Вариант 3: Автоматический деплой с проверками
```bash
# Запустите скрипт с полной проверкой
node scripts/deploy-to-render.js
```

## 📋 Что происходит при деплое

1. **Установка зависимостей** - `pnpm install`
2. **Сборка приложения** - `pnpm run build:prod`
3. **Копирование фронтенда** - файлы копируются в `server/public`
4. **Генерация Prisma клиента** - для PostgreSQL
5. **Создание схемы БД** - `prisma db push` в PostgreSQL
6. **Запуск сервера** - `node dist/index.js`

## 🔍 Проверка после деплоя

### 1. Health Check
```bash
curl https://mnemine-backend-7b4y.onrender.com/health
```

### 2. API Health
```bash
curl https://mnemine-backend-7b4y.onrender.com/api/health
```

### 3. Проверка Telegram Webhook
```bash
curl -X POST "https://api.telegram.org/bot8422118658:AAHQHHJbO8CszCJRY8J0Rk8AQKVmqFp6HbE/getWebhookInfo"
```

### 4. Логи в Render Dashboard
- Перейдите в ваш сервис
- Откройте вкладку **"Logs"**
- Проверьте, что нет ошибок

## 🎯 Ожидаемый результат

После успешного деплоя:

✅ **URL приложения**: https://mnemine-backend-7b4y.onrender.com  
✅ **Telegram WebApp** работает через бота  
✅ **PostgreSQL база данных** подключена и работает  
✅ **Все API endpoints** доступны  
✅ **Fallback авторизация** отключена (только Telegram)  
✅ **Webhook** настроен и работает  

## 🐛 Troubleshooting

### Если деплой не удался:
1. Проверьте логи в Render Dashboard
2. Убедитесь, что все переменные окружения установлены
3. Проверьте подключение к PostgreSQL базе

### Если база данных не создается:
```bash
# В Render Dashboard → Shell
cd server
npx prisma db push --schema=./prisma/schema.prisma
```

### Если webhook не работает:
```bash
# Установите webhook вручную
curl -X POST "https://api.telegram.org/bot8422118658:AAHQHHJbO8CszCJRY8J0Rk8AQKVmqFp6HbE/setWebhook" \
  -d "url=https://mnemine-backend-7b4y.onrender.com/api/webhook/8422118658:AAHQHHJbO8CszCJRY8J0Rk8AQKVmqFp6HbE"
```

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте логи в Render Dashboard
2. Убедитесь, что все переменные окружения корректны
3. Проверьте статус PostgreSQL базы данных
4. Убедитесь, что Telegram Bot токен активен

---

**Готово к деплою!** 🚀  
Просто нажмите деплой в Render Dashboard или выполните `render deploy`!

