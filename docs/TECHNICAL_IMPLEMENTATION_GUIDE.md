# 🔧 ТЕХНИЧЕСКОЕ РУКОВОДСТВО ПО РЕАЛИЗАЦИИ

## 📋 СОДЕРЖАНИЕ
1. [Структура проекта](#структура-проекта)
2. [Настройка окружения](#настройка-окружения)
3. [API документация](#api-документация)
4. [База данных](#база-данных)
5. [Автоматизация](#автоматизация)
6. [Тестирование](#тестирование)
7. [Деплой](#деплой)

---

## 🏗 СТРУКТУРА ПРОЕКТА

```
NONMINE/
├── client/                    # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/       # React компоненты
│   │   ├── pages/           # Страницы приложения
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Утилиты и API клиент
│   │   └── types/           # TypeScript типы
│   └── package.json
├── server/                   # Backend (Node.js + Express)
│   ├── src/
│   │   ├── controllers/     # Контроллеры API
│   │   ├── routes/          # Маршруты API
│   │   ├── utils/           # Утилиты
│   │   ├── websocket/       # WebSocket сервер
│   │   └── index.ts         # Главный файл сервера
│   ├── prisma/              # База данных
│   │   ├── schema.prisma    # Схема БД
│   │   └── migrations/      # Миграции
│   └── package.json
└── shared/                  # Общие константы
    └── constants.ts
```

---

## ⚙️ НАСТРОЙКА ОКРУЖЕНИЯ

### 1. Переменные окружения (.env):

```bash
# База данных
DATABASE_URL="postgresql://user:password@localhost:5432/NONMINE"

# Telegram Bot
TELEGRAM_BOT_TOKEN="your_bot_token"

# Сервер
PORT=10112
NODE_ENV=development

# WebSocket
WEBSOCKET_PORT=10113

# Безопасность
JWT_SECRET="your_jwt_secret"
ENCRYPTION_KEY="your_encryption_key"
```

### 2. Установка зависимостей:

```bash
# Установка всех зависимостей
pnpm install

# Генерация Prisma клиента
cd server && npx prisma generate

# Применение миграций
npx prisma migrate dev
```

### 3. Запуск в разработке:

```bash
# Запуск сервера
cd server && pnpm dev

# Запуск клиента
cd client && pnpm dev
```

---

## 🔌 API ДОКУМЕНТАЦИЯ

### Базовый URL: `http://localhost:10112/api`

### Аутентификация:
Все API требуют валидный Telegram WebApp токен в заголовке:
```
Authorization: Bearer <telegram_webapp_token>
```

### Основные эндпоинты:

#### **Пользовательские данные:**

```typescript
// Получить данные пользователя
GET /user/:telegramId/data
Response: {
  user: {
    id: string,
    telegramId: string,
    username: string,
    firstName: string,
    wallets: Wallet[],
    miningSlots: MiningSlot[],
    referrals: User[]
  }
}

// Получить статистику
GET /user/:telegramId/stats
Response: {
  totalInvested: number,
  totalEarnings: number,
  activeSlots: number,
  referralCount: number
}
```

#### **Слоты и доходность:**

```typescript
// Получить слоты пользователя
GET /user/:telegramId/slots
Response: MiningSlot[]

// Получить доход в реальном времени
GET /user/:telegramId/real-time-income
Response: {
  totalCurrentIncome: number,
  totalProjectedIncome: number,
  slots: {
    id: string,
    principal: number,
    currentIncome: number,
    projectedIncome: number,
    isLocked: boolean,
    type: 'standard' | 'premium' | 'welcome',
    hoursUntilExpiry: number,
    rate: number
  }[],
  lastUpdated: string
}

// Купить новый слот
POST /user/:telegramId/slots/buy
Body: { amount: number }
Response: { message: string }

// Продлить слот
POST /user/:telegramId/slots/:slotId/extend
Response: { message: string }

// Апгрейдить слот
POST /user/:telegramId/slots/:slotId/upgrade
Body: { amount: number }
Response: { message: string }
```

#### **Конвертация валют:**

```typescript
// Получить текущий курс
GET /user/:telegramId/swap/rate
Response: {
  rate: number,
  baseRate: number,
  variation: number,
  lastUpdated: string
}

// Конвертировать USD в NON
POST /user/:telegramId/swap/USD-to-NON
Body: { amount: number }
Response: {
  message: string,
  USDAmount: number,
  NONAmount: number,
  rate: number
}

// Конвертировать NON в USD
POST /user/:telegramId/swap/NON-to-USD
Body: { amount: number }
Response: {
  message: string,
  USDAmount: number,
  NONAmount: number,
  rate: number
}

// История конвертаций
GET /user/:telegramId/swap/history
Response: ActivityLog[]
```

#### **Уведомления:**

```typescript
// Получить уведомления
GET /user/:telegramId/notifications
Response: Notification[]

// Отметить как прочитанное
POST /user/:telegramId/notifications/mark-read
Body: { notificationId: string }
Response: { message: string }
```

#### **Рефералы:**

```typescript
// Получить данные рефералов
GET /user/:telegramId/referrals
Response: {
  referralCode: string,
  referralCount: number
}

// Получить список рефералов
GET /user/:telegramId/referrals/list
Response: {
  id: string,
  firstName: string,
  username: string,
  avatarUrl: string,
  lastSeenAt: string,
  totalInvested: number,
  isOnline: boolean
}[]

// Получить статистику рефералов
GET /user/:telegramId/referrals/stats
Response: {
  totalReferralEarnings: number,
  activeReferralsCount: number,
  referralsByLevel: {
    l1: number,
    l2: number,
    l3: number
  }
}
```

#### **Кошелек:**

```typescript
// Депозит
POST /user/:telegramId/deposit
Body: { amount: number }
Response: { message: string }

// Вывод (заблокирован)
POST /user/:telegramId/withdraw
Body: { amount: number, address: string }
Response: { error: string } // Всегда ошибка - вывод заблокирован

// Клейм дохода
POST /user/:telegramId/claim
Response: {
  message: string,
  claimedAmount: number
}
```

### Админ API:

#### **Уведомления:**

```typescript
// Отправить уведомление
POST /admin/notifications/send
Body: {
  type: string,
  title: string,
  message: string,
  targetUsers: 'all' | string[]
}
Response: {
  message: string,
  sentCount: number
}
```

#### **Курс обмена:**

```typescript
// Получить курс
GET /admin/exchange-rate
Response: {
  rate: number,
  isActive: boolean,
  createdAt: string
}

// Установить курс
POST /admin/exchange-rate
Body: { rate: number }
Response: { message: string }
```

#### **Лотерея:**

```typescript
// Получить данные лотереи
GET /admin/lottery
Response: {
  currentJackpot: number,
  nextDraw: string,
  ticketCost: number
}

// Установить джекпот
POST /admin/lottery/set-jackpot
Body: { jackpot: number }
Response: { message: string }

// Ручной розыгрыш
POST /admin/lottery/draw
Body: { winningNumbers: string }
Response: { message: string }
```

---

## 🗄 БАЗА ДАННЫХ

### Схема Prisma:

```prisma
// Пользователи
model User {
  id                String   @id @default(cuid())
  telegramId        String   @unique
  username          String?
  firstName         String?
  lastName          String?
  avatarUrl         String?
  role              UserRole @default(USER)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  lastSeenAt        DateTime?
  referralCode      String   @unique
  referredById      String?
  totalInvested     Float    @default(0)
  lastDepositAt     DateTime?
  lastWithdrawalAt  DateTime?
  lastSlotPurchaseAt DateTime?
  captchaValidated  Boolean  @default(false)
  isSuspicious      Boolean  @default(false)
  rank              String?
  isOnline          Boolean  @default(false)
  
  // Связи
  wallets           Wallet[]
  miningSlots       MiningSlot[]
  notifications     Notification[]
  referrals         User[]   @relation("UserReferrals")
  referredBy        User?    @relation("UserReferrals")
  
  @@index([telegramId])
  @@index([createdAt])
  @@index([isOnline])
}

// Кошельки
model Wallet {
  id        String   @id @default(cuid())
  userId    String
  currency  String   // 'USD' | 'NON'
  balance   Float
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user      User     @relation(fields: [userId], references: [id])
  
  @@index([userId])
}

// Слоты
model MiningSlot {
  id                  String   @id @default(cuid())
  userId              String
  principal           Float
  startAt             DateTime @default(now())
  lastAccruedAt       DateTime
  effectiveWeeklyRate Float
  expiresAt           DateTime
  isActive            Boolean  @default(true)
  isLocked            Boolean  @default(false)
  type                String   @default("standard")
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  user                User     @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([isActive])
  @@index([expiresAt])
  @@index([isLocked])
}

// Уведомления
model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String
  title     String
  message   String
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([isRead])
}

// Курс обмена
model ExchangeRate {
  id        String   @id @default(cuid())
  rate      Float
  isActive  Boolean  @default(true)
  createdBy String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Лог активности
model ActivityLog {
  id           String          @id @default(cuid())
  userId       String
  type         ActivityLogType
  amount       Float
  description  String
  sourceUserId String?
  ipAddress    String?
  createdAt    DateTime        @default(now())
  
  user         User            @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([type])
  @@index([createdAt])
}

// Типы активности
enum ActivityLogType {
  DEPOSIT
  WITHDRAWAL
  CLAIM
  NEW_SLOT_PURCHASE
  SLOT_EXTENSION
  REFERRAL_SIGNUP_BONUS
  REFERRAL_COMMISSION
  REFERRAL_DEPOSIT_BONUS
  TASK_REWARD
  DAILY_BONUS
  WELCOME_BONUS
  REINVESTMENT
  LEADERBOARD_BONUS
  INVESTMENT_GROWTH_BONUS
  DIVIDEND_BONUS
  REFERRAL_3_IN_3_DAYS_BONUS
  BALANCE_ZEROED_PENALTY
  BALANCE_FROZEN_PENALTY
  LOTTERY_TICKET_PURCHASE
  LOTTERY_WIN
  SWAP_USD_TO_NON
  EXCHANGE_RATE_CHANGE
  ADMIN_LOTTERY_WIN
}

// Роли пользователей
enum UserRole {
  USER
  ADMIN
  MANAGER
  STAFF
}
```

### Миграции:

```bash
# Создать новую миграцию
npx prisma migrate dev --name migration_name

# Применить миграции
npx prisma migrate deploy

# Сбросить базу данных
npx prisma migrate reset
```

---

## ⚙️ АВТОМАТИЗАЦИЯ

### Процессор слотов:

```typescript
// server/src/utils/slotProcessor.ts
import { processExpiredSlots } from '../controllers/slotController.js';

// Запуск каждые 5 минут
setInterval(async () => {
  await processExpiredSlots();
}, 5 * 60 * 1000);

console.log('Slot processor started - checking every 5 minutes');
```

### Логика обработки:

```typescript
export const processExpiredSlots = async () => {
  try {
    const now = new Date();
    const expiredSlots = await prisma.miningSlot.findMany({
      where: {
        isActive: true,
        expiresAt: { lte: now }
      },
      include: {
        user: {
          include: { wallets: true }
        }
      }
    });

    for (const slot of expiredSlots) {
      // Расчет дохода
      const timeElapsedMs = now.getTime() - slot.lastAccruedAt.getTime();
      const finalEarnings = slot.principal * slot.effectiveWeeklyRate * 
        (timeElapsedMs / (7 * 24 * 60 * 60 * 1000));
      
      // Обновление баланса
      const USDWallet = slot.user.wallets.find(w => w.currency === 'USD');
      if (USDWallet) {
        await prisma.$transaction([
          prisma.wallet.update({
            where: { id: USDWallet.id },
            data: { balance: { increment: finalEarnings } }
          }),
          prisma.miningSlot.update({
            where: { id: slot.id },
            data: { isActive: false }
          }),
          prisma.activityLog.create({
            data: {
              userId: slot.userId,
              type: ActivityLogType.CLAIM,
              amount: finalEarnings,
              description: `Automatic slot closure - earned ${finalEarnings.toFixed(4)} USD`
            }
          })
        ]);
        
        // Отправка уведомления
        await sendSlotClosedNotification(slot.userId, slot.id, finalEarnings);
      }
    }
  } catch (error) {
    console.error('Error processing expired slots:', error);
  }
};
```

---

## 🧪 ТЕСТИРОВАНИЕ

### Unit тесты:

```typescript
// server/src/__tests__/slotController.test.ts
import { describe, it, expect, vi } from 'vitest';
import { buyNewSlot } from '../controllers/slotController.js';

describe('Slot Controller', () => {
  it('should create a standard slot for amount < 100', async () => {
    const req = {
      params: { telegramId: '123' },
      body: { amount: 50 }
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    
    await buyNewSlot(req as any, res as any);
    
    expect(res.status).toHaveBeenCalledWith(201);
  });
  
  it('should create a premium slot for amount >= 100', async () => {
    const req = {
      params: { telegramId: '123' },
      body: { amount: 150 }
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    
    await buyNewSlot(req as any, res as any);
    
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
```

### Интеграционные тесты:

```typescript
// server/src/__tests__/integration/api.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';

describe('API Integration Tests', () => {
  it('should get user data', async () => {
    const response = await request(app)
      .get('/api/user/123/data')
      .expect(200);
    
    expect(response.body.user).toBeDefined();
    expect(response.body.user.telegramId).toBe('123');
  });
  
  it('should buy a slot', async () => {
    const response = await request(app)
      .post('/api/user/123/slots/buy')
      .send({ amount: 10 })
      .expect(201);
    
    expect(response.body.message).toContain('Slot purchased');
  });
});
```

### Запуск тестов:

```bash
# Unit тесты
npm run test

# Интеграционные тесты
npm run test:integration

# E2E тесты
npm run test:e2e
```

---

## 🚀 ДЕПЛОЙ

### 1. Подготовка к продакшену:

```bash
# Сборка клиента
cd client && npm run build

# Сборка сервера
cd server && npm run build

# Применение миграций
npx prisma migrate deploy
```

### 2. Переменные окружения для продакшена:

```bash
# .env (based on env.example)
DATABASE_URL="postgresql://user:password@prod-db:5432/NONMINE"
NODE_ENV=production
PORT=10112
TELEGRAM_BOT_TOKEN="production_bot_token"
JWT_SECRET="production_jwt_secret"
```

### 3. Docker конфигурация:

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 10112

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "10112:10112"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=NONMINE
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 4. Мониторинг:

```typescript
// server/src/monitoring/healthCheck.ts
export const healthCheck = async (req: Request, res: Response) => {
  try {
    // Проверка базы данных
    await prisma.$queryRaw`SELECT 1`;
    
    // Проверка WebSocket
    const wsStatus = WebSocketServer.getStatus();
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      websocket: wsStatus,
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
};
```

---

## 📊 МОНИТОРИНГ И ЛОГИРОВАНИЕ

### Логирование:

```typescript
// server/src/utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console()
  ]
});

export default logger;
```

### Метрики:

```typescript
// server/src/utils/metrics.ts
export const metrics = {
  totalUsers: 0,
  activeSlots: 0,
  totalInvestments: 0,
  conversions: 0,
  notifications: 0
};

export const updateMetrics = async () => {
  metrics.totalUsers = await prisma.user.count();
  metrics.activeSlots = await prisma.miningSlot.count({
    where: { isActive: true }
  });
  metrics.totalInvestments = await prisma.activityLog.aggregate({
    where: { type: 'NEW_SLOT_PURCHASE' },
    _sum: { amount: true }
  });
};
```

---

## 🔒 БЕЗОПАСНОСТЬ

### Валидация данных:

```typescript
// server/src/utils/validation.ts
export const validateAmount = (amount: any): boolean => {
  return typeof amount === 'number' && amount > 0 && amount <= 1000000;
};

export const validateAddress = (address: string): boolean => {
  return /^[A-Za-z0-9]{34}$/.test(address);
};

export const sanitizeInput = (input: string): string => {
  return input.replace(/[<>]/g, '').trim();
};
```

### Rate limiting:

```typescript
// server/src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов
  message: 'Too many requests from this IP'
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // максимум 5 попыток входа
  message: 'Too many authentication attempts'
});
```

### CORS настройки:

```typescript
// server/src/index.ts
import cors from 'cors';

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

---

## 📈 ОПТИМИЗАЦИЯ ПРОИЗВОДИТЕЛЬНОСТИ

### Кэширование:

```typescript
// server/src/utils/cache.ts
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 }); // 10 минут

export const getCachedData = async (key: string, fetchFn: () => Promise<any>) => {
  const cached = cache.get(key);
  if (cached) return cached;
  
  const data = await fetchFn();
  cache.set(key, data);
  return data;
};
```

### Оптимизация запросов:

```typescript
// server/src/utils/dbSelects.ts
export const userSelect = {
  id: true,
  telegramId: true,
  username: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
  totalInvested: true,
  rank: true,
  isOnline: true,
  wallets: {
    select: {
      id: true,
      currency: true,
      balance: true
    }
  },
  miningSlots: {
    where: { isActive: true },
    select: {
      id: true,
      principal: true,
      effectiveWeeklyRate: true,
      lastAccruedAt: true,
      expiresAt: true,
      isLocked: true,
      type: true
    }
  }
};
```

---

## 🎯 ЗАКЛЮЧЕНИЕ

Данное техническое руководство содержит всю необходимую информацию для:

- **Разработки** новых функций
- **Тестирования** системы
- **Деплоя** в продакшен
- **Мониторинга** и поддержки
- **Оптимизации** производительности

Все компоненты системы интегрированы и готовы к использованию в продакшене.


