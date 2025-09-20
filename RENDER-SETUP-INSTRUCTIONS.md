# Инструкции по настройке раздельного деплоя на Render.com

## Обзор

Проект настроен для раздельного деплоя на Render.com с двумя отдельными сервисами:
- **Backend** (Node.js + TypeScript + Prisma + PostgreSQL)
- **Frontend** (Vite + React)

## Структура сервисов

### Backend Service (mnemine-backend)
- **Тип**: Web Service
- **Root Directory**: `./server`
- **Build Command**: `npm install && npx prisma generate && tsc && npm run postbuild`
- **Start Command**: `node dist/index.js`
- **Health Check**: `/health`

### Frontend Service (mnemine-frontend)
- **Тип**: Static Site
- **Root Directory**: `./client`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `./dist`

## Переменные окружения

### Backend Service (mnemine-backend)

#### Обязательные переменные:
```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Security
JWT_SECRET=your_jwt_secret_here_minimum_32_characters
ENCRYPTION_KEY=your_encryption_key_here_32_characters
SESSION_SECRET=your_session_secret_here

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
ADMIN_TELEGRAM_ID=6760298907

# URLs
BACKEND_URL=https://mnemine-backend.onrender.com
ALLOWED_ORIGINS=https://mnemine-frontend.onrender.com
```

#### Опциональные переменные:
```bash
# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX_REQUESTS=5

# Environment
NODE_ENV=production
```

### Frontend Service (mnemine-frontend)

#### Обязательные переменные:
```bash
# Backend URLs
VITE_BACKEND_URL=https://mnemine-backend.onrender.com
VITE_WS_URL=wss://mnemine-backend.onrender.com/ws
```

#### Опциональные переменные:
```bash
# App Info
VITE_APP_NAME=Mnemine
VITE_APP_VERSION=1.0.0
```

## Пошаговая настройка на Render.com

### 1. Создание Backend сервиса

1. Войдите в Render Dashboard
2. Нажмите "New +" → "Web Service"
3. Подключите ваш GitHub репозиторий
4. Настройте сервис:
   - **Name**: `mnemine-backend`
   - **Environment**: `Node`
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npx prisma generate && tsc && npm run postbuild`
   - **Start Command**: `node dist/index.js`

### 2. Создание Frontend сервиса

1. Нажмите "New +" → "Static Site"
2. Подключите тот же GitHub репозиторий
3. Настройте сервис:
   - **Name**: `mnemine-frontend`
   - **Branch**: `main`
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

### 3. Настройка переменных окружения

#### Для Backend сервиса:
1. Перейдите в настройки Backend сервиса
2. Откройте вкладку "Environment"
3. Добавьте все переменные из раздела "Backend Service" выше
4. **ВАЖНО**: Замените URL-ы на реальные URL-ы ваших сервисов

#### Для Frontend сервиса:
1. Перейдите в настройки Frontend сервиса
2. Откройте вкладку "Environment"
3. Добавьте все переменные из раздела "Frontend Service" выше
4. **ВАЖНО**: `VITE_BACKEND_URL` должен указывать на URL Backend сервиса

### 4. Создание PostgreSQL базы данных

1. Нажмите "New +" → "PostgreSQL"
2. Настройте базу данных:
   - **Name**: `mnemine-db`
   - **Database**: `mnemine`
   - **User**: `mnemine_user`
3. После создания скопируйте **Internal Database URL**
4. Добавьте эту URL как `DATABASE_URL` в Backend сервис

### 5. Порядок деплоя

1. **Сначала** деплойте Backend сервис
2. **Затем** деплойте Frontend сервис
3. **После деплоя** обновите переменные окружения Frontend с правильными URL-ами Backend

## Проверка деплоя

### Backend Health Check
```bash
curl https://mnemine-backend.onrender.com/health
```

### Frontend доступность
Откройте URL Frontend сервиса в браузере

### Проверка API
```bash
curl https://mnemine-backend.onrender.com/api/health
```

## Troubleshooting

### Проблемы с Prisma
- Убедитесь, что `prisma` находится в `devDependencies`
- Проверьте, что `DATABASE_URL` правильно настроена
- Проверьте логи сборки на наличие ошибок Prisma

### Проблемы с CORS
- Убедитесь, что `ALLOWED_ORIGINS` содержит URL Frontend сервиса
- Проверьте, что `VITE_BACKEND_URL` правильно настроен

### Проблемы с WebSocket
- Убедитесь, что `VITE_WS_URL` использует `wss://` для production
- Проверьте, что WebSocket endpoint доступен на Backend

## Мониторинг

### Логи
- Backend логи: Render Dashboard → Backend Service → Logs
- Frontend логи: Render Dashboard → Frontend Service → Logs

### Метрики
- CPU и Memory usage доступны в Render Dashboard
- Database метрики в PostgreSQL сервисе

## Обновление

При обновлении кода:
1. Push в `main` ветку
2. Render автоматически пересоберет и перезапустит сервисы
3. Проверьте логи на наличие ошибок

## Безопасность

- Никогда не коммитьте `.env` файлы
- Используйте сильные пароли для JWT_SECRET и ENCRYPTION_KEY
- Регулярно обновляйте зависимости
- Мониторьте логи на подозрительную активность
