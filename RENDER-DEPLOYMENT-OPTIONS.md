# Варианты деплоя на Render.com

## 🎯 Рекомендуемый вариант: Единый сервис

### Почему единый сервис лучше для вашего проекта:
1. **У вас уже есть готовый фронтенд** в `server/public/`
2. **Проще настройка** - один сервис вместо двух
3. **Меньше затрат** - один сервис вместо двух
4. **Нет проблем с CORS** - фронтенд и API на одном домене

### Конфигурация (render.yaml):
```yaml
services:
  - type: web
    name: mnemine-app
    env: node
    plan: starter
    buildCommand: pnpm install --frozen-lockfile && cd server && npx prisma generate && tsc && pnpm run postbuild
    startCommand: cd server && node dist/index.js
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: mnemine-db
          property: connectionString
      - key: PORT
        value: 10000
      - key: JWT_SECRET
        generateValue: true
      - key: TELEGRAM_BOT_TOKEN
        sync: false
      - key: TELEGRAM_WEBHOOK_URL
        sync: false
    autoDeploy: true
    branch: main

  - type: pserv
    name: mnemine-db
    plan: starter
    databaseName: mnemine
    user: mnemine_user
```

### Результат:
- **URL**: `https://mnemine-app.onrender.com`
- **API**: `https://mnemine-app.onrender.com/api/*`
- **Frontend**: `https://mnemine-app.onrender.com/` (из server/public/)

---

## 🔄 Альтернативный вариант: Раздельный деплой

### Когда использовать:
- Если хотите отдельно масштабировать фронтенд и бэкенд
- Если планируете использовать CDN для статических файлов

### Конфигурация (render-final.yaml):
```yaml
services:
  - type: web
    name: mnemine-backend
    env: node
    plan: starter
    buildCommand: pnpm install --frozen-lockfile && cd server && npx prisma generate && tsc && pnpm run postbuild
    startCommand: cd server && node dist/index.js
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: mnemine-db
          property: connectionString
      - key: PORT
        value: 10000
      - key: JWT_SECRET
        generateValue: true
      - key: TELEGRAM_BOT_TOKEN
        sync: false
      - key: TELEGRAM_WEBHOOK_URL
        sync: false
      - key: CORS_ORIGIN
        value: https://mnemine-frontend.onrender.com
    autoDeploy: true
    branch: main

  - type: web
    name: mnemine-frontend
    env: static
    buildCommand: pnpm install --frozen-lockfile && cd client && vite build
    staticPublishPath: ./client/dist
    envVars:
      - key: VITE_API_URL
        value: https://mnemine-backend.onrender.com
      - key: VITE_APP_NAME
        value: Mnemine
    autoDeploy: true
    branch: main

  - type: pserv
    name: mnemine-db
    plan: starter
    databaseName: mnemine
    user: mnemine_user
```

### Результат:
- **Backend**: `https://mnemine-backend.onrender.com`
- **Frontend**: `https://mnemine-frontend.onrender.com`

---

## 🚀 Инструкция по деплою

### Шаг 1: Выберите вариант
- **Рекомендуется**: Используйте `render.yaml` (единый сервис)
- **Альтернатива**: Переименуйте `render-final.yaml` в `render.yaml`

### Шаг 2: Настройте переменные окружения
В Render Dashboard добавьте:
- `TELEGRAM_BOT_TOKEN` = ваш токен бота
- `TELEGRAM_WEBHOOK_URL` = `https://mnemine-app.onrender.com/webhook`

### Шаг 3: Выполните миграции
```bash
npx prisma db push
```

### Шаг 4: Проверьте деплой
- **Единый сервис**: `https://mnemine-app.onrender.com`
- **Раздельный**: `https://mnemine-backend.onrender.com/health`

---

## 💰 Стоимость

### Единый сервис:
- **App**: $7/месяц (Starter) или $25/месяц (Production)
- **Database**: $7/месяц (Starter) или $25/месяц (Production)
- **Итого**: $14/месяц или $50/месяц

### Раздельный деплой:
- **Backend**: $7/месяц или $25/месяц
- **Frontend**: Бесплатно
- **Database**: $7/месяц или $25/месяц
- **Итого**: $14/месяц или $50/месяц

---

## 🎯 Рекомендация

**Используйте единый сервис** (`render.yaml`), потому что:
1. У вас уже есть готовый фронтенд в `server/public/`
2. Проще настройка и поддержка
3. Нет проблем с CORS
4. Одинаковая стоимость
