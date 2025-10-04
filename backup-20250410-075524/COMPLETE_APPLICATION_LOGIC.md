# 🚀 ПОЛНАЯ ЛОГИКА ПРИЛОЖЕНИЯ MNEMINE

## 📋 ОГЛАВЛЕНИЕ
1. [Общая архитектура](#общая-архитектура)
2. [Логика регистрации пользователя](#логика-регистрации-пользователя)
3. [Система слотов и доходности](#система-слотов-и-доходности)
4. [Конвертация валют](#конвертация-валют)
5. [Реферальная система](#реферальная-система)
6. [Система уведомлений](#система-уведомлений)
7. [Лотерея](#лотерея)
8. [Админ панель](#админ-панель)
9. [API Endpoints](#api-endpoints)
10. [База данных](#база-данных)
11. [Автоматизация](#автоматизация)

---

## 🏗 ОБЩАЯ АРХИТЕКТУРА

### Компоненты системы:
- **Frontend:** React + TypeScript (клиентская часть)
- **Backend:** Node.js + Express + TypeScript
- **База данных:** PostgreSQL + Prisma ORM
- **WebSocket:** Реальное время обновлений
- **Автоматизация:** Cron jobs для обработки слотов

### Основные валюты:
- **CFM:** Основная валюта приложения
- **CFMT:** Внешняя валюта для вывода

---

## 👤 ЛОГИКА РЕГИСТРАЦИИ ПОЛЬЗОВАТЕЛЯ

### При первом входе:

1. **Получение данных из Telegram:**
   ```typescript
   // Данные от Telegram WebApp
   {
     id: "123456789",
     first_name: "Иван",
     username: "ivan_user",
     photo_url: "https://..."
   }
   ```

2. **Создание пользователя:**
   ```typescript
   // Автоматически создается:
   - CFM кошелек с балансом 0
   - Заблокированный слот на 3 CFM
   - Уникальный реферальный код
   - Связь с реферером (если есть)
   ```

3. **Приветственный слот:**
   ```typescript
   {
     principal: 3.0,           // 3 CFM автоматически инвестируется
     effectiveWeeklyRate: 0.3, // 30% доходность
     expiresAt: +7 дней,       // Срок действия
     isLocked: true,          // Заблокирован для клейма
     type: 'welcome'          // Тип приветственного слота
   }
   ```

4. **Реферальные бонусы:**
   - Если есть реферер → реферер получает 3 CFM
   - Если реферер делает первый депозит → +1 CFM бонус

### Результат регистрации:
- **Баланс:** 0 CFM (все в слоте)
- **Слот:** 3 CFM заблокированы на 7 дней
- **Доход через 7 дней:** 3.9 CFM (3 + 0.9)
- **Статус:** Может покупать новые слоты, но не может клеймить приветственный

---

## 💰 СИСТЕМА СЛОТОВ И ДОХОДНОСТИ

### Типы слотов:

#### 1. **Стандартный слот (до 100 CFM):**
```typescript
{
  type: 'standard',
  rate: 30%,           // 30% в неделю
  minInvestment: 3 CFM,
  duration: 7 дней,
  isLocked: false     // Можно клеймить в любое время
}
```

#### 2. **Премиум слот (100+ CFM):**
```typescript
{
  type: 'premium',
  rate: 35%,           // 35% в неделю
  minInvestment: 100 CFM,
  duration: 7 дней,
  isLocked: false     // Можно клеймить в любое время
}
```

#### 3. **Приветственный слот:**
```typescript
{
  type: 'welcome',
  rate: 30%,           // 30% в неделю
  principal: 3 CFM,
  duration: 7 дней,
  isLocked: true      // НЕЛЬЗЯ клеймить до истечения
}
```

### Логика расчета дохода:

```typescript
// Формула расчета дохода
const timeElapsedMs = now.getTime() - slot.lastAccruedAt.getTime();
const earnings = slot.principal * slot.effectiveWeeklyRate * (timeElapsedMs / (7 * 24 * 60 * 60 * 1000));

// Примеры:
// 10 CFM, 30%, 1 день = 10 * 0.3 * (1/7) = 0.43 CFM
// 10 CFM, 30%, 7 дней = 10 * 0.3 = 3.0 CFM
// 100 CFM, 35%, 7 дней = 100 * 0.35 = 35.0 CFM
```

### Ограничения:
- **Максимум 5 слотов в день** на пользователя
- **Минимум 3 CFM** для покупки слота
- **Заблокированные слоты** нельзя клеймить до истечения

---

## 🔄 КОНВЕРТАЦИЯ ВАЛЮТ

### Логика курса обмена:

1. **Базовый курс** устанавливается админом в админ панели
2. **Случайное отклонение** от 0% до 5% для каждого запроса
3. **Одинаковый курс** для всех пользователей в момент запроса

```typescript
// Алгоритм расчета курса
const baseRate = await getAdminSetRate(); // Из базы данных
const variation = Math.random() * 0.05;  // 0-5% отклонение
const currentRate = baseRate * (1 + variation);
```

### API конвертации:

#### **CFM → CFMT:**
```typescript
POST /api/user/:telegramId/swap/cfm-to-cfmt
{
  "amount": 10.0  // Минимум 1 CFM
}

// Ответ:
{
  "message": "Successfully converted 10.0 CFM to 9.5 CFMT",
  "cfmAmount": -10.0,
  "cfmtAmount": 9.5,
  "rate": 0.95
}
```

#### **CFMT → CFM:**
```typescript
POST /api/user/:telegramId/swap/cfmt-to-cfm
{
  "amount": 9.5  // Минимум 1 CFMT
}

// Ответ:
{
  "message": "Successfully converted 9.5 CFMT to 10.0 CFM",
  "cfmAmount": 10.0,
  "cfmtAmount": -9.5,
  "rate": 0.95
}
```

### Ограничения конвертации:
- **Минимальная сумма:** 1 CFM или 1 CFMT
- **Без комиссии:** конвертация в обе стороны
- **История:** все транзакции сохраняются
- **Курс:** обновляется каждые несколько секунд

---

## 👥 РЕФЕРАЛЬНАЯ СИСТЕМА

### Структура рефералов:

```
Пользователь A (реферер)
├── Пользователь B (L1 реферал) - 25% от депозитов
│   └── Пользователь C (L2 реферал) - 15% от депозитов
└── Пользователь D (L1 реферал) - 25% от депозитов
```

### Проценты комиссий:

```typescript
const REFERRAL_COMMISSIONS = {
  L1: 0.25,  // 25% для прямых рефералов
  L2: 0.15   // 15% для рефералов рефералов
};
```

### Логика выплат:

1. **При депозите реферала:**
   ```typescript
   // Пример: реферал депонировал 100 CFM
   const l1Commission = 100 * 0.25; // 25 CFM рефереру
   const l2Commission = 100 * 0.15; // 15 CFM рефереру реферера
   ```

2. **Ограничение дохода:**
   ```typescript
   // Реферальный доход не может превышать текущий баланс реферера
   if (REFERRAL_INCOME_CAP_ENABLED) {
     commissionAmount = Math.min(commissionAmount, referrerBalance);
   }
   ```

3. **Бонусы:**
   - **За регистрацию реферала:** 3 CFM
   - **За первый депозит реферала:** 1 CFM
   - **За 3 рефералов за 3 дня:** 1 CFM

### Требования для вывода:
- **3 активных реферала** ИЛИ
- **Депозит 5+ CFM** реальными деньгами

---

## 📱 СИСТЕМА УВЕДОМЛЕНИЙ

### Типы уведомлений:

```typescript
const NOTIFICATION_TYPES = {
  SLOT_EXPIRED: 'SLOT_EXPIRED',           // Слот истек
  SLOT_AUTO_CLOSED: 'SLOT_AUTO_CLOSED',   // Слот автоматически закрыт
  ADMIN_MESSAGE: 'ADMIN_MESSAGE',         // Сообщение от админа
  LOTTERY_WIN: 'LOTTERY_WIN',             // Выигрыш в лотерее
  REFERRAL_JOINED: 'REFERRAL_JOINED'      // Новый реферал
};
```

### Автоматические уведомления:

1. **При закрытии слота:**
   ```typescript
   {
     type: 'SLOT_AUTO_CLOSED',
     title: 'Slot Automatically Closed',
     message: 'Your mining slot has been automatically closed. You earned 0.9 CFM.',
     isRead: false
   }
   ```

2. **При новом реферале:**
   ```typescript
   {
     type: 'REFERRAL_JOINED',
     title: 'New Referral Joined',
     message: 'John joined using your referral link!',
     isRead: false
   }
   ```

### Админ уведомления:

```typescript
POST /api/admin/notifications/send
{
  "type": "ADMIN_MESSAGE",
  "title": "Important Update",
  "message": "New features are now available!",
  "targetUsers": "all"  // или массив ID пользователей
}
```

---

## 🎲 ЛОТЕРЕЯ

### Логика лотереи:

1. **Стоимость билета:** 1 CFM
2. **Розыгрыш:** каждые 24 часа
3. **Джекпот:** настраивается админом
4. **Распределение призов:**
   ```typescript
   const PRIZE_DISTRIBUTION = {
     MATCH_6: 0.70,  // 70% джекпота
     MATCH_5: 0.20,  // 20% джекпота
     MATCH_4: 0.10   // 10% джекпота
   };
   ```

### Админ управление:

```typescript
// Установка джекпота
POST /api/admin/lottery/set-jackpot
{
  "jackpot": 670.0  // 670 CFM джекпот
}

// Ручной розыгрыш
POST /api/admin/lottery/draw
{
  "winningNumbers": "1,2,3,4,5,6"
}
```

### Фиктивные данные:
- **Предыдущие выигрыши** с фальшивыми именами
- **Статистика** для создания доверия
- **История розыгрышей** для реалистичности

---

## 🛠 АДМИН ПАНЕЛЬ

### Управление курсом обмена:

```typescript
// Установка базового курса
POST /api/admin/exchange-rate
{
  "rate": 0.95,        // 1 CFM = 0.95 CFMT
  "isActive": true
}

// Настройка вариации
POST /api/admin/exchange-settings
{
  "variationMin": 0.0,   // Минимальное отклонение 0%
  "variationMax": 0.05    // Максимальное отклонение 5%
}
```

### Статистика:

1. **Общая статистика:**
   - Количество пользователей
   - Общий объем инвестиций
   - Активные слоты
   - Конвертации валют

2. **Детальная аналитика:**
   - Доходность по типам слотов
   - Реферальная активность
   - История транзакций
   - Автоматические закрытия

3. **Мониторинг:**
   - Заблокированные слоты
   - Ожидающие закрытия
   - Уведомления пользователям
   - Ошибки системы

### Управление пользователями:

```typescript
// Отправка уведомления всем
POST /api/admin/notifications/send
{
  "type": "ADMIN_MESSAGE",
  "title": "System Maintenance",
  "message": "The system will be under maintenance from 2-4 AM",
  "targetUsers": "all"
}

// Отправка конкретному пользователю
POST /api/admin/notifications/send
{
  "type": "ADMIN_MESSAGE",
  "title": "Welcome Bonus",
  "message": "You received a special bonus!",
  "targetUsers": ["user_id_1", "user_id_2"]
}
```

---

## 🔌 API ENDPOINTS

### Пользовательские API:

#### **Данные пользователя:**
```
GET  /api/user/:telegramId/data              - Основные данные
GET  /api/user/:telegramId/stats             - Статистика пользователя
GET  /api/user/:telegramId/activity         - История активности
```

#### **Кошелек:**
```
POST /api/user/:telegramId/deposit           - Депозит CFM
POST /api/user/:telegramId/withdraw          - Вывод CFM (заблокирован)
POST /api/user/:telegramId/claim             - Клейм дохода
```

#### **Слоты:**
```
GET  /api/user/:telegramId/slots             - Список слотов
GET  /api/user/:telegramId/real-time-income  - Доход в реальном времени
POST /api/user/:telegramId/slots/buy         - Покупка слота
POST /api/user/:telegramId/slots/:id/extend  - Продление слота
POST /api/user/:telegramId/slots/:id/upgrade - Апгрейд слота
```

#### **Конвертация:**
```
GET  /api/user/:telegramId/swap/rate         - Текущий курс
POST /api/user/:telegramId/swap/cfm-to-cfmt  - CFM → CFMT
POST /api/user/:telegramId/swap/cfmt-to-cfm  - CFMT → CFM
GET  /api/user/:telegramId/swap/history      - История конвертаций
```

#### **Уведомления:**
```
GET  /api/user/:telegramId/notifications    - Список уведомлений
POST /api/user/:telegramId/notifications/mark-read - Отметить как прочитанное
```

#### **Рефералы:**
```
GET  /api/user/:telegramId/referrals        - Данные рефералов
GET  /api/user/:telegramId/referrals/list   - Список рефералов
GET  /api/user/:telegramId/referrals/stats  - Статистика рефералов
```

### Админ API:

#### **Уведомления:**
```
POST /api/admin/notifications/send           - Отправить уведомление
```

#### **Курс обмена:**
```
GET  /api/admin/exchange-rate                - Получить курс
POST /api/admin/exchange-rate                - Установить курс
```

#### **Лотерея:**
```
GET  /api/admin/lottery                      - Данные лотереи
POST /api/admin/lottery/set-jackpot          - Установить джекпот
POST /api/admin/lottery/draw                  - Ручной розыгрыш
```

---

## 🗄 БАЗА ДАННЫХ

### Основные таблицы:

#### **User (Пользователи):**
```sql
- id: String (PK)
- telegramId: String (UNIQUE)
- username: String
- firstName: String
- lastName: String
- avatarUrl: String
- referralCode: String (UNIQUE)
- referredById: String (FK)
- totalInvested: Float
- rank: String
- isOnline: Boolean
- createdAt: DateTime
- lastSeenAt: DateTime
```

#### **Wallet (Кошельки):**
```sql
- id: String (PK)
- userId: String (FK)
- currency: String ('CFM' | 'CFMT')
- balance: Float
- createdAt: DateTime
- updatedAt: DateTime
```

#### **MiningSlot (Слоты):**
```sql
- id: String (PK)
- userId: String (FK)
- principal: Float
- effectiveWeeklyRate: Float
- startAt: DateTime
- lastAccruedAt: DateTime
- expiresAt: DateTime
- isActive: Boolean
- isLocked: Boolean
- type: String ('standard' | 'premium' | 'welcome')
- createdAt: DateTime
- updatedAt: DateTime
```

#### **Notification (Уведомления):**
```sql
- id: String (PK)
- userId: String (FK)
- type: String
- title: String
- message: String
- isRead: Boolean
- createdAt: DateTime
```

#### **ExchangeRate (Курс обмена):**
```sql
- id: String (PK)
- rate: Float
- isActive: Boolean
- createdBy: String
- createdAt: DateTime
- updatedAt: DateTime
```

#### **ActivityLog (Лог активности):**
```sql
- id: String (PK)
- userId: String (FK)
- type: ActivityLogType
- amount: Float
- description: String
- sourceUserId: String
- ipAddress: String
- createdAt: DateTime
```

### Индексы для оптимизации:
```sql
-- Пользователи
INDEX(telegramId)
INDEX(createdAt)
INDEX(isOnline)

-- Слоты
INDEX(userId, isActive)
INDEX(expiresAt)
INDEX(isLocked)

-- Уведомления
INDEX(userId, isRead)
INDEX(createdAt)

-- Активность
INDEX(userId, type)
INDEX(createdAt)
```

---

## ⚙️ АВТОМАТИЗАЦИЯ

### Процессор слотов (каждые 5 минут):

```typescript
// Функция processExpiredSlots()
1. Найти все активные слоты с истекшим сроком
2. Рассчитать финальный доход для каждого слота
3. Добавить доход к балансу пользователя
4. Деактивировать слот
5. Создать запись в ActivityLog
6. Отправить уведомление пользователю
```

### Логика автоматического закрытия:

```typescript
for (const slot of expiredSlots) {
  // Расчет дохода
  const timeElapsedMs = now.getTime() - slot.lastAccruedAt.getTime();
  const finalEarnings = slot.principal * slot.effectiveWeeklyRate * 
    (timeElapsedMs / (7 * 24 * 60 * 60 * 1000));
  
  // Обновление баланса
  await prisma.wallet.update({
    where: { id: cfmWallet.id },
    data: { balance: { increment: finalEarnings } }
  });
  
  // Деактивация слота
  await prisma.miningSlot.update({
    where: { id: slot.id },
    data: { isActive: false }
  });
  
  // Уведомление
  await sendSlotClosedNotification(slot.userId, slot.id, finalEarnings);
}
```

### Мониторинг системы:

1. **Проверка здоровья:** каждые 30 секунд
2. **Обработка слотов:** каждые 5 минут
3. **Обновление курса:** при каждом запросе
4. **Логирование:** всех операций

---

## 🎯 КЛЮЧЕВЫЕ ОСОБЕННОСТИ

### 1. **Безопасность:**
- Валидация всех входных данных
- Защита от SQL инъекций
- Ограничение частоты запросов
- Логирование всех действий

### 2. **Производительность:**
- Индексы для быстрого поиска
- Кэширование часто используемых данных
- Оптимизированные запросы к БД
- Асинхронная обработка

### 3. **Масштабируемость:**
- Модульная архитектура
- Разделение ответственности
- Горизонтальное масштабирование
- Микросервисная готовность

### 4. **Пользовательский опыт:**
- Реальное время обновлений
- Интуитивный интерфейс
- Детальная информация
- Мгновенные уведомления

### 5. **Админ контроль:**
- Полная аналитика
- Гибкие настройки
- Массовые операции
- Мониторинг в реальном времени

---

## 📊 ПРИМЕРЫ РАБОТЫ

### Сценарий 1: Новый пользователь

1. **Регистрация:** Получает 3 CFM в заблокированном слоте
2. **Через 7 дней:** Слот автоматически закрывается, получает 3.9 CFM
3. **Инвестирование:** Может купить новые слоты от 3 CFM
4. **Конвертация:** Может обменять CFM на CFMT для вывода
5. **Вывод:** Нужны 3 реферала или депозит 5+ CFM

### Сценарий 2: Активный инвестор

1. **Инвестиции:** 100 CFM в премиум слот (35% доходность)
2. **Доход:** 35 CFM за 7 дней
3. **Рефералы:** Получает 25% от депозитов L1, 15% от L2
4. **Конвертация:** Обменивает часть на CFMT для вывода
5. **Лотерея:** Покупает билеты за 1 CFM

### Сценарий 3: Админ управление

1. **Настройка курса:** Устанавливает базовый курс 0.95
2. **Вариация:** Настраивает отклонение 0-5%
3. **Уведомления:** Отправляет сообщения пользователям
4. **Лотерея:** Устанавливает джекпот 670 CFM
5. **Мониторинг:** Отслеживает все операции

---

## 🔧 ТЕХНИЧЕСКИЕ ДЕТАЛИ

### Константы системы:

```typescript
// Доходность слотов
BASE_STANDARD_SLOT_WEEKLY_RATE = 0.3    // 30%
PREMIUM_SLOT_WEEKLY_RATE = 0.35         // 35%
PREMIUM_SLOT_THRESHOLD = 100.0          // 100 CFM

// Реферальные проценты
REFERRAL_COMMISSIONS_L1 = 0.25          // 25%
REFERRAL_COMMISSIONS_L2 = 0.15          // 15%

// Ограничения
MINIMUM_SLOT_INVESTMENT = 3.0           // 3 CFM
MINIMUM_CONVERSION_AMOUNT = 1.0         // 1 CFM/CFMT
MINIMUM_WITHDRAWAL_CFMT = 3.0           // 3 CFMT
SLOT_PURCHASE_DAILY_LIMIT = 5           // 5 слотов в день

// Курс обмена
EXCHANGE_RATE_VARIATION_MIN = 0.0       // 0%
EXCHANGE_RATE_VARIATION_MAX = 0.05      // 5%
```

### Обработка ошибок:

```typescript
// Стандартная обработка ошибок
try {
  // Логика операции
  res.status(200).json({ success: true, data: result });
} catch (error) {
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal server error' });
}
```

### Логирование:

```typescript
// Все операции логируются
await prisma.activityLog.create({
  data: {
    userId: user.id,
    type: ActivityLogType.OPERATION_TYPE,
    amount: amount,
    description: 'Описание операции',
    ipAddress: req.ip
  }
});
```

---

## 🚀 ЗАКЛЮЧЕНИЕ

Данная система представляет собой полнофункциональную платформу для финансового симулирования с:

- **Автоматизированными процессами** (слоты, уведомления, курсы)
- **Гибкой системой доходности** (разные типы слотов)
- **Полной реферальной программой** (2 уровня, ограничения)
- **Системой конвертации валют** (CFM ↔ CFMT)
- **Админ панелью** (управление, статистика, уведомления)
- **Безопасностью и производительностью**

Все компоненты интегрированы и работают как единая экосистема, обеспечивая пользователям простой и понятный интерфейс, а администраторам - полный контроль над системой.
