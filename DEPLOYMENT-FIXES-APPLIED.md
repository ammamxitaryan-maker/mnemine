# Исправления для деплоя на Render

## Проблемы, которые были исправлены:

### 1. Ошибка базы данных ExchangeRate
**Проблема:** Таблица `ExchangeRate` не существовала в продакшн базе данных, что вызывало ошибки в WebSocket сервере.

**Исправления:**
- Добавлена команда `npx prisma db push` в buildCommand в файлах `render.yaml` и `render-production.yaml`
- Добавлена функция `seedExchangeRate()` в `server/src/index.ts` для создания дефолтного курса обмена
- Исправлен метод `getPriceData()` в `server/src/websocket/WebSocketServer.ts` с обработкой ошибок

### 2. Конфигурация деплоя
**Изменения в render.yaml:**
```yaml
buildCommand: |
  pnpm install --frozen-lockfile
  pnpm run build:prod
  pnpm run copy:frontend
  echo "Setting up database..."
  cd server && npx prisma db push
  cd ..
```

**Изменения в render-production.yaml:**
```yaml
buildCommand: |
  echo "Starting production build..."
  npm install -g pnpm@latest
  pnpm install --frozen-lockfile
  pnpm run build:shared
  pnpm run build:client
  pnpm run build:server
  pnpm run copy:frontend
  echo "Setting up database..."
  cd server && npx prisma db push
  cd ..
  pnpm run verify:deployment
```

## Инструкции по деплою:

### Вариант 1: Автоматический деплой через Git
1. Закоммитьте все изменения:
   ```bash
   git add .
   git commit -m "Fix database schema and WebSocket errors for Render deployment"
   git push origin main
   ```

2. Render автоматически начнет новый деплой

### Вариант 2: Ручной деплой через Render Dashboard
1. Зайдите в Render Dashboard
2. Найдите ваш сервис
3. Нажмите "Manual Deploy" -> "Deploy latest commit"

### Вариант 3: Принудительный пересборка
1. В Render Dashboard найдите ваш сервис
2. Перейдите в Settings
3. Нажмите "Clear build cache"
4. Запустите новый деплой

## Что должно произойти после деплоя:

1. ✅ База данных будет синхронизирована с Prisma схемой
2. ✅ Таблица ExchangeRate будет создана
3. ✅ WebSocket сервер перестанет выдавать ошибки
4. ✅ Lottery API будет работать корректно
5. ✅ Telegram приложение будет функционировать

## Проверка после деплоя:

1. Проверьте логи в Render Dashboard - не должно быть ошибок Prisma
2. Проверьте WebSocket соединение - не должно быть ошибок "ExchangeRate table not available"
3. Протестируйте API endpoints:
   - `/api/lottery/status`
   - `/api/user/{telegramId}/data`
   - WebSocket: `wss://your-app.onrender.com/ws`

## Если проблемы остаются:

1. Проверьте переменные окружения в Render Dashboard
2. Убедитесь, что `DATABASE_URL` правильно настроен
3. Проверьте, что все необходимые переменные окружения установлены
4. При необходимости очистите кэш сборки и пересоберите проект

## Дополнительные улучшения:

- Добавлена обработка ошибок в WebSocket сервере
- Улучшена инициализация базы данных при запуске
- Добавлены предупреждения вместо критических ошибок для отсутствующих таблиц
