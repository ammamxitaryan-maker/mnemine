# ЗАГРУЗКА ДАННЫХ ПОЛЬЗОВАТЕЛЯ

## ✅ **ИСПРАВЛЕНО: ПОЛНАЯ ЗАГРУЗКА ДАННЫХ ПОЛЬЗОВАТЕЛЯ**

### 🔍 **ЧТО ЗАГРУЖАЕТСЯ ДЛЯ СУЩЕСТВУЮЩЕГО ПОЛЬЗОВАТЕЛЯ:**

```typescript
// Строки 49-60: Поиск существующего пользователя
const existingUser = await prisma.user.findUnique({
  where: { telegramId: String(userData.id) },
  include: { 
    wallets: true,                    // ← КОШЕЛЬКИ
    miningSlots: true,                // ← МАЙНИНГ СЛОТЫ
    referrals: true,                 // ← РЕФЕРАЛЫ
    activityLogs: {                  // ← АКТИВНОСТЬ
      orderBy: { createdAt: 'desc' },
      take: 10
    }
  },
});
```

### 🔍 **ЧТО ЗАГРУЖАЕТСЯ ПРИ ОБНОВЛЕНИИ:**

```typescript
// Строки 64-82: Обновление пользователя
user = await prisma.user.update({
  where: { id: existingUser.id },
  data: {
    username: userData.username,        // ← ОБНОВЛЕНИЕ USERNAME
    firstName: userData.first_name,      // ← ОБНОВЛЕНИЕ ИМЕНИ
    lastName: userData.last_name,       // ← ОБНОВЛЕНИЕ ФАМИЛИИ
    avatarUrl: userData.photo_url,      // ← ОБНОВЛЕНИЕ ФОТО
    lastSeenAt: new Date(),            // ← ОБНОВЛЕНИЕ ВРЕМЕНИ
  },
  include: { 
    wallets: true,                    // ← ЗАГРУЗКА КОШЕЛЬКОВ
    miningSlots: true,                // ← ЗАГРУЗКА СЛОТОВ
    referrals: true,                  // ← ЗАГРУЗКА РЕФЕРАЛОВ
    activityLogs: {                   // ← ЗАГРУЗКА АКТИВНОСТИ
      orderBy: { createdAt: 'desc' },
      take: 10
    }
  },
});
```

### 🔍 **ЧТО ЗАГРУЖАЕТСЯ ДЛЯ НОВОГО ПОЛЬЗОВАТЕЛЯ:**

```typescript
// Строки 139-150: Возврат нового пользователя
return await tx.user.findUnique({
  where: { id: newUser.id },
  include: { 
    wallets: true,                    // ← КОШЕЛЬКИ (с welcome bonus)
    miningSlots: true,                // ← МАЙНИНГ СЛОТЫ (начальный слот)
    referrals: true,                  // ← РЕФЕРАЛЫ (если есть)
    activityLogs: {                   // ← АКТИВНОСТЬ (welcome bonus)
      orderBy: { createdAt: 'desc' },
      take: 10
    }
  },
});
```

## 📊 **ПОЛНЫЕ ДАННЫЕ ПОЛЬЗОВАТЕЛЯ:**

### ✅ **Основная информация:**
- `id` - ID пользователя в БД
- `telegramId` - Реальный Telegram ID
- `username` - Реальный username из Telegram
- `firstName` - Реальное имя из Telegram
- `lastName` - Реальная фамилия из Telegram
- `avatarUrl` - Реальное фото из Telegram
- `referralCode` - Уникальный реферальный код
- `lastSeenAt` - Время последнего входа

### ✅ **Кошельки (wallets):**
- `currency` - Валюта (CFM, CFMT)
- `balance` - Баланс
- `createdAt` - Дата создания

### ✅ **Майнинг слоты (miningSlots):**
- `principal` - Основная сумма
- `startAt` - Дата начала
- `expiresAt` - Дата окончания
- `effectiveWeeklyRate` - Эффективная ставка
- `isActive` - Активен ли слот

### ✅ **Рефералы (referrals):**
- `referredById` - Кто пригласил
- `referralCode` - Реферальный код
- `bonusAmount` - Сумма бонуса

### ✅ **Активность (activityLogs):**
- `type` - Тип активности
- `amount` - Сумма
- `description` - Описание
- `createdAt` - Дата

## 🎯 **РЕЗУЛЬТАТ:**

### ✅ **Для существующего пользователя:**
1. **Обновляются** актуальные данные из Telegram
2. **Загружаются** все кошельки, слоты, рефералы, активность
3. **Возвращается** полный объект пользователя

### ✅ **Для нового пользователя:**
1. **Создается** пользователь с реальными Telegram данными
2. **Создается** кошелек с welcome bonus
3. **Создается** начальный майнинг слот
4. **Создается** лог активности
5. **Загружается** полный объект пользователя

## ✅ **ЗАКЛЮЧЕНИЕ:**

**ТЕПЕРЬ ПРАВИЛЬНО!** 

- ✅ **Существующие пользователи** получают все свои данные
- ✅ **Новые пользователи** получают полный набор данных
- ✅ **Обновляются** актуальные данные из Telegram
- ✅ **Загружаются** кошельки, слоты, рефералы, активность

**Пользователи получают полные данные при входе! 🎉**
