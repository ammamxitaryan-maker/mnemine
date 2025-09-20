# 🚀 Пошаговый Деплой на Render

## ✅ **Проект Готов к Деплою!**

Все проверки пройдены успешно. Теперь следуйте этим шагам:

## 📋 **Шаг 1: Подготовка GitHub**

### 1.1 Коммит и Push изменений
```bash
# Добавить все файлы в Git
git add .

# Создать коммит
git commit -m "Fix deployment configuration - ready for Render"

# Push в GitHub
git push origin main
```

## 🌐 **Шаг 2: Создание Render Blueprint**

### 2.1 Перейти на Render Dashboard
1. Откройте [https://dashboard.render.com](https://dashboard.render.com)
2. Войдите в свой аккаунт (или создайте бесплатный)

### 2.2 Создать Blueprint
1. Нажмите **"New +"** в правом верхнем углу
2. Выберите **"Blueprint"**
3. Подключите ваш GitHub репозиторий: `ammamxitaryan-maker/mnemine`
4. Выберите ветку `main`

### 2.3 Настроить Blueprint
1. Render автоматически найдет файл `render.yaml`
2. Проверьте конфигурацию:
   - **Service Name**: `mnemine-app`
   - **Database**: `mnemine-db` (PostgreSQL)
3. Нажмите **"Apply"**

## ⚙️ **Шаг 3: Настройка Environment Variables**

### 3.1 Обязательные переменные
В Render Dashboard → ваш сервис → Environment:

```bash
# Эти переменные нужно добавить ВРУЧНУЮ:
TELEGRAM_BOT_TOKEN=ваш_токен_бота_здесь
ADMIN_TELEGRAM_ID=ваш_telegram_id_здесь
```

### 3.2 Автоматически генерируемые
Эти переменные Render создаст автоматически:
```bash
JWT_SECRET=автоматически_сгенерирован
ENCRYPTION_KEY=автоматически_сгенерирован
SESSION_SECRET=автоматически_сгенерирован
DATABASE_URL=автоматически_из_базы_данных
```

## 🔧 **Шаг 4: Настройка Telegram Bot**

### 4.1 Получить Bot Token
1. Напишите [@BotFather](https://t.me/BotFather) в Telegram
2. Создайте нового бота: `/newbot`
3. Скопируйте токен (формат: `1234567890:ABCdefGhIjKlMnOpQrStUvWxYz`)

### 4.2 Получить Admin Telegram ID
1. Напишите [@userinfobot](https://t.me/userinfobot)
2. Скопируйте ваш ID (например: `6760298907`)

### 4.3 Настроить Webhook
После деплоя установите webhook:
```bash
# Замените YOUR_BOT_TOKEN и YOUR_APP_URL
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://mnemine-app.onrender.com/webhook"}'
```

## 🎯 **Шаг 5: Мониторинг Деплоя**

### 5.1 Проверка Build
1. В Render Dashboard → ваш сервис → Logs
2. Следите за процессом сборки
3. Убедитесь, что все шаги завершились успешно

### 5.2 Проверка Health
После деплоя проверьте:
- **Health Check**: `https://mnemine-app.onrender.com/health`
- **Frontend**: `https://mnemine-app.onrender.com`
- **API**: `https://mnemine-app.onrender.com/api/health`

## 🚨 **Возможные Проблемы и Решения**

### Проблема: Build Failed
**Решение**: Проверьте логи в Render Dashboard
```bash
# Локальная проверка
pnpm run build
pnpm run verify:production
```

### Проблема: Environment Variables Missing
**Решение**: Убедитесь, что добавили:
- `TELEGRAM_BOT_TOKEN`
- `ADMIN_TELEGRAM_ID`

### Проблема: Database Connection Failed
**Решение**: Проверьте, что PostgreSQL сервис создан и `DATABASE_URL` настроен

## 📊 **Стоимость**

### Free Tier (Рекомендуется для начала)
- **Web Service**: 750 часов/месяц (достаточно для тестирования)
- **PostgreSQL**: 1GB storage, 1GB RAM
- **Итого**: $0/месяц

### Paid Plans (При необходимости)
- **Starter**: $7/месяц за сервис
- **Standard**: $25/месяц за сервис

## 🎉 **После Успешного Деплоя**

### Проверочный Список
- [ ] Сервис запущен и доступен
- [ ] Health check возвращает 200 OK
- [ ] Frontend загружается корректно
- [ ] Database подключена
- [ ] Telegram bot отвечает
- [ ] WebSocket соединения работают

### URL Вашего Приложения
```
https://mnemine-app.onrender.com
```

## 📞 **Поддержка**

### Если что-то не работает:
1. **Проверьте логи** в Render Dashboard
2. **Убедитесь в environment variables**
3. **Проверьте health endpoint**
4. **Обратитесь к документации Render**

### Полезные ссылки:
- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com)
- [Render Status](https://status.render.com)

---

## 🚀 **Быстрый Старт**

```bash
# 1. Коммит изменений
git add . && git commit -m "Ready for deployment" && git push origin main

# 2. Идите на https://dashboard.render.com
# 3. Создайте Blueprint с вашим репозиторием
# 4. Добавьте TELEGRAM_BOT_TOKEN и ADMIN_TELEGRAM_ID
# 5. Нажмите Apply и ждите деплоя
```

**Удачи с деплоем! 🎉**
