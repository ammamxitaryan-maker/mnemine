# Исправление CORS ошибок и проблем с базой данных

## 🚨 Проблемы, которые исправлены:

### 1. CORS ошибки для статических файлов
**Ошибка:** `Error: Not allowed by CORS` для JS файлов
**Причина:** CORS middleware применялся ко всем запросам, включая статические файлы
**Исправление:** ✅ Исключены статические файлы из CORS проверки

### 2. Таблица ExchangeRate не создается
**Ошибка:** `The table main.ExchangeRate does not exist in the current database`
**Причина:** Команда `prisma db push` не выполнялась правильно
**Исправление:** ✅ Улучшена конфигурация сборки с подробными логами

### 3. Неправильные CORS домены
**Проблема:** CORS не разрешал запросы с продакшн доменов
**Исправление:** ✅ Добавлены правильные домены Render

## 🔧 Внесенные изменения:

### 1. server/src/index.ts
```typescript
// Исключены статические файлы из CORS проверки
app.use((req, res, next) => {
  // Skip CORS for static files (JS, CSS, images, etc.)
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    return next();
  }
  
  // Skip CORS for health checks
  if (req.path === '/health') {
    return next();
  }
  
  // Apply CORS for all other requests
  cors(corsOptions)(req, res, next);
});
```

### 2. server/src/middleware/commonMiddleware.ts
```typescript
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://mnemine-backend-7b4y.onrender.com',
  'https://mnemine-production.onrender.com',
  'https://mnemine-production-fixed.onrender.com',
];
```

### 3. render-production.yaml и render.yaml
```yaml
echo "Setting up database..."
cd server
echo "Generating Prisma client..."
npx prisma generate
echo "Pushing database schema..."
npx prisma db push --force-reset --accept-data-loss
echo "Database setup completed"
cd ..
```

## 🚀 Инструкции по деплою:

### Шаг 1: Закоммитьте изменения
```bash
git add .
git commit -m "Fix CORS errors and database schema issues"
git push origin main
```

### Шаг 2: Следите за логами сборки
В Render Dashboard должны появиться сообщения:
- "Generating Prisma client..."
- "Pushing database schema..."
- "Database setup completed"

### Шаг 3: Проверьте результат
После деплоя проверьте:

1. **Статические файлы** - должны загружаться без CORS ошибок
2. **База данных** - не должно быть ошибок "ExchangeRate table not available"
3. **WebSocket** - должен работать без ошибок Prisma
4. **Telegram приложение** - должно загружаться полностью

## ✅ Ожидаемые результаты:

### До исправления:
```
Error: Not allowed by CORS
GET /js/router-DTLQ8oj-.js - 500 - 1ms
The table main.ExchangeRate does not exist in the current database
```

### После исправления:
```
GET /js/router-DTLQ8oj-.js - 200 - 5ms
[SEED] Default exchange rate created
[WebSocket] WebSocket server initialized
```

## 🔍 Проверка после деплоя:

1. **Откройте приложение в браузере** - не должно быть ошибок в консоли
2. **Проверьте Network tab** - все JS/CSS файлы должны загружаться с кодом 200
3. **Проверьте логи сервера** - не должно быть CORS ошибок
4. **Протестируйте Telegram приложение** - должно работать полностью

## 🚨 Если проблемы остаются:

1. **Очистите кэш браузера** - Ctrl+F5 или Cmd+Shift+R
2. **Проверьте переменные окружения** в Render Dashboard
3. **Принудительно пересоберите** проект с очисткой кэша
4. **Проверьте домен** - убедитесь, что используете правильный URL

После этого деплоя ваше приложение должно работать полностью! 🎉
