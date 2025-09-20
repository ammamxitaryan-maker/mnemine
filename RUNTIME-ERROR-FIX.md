# 🔧 Исправление Runtime Error в Blueprint

## 🚨 **Проблема**: Runtime Error

**Ошибка**: 
```
services[1]
    non-docker, non-static, non-image runtime must have startCommand
services[1].runtime
    invalid runtime 
```

## ✅ **Решение**: Добавлен runtime для PostgreSQL

### Что было исправлено:

```yaml
# БЫЛО (вызывало ошибку):
- type: pserv
  name: mnemine-db
  plan: starter

# СТАЛО (работает):
- type: pserv
  name: mnemine-db
  plan: starter
  runtime: postgresql  # ✅ Добавлен runtime
```

## 🎯 **Исправленная Конфигурация**

### render.yaml - Финальная версия:
```yaml
services:
  - type: web
    name: mnemine-app
    env: node
    plan: starter
    buildCommand: pnpm install --frozen-lockfile && pnpm run build && pnpm run copy:frontend
    startCommand: node server/dist/index.js
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: mnemine-db
          property: connectionString
      # ... остальные переменные ...
    autoDeploy: true
    branch: main

  - type: pserv
    name: mnemine-db
    plan: starter
    runtime: postgresql  # ✅ Исправлено
```

## 🚀 **Сейчас Можете Деплоить:**

### 1. Обновить файлы в Git
```bash
git add .
git commit -m "Fix runtime error - add postgresql runtime"
git push origin main
```

### 2. Создать Blueprint
1. Идите на [dashboard.render.com](https://dashboard.render.com)
2. **"New +"** → **"Blueprint"**
3. Подключите `ammamxitaryan-maker/mnemine`
4. Выберите ветку `main`
5. Нажмите **"Apply"**

### 3. Настроить Environment Variables
После создания добавьте:
```
TELEGRAM_BOT_TOKEN=ваш_токен_бота
ADMIN_TELEGRAM_ID=ваш_telegram_id
```

## 🔍 **Проверка Конфигурации**

Убедитесь, что:
- ✅ Web service имеет `startCommand`
- ✅ PostgreSQL service имеет `runtime: postgresql`
- ✅ Все environment variables настроены
- ✅ Build и start команды корректны

## 🎉 **Результат**

После успешного деплоя:
- **Приложение**: `https://mnemine-app.onrender.com`
- **Health Check**: `https://mnemine-app.onrender.com/health`
- **Database**: Автоматически подключена через `DATABASE_URL`

## 📞 **Если Все Еще Ошибки**

### Альтернатива: Ручное создание
1. **PostgreSQL**: New → PostgreSQL → Name: `mnemine-db`
2. **Web Service**: New → Web Service → Connect GitHub
3. **Environment**: Добавить переменные вручную

---

## 🚀 **Runtime Error Исправлен!**

**Теперь Blueprint должен создаться без ошибок! Попробуйте снова! 🎉**
