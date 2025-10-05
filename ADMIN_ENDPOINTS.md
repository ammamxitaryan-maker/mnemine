# 🔐 Админ панель - Все эндпоинты

## 📋 Полный список всех админ эндпоинтов

### 🛡️ Защита
- **Middleware**: `isAdmin` - проверяет Telegram ID `6760298907`
- **Доступ**: Только пользователь с Telegram ID `6760298907`

---

## 🔐 Основные админ эндпоинты (`/api/admin/*`)

### 💰 Финансы и выплаты
| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| `GET` | `/api/admin/daily-payouts` | Ежедневные выплаты |
| `GET` | `/api/admin/today-payouts` | Сегодняшние выплаты |
| `POST` | `/api/admin/process-today-payouts` | Обработать выплаты |

### 👥 Управление пользователями
| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| `GET` | `/api/admin/active-users` | Активные пользователи |
| `GET` | `/api/admin/inactive-users` | Неактивные пользователи |
| `POST` | `/api/admin/freeze-accounts` | Заморозить аккаунты |
| `GET` | `/api/admin/users` | Список всех пользователей |
| `DELETE` | `/api/admin/delete-user/:userId` | Удалить пользователя |
| `POST` | `/api/admin/users/bulk-actions` | Массовые действия с пользователями |

### 👤 Действия с пользователями
| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| `POST` | `/api/admin/users/:userId/freeze` | Заморозить пользователя |
| `POST` | `/api/admin/users/:userId/unfreeze` | Разморозить пользователя |
| `POST` | `/api/admin/users/:userId/ban` | Забанить пользователя |
| `POST` | `/api/admin/users/:userId/unban` | Разбанить пользователя |

### 📊 Статистика и аналитика
| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| `GET` | `/api/admin/dashboard-stats` | Статистика дашборда |
| `GET` | `/api/admin/analytics` | Аналитика |
| `GET` | `/api/admin/custom-reports` | Кастомные отчеты |

### 🔔 Уведомления
| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| `GET` | `/api/admin/notifications` | Список уведомлений |
| `POST` | `/api/admin/notifications/send` | Отправить уведомления |
| `POST` | `/api/admin/notifications/broadcast` | Массовая рассылка |
| `POST` | `/api/admin/notifications/:notificationId/retry` | Повторить уведомление |
| `DELETE` | `/api/admin/notifications/:notificationId` | Удалить уведомление |

### 📝 Логи и транзакции
| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| `GET` | `/api/admin/logs` | Логи системы |
| `GET` | `/api/admin/transactions` | Транзакции |

### ⚙️ Настройки системы
| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| `GET` | `/api/admin/settings` | Настройки системы |
| `POST` | `/api/admin/settings/update` | Обновить настройки |
| `POST` | `/api/admin/system/:action` | Системные действия |

#### Системные действия (`/api/admin/system/:action`)
- `backup` - Резервное копирование базы данных
- `cleanup` - Очистка логов
- `maintenance-mode` - Режим обслуживания
- `cache-clear` - Очистка кэша

---

## 🔄 Дополнительные админ эндпоинты

### 💱 Обмен валют
| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| `POST` | `/api/exchange/admin/rate` | Установить курс обмена |

### 🔐 Аутентификация админа
| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| `POST` | `/api/admin/login` | Вход админа |

### 📨 Уведомления (дополнительные)
| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| `POST` | `/api/notifications/admin/notifications/send` | Отправить уведомление |
| `GET` | `/api/notifications/admin/notifications/queue-stats` | Статистика очереди |
| `POST` | `/api/notifications/admin/notifications/clear-queue` | Очистить очередь |
| `GET` | `/api/notifications/admin/notifications/stats` | Статистика уведомлений |

### ⚡ Обработка данных
| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| `GET` | `/api/processing/admin/processing/metrics` | Метрики обработки |
| `POST` | `/api/processing/admin/processing/run-manual` | Ручная обработка |
| `GET` | `/api/processing/admin/processing/status` | Статус обработки |
| `GET` | `/api/processing/admin/processing/queue` | Очередь обработки |

---

## 📊 Статистика эндпоинтов

### По категориям:
- **Финансы и выплаты**: 3 эндпоинта
- **Управление пользователями**: 6 эндпоинтов
- **Действия с пользователями**: 4 эндпоинта
- **Статистика и аналитика**: 3 эндпоинта
- **Уведомления**: 5 эндпоинтов
- **Логи и транзакции**: 2 эндпоинта
- **Настройки системы**: 3 эндпоинта
- **Дополнительные**: 9 эндпоинтов

### По методам:
- **GET**: 15 эндпоинтов
- **POST**: 15 эндпоинтов
- **DELETE**: 2 эндпоинта

**Всего админ эндпоинтов: 32**

---

## 🛡️ Безопасность

### Защита эндпоинтов:
- Все эндпоинты защищены middleware `isAdmin`
- Проверка Telegram ID: `6760298907`
- Логирование всех админ действий
- Автоматическое перенаправление неавторизованных пользователей

### Файлы защиты:
- `server/src/middleware-stubs.ts` - Middleware `isAdmin`
- `client/src/components/layout/AdminRoute.tsx` - Фронтенд защита
- `client/src/pages/Admin.tsx` - Дополнительная защита компонента

---

## 📁 Структура файлов

### Серверная часть:
- `server/src/routes/admin.ts` - Основные админ маршруты
- `server/src/controllers/adminController.ts` - Контроллеры админ функций
- `server/src/middleware-stubs.ts` - Middleware защиты

### Клиентская часть:
- `client/src/components/layout/AdminRoute.tsx` - Защита маршрутов
- `client/src/pages/admin/` - Админ страницы
- `client/src/App.tsx` - Конфигурация маршрутов

---

## 🔄 Обновления

**Последнее обновление**: $(date)
**Версия**: 1.0
**Статус**: ✅ Все эндпоинты проверены и работают

---

*Этот файл содержит полный список всех админ эндпоинтов для быстрого доступа и анализа.*
