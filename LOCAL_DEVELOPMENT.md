# 🚀 Локальная разработка FastMine

## Быстрый старт

### 1. Запуск сервера
```bash
# В корневой папке проекта
pnpm run dev:server
```

### 2. Запуск клиента (в новом терминале)
```bash
# В корневой папке проекта
pnpm run dev:client
```

### 3. Или запуск всего сразу
```powershell
# PowerShell
.\start-local-dev.ps1
```

## 🔧 Конфигурация

### Сервер
- **Порт**: 10112
- **URL**: http://localhost:10112
- **API**: http://localhost:10112/api
- **WebSocket**: ws://localhost:10112/ws

### Клиент
- **Порт**: 5173
- **URL**: http://localhost:5173
- **Прокси**: /api → http://localhost:10112/api

## 🧪 Тестирование

### Тест сервера
```powershell
.\test-local-server.ps1
```

### Тест API вручную
```bash
# Health check
curl http://localhost:10112/api/health

# Test endpoint
curl http://localhost:10112/api/test

# Stats
curl http://localhost:10112/api/stats/fake
```

## 🔍 Отладка

### CORS проблемы
- В режиме разработки CORS настроен более мягко
- Все localhost и 127.0.0.1 разрешены
- Проверьте логи сервера для CORS сообщений

### Проблемы с подключением
1. Убедитесь, что сервер запущен на порту 10112
2. Проверьте, что клиент использует правильный URL
3. Проверьте прокси настройки в vite.config.ts

### Логи
- Сервер: консоль где запущен `pnpm run dev:server`
- Клиент: консоль браузера (F12)

## 📁 Структура

```
fastmine/
├── client/          # React фронтенд
├── server/          # Express сервер
├── env.local        # Локальные переменные
├── start-local-dev.ps1  # Скрипт запуска
└── test-local-server.ps1 # Скрипт тестирования
```

## 🌐 Переменные окружения

### Локальная разработка (env.local)
```env
NODE_ENV=development
PORT=10112
BACKEND_URL=http://localhost:10112
FRONTEND_URL=http://localhost:5173
VITE_BACKEND_URL=http://localhost:10112
VITE_WS_URL=ws://localhost:10112/ws
```

## 🚨 Важные замечания

1. **Не подключайтесь к Render** в локальном режиме
2. **Используйте локальную базу данных** или SQLite для разработки
3. **CORS настроен мягко** для локальной разработки
4. **Прокси настроен** для автоматического перенаправления API запросов

## 🔧 Команды

```bash
# Установка зависимостей
pnpm install

# Запуск сервера
pnpm run dev:server

# Запуск клиента
pnpm run dev:client

# Запуск всего
pnpm run dev

# Сборка для продакшена
pnpm run build:prod

# Тестирование
.\test-local-server.ps1
```
