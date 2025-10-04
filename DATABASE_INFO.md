# 🗄️ ИНФОРМАЦИЯ О БАЗЕ ДАННЫХ

## 🎯 **ТИП БАЗЫ ДАННЫХ**
**PostgreSQL** - реляционная база данных

## 📊 **КОНФИГУРАЦИЯ**

### Prisma Schema:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### DATABASE_URL:
```
postgresql://mnemine_user:2DpMhmihzMUXfaVlksxOaWvYtL@dpg-d38dq93e5dus73a34u3g-a.oregon-postgres.render.com/mnemine_zupy
```

## 🏗️ **СТРУКТУРА**

### Основные таблицы:
- **User** - пользователи с Telegram ID
- **Wallet** - кошельки пользователей
- **MiningSlot** - слоты майнинга
- **ActivityLog** - история активности
- **LotteryTicket** - лотерейные билеты
- **SwapTransaction** - обменные транзакции

### Ключевые поля User:
```sql
id          String   @id @default(cuid())
telegramId  String   @unique    ← РЕАЛЬНЫЙ TELEGRAM ID
username    String?
firstName   String?
lastName    String?
role        UserRole @default(USER)
```

## 🔧 **ПОДКЛЮЧЕНИЕ**

### Локальная разработка:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/mnemine"
```

### Production (Render):
```bash
DATABASE_URL="postgresql://mnemine_user:2DpMhmihzMUXfaVlksxOaWvYtL@dpg-d38dq93e5dus73a34u3g-a.oregon-postgres.render.com/mnemine_zupy"
```

## ✅ **ПОДТВЕРЖДЕНИЕ**

✅ **Используется PostgreSQL**  
✅ **НЕ SQLite**  
✅ **Production база на Render**  
✅ **Telegram ID сохраняются в PostgreSQL**  
✅ **Все данные пользователей в PostgreSQL**

**Приложение использует PostgreSQL! 🎉**
