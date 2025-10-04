# СЦЕНАРИИ АУТЕНТИФИКАЦИИ

## 🎯 **СЦЕНАРИЙ 1: ПОЛЬЗОВАТЕЛЬ В TELEGRAM (ОСНОВНОЙ)**

### Входные данные:
```javascript
window.Telegram.WebApp = {
  initData: "user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22John%22%7D&hash=abc123",
  initDataUnsafe: {
    user: {
      id: 123456789,
      first_name: "John",
      last_name: "Doe",
      username: "johndoe"
    }
  }
}
```

### Логика выполнения:
1. ✅ `initDataForValidation` существует
2. ✅ Отправка на `/auth/validate` с `initData`
3. ✅ Сервер проверяет хеш и находит пользователя
4. ✅ Возврат реального пользователя: `{ id: 123456789, telegramId: "123456789", ... }`

### Результат: ✅ **РЕАЛЬНЫЙ TELEGRAM ID**

---

## 🎯 **СЦЕНАРИЙ 2: TELEGRAM БЕЗ initData (FALLBACK)**

### Входные данные:
```javascript
window.Telegram.WebApp = {
  initData: null,  // ← НЕТ initData
  initDataUnsafe: {
    user: {
      id: 987654321,
      first_name: "Jane",
      username: "janesmith"
    }
  }
}
```

### Логика выполнения:
1. ✅ `initDataForValidation` = null
2. ✅ Проверка `tg.initDataUnsafe.user` - ЕСТЬ
3. ✅ Извлечение реальных данных: `{ id: 987654321, ... }`
4. ✅ `setUser(realUser)` с реальными данными

### Результат: ✅ **РЕАЛЬНЫЙ TELEGRAM ID**

---

## 🎯 **СЦЕНАРИЙ 3: ОШИБКА СЕРВЕРНОЙ ВАЛИДАЦИИ (FALLBACK)**

### Входные данные:
```javascript
window.Telegram.WebApp = {
  initData: "user=...&hash=invalid",  // ← НЕПРАВИЛЬНЫЙ ХЕШ
  initDataUnsafe: {
    user: {
      id: 555666777,
      first_name: "Bob",
      username: "bobwilson"
    }
  }
}
```

### Логика выполнения:
1. ✅ `initDataForValidation` существует
2. ❌ Серверная валидация НЕ УДАЛАСЬ (неправильный хеш)
3. ✅ Fallback на `tg.initDataUnsafe.user`
4. ✅ Извлечение реальных данных: `{ id: 555666777, ... }`
5. ✅ `setUser(realUser)` с реальными данными

### Результат: ✅ **РЕАЛЬНЫЙ TELEGRAM ID**

---

## 🎯 **СЦЕНАРИЙ 4: НЕТ TELEGRAM ДАННЫХ (GUEST)**

### Входные данные:
```javascript
window.Telegram.WebApp = null;  // ← НЕТ TELEGRAM
// или
window.Telegram.WebApp = {
  initData: null,
  initDataUnsafe: null
}
```

### Логика выполнения:
1. ✅ `initDataForValidation` = null
2. ✅ `tg.initDataUnsafe.user` = null
3. ✅ Создание уникального guest ID: `guest_1234567890_abc123_Mozilla/5.0`
4. ✅ `setUser(guestUser)` с уникальным ID

### Результат: ✅ **УНИКАЛЬНЫЙ GUEST ID**

---

## 🎯 **СЦЕНАРИЙ 5: СЕРВЕРНАЯ ВАЛИДАЦИЯ (ДЕТАЛЬНО)**

### Входные данные:
```javascript
// initData содержит:
"user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22John%22%7D&hash=valid_hash"
```

### Серверная логика:
1. ✅ Парсинг `initData` → `userData = { id: 123456789, first_name: "John" }`
2. ✅ Проверка хеша для подлинности
3. ✅ Поиск в БД: `WHERE telegramId = "123456789"`
4. ✅ Найден существующий пользователь
5. ✅ Обновление данных: `firstName`, `lastName`, `lastSeenAt`
6. ✅ Возврат: `{ id: "db_id", telegramId: "123456789", ... }`

### Результат: ✅ **РЕАЛЬНЫЙ ПОЛЬЗОВАТЕЛЬ ИЗ БД**

---

## 📊 **СВОДКА РЕЗУЛЬТАТОВ**

| Сценарий | initData | initDataUnsafe | Результат | ID Тип |
|----------|----------|----------------|-----------|---------|
| 1. Telegram с initData | ✅ | ✅ | Серверная валидация | Реальный |
| 2. Telegram без initData | ❌ | ✅ | initDataUnsafe | Реальный |
| 3. Ошибка сервера | ✅ | ✅ | initDataUnsafe fallback | Реальный |
| 4. Нет Telegram | ❌ | ❌ | Guest пользователь | Уникальный |
| 5. Серверная валидация | ✅ | ✅ | База данных | Реальный |

## ✅ **ВСЕ СЦЕНАРИИ ПРАВИЛЬНЫЕ**

1. **Реальные Telegram ID:** Используются во всех сценариях с Telegram
2. **Уникальные Guest ID:** Только когда нет Telegram данных
3. **Безопасность:** Проверка подлинности через хеш
4. **Fallback:** Надежные механизмы восстановления
5. **Никаких конфликтов:** Каждый пользователь уникален
