# Раздельный деплой сервера и фронтенда

## 🎯 Варианты раздельного деплоя

### Вариант 1: Server + Client (Рекомендуется)
**Файл**: `render.yaml`

**Структура**:
- **Backend**: `server/` (Node.js API)
- **Frontend**: `client/` (React SPA из Vite)

**Преимущества**:
- ✅ Современная архитектура
- ✅ Отдельная сборка фронтенда
- ✅ Легко обновлять фронтенд независимо
- ✅ Лучшая производительность

**URLs**:
- Backend: `https://mnemine-backend.onrender.com`
- Frontend: `https://mnemine-frontend.onrender.com`

---

### Вариант 2: Server + Server Public
**Файл**: `render-server-public.yaml`

**Структура**:
- **Backend**: `server/` (Node.js API)
- **Frontend**: `server/public/` (готовые статические файлы)

**Преимущества**:
- ✅ Использует уже готовые файлы
- ✅ Простая настройка
- ✅ Меньше сборок

**URLs**:
- Backend: `https://mnemine-backend.onrender.com`
- Frontend: `https://mnemine-frontend.onrender.com`

---

## 🚀 Инструкция по деплою

### Шаг 1: Выберите вариант

**Для Варианта 1 (Server + Client)**:
```bash
# Используйте текущий render.yaml
git add render.yaml
git commit -m "Use separate server and client deployment"
git push origin main
```

**Для Варианта 2 (Server + Server Public)**:
```bash
# Переименуйте файл
mv render-server-public.yaml render.yaml
git add render.yaml
git commit -m "Use server with public folder deployment"
git push origin main
```

### Шаг 2: Создайте Blueprint на Render

1. Откройте [Render Dashboard](https://dashboard.render.com)
2. Нажмите **"New +"** → **"Blueprint"**
3. Подключите ваш GitHub репозиторий
4. Render создаст 3 сервиса:
   - `mnemine-backend` (Node.js)
   - `mnemine-frontend` (Static)
   - `mnemine-db` (PostgreSQL)

### Шаг 3: Настройте переменные окружения

**В Backend сервисе добавьте**:
- `TELEGRAM_BOT_TOKEN` = ваш токен бота
- `ADMIN_TELEGRAM_ID` = ваш Telegram ID

### Шаг 4: Выполните миграции

```bash
# Локально с подключением к удаленной БД
npx prisma db push
```

---

## 📊 Сравнение вариантов

| Критерий | Server + Client | Server + Public |
|----------|----------------|-----------------|
| **Архитектура** | Современная | Простая |
| **Обновления** | Легко | Сложнее |
| **Производительность** | Лучше | Хорошо |
| **Настройка** | Средняя | Простая |
| **Стоимость** | $14/мес | $14/мес |

---

## 🎯 Рекомендация

**Используйте Вариант 1 (Server + Client)** потому что:

1. **Современная архитектура** - разделение фронтенда и бэкенда
2. **Легкие обновления** - можно обновлять фронтенд независимо
3. **Лучшая производительность** - оптимизированная сборка Vite
4. **Масштабируемость** - можно легко добавить CDN для статики

---

## 🔧 Устранение проблем

### Проблема: CORS ошибки
**Решение**: Убедитесь, что `CORS_ORIGIN` в backend указывает на frontend URL

### Проблема: Frontend не подключается к API
**Решение**: Проверьте `VITE_BACKEND_URL` в frontend переменных

### Проблема: WebSocket не работает
**Решение**: Убедитесь, что `VITE_WS_URL` использует `wss://` (безопасное соединение)

---

## 📞 Поддержка

Если возникнут проблемы:
1. Проверьте логи в Render Dashboard
2. Убедитесь, что все переменные окружения настроены
3. Проверьте, что build команды работают локально
