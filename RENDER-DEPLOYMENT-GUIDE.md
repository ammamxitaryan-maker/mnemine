# Руководство по деплою на Render.com

## Обзор

Этот проект настроен для раздельного деплоя на Render.com с тремя сервисами:
- **Backend** (Node.js + TypeScript + Prisma + PostgreSQL)
- **Frontend** (Vite + React)
- **Database** (PostgreSQL)

## Структура деплоя

### 1. Backend Service (`mnemine-backend`)
- **Тип**: Web Service
- **Среда**: Node.js 20+
- **План**: Starter
- **Build команда**: `cd server && pnpm install --frozen-lockfile && npx prisma generate && tsc && pnpm run postbuild`
- **Start команда**: `cd server && node dist/index.js`
- **Health Check**: `/health`

### 2. Frontend Service (`mnemine-frontend`)
- **Тип**: Static Site
- **Build команда**: `cd client && pnpm install && vite build`
- **Publish Path**: `./client/dist`

### 3. Database (`mnemine-db`)
- **Тип**: PostgreSQL
- **План**: Starter

## Переменные окружения

### Backend Service
Настройте следующие переменные окружения в Render Dashboard:

#### Обязательные переменные:
- `NODE_ENV` = `production`
- `DATABASE_URL` = (автоматически из базы данных)
- `PORT` = `10000`
- `JWT_SECRET` = (генерируется автоматически)
- `CORS_ORIGIN` = `https://mnemine-frontend.onrender.com`

#### Переменные для настройки:
- `TELEGRAM_BOT_TOKEN` = (ваш Telegram Bot Token)
- `TELEGRAM_WEBHOOK_URL` = `https://mnemine-backend.onrender.com/webhook`

### Frontend Service
- `VITE_API_URL` = `https://mnemine-backend.onrender.com`
- `VITE_APP_NAME` = `Mnemine`

## Пошаговая инструкция деплоя

### Шаг 1: Подготовка репозитория
1. Убедитесь, что все изменения закоммичены в `main` ветку
2. Убедитесь, что файл `render.yaml` находится в корне репозитория

### Шаг 2: Создание сервисов на Render
1. Войдите в [Render Dashboard](https://dashboard.render.com)
2. Нажмите "New +" → "Blueprint"
3. Подключите ваш GitHub репозиторий
4. Render автоматически обнаружит `render.yaml` и создаст все сервисы

### Шаг 3: Настройка переменных окружения
1. Перейдите в настройки Backend сервиса
2. В разделе "Environment" добавьте:
   - `TELEGRAM_BOT_TOKEN` (ваш токен бота)
   - `TELEGRAM_WEBHOOK_URL` (URL для webhook)

### Шаг 4: Настройка базы данных
1. После создания базы данных, скопируйте `DATABASE_URL`
2. Выполните миграции Prisma:
   ```bash
   # Локально с подключением к удаленной БД
   npx prisma db push
   ```

### Шаг 5: Проверка деплоя
1. Backend должен быть доступен по адресу: `https://mnemine-backend.onrender.com`
2. Frontend должен быть доступен по адресу: `https://mnemine-frontend.onrender.com`
3. Проверьте health check: `https://mnemine-backend.onrender.com/health`

## Особенности конфигурации

### Backend
- Использует `pnpm` для управления зависимостями
- `prisma generate` выполняется во время сборки
- TypeScript компилируется в папку `dist`
- DevDependencies доступны во время сборки

### Frontend
- Использует Vite для сборки
- Статические файлы публикуются из `client/dist`
- Настроен для работы с API через переменную `VITE_API_URL`

### База данных
- PostgreSQL с автоматическим подключением
- `DATABASE_URL` автоматически передается в Backend

## Мониторинг и логи

### Просмотр логов
1. В Render Dashboard выберите сервис
2. Перейдите в раздел "Logs"
3. Логи доступны в реальном времени

### Health Checks
- Backend: `GET /health`
- Render автоматически проверяет доступность сервиса

## Обновление деплоя

### Автоматический деплой
- При push в `main` ветку, все сервисы автоматически пересобираются
- Настройка `autoDeploy: true` в `render.yaml`

### Ручной деплой
1. В Render Dashboard нажмите "Manual Deploy"
2. Выберите ветку для деплоя

## Устранение неполадок

### Проблемы с Backend
1. **Ошибка Prisma**: Убедитесь, что `DATABASE_URL` настроен правильно
2. **Ошибка TypeScript**: Проверьте, что все типы корректны
3. **Ошибка зависимостей**: Убедитесь, что `pnpm-lock.yaml` актуален

### Проблемы с Frontend
1. **Ошибка сборки**: Проверьте, что все зависимости установлены
2. **Ошибка API**: Убедитесь, что `VITE_API_URL` указывает на правильный Backend

### Проблемы с базой данных
1. **Подключение**: Проверьте `DATABASE_URL` в переменных окружения
2. **Миграции**: Выполните `npx prisma db push` для применения схемы

## Стоимость

### Starter Plan (рекомендуется для разработки)
- Backend: $7/месяц
- Frontend: Бесплатно
- Database: $7/месяц
- **Итого**: ~$14/месяц

### Production Plan (для продакшена)
- Backend: $25/месяц
- Frontend: Бесплатно
- Database: $25/месяц
- **Итого**: ~$50/месяц

## Дополнительные настройки

### Кастомный домен
1. В настройках сервиса добавьте ваш домен
2. Настройте DNS записи согласно инструкциям Render

### SSL сертификаты
- Render автоматически предоставляет SSL сертификаты
- Все сервисы доступны по HTTPS

### Мониторинг
- Render предоставляет базовый мониторинг
- Для расширенного мониторинга рассмотрите интеграцию с внешними сервисами
