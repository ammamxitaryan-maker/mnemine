# Деплой на Render

Этот документ описывает процесс деплоя приложения на Render.com.

## Подготовка к деплою

### 1. Установка Render CLI
```bash
npm install -g @render/cli
render login
```

### 2. Настройка переменных окружения
Все необходимые переменные уже настроены в `render.yaml`:

✅ **Уже настроено:**
- `TELEGRAM_BOT_TOKEN` - 8422118658:AAHQHHJbO8CszCJRY8J0Rk8AQKVmqFp6HbE
- `ADMIN_TELEGRAM_ID` - 6760298907
- `DATABASE_URL` - PostgreSQL база данных на Render
- `JWT_SECRET`, `ENCRYPTION_KEY`, `SESSION_SECRET` - сгенерированные ключи
- `BACKEND_URL`, `FRONTEND_URL` - https://mnemine-backend-7b4y.onrender.com

### 3. Проверка готовности
```bash
# Проверка структуры проекта
pnpm run verify:production

# Проверка сборки
pnpm run build:prod

# Проверка локального запуска
pnpm start
```

## Деплой

### Автоматический деплой
```bash
# Запуск скрипта деплоя с проверками
node scripts/deploy-to-render.js
```

### Ручной деплой
```bash
# 1. Сборка проекта
pnpm run build:prod

# 2. Деплой на Render
render deploy
```

## Конфигурация Render

### render.yaml
Файл `render.yaml` содержит конфигурацию для автоматического деплоя:

```yaml
services:
  - type: web
    name: mnemine-backend
    env: node
    plan: free
    buildCommand: |
      echo "Installing dependencies..." && 
      pnpm install && 
      echo "Building application..." && 
      pnpm run build:prod && 
      echo "Copying frontend files..." && 
      pnpm run copy:frontend && 
      echo "Setting up database..." && 
      cd server && 
      echo "Generating Prisma client..." && 
      npx prisma generate && 
      echo "Pushing database schema..." && 
      npx prisma db push --accept-data-loss && 
      echo "Build completed successfully!"
    startCommand: |
      echo "Starting production server..." && 
      cd server && 
      echo "Ensuring database is ready..." && 
      npx prisma db push --accept-data-loss || echo "Database push failed, continuing..." && 
      echo "Starting Node.js server..." && 
      node dist/index.js
```

### Переменные окружения
Основные переменные, которые нужно настроить в Render Dashboard:

#### Обязательные
- `TELEGRAM_BOT_TOKEN` - токен Telegram бота
- `ADMIN_TELEGRAM_ID` - ID администратора
- `DATABASE_URL` - URL PostgreSQL базы (автоматически)

#### Автоматически генерируемые
- `JWT_SECRET` - секрет для JWT токенов
- `ENCRYPTION_KEY` - ключ шифрования
- `SESSION_SECRET` - секрет сессий

#### Опциональные
- `BACKEND_URL` - URL бэкенда (автоматически)
- `FRONTEND_URL` - URL фронтенда (автоматически)
- `TELEGRAM_WEBHOOK_URL` - URL для webhook

## После деплоя

### 1. Проверка работоспособности
```bash
# Проверка здоровья приложения
curl https://your-app.onrender.com/health

# Проверка API
curl https://your-app.onrender.com/api/health
```

### 2. Настройка Telegram Webhook
После успешного деплоя настройте webhook для Telegram бота:

```bash
# Получите URL вашего приложения
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -d "url=https://your-app.onrender.com/api/webhook/<YOUR_BOT_TOKEN>"
```

### 3. Проверка логов
```bash
# Просмотр логов в Render Dashboard
render logs --service your-service-name

# Или через CLI
render logs
```

## Мониторинг

### Проверка состояния
- **Health Check**: `GET /health`
- **API Health**: `GET /api/health`
- **Database**: Автоматическая проверка подключения

### Логи
Важные события в логах:
- `[ENV]` - Загрузка переменных окружения
- `[SERVER]` - Запуск сервера
- `[BOT]` - Инициализация Telegram бота
- `[WEBHOOK]` - Webhook события
- `[AUTH]` - Процессы авторизации

## Troubleshooting

### Проблемы с базой данных
```bash
# Проверка подключения к базе
render exec --service your-service-name -- npx prisma db push

# Сброс базы данных (ОСТОРОЖНО!)
render exec --service your-service-name -- npx prisma migrate reset
```

### Проблемы с webhook
```bash
# Проверка webhook
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"

# Удаление webhook
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook"
```

### Проблемы с памятью
Если приложение падает из-за нехватки памяти:
```yaml
# В render.yaml добавьте:
envVars:
  - key: NODE_OPTIONS
    value: "--max-old-space-size=4096"
```

### Проблемы с CORS
Если возникают проблемы с CORS в продакшне:
1. Проверьте переменную `FRONTEND_URL`
2. Убедитесь, что домен добавлен в allowed origins
3. Проверьте настройки CORS в коде

## Обновление

### Обновление кода
```bash
# 1. Обновите код
git add .
git commit -m "Update application"
git push

# 2. Деплой автоматически запустится
# Или запустите вручную:
render deploy
```

### Обновление переменных окружения
1. Откройте Render Dashboard
2. Перейдите в Environment Variables
3. Обновите нужные переменные
4. Перезапустите сервис

### Откат версии
```bash
# Список деплоев
render deploys --service your-service-name

# Откат к предыдущей версии
render rollback --service your-service-name --deploy <deploy-id>
```

## Безопасность

### Рекомендации
1. **Никогда не коммитьте** `.env.production` файл
2. **Используйте сильные** JWT_SECRET и ENCRYPTION_KEY
3. **Ограничьте** доступ к админским функциям
4. **Регулярно обновляйте** зависимости
5. **Мониторьте** логи на подозрительную активность

### Переменные окружения
- Все секретные данные хранятся в Render Environment Variables
- Используйте автоматическую генерацию для JWT_SECRET
- Регулярно ротируйте ключи шифрования
