# Исправления для Render.com деплоя

## 🔧 Проблемы, которые были исправлены:

### 1. **Отсутствующий pnpm-lock.yaml**
- **Проблема**: Render не мог установить зависимости без lock файла
- **Решение**: Создан `pnpm-lock.yaml` через `pnpm install`
- **Статус**: ✅ Исправлено

### 2. **Неправильная версия Node.js в dist-package.json**
- **Проблема**: Указана версия >=18.0.0 вместо >=20.0.0
- **Решение**: Обновлена версия в `server/dist-package.json`
- **Статус**: ✅ Исправлено

### 3. **Оптимизированы build команды**
- **Проблема**: Сложные команды могли вызывать таймауты
- **Решение**: Упрощены команды в `render.yaml`:
  - Backend: `pnpm install --frozen-lockfile && cd server && npx prisma generate && tsc && pnpm run postbuild`
  - Frontend: `pnpm install --frozen-lockfile && cd client && vite build`
- **Статус**: ✅ Исправлено

### 4. **Добавлены .nvmrc файлы**
- **Проблема**: Не было явного указания версии Node.js
- **Решение**: Созданы `.nvmrc` файлы с версией 20.18.0
- **Статус**: ✅ Исправлено

## 📁 Созданные/обновленные файлы:

### Новые файлы:
- ✅ `.nvmrc` (корень проекта)
- ✅ `server/.nvmrc`
- ✅ `client/.nvmrc`
- ✅ `RENDER-TROUBLESHOOTING.md`
- ✅ `RENDER-FIXES-SUMMARY.md`
- ✅ `pnpm-lock.yaml`

### Обновленные файлы:
- ✅ `render.yaml` - исправлены build команды
- ✅ `server/dist-package.json` - обновлена версия Node.js
- ✅ `server/package.json` - исправлен build скрипт
- ✅ `client/package.json` - исправлен build скрипт
- ✅ `env.example` - добавлены переменные для Render

## 🚀 Готово к деплою:

### Текущая конфигурация:
```yaml
services:
  # Backend Service
  - type: web
    name: mnemine-backend
    env: node
    plan: starter
    buildCommand: pnpm install --frozen-lockfile && cd server && npx prisma generate && tsc && pnpm run postbuild
    startCommand: cd server && node dist/index.js
    healthCheckPath: /health

  # Frontend Service
  - type: web
    name: mnemine-frontend
    env: static
    buildCommand: pnpm install --frozen-lockfile && cd client && vite build
    staticPublishPath: ./client/dist

  # PostgreSQL Database
  - type: pserv
    name: mnemine-db
    plan: starter
```

### Переменные окружения:
**Backend**:
- `NODE_ENV` = `production`
- `DATABASE_URL` = (автоматически из БД)
- `PORT` = `10000`
- `JWT_SECRET` = (автоматически генерируется)
- `TELEGRAM_BOT_TOKEN` = (нужно настроить)
- `TELEGRAM_WEBHOOK_URL` = (нужно настроить)
- `CORS_ORIGIN` = `https://mnemine-frontend.onrender.com`

**Frontend**:
- `VITE_API_URL` = `https://mnemine-backend.onrender.com`
- `VITE_APP_NAME` = `Mnemine`

## 📋 Следующие шаги:

1. **Push изменений**:
   ```bash
   git push origin main
   ```

2. **Создать Blueprint на Render**:
   - Открыть [Render Dashboard](https://dashboard.render.com)
   - "New +" → "Blueprint"
   - Подключить репозиторий

3. **Настроить переменные**:
   - Добавить `TELEGRAM_BOT_TOKEN`
   - Добавить `TELEGRAM_WEBHOOK_URL`

4. **Выполнить миграции**:
   ```bash
   npx prisma db push
   ```

## 🎯 Ожидаемый результат:

- **Backend**: `https://mnemine-backend.onrender.com`
- **Frontend**: `https://mnemine-frontend.onrender.com`
- **Health Check**: `https://mnemine-backend.onrender.com/health`

## 📞 Поддержка:

Если возникнут проблемы:
1. Проверьте `RENDER-TROUBLESHOOTING.md`
2. Посмотрите логи в Render Dashboard
3. Убедитесь, что все переменные окружения настроены

Все основные проблемы исправлены! 🎉
