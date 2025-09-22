# Временное исправление для работы приложения

## 🚨 **Проблема:**
Колонка `isAdminSelected` в таблице `LotteryTicket` не создается, что вызывает ошибки 500 в Lottery API.

## ✅ **Временное решение:**

### 1. Отключено использование isAdminSelected
- **Файл:** `server/src/controllers/adminLotteryController.ts`
- **Изменения:** Закомментированы все обращения к `isAdminSelected`
- **Результат:** Приложение будет работать без ошибок 500

### 2. Упрощена команда создания колонки
- **Файл:** `server/src/index.ts`
- **Изменения:** Используется простая команда `ADD COLUMN IF NOT EXISTS`
- **Результат:** Более надежное создание колонки

## 🔧 **Что изменено:**

### В adminLotteryController.ts:
```typescript
// Было:
isAdminSelected: true,

// Стало:
// isAdminSelected: true, // Temporarily disabled until database schema is fixed
```

### В index.ts:
```typescript
// Было: Сложный DO $$ блок
// Стало: Простая команда
await prisma.$executeRaw`ALTER TABLE "LotteryTicket" ADD COLUMN IF NOT EXISTS "isAdminSelected" BOOLEAN NOT NULL DEFAULT false;`;
```

## 🚀 **Инструкции по деплою:**

### Шаг 1: Закоммитьте временное исправление
```bash
git add .
git commit -m "Temporary fix: disable isAdminSelected usage until database schema is fixed"
git push origin main
```

### Шаг 2: Проверьте результат
После деплоя:
- ✅ Lottery API должен возвращать 200 вместо 500
- ✅ Приложение должно работать без ошибок
- ⚠️ Админские функции лотереи будут ограничены (временно)

### Шаг 3: После успешного деплоя
Когда приложение заработает, можно будет:
1. Проверить, создалась ли колонка `isAdminSelected`
2. Раскомментировать использование этой колонки
3. Протестировать админские функции

## 📋 **Ожидаемые результаты:**

### До исправления:
```
The column `main.LotteryTicket.isAdminSelected` does not exist in the current database.
GET /api/lottery/status - 500 - 4ms
```

### После исправления:
```
GET /api/lottery/status - 200 - 5ms
[SEED] LotteryTicket.isAdminSelected column added/verified
```

## ⚠️ **Временные ограничения:**

- Админские функции лотереи будут работать частично
- Статистика `adminSelectedWinners` будет показывать 0
- Это временное решение до полного исправления схемы БД

## 🎯 **Цель:**
Сначала заставить приложение работать, затем постепенно восстанавливать все функции.

После этого деплоя ваше приложение должно работать без ошибок 500! 🎉
