# Быстрый старт деплоя на Render.com

## 🚀 Быстрая настройка (5 минут)

### 1. Подготовка репозитория
```bash
# Убедитесь, что все изменения закоммичены
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

### 2. Создание сервисов на Render
1. Откройте [Render Dashboard](https://dashboard.render.com)
2. Нажмите **"New +"** → **"Blueprint"**
3. Подключите ваш GitHub репозиторий
4. Render автоматически создаст 3 сервиса из `render.yaml`:
   - `mnemine-backend` (Node.js API)
   - `mnemine-frontend` (React SPA)
   - `mnemine-db` (PostgreSQL)

### 3. Настройка переменных окружения

#### Backend Service
В настройках `mnemine-backend` добавьте:
```
TELEGRAM_BOT_TOKEN=your_actual_bot_token
TELEGRAM_WEBHOOK_URL=https://mnemine-backend.onrender.com/webhook
```

#### Frontend Service
Переменные уже настроены в `render.yaml`:
```
VITE_API_URL=https://mnemine-backend.onrender.com
VITE_APP_NAME=Mnemine
```

### 4. Настройка базы данных
После создания базы данных:
```bash
# Локально выполните миграции
npx prisma db push
```

### 5. Проверка деплоя
- Backend: https://mnemine-backend.onrender.com/health
- Frontend: https://mnemine-frontend.onrender.com

## 📋 Чек-лист деплоя

- [ ] Репозиторий подключен к Render
- [ ] Все 3 сервиса созданы
- [ ] `TELEGRAM_BOT_TOKEN` настроен
- [ ] База данных создана
- [ ] Миграции Prisma выполнены
- [ ] Backend отвечает на `/health`
- [ ] Frontend загружается
- [ ] API работает (проверить в DevTools)

## 🔧 Устранение проблем

### Backend не запускается
1. Проверьте логи в Render Dashboard
2. Убедитесь, что `DATABASE_URL` настроен
3. Проверьте, что `TELEGRAM_BOT_TOKEN` добавлен

### Frontend не подключается к API
1. Проверьте `VITE_API_URL` в переменных окружения
2. Убедитесь, что Backend доступен
3. Проверьте CORS настройки

### База данных недоступна
1. Убедитесь, что база данных создана
2. Проверьте `DATABASE_URL` в Backend
3. Выполните миграции Prisma

## 💰 Стоимость
- **Starter Plan**: ~$14/месяц
- **Production Plan**: ~$50/месяц

## 📞 Поддержка
- [Render Documentation](https://render.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Vite Documentation](https://vitejs.dev/guide/)
