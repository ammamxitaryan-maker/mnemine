# 📊 Система структурированного логирования

## Обзор

Новая система логирования заменяет разрозненные `console.log` на централизованную, структурированную систему с контекстами, уровнями и метаданными.

## 🎯 Преимущества

### ✅ **До (проблемы):**
- 1280+ разрозненных `console.log`
- Нет структуры и контекста
- Сложно фильтровать и анализировать
- Производительность страдает в production
- Нет метаданных для отладки

### ✅ **После (решения):**
- Централизованная система логирования
- Структурированные контексты и уровни
- Автоматическое добавление метаданных
- Оптимизированная производительность
- Легкий анализ и мониторинг

## 🏗️ Архитектура

### Основные компоненты:

1. **Logger** (`server/src/utils/logger.ts`)
   - Центральный класс для логирования
   - Уровни: DEBUG, INFO, WARN, ERROR
   - Контексты: SERVER, DATABASE, WEBSOCKET, API, AUTH, TELEGRAM, PERFORMANCE, SECURITY, BUSINESS

2. **Request Logger** (`server/src/middleware/requestLogger.ts`)
   - Middleware для автоматического логирования HTTP запросов
   - Трекинг производительности
   - Уникальные ID запросов для трассировки

3. **Console Replacer** (`server/src/utils/consoleReplacer.ts`)
   - Автоматическая замена `console.log` на структурированное логирование
   - Умное определение контекста из stack trace

## 📋 Использование

### Базовое логирование:

```typescript
import { logger, LogContext } from './utils/logger.js';

// Простое сообщение
logger.info(LogContext.SERVER, 'Server started successfully');

// С данными
logger.business('Slot purchased', {
  userId: 'user123',
  amount: 100,
  currency: 'USD'
});

// Ошибки
logger.error(LogContext.DATABASE, 'Database connection failed', error);
```

### Удобные методы:

```typescript
// Контекстные методы
logger.server('Server message');
logger.database('Database operation');
logger.websocket('WebSocket event');
logger.api('API request');
logger.auth('Authentication event');
logger.telegram('Telegram bot event');
logger.performance('Performance metric');
logger.security('Security event');
logger.business('Business operation');
```

### Производительность:

```typescript
import { PerformanceTimer } from './utils/logger.js';

const timer = new PerformanceTimer(LogContext.API, 'Database query');
// ... выполнение операции
timer.end({ queryType: 'SELECT', rows: 100 });
```

## 🎛️ Конфигурация

### Уровни логирования:

```typescript
import { LogLevel } from './utils/logger.js';

// В development - все логи
logger.setLevel(LogLevel.DEBUG);

// В production - только важные
logger.setLevel(LogLevel.INFO);
```

### Переменные окружения:

```bash
# Включить замену console.log
ENABLE_CONSOLE_REPLACEMENT=true

# Уровень логирования
LOG_LEVEL=INFO
```

## 📊 Контексты и их назначение

| Контекст | Назначение | Примеры |
|----------|------------|---------|
| `SERVER` | Общие серверные события | Запуск, остановка, конфигурация |
| `DATABASE` | Операции с БД | Подключения, запросы, ошибки |
| `WEBSOCKET` | WebSocket события | Подключения, сообщения, отключения |
| `API` | HTTP API запросы | Маршруты, ответы, ошибки |
| `AUTH` | Аутентификация | Логин, токены, авторизация |
| `TELEGRAM` | Telegram Bot | Команды, webhook, сообщения |
| `PERFORMANCE` | Метрики производительности | Время выполнения, память |
| `SECURITY` | События безопасности | Подозрительная активность, блокировки |
| `BUSINESS` | Бизнес-логика | Слоты, лотерея, транзакции |

## 🔧 Автоматизация

### Скрипт замены console.log:

```bash
# Заменить все console.log в проекте
node scripts/replace-console-logs.js

# Заменить в конкретной директории
node scripts/replace-console-logs.js server/src/controllers
```

### Что делает скрипт:

1. **Сканирует файлы** с расширениями `.ts`, `.tsx`, `.js`, `.jsx`
2. **Определяет контекст** по пути файла
3. **Заменяет** `console.method()` на `logger.method(context, ...)`
4. **Добавляет импорты** автоматически
5. **Пропускает** системные файлы

## 📈 Мониторинг и анализ

### Структура логов:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "INFO",
  "context": "BUSINESS",
  "message": "Slot purchased successfully",
  "data": {
    "userId": "user123",
    "amount": 100,
    "currency": "USD"
  },
  "requestId": "req_1705312200000_abc123",
  "duration": 45
}
```

### Фильтрация логов:

```bash
# Только ошибки
grep '"level":"ERROR"' logs/app.log

# Только бизнес-операции
grep '"context":"BUSINESS"' logs/app.log

# По пользователю
grep '"userId":"user123"' logs/app.log

# По времени выполнения
grep '"duration":[5-9][0-9][0-9]' logs/app.log
```

## 🚀 Следующие шаги

### Этап 1: ✅ Завершен
- [x] Создана система логирования
- [x] Добавлены middleware
- [x] Обновлен главный файл сервера
- [x] Создан скрипт автоматизации

### Этап 2: 🔄 В процессе
- [ ] Запустить скрипт замены console.log
- [ ] Обновить контроллеры
- [ ] Обновить утилиты
- [ ] Тестирование

### Этап 3: 📋 Планируется
- [ ] Интеграция с внешними сервисами (Sentry, LogRocket)
- [ ] Дашборд мониторинга
- [ ] Алерты и уведомления
- [ ] Метрики производительности

## 💡 Рекомендации

### Для разработчиков:

1. **Используйте контексты** - всегда указывайте правильный контекст
2. **Добавляйте метаданные** - включайте полезную информацию
3. **Избегайте console.log** - используйте структурированное логирование
4. **Логируйте ошибки** - всегда логируйте ошибки с контекстом

### Для production:

1. **Настройте уровни** - используйте INFO или WARN в production
2. **Мониторьте производительность** - отслеживайте время выполнения
3. **Настройте алерты** - получайте уведомления об ошибках
4. **Архивируйте логи** - сохраняйте логи для анализа

## 🔍 Примеры использования

### В контроллере:

```typescript
import { logger, LogContext } from '../utils/logger.js';

export const purchaseSlot = async (req: Request, res: Response) => {
  const timer = new PerformanceTimer(LogContext.API, 'Purchase slot');
  
  try {
    logger.business('Slot purchase initiated', {
      userId: req.user.id,
      amount: req.body.amount
    });
    
    const result = await slotService.purchase(req.user.id, req.body.amount);
    
    timer.end({ success: true, slotId: result.id });
    
    logger.business('Slot purchase completed', {
      userId: req.user.id,
      slotId: result.id,
      amount: req.body.amount
    });
    
    res.json(result);
  } catch (error) {
    timer.end({ success: false, error: error.message });
    
    logger.error(LogContext.BUSINESS, 'Slot purchase failed', error, {
      userId: req.user.id,
      amount: req.body.amount
    });
    
    res.status(500).json({ error: 'Purchase failed' });
  }
};
```

### В сервисе:

```typescript
import { logger, LogContext } from '../utils/logger.js';

export class SlotService {
  async purchase(userId: string, amount: number) {
    logger.database('Starting slot purchase transaction', { userId, amount });
    
    const result = await prisma.$transaction(async (tx) => {
      // ... бизнес-логика
    });
    
    logger.database('Slot purchase transaction completed', {
      userId,
      slotId: result.id,
      amount
    });
    
    return result;
  }
}
```

---

**Результат:** Профессиональная система логирования, которая делает код более читаемым, производительным и удобным для отладки! 🎉
