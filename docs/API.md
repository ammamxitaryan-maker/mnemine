# NONMINE API Documentation

## Overview

The NONMINE API provides comprehensive endpoints for managing users, mining slots, tasks, lottery, and real-time features.

## Base URL

- **Development**: `http://localhost:10112/api`
- **Production**: `https://mnemine-backend-7b4y.onrender.com/api`

## Authentication

All API requests require authentication via Telegram WebApp or JWT token.

### Headers

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-Request-ID: <unique_request_id>
```

## Rate Limiting

- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **Admin Endpoints**: 200 requests per 15 minutes

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "req_1234567890_abcdef"
}
```

## Endpoints

### Authentication

#### POST /auth/telegram

Authenticate user via Telegram WebApp.

**Request Body:**
```json
{
  "initData": "telegram_webapp_init_data",
  "user": {
    "id": 123456789,
    "first_name": "John",
    "last_name": "Doe",
    "username": "johndoe"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token",
    "user": {
      "id": "user_id",
      "telegramId": "123456789",
      "firstName": "John",
      "lastName": "Doe",
      "username": "johndoe",
      "role": "USER",
      "balance": 1000.00,
      "referralCode": "ABC123"
    }
  }
}
```

### User Management

#### GET /user/:telegramId

Get user profile and statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "telegramId": "123456789",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "role": "USER",
    "balance": 1000.00,
    "totalInvested": 5000.00,
    "referralCode": "ABC123",
    "wallets": [
      {
        "currency": "USD",
        "balance": 1000.00
      }
    ],
    "miningSlots": [
      {
        "id": "slot_id",
        "principal": 100.00,
        "isActive": true,
        "expiresAt": "2024-12-31T23:59:59.000Z"
      }
    ],
    "referrals": [
      {
        "id": "ref_id",
        "firstName": "Jane",
        "joinedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

#### POST /user/claim

Claim mining earnings.

**Request Body:**
```json
{
  "amount": 100.00
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "tx_123456789",
    "amount": 100.00,
    "newBalance": 1100.00,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /user/reinvest

Reinvest earnings into new mining slot.

**Request Body:**
```json
{
  "amount": 100.00,
  "duration": 30
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "slotId": "slot_123456789",
    "principal": 100.00,
    "duration": 30,
    "expiresAt": "2024-01-31T00:00:00.000Z"
  }
}
```

### Mining Slots

#### GET /slots/:telegramId

Get user's mining slots.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "slot_id",
      "principal": 100.00,
      "startAt": "2024-01-01T00:00:00.000Z",
      "lastAccruedAt": "2024-01-01T12:00:00.000Z",
      "effectiveWeeklyRate": 0.05,
      "expiresAt": "2024-01-31T00:00:00.000Z",
      "isActive": true,
      "type": "standard",
      "earnings": 2.50
    }
  ]
}
```

#### POST /slots/purchase

Purchase new mining slot.

**Request Body:**
```json
{
  "principal": 100.00,
  "duration": 30,
  "type": "standard"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "slotId": "slot_123456789",
    "principal": 100.00,
    "duration": 30,
    "expiresAt": "2024-01-31T00:00:00.000Z",
    "weeklyRate": 0.05
  }
}
```

### Tasks

#### GET /tasks

Get available tasks.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "task_id",
      "taskId": "daily_login",
      "title": "Daily Login",
      "description": "Log in to the app daily",
      "reward": 10.00,
      "link": "https://t.me/example",
      "isCompleted": false
    }
  ]
}
```

#### POST /tasks/complete

Complete a task.

**Request Body:**
```json
{
  "taskId": "daily_login"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "taskId": "daily_login",
    "reward": 10.00,
    "newBalance": 1110.00,
    "completedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Lottery

#### GET /lottery

Get lottery information.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "lottery_id",
    "drawDate": "2024-01-07T00:00:00.000Z",
    "jackpot": 10000.00,
    "isDrawn": false,
    "ticketPrice": 10.00,
    "userTickets": 5,
    "totalTickets": 1000
  }
}
```

#### POST /lottery/purchase

Purchase lottery ticket.

**Request Body:**
```json
{
  "numbers": "1,2,3,4,5,6"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ticketId": "ticket_123456789",
    "numbers": "1,2,3,4,5,6",
    "cost": 10.00,
    "newBalance": 1100.00
  }
}
```

### Real-time Data

#### GET /realtime/user/:telegramId

Get real-time user data.

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": 1000.00,
    "activeSlots": 3,
    "totalEarnings": 50.00,
    "lastUpdated": "2024-01-01T12:00:00.000Z"
  }
}
```

#### GET /realtime/market

Get real-time market data.

**Response:**
```json
{
  "success": true,
  "data": {
    "exchangeRate": 1.0,
    "totalUsers": 10000,
    "totalVolume": 1000000.00,
    "lastUpdated": "2024-01-01T12:00:00.000Z"
  }
}
```

### Admin Endpoints

#### GET /admin/users

Get all users (admin only).

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search term
- `role`: Filter by role

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_id",
        "telegramId": "123456789",
        "firstName": "John",
        "lastName": "Doe",
        "role": "USER",
        "balance": 1000.00,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "lastSeenAt": "2024-01-01T12:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

#### POST /admin/users/:userId/balance

Update user balance (admin only).

**Request Body:**
```json
{
  "amount": 1000.00,
  "reason": "Admin adjustment"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user_id",
    "oldBalance": 1000.00,
    "newBalance": 2000.00,
    "change": 1000.00,
    "reason": "Admin adjustment",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## WebSocket Events

### Connection

Connect to WebSocket at `ws://localhost:10112/ws` or `wss://mnemine-backend-7b4y.onrender.com/ws`

### Events

#### user:update

Real-time user data updates.

```json
{
  "type": "user:update",
  "data": {
    "telegramId": "123456789",
    "balance": 1000.00,
    "activeSlots": 3,
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

#### market:update

Real-time market data updates.

```json
{
  "type": "market:update",
  "data": {
    "exchangeRate": 1.0,
    "totalUsers": 10000,
    "totalVolume": 1000000.00,
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

#### lottery:update

Lottery updates.

```json
{
  "type": "lottery:update",
  "data": {
    "jackpot": 10000.00,
    "ticketCount": 1000,
    "drawDate": "2024-01-07T00:00:00.000Z",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_TOKEN` | Invalid or expired JWT token |
| `INSUFFICIENT_BALANCE` | Not enough balance for operation |
| `SLOT_NOT_FOUND` | Mining slot not found |
| `TASK_ALREADY_COMPLETED` | Task already completed |
| `LOTTERY_CLOSED` | Lottery is closed |
| `ADMIN_REQUIRED` | Admin privileges required |
| `RATE_LIMIT_EXCEEDED` | Rate limit exceeded |
| `VALIDATION_ERROR` | Request validation failed |
| `INTERNAL_ERROR` | Internal server error |

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/auth/*` | 5 requests | 15 minutes |
| `/user/*` | 100 requests | 15 minutes |
| `/slots/*` | 50 requests | 15 minutes |
| `/tasks/*` | 30 requests | 15 minutes |
| `/lottery/*` | 20 requests | 15 minutes |
| `/admin/*` | 200 requests | 15 minutes |

## SDK Examples

### JavaScript/TypeScript

```typescript
import { mnemineAPI } from '@mnemine/api-client';

const api = new mnemineAPI({
  baseURL: 'https://mnemine-backend-7b4y.onrender.com/api',
  token: 'your_jwt_token'
});

// Get user profile
const user = await api.user.getProfile('123456789');

// Purchase mining slot
const slot = await api.slots.purchase({
  principal: 100,
  duration: 30,
  type: 'standard'
});

// Complete task
const result = await api.tasks.complete('daily_login');
```

### Python

```python
import requests

class NONMINEAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def get_user(self, telegram_id):
        response = requests.get(
            f'{self.base_url}/user/{telegram_id}',
            headers=self.headers
        )
        return response.json()

# Usage
api = mnemineAPI('https://mnemine-backend-7b4y.onrender.com/api', 'your_token')
user = api.get_user('123456789')
```

## Testing

Use the provided Postman collection or curl examples for testing:

```bash
# Get user profile
curl -X GET "https://mnemine-backend-7b4y.onrender.com/api/user/123456789" \
  -H "Authorization: Bearer your_jwt_token"

# Purchase mining slot
curl -X POST "https://mnemine-backend-7b4y.onrender.com/api/slots/purchase" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{"principal": 100, "duration": 30, "type": "standard"}'
```


