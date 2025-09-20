# Устранение проблем при деплое на Render.com

## 🚨 Основные проблемы и решения

### 1. Проблема с pnpm-lock.yaml
**Ошибка**: `pnpm-lock.yaml not found`
**Решение**: 
```bash
# В корне проекта выполните:
pnpm install
git add pnpm-lock.yaml
git commit -m "Add pnpm-lock.yaml"
git push origin main
```

### 2. Проблема с workspace зависимостями
**Ошибка**: `Cannot resolve workspace dependency`
**Решение**: 
- Убедитесь, что `pnpm-workspace.yaml` настроен правильно
- Все workspace пакеты должны быть в `package.json` с версией `workspace:*`

### 3. Проблема с Prisma
**Ошибка**: `Prisma Client not generated`
**Решение**:
- Убедитесь, что `npx prisma generate` выполняется в build команде
- Проверьте, что `DATABASE_URL` настроен правильно

### 4. Проблема с TypeScript
**Ошибка**: `TypeScript compilation failed`
**Решение**:
- Проверьте `tsconfig.json` в папке server
- Убедитесь, что все типы корректны
- Проверьте, что `@types/*` пакеты установлены

### 5. Проблема с CORS
**Ошибка**: `CORS policy blocked`
**Решение**:
- Убедитесь, что `CORS_ORIGIN` настроен правильно
- Проверьте, что frontend URL соответствует реальному

## 🔧 Пошаговое устранение проблем

### Шаг 1: Проверка локальной сборки
```bash
# Backend
cd server
pnpm install
npx prisma generate
tsc
pnpm run postbuild

# Frontend
cd client
pnpm install
vite build
```

### Шаг 2: Проверка переменных окружения
Убедитесь, что все переменные настроены в Render Dashboard:

**Backend**:
- `NODE_ENV` = `production`
- `DATABASE_URL` = (автоматически)
- `PORT` = `10000`
- `JWT_SECRET` = (автоматически)
- `TELEGRAM_BOT_TOKEN` = (ваш токен)
- `TELEGRAM_WEBHOOK_URL` = `https://mnemine-backend.onrender.com/webhook`
- `CORS_ORIGIN` = `https://mnemine-frontend.onrender.com`

**Frontend**:
- `VITE_API_URL` = `https://mnemine-backend.onrender.com`
- `VITE_APP_NAME` = `Mnemine`

### Шаг 3: Проверка логов
1. Откройте Render Dashboard
2. Выберите сервис
3. Перейдите в "Logs"
4. Ищите ошибки в build или runtime логах

### Шаг 4: Проверка базы данных
```bash
# Локально с подключением к удаленной БД
npx prisma db push
npx prisma studio
```

## 📋 Чек-лист для деплоя

### Перед деплоем:
- [ ] `pnpm-lock.yaml` существует в корне
- [ ] Все workspace зависимости настроены
- [ ] TypeScript компилируется без ошибок
- [ ] Prisma схема корректна
- [ ] Все переменные окружения подготовлены

### После деплоя:
- [ ] Backend отвечает на `/health`
- [ ] Frontend загружается
- [ ] API работает (проверить в DevTools)
- [ ] База данных подключена
- [ ] Telegram Bot работает

## 🆘 Частые ошибки

### "Module not found"
- Проверьте, что все зависимости установлены
- Убедитесь, что workspace зависимости настроены правильно

### "Database connection failed"
- Проверьте `DATABASE_URL`
- Убедитесь, что база данных создана
- Проверьте, что миграции выполнены

### "Build timeout"
- Упростите build команды
- Разделите сложные команды на несколько шагов
- Проверьте, что нет бесконечных циклов

### "Static site not found"
- Убедитесь, что `staticPublishPath` указывает на правильную папку
- Проверьте, что `vite build` создает папку `dist`

## 📞 Получение помощи

1. **Render Support**: [render.com/support](https://render.com/support)
2. **Prisma Docs**: [prisma.io/docs](https://prisma.io/docs)
3. **Vite Docs**: [vitejs.dev/guide](https://vitejs.dev/guide/)
4. **pnpm Docs**: [pnpm.io/](https://pnpm.io/)

## 🔄 Пересборка сервисов

Если что-то пошло не так:
1. В Render Dashboard выберите сервис
2. Нажмите "Manual Deploy"
3. Выберите ветку `main`
4. Дождитесь завершения сборки

## 📊 Мониторинг

- **Health Check**: `https://mnemine-backend.onrender.com/health`
- **Logs**: Render Dashboard → Service → Logs
- **Metrics**: Render Dashboard → Service → Metrics
