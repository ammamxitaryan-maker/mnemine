# 🎯 Система строгой типизации

## Обзор

Новая система типизации заменяет все `any` типы на строгие TypeScript типы, обеспечивая типобезопасность, лучшую поддержку IDE и предотвращение ошибок во время выполнения.

## 🎯 Преимущества

### ✅ **До (проблемы):**
- 187+ случаев использования `any` типов
- Отсутствие типобезопасности
- Сложно отлаживать ошибки
- Нет автодополнения в IDE
- Runtime ошибки из-за неправильных типов

### ✅ **После (решения):**
- Строгая типизация всех API и бизнес-логики
- Runtime валидация с Zod
- Полная типобезопасность
- Отличная поддержка IDE
- Предотвращение ошибок на этапе компиляции

## 🏗️ Архитектура

### Основные компоненты:

1. **API Types** (`server/src/types/api.ts`)
   - Базовые типы для API запросов и ответов
   - Пагинация и фильтрация
   - Обработка ошибок

2. **Business Types** (`server/src/types/business.ts`)
   - Все бизнес-сущности (User, Slot, Transaction, etc.)
   - Строгие типы для всех операций
   - Синхронизация с Prisma схемой

3. **WebSocket Types** (`server/src/types/websocket.ts`)
   - Типы для real-time коммуникации
   - События и сообщения
   - Управление соединениями

4. **Validation Schemas** (`server/src/validation/schemas.ts`)
   - Zod схемы для runtime валидации
   - Валидация всех API endpoints
   - Автоматическая генерация типов

5. **Client Types** (`client/src/types/api.ts`)
   - Синхронизированные типы для клиента
   - Безопасные типы для UI компонентов
   - Общие утилиты

## 📋 Использование

### Базовые типы:

```typescript
import { 
  ApiResponse, 
  UserProfile, 
  MiningSlotInfo, 
  TransactionInfo 
} from '../types/business.js';

// Строго типизированные функции
async function getUserProfile(userId: string): Promise<ApiResponse<UserProfile>> {
  // TypeScript знает точную структуру ответа
}

async function purchaseSlot(
  request: SlotPurchaseRequest
): Promise<ApiResponse<SlotPurchaseResponse>> {
  // Все поля строго типизированы
}
```

### Runtime валидация:

```typescript
import { validateRequest } from '../middleware/validation.js';
import { SlotPurchaseSchema } from '../validation/schemas.js';

// Автоматическая валидация запроса
router.post('/slots/purchase', 
  validateRequest(SlotPurchaseSchema),
  async (req: Request, res: Response) => {
    // req.validatedData уже содержит валидированные данные
    const { amount, currency, type } = getValidatedData<SlotPurchaseInput>(req);
    
    // TypeScript знает точные типы
  }
);
```

### Типизированные контроллеры:

```typescript
import { 
  ControllerRequest, 
  ControllerResponse,
  getValidatedData 
} from '../types/index.js';

export const purchaseSlot = async (
  req: ControllerRequest,
  res: ControllerResponse
): Promise<void> => {
  // req.user строго типизирован
  const userId = req.user.id;
  
  // Валидированные данные
  const slotData = getValidatedData<SlotPurchaseInput>(req);
  
  // Строго типизированный ответ
  const result = await slotService.purchase(userId, slotData);
  
  res.json(createSuccessResponse(result));
};
```

## 🎛️ Конфигурация

### Валидация запросов:

```typescript
import { Schemas } from '../validation/schemas.js';

// Простая валидация
router.post('/users', 
  validateRequest(Schemas.UserUpdate),
  createUser
);

// Множественная валидация
router.get('/transactions',
  validateMultiple([
    { schema: Schemas.Pagination, source: 'query' },
    { schema: Schemas.DateRange, source: 'query' },
    { schema: Schemas.TransactionFilter, source: 'query' }
  ]),
  getTransactions
);
```

### Валидация ответов:

```typescript
import { UserProfileSchema } from '../validation/schemas.js';

// Валидация ответа
router.get('/users/:id',
  validateRequest(Schemas.UserId, 'params'),
  validateResponse(UserProfileSchema),
  getUser
);
```

## 📊 Типы и их назначение

### API Types:

| Тип | Назначение | Примеры |
|-----|------------|---------|
| `ApiResponse<T>` | Базовый ответ API | `ApiResponse<UserProfile>` |
| `PaginatedResponse<T>` | Пагинированные данные | `PaginatedResponse<TransactionInfo>` |
| `PaginationParams` | Параметры пагинации | `{ page: 1, limit: 20 }` |
| `DateRangeParams` | Фильтр по датам | `{ startDate: '2024-01-01' }` |

### Business Types:

| Тип | Назначение | Примеры |
|-----|------------|---------|
| `UserProfile` | Профиль пользователя | Полная информация о пользователе |
| `MiningSlotInfo` | Майнинг слот | Активные слоты пользователя |
| `TransactionInfo` | Транзакция | Все операции с балансом |
| `WalletInfo` | Кошелек | Баланс по валютам |
| `LotteryInfo` | Лотерея | Информация о розыгрышах |

### WebSocket Types:

| Тип | Назначение | Примеры |
|-----|------------|---------|
| `WebSocketMessage<T>` | Сообщение WebSocket | `WebSocketMessage<EarningsUpdateEvent>` |
| `EarningsUpdateEvent` | Обновление доходов | Real-time уведомления |
| `BalanceUpdateEvent` | Обновление баланса | Изменения баланса |
| `NotificationEvent` | Уведомление | Системные уведомления |

## 🔧 Автоматизация

### Скрипт замены any типов:

```bash
# Анализ использования any типов
node scripts/replace-any-types.js . analyze

# Замена any типов
node scripts/replace-any-types.js . replace
```

### Что делает скрипт:

1. **Анализирует файлы** на наличие `any` типов
2. **Заменяет** `any` на соответствующие типы
3. **Добавляет импорты** автоматически
4. **Контекстно определяет** подходящие типы
5. **Пропускает** системные файлы

## 📈 Валидация и безопасность

### Zod схемы:

```typescript
// Строгая валидация входных данных
export const SlotPurchaseSchema = z.object({
  amount: z.number().positive().max(1000000),
  currency: z.enum(['USD', 'MNE']),
  type: z.enum(['standard', 'premium', 'vip']).default('standard'),
}).refine(
  (data) => {
    if (data.currency === 'USD' && data.amount < 1) return false;
    if (data.currency === 'MNE' && data.amount < 10) return false;
    return true;
  },
  {
    message: "Minimum purchase amount: $1 USD or 10 MNE",
    path: ["amount"],
  }
);
```

### Middleware валидации:

```typescript
// Автоматическая валидация и санитизация
app.use(sanitizeInput);
app.use(validateContentType(['application/json']));
app.use(validateRateLimit);
```

## 🚀 Следующие шаги

### Этап 2: ✅ Завершен
- [x] Создана система типов
- [x] Добавлена runtime валидация
- [x] Создан скрипт автоматизации
- [x] Обновлены клиентские типы

### Этап 3: 🔄 В процессе
- [ ] Запустить скрипт замены any типов
- [ ] Обновить контроллеры
- [ ] Обновить сервисы
- [ ] Тестирование

### Этап 4: 📋 Планируется
- [ ] Интеграция с Prisma
- [ ] Автоматическая генерация типов
- [ ] Валидация на клиенте
- [ ] Type-safe API клиент

## 💡 Рекомендации

### Для разработчиков:

1. **Используйте строгие типы** - избегайте `any` и `unknown`
2. **Валидируйте данные** - используйте Zod схемы
3. **Типизируйте API** - все endpoints должны быть типизированы
4. **Используйте утилиты** - `Optional<T, K>`, `RequiredFields<T, K>`

### Для production:

1. **Включите строгую проверку** - `"strict": true` в tsconfig
2. **Валидируйте все входы** - используйте middleware валидации
3. **Мониторьте ошибки** - отслеживайте validation errors
4. **Тестируйте типы** - используйте type tests

## 🔍 Примеры использования

### В контроллере:

```typescript
import { 
  validateRequest, 
  getValidatedData,
  createSuccessResponse 
} from '../middleware/validation.js';
import { SlotPurchaseSchema, SlotPurchaseInput } from '../validation/schemas.js';

export const purchaseSlot = async (
  req: ControllerRequest,
  res: ControllerResponse
): Promise<void> => {
  try {
    // Валидированные данные
    const slotData = getValidatedData<SlotPurchaseInput>(req);
    const userId = req.user.id;
    
    // Строго типизированный сервис
    const result = await slotService.purchase(userId, slotData);
    
    // Типизированный ответ
    res.json(createSuccessResponse(result, 'Slot purchased successfully'));
  } catch (error) {
    logger.error(LogContext.BUSINESS, 'Slot purchase failed', error, {
      userId: req.user.id,
      slotData: getValidatedData<SlotPurchaseInput>(req)
    });
    
    res.status(500).json(createErrorResponse('Purchase failed'));
  }
};
```

### В сервисе:

```typescript
import { 
  UserProfile, 
  MiningSlotInfo, 
  SlotPurchaseRequest,
  SlotPurchaseResponse 
} from '../types/business.js';

export class SlotService {
  async purchase(
    userId: string, 
    request: SlotPurchaseRequest
  ): Promise<SlotPurchaseResponse> {
    // Все параметры строго типизированы
    const user = await this.getUser(userId);
    const slot = await this.createSlot(userId, request);
    const transaction = await this.createTransaction(userId, request);
    
    return {
      slot,
      transaction,
      newBalance: user.wallets.find(w => w.currency === request.currency)?.balance || 0
    };
  }
}
```

### В клиенте:

```typescript
import { 
  ApiResponse, 
  UserProfile, 
  MiningSlotInfo,
  SlotPurchaseRequest 
} from '../types/api.js';

export const useSlotPurchase = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const purchaseSlot = async (request: SlotPurchaseRequest): Promise<ApiResponse<MiningSlotInfo> | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.post<ApiResponse<MiningSlotInfo>>('/slots/purchase', request);
      return response.data;
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  return { purchaseSlot, isLoading, error };
};
```

---

**Результат:** Полная типобезопасность, предотвращение ошибок, отличная поддержка IDE и профессиональный код! 🎉
