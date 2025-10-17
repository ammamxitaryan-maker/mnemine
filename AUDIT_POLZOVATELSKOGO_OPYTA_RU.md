# Аудит пользовательского опыта и механики заработка FastMine

## Что видит пользователь на главной странице

### 1. Заголовок и информация о пользователе
```
┌─────────────────────────────────────────┐
│ [Имя пользователя]              [🌐][🌙][👤] │
│ ● 150 online  ● 1,250 users            │
└─────────────────────────────────────────┘
```

**Элементы:**
- Имя пользователя (firstName или username)
- Переключатель языка (LanguageSwitcher)
- Переключатель темы (ThemeSwitcher)
- Аватар пользователя
- Статистика онлайн пользователей (имитация)

### 2. Основной баланс (MainBalanceDisplay)
```
┌─────────────────────────────────────────┐
│           💰 Available Balance          │
│           1.234567 MNE                  │
│           ≈ $0.12 USD                   │
│                                         │
│  ⚡ Live Earnings          ● Live       │
│  +0.000123 MNE                          │
│  ≈ +$0.01 USD                           │
│                                         │
│  🪙 Total Balance: 5.123456 MNE         │
│     ≈ $0.51 USD                         │
│                                         │
│  📈 Invested in Slots: 3.888889 MNE     │
│     2 active slots                      │
└─────────────────────────────────────────┘
```

**Ключевые элементы:**
- **Доступный баланс** - MNE не инвестированные в слоты
- **Live Earnings** - доход в реальном времени с анимацией
- **Общий баланс** - все MNE пользователя
- **Инвестировано в слоты** - заблокированные MNE

### 3. Быстрые действия (QuickActions)
```
┌─────────────┬─────────────┬─────────────┐
│    🖥️       │    🎫       │    ↔️       │
│ Mining Slots│ Daily       │ Exchange    │
│ 2 active    │ Lottery     │             │
│             │ Jackpot     │             │
└─────────────┴─────────────┴─────────────┘
```

**Действия:**
- **Mining Slots** - покупка и управление слотами
- **Daily Lottery** - участие в лотерее
- **Exchange** - обмен валют

### 4. Секция рефералов
```
┌─────────────────────────────────────────┐
│ 👥 Invite Friends              ▶        │
│ Earn from referrals                    │
└─────────────────────────────────────────┘
```

### 5. Действия с кошельком
```
┌─────────────┬─────────────┬─────────────┐
│    ⬇️       │    ⬆️       │    📜       │
│ Deposit     │ Withdraw    │ History     │
│ Add funds   │ Cash out    │ Transactions│
└─────────────┴─────────────┴─────────────┘
```

### 6. Статистика (SimpleStats)
```
┌─────────────────────────────────────────┐
│    30.0%        │        2              │
│ Mining Power    │ Active Slots          │
│                                         │
│ ─────────────────────────────────────── │
│           +40.0%                        │
│    Referral Income                      │
│    2 active referrals                   │
└─────────────────────────────────────────┘
```

## Механика заработка для клиента

### 1. Система майнинг-слотов

#### Принцип работы:
- **Инвестиция**: Пользователь покупает слот за MNE
- **Длительность**: 7 дней (168 часов)
- **Доходность**: 30% от суммы инвестиции
- **Алгоритм**: `Доход = Сумма × 30% × (Время_прошло / 7_дней)`

#### Пример расчета:
```
Инвестиция: 100 MNE
Время: 7 дней
Доход: 100 × 0.30 = 30 MNE
Итого: 130 MNE (100 + 30)
```

#### Покупка слота:
```typescript
// POST /api/user/:telegramId/slots/buy
{
  "amount": 100.0  // MNE для инвестиции
}

// Результат:
- Создается слот на 7 дней
- MNE блокируются в слоте
- Начинается начисление дохода
```

### 2. Алгоритм показа дохода в реальном времени

#### Frontend расчет (globalEarningsManager):
```typescript
// Формула расчета дохода в секунду
perSecondRate = (principal × 0.30) / (7 × 24 × 60 × 60)

// Обновление каждую секунду
totalEarnings += perSecondRate × timeElapsedSeconds
```

#### Backend синхронизация:
```typescript
// GET /api/user/:telegramId/real-time-income
// Синхронизация каждые 30 секунд
const serverEarnings = calculateServerEarnings(slots);
const clientEarnings = calculateClientEarnings(slots);
// Используется серверное значение как база
```

#### Визуализация:
- **Анимация**: мигающий значок ⚡
- **Обновление**: каждую секунду
- **Синхронизация**: каждые 30 секунд с сервером
- **Кэширование**: localStorage для офлайн работы

### 3. Система рефералов

#### Уровни рефералов:
- **L1 (Прямые)**: 25% от дохода реферала
- **L2 (Второй уровень)**: 15% от дохода реферала

#### Расчет реферального дохода:
```typescript
const l1Percentage = (l1Referrals × 25);
const l2Percentage = (l2Referrals × 15);
const totalReferralIncome = l1Percentage + l2Percentage;
```

### 4. Автоматическое закрытие слотов

#### Процесс:
1. **Мониторинг**: каждые 5 минут проверка истекших слотов
2. **Расчет**: финальный доход = 30% от инвестиции
3. **Выплата**: MNE возвращаются на баланс пользователя
4. **Уведомление**: отправка уведомления о завершении

#### Код обработки:
```typescript
// SlotExpirationProcessor
const finalEarnings = slot.principal * 0.30;
await prisma.wallet.update({
  where: { id: MNEWallet.id },
  data: { balance: { increment: finalEarnings } }
});
```

## Алгоритм показа дохода в реальном времени

### 1. Архитектура системы

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│                 │    │                 │    │                 │
│ globalEarnings  │◄──►│ SlotEarnings    │◄──►│ MiningSlots     │
│ Manager         │    │ Service         │    │                 │
│                 │    │                 │    │                 │
│ - Расчет в      │    │ - Синхронизация │    │ - Хранение      │
│   реальном      │    │ - Валидация     │    │   данных        │
│   времени       │    │ - Обработка     │    │ - Транзакции    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 2. Детальный алгоритм

#### Шаг 1: Инициализация
```typescript
// При загрузке страницы
const slots = await fetchUserSlots(telegramId);
const serverEarnings = await fetchServerEarnings(telegramId);

// Инициализация менеджера
globalEarningsManager.updateSlotsData(telegramId, slots, serverEarnings);
```

#### Шаг 2: Расчет дохода в секунду
```typescript
// Для каждого активного слота
const perSecondRate = (slot.principal × 0.30) / (7 × 24 × 60 × 60);

// Общий доход в секунду
const totalPerSecondRate = slots.reduce((sum, slot) => 
  sum + slot.perSecondRate, 0
);
```

#### Шаг 3: Обновление в реальном времени
```typescript
// Каждую секунду
setInterval(() => {
  const timeElapsed = (Date.now() - lastUpdateTime) / 1000;
  const accumulatedEarnings = perSecondRate × timeElapsed;
  
  totalEarnings += accumulatedEarnings;
  lastUpdateTime = Date.now();
  
  // Обновление UI
  updateDisplay(totalEarnings);
}, 1000);
```

#### Шаг 4: Синхронизация с сервером
```typescript
// Каждые 30 секунд
setInterval(async () => {
  const serverEarnings = await fetchServerEarnings();
  const clientEarnings = calculateClientEarnings();
  
  // Синхронизация с сервером
  if (Math.abs(serverEarnings - clientEarnings) > threshold) {
    totalEarnings = serverEarnings;
  }
}, 30000);
```

### 3. Обработка ошибок и восстановление

#### Кэширование в localStorage:
```typescript
// Сохранение состояния
localStorage.setItem('globalPersistentEarnings', JSON.stringify({
  totalEarnings,
  perSecondRate,
  lastUpdateTime,
  serverSyncTime
}));

// Восстановление при загрузке
const saved = localStorage.getItem('globalPersistentEarnings');
if (saved) {
  const timeElapsed = (Date.now() - saved.lastUpdateTime) / 1000;
  const accumulatedEarnings = saved.perSecondRate × timeElapsed;
  totalEarnings = saved.totalEarnings + accumulatedEarnings;
}
```

#### Валидация данных:
```typescript
// Проверка корректности расчета
const maxEarnings = slot.principal × 0.30;
const actualEarnings = Math.min(calculatedEarnings, maxEarnings);

// Проверка времени
if (slot.expiresAt < Date.now()) {
  slot.isActive = false;
}
```

## Пользовательский опыт

### 1. Визуальные индикаторы

#### Live Earnings:
- **Анимация**: мигающий значок ⚡
- **Цвет**: акцентный цвет (обычно зеленый)
- **Обновление**: плавное изменение чисел
- **Статус**: "Live" с точкой

#### Статистика:
- **Mining Power**: фиксированное значение 30.0%
- **Active Slots**: количество активных слотов
- **Referral Income**: процент от рефералов

### 2. Интерактивность

#### Haptic Feedback:
```typescript
// При нажатии на кнопки
onClick={() => hapticLight()}

// При ошибках
onError={() => hapticWarning()}
```

#### Анимации:
```css
/* Hover эффекты */
.hover:scale-105 .active:scale-95 .transition-all .duration-200

/* Анимация загрузки */
.animate-spin .animate-pulse
```

### 3. Адаптивность

#### Мобильная оптимизация:
- Минималистичный дизайн
- Крупные кнопки для касания
- Оптимизированная прокрутка
- Telegram Web App интеграция

#### Производительность:
- Ленивая загрузка компонентов
- Кэширование данных
- Оптимизированные запросы
- WebSocket для реального времени

## Заключение

### Сильные стороны:
1. **Прозрачность**: четкий алгоритм расчета дохода
2. **Реальное время**: мгновенное обновление баланса
3. **Простота**: понятный интерфейс для пользователя
4. **Надежность**: синхронизация с сервером
5. **Мобильность**: оптимизация для Telegram Web App

### Области для улучшения:
1. **Образование**: добавить объяснения алгоритма
2. **Аналитика**: детальная статистика доходов
3. **Уведомления**: push-уведомления о доходах
4. **Геймификация**: достижения и уровни
5. **Социальность**: сравнение с другими пользователями

### Техническая реализация:
- ✅ Корректный расчет дохода
- ✅ Синхронизация клиент-сервер
- ✅ Кэширование и восстановление
- ✅ Обработка ошибок
- ✅ Оптимизация производительности

Приложение предоставляет пользователю четкое понимание того, как работает система заработка, с прозрачным алгоритмом расчета и визуализацией дохода в реальном времени.
