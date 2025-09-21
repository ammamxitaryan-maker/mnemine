# 🚀 Render Deployment Fix

## Проблема
Render deployment падал с ошибкой:
```
postinstall: sh: 1: prisma: not found
```

## Решение

### 1. Переместили Prisma CLI в dependencies
В `server/package.json` переместили `prisma` и `typescript` из `devDependencies` в `dependencies`, так как они нужны в production для сборки.

### 2. Обновили build скрипты
- Убрали `pnpm dlx` из build скрипта
- Добавили `build:prod` скрипты
- Создали `build:render` скрипт для Render

### 3. Создали render.yaml
Конфигурация для автоматического деплоя на Render с правильными настройками.

## Как деплоить на Render

### Вариант 1: Использовать render.yaml
1. Загрузите код на GitHub
2. Подключите репозиторий к Render
3. Render автоматически использует `render.yaml`

### Вариант 2: Ручная настройка
1. Создайте новый Web Service в Render
2. Подключите GitHub репозиторий
3. Настройте:
   - **Build Command**: `pnpm install --frozen-lockfile && pnpm run build:render`
   - **Start Command**: `pnpm run start:prod`
   - **Environment**: Node

### Переменные окружения для Render
```env
NODE_ENV=production
PORT=10000
DATABASE_URL=<from_database>
JWT_SECRET=<generate>
ENCRYPTION_KEY=<generate>
SESSION_SECRET=<generate>
ADMIN_TELEGRAM_ID=6760298907
TELEGRAM_BOT_TOKEN=<your_bot_token>
TELEGRAM_WEBHOOK_SECRET=<generate>
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=50
LOG_LEVEL=warn
```

## Проверка деплоя
После успешного деплоя:
1. Проверьте health endpoint: `https://your-app.onrender.com/health`
2. Убедитесь, что API отвечает
3. Проверьте логи на ошибки

## Альтернативные команды сборки
Если основной build не работает, попробуйте:
```bash
# Для Render
pnpm run build:render

# Для других платформ
pnpm run build:prod
```
