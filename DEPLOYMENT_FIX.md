# Исправление деплоя на Render

## Проблема была в том, что:
1. **Скрипт `copy-frontend.js` не найден** в Render
2. **Неправильная последовательность команд** в buildCommand
3. **Отсутствовали важные переменные окружения**

## Что исправлено:

### 1. Команда копирования файлов
**Было:**
```json
"copy:frontend": "node scripts/copy-frontend.js"
```

**Стало:**
```json
"copy:frontend": "mkdir -p server/public && cp -r client/dist/* server/public/ 2>/dev/null || (mkdir server\\public 2>nul & xcopy client\\dist\\* server\\public\\ /E /I /Y /Q)"
```

### 2. Render.yaml buildCommand
**Было:**
```yaml
buildCommand: |
  npm install -g pnpm
  pnpm install
  pnpm run build:server:prod
  pnpm run copy:frontend
```

**Стало:**
```yaml
buildCommand: |
  # Install pnpm globally
  npm install -g pnpm
  
  # Install all dependencies
  pnpm install
  
  # Generate Prisma client first
  pnpm run prisma:generate:prod
  
  # Build client (frontend) - this creates client/dist/
  pnpm run build:client
  
  # Build server (backend) - this creates server/dist/
  pnpm run build:server:prod
  
  # Copy frontend files to server public directory
  mkdir -p server/public && cp -r client/dist/* server/public/
  
  # Push database schema (migration) - do this last
  pnpm run prisma:push:prod
```

### 3. Добавлены переменные окружения
- JWT_SECRET
- ENCRYPTION_KEY  
- SESSION_SECRET
- ADMIN_TELEGRAM_ID
- ADMIN_TELEGRAM_IDS
- VITE_* переменные для фронтенда

## Правильная последовательность:

1. **Установка pnpm** - глобально
2. **Установка зависимостей** - pnpm install
3. **Генерация Prisma клиента** - prisma generate
4. **Сборка клиента** - создает client/dist/
5. **Сборка сервера** - создает server/dist/
6. **Копирование файлов** - client/dist/* → server/public/
7. **Применение схемы БД** - prisma db push

## Проверка деплоя:

### 1. Логи сборки
В Render Dashboard → ваш сервис → Logs
Ищите:
- ✅ "Built client successfully"
- ✅ "Built server successfully" 
- ✅ "Database schema pushed successfully"

### 2. Проверка файлов
После сборки в server/public/ должны быть:
- index.html
- assets/ (папка с JS/CSS)
- locales/ (папка с переводами)

### 3. Проверка переменных
Убедитесь, что все переменные окружения установлены в Render Dashboard.

## Если что-то не работает:

### 1. Ошибка "Cannot find module"
- Проверьте, что все файлы закоммичены
- Убедитесь, что pnpm установлен глобально

### 2. Ошибка Prisma
- Проверьте DATABASE_URL
- Убедитесь, что база данных доступна

### 3. Ошибка копирования файлов
- Проверьте, что клиент собрался успешно
- Убедитесь, что client/dist/ существует

## Альтернативные решения:

### 1. Используйте render-backup.yaml
Если основная конфигурация не работает

### 2. Ручной деплой
В Render Dashboard → Manual Deploy → Deploy latest commit

### 3. Проверьте логи
Всегда смотрите логи в Render Dashboard для диагностики

## Контакты:
Если проблемы продолжаются, проверьте:
1. Логи Render
2. Переменные окружения
3. Доступность базы данных
4. Правильность URL в переменных
