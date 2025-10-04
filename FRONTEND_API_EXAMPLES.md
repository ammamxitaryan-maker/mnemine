# 🎨 ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ API ДЛЯ FRONTEND

## 📋 СОДЕРЖАНИЕ
1. [Настройка API клиента](#настройка-api-клиента)
2. [Аутентификация](#аутентификация)
3. [Получение данных пользователя](#получение-данных-пользователя)
4. [Работа со слотами](#работа-со-слотами)
5. [Конвертация валют](#конвертация-валют)
6. [Уведомления](#уведомления)
7. [Рефералы](#рефералы)
8. [WebSocket подключение](#websocket-подключение)

---

## 🔧 НАСТРОЙКА API КЛИЕНТА

### Базовый API клиент:

```typescript
// src/lib/api.ts
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:10112/api';

class ApiClient {
  private baseURL: string;
  private telegramToken: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setTelegramToken(token: string) {
    this.telegramToken = token;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.telegramToken) {
      headers['Authorization'] = `Bearer ${this.telegramToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    return response.json();
  }

  // GET запрос
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST запрос
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
```

---

## 🔐 АУТЕНТИФИКАЦИЯ

### Инициализация Telegram WebApp:

```typescript
// src/hooks/useTelegramAuth.ts
import { useEffect, useState } from 'react';
import { apiClient } from '../lib/api';

interface TelegramUser {
  id: number;
  first_name: string;
  username?: string;
  photo_url?: string;
}

export const useTelegramAuth = () => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initTelegram = async () => {
      try {
        // Получаем данные от Telegram WebApp
        const tg = (window as any).Telegram?.WebApp;
        if (!tg) {
          throw new Error('Telegram WebApp not available');
        }

        // Инициализируем WebApp
        tg.ready();
        tg.expand();

        // Получаем данные пользователя
        const userData = tg.initDataUnsafe?.user;
        if (!userData) {
          throw new Error('User data not available');
        }

        // Устанавливаем токен для API
        apiClient.setTelegramToken(tg.initData);

        // Аутентифицируемся на сервере
        const response = await apiClient.post('/auth/validate', {
          initData: tg.initData,
          startParam: tg.initDataUnsafe?.start_param
        });

        setUser(response.user);
      } catch (error) {
        console.error('Telegram auth error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initTelegram();
  }, []);

  return { user, isLoading };
};
```

---

## 👤 ПОЛУЧЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ

### Основные данные пользователя:

```typescript
// src/hooks/useUserData.ts
import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';

interface UserData {
  user: {
    id: string;
    telegramId: string;
    username: string;
    firstName: string;
    wallets: Wallet[];
    miningSlots: MiningSlot[];
    referrals: User[];
  };
}

export const useUserData = (telegramId: string) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await apiClient.get<UserData>(`/user/${telegramId}/data`);
        setUserData(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [telegramId]);

  return { userData, isLoading };
};
```

### Статистика пользователя:

```typescript
// src/hooks/useUserStats.ts
import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';

interface UserStats {
  totalInvested: number;
  totalEarnings: number;
  activeSlots: number;
  referralCount: number;
}

export const useUserStats = (telegramId: string) => {
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiClient.get<UserStats>(`/user/${telegramId}/stats`);
        setStats(data);
      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
    };

    fetchStats();
  }, [telegramId]);

  return stats;
};
```

---

## 💰 РАБОТА СО СЛОТАМИ

### Получение слотов:

```typescript
// src/hooks/useSlots.ts
import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';

interface MiningSlot {
  id: string;
  principal: number;
  effectiveWeeklyRate: number;
  lastAccruedAt: string;
  expiresAt: string;
  isActive: boolean;
  isLocked: boolean;
  type: 'standard' | 'premium' | 'welcome';
}

export const useSlots = (telegramId: string) => {
  const [slots, setSlots] = useState<MiningSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const data = await apiClient.get<MiningSlot[]>(`/user/${telegramId}/slots`);
        setSlots(data);
      } catch (error) {
        console.error('Error fetching slots:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlots();
  }, [telegramId]);

  return { slots, isLoading };
};
```

### Доход в реальном времени:

```typescript
// src/hooks/useRealTimeIncome.ts
import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';

interface RealTimeIncome {
  totalCurrentIncome: number;
  totalProjectedIncome: number;
  slots: {
    id: string;
    principal: number;
    currentIncome: number;
    projectedIncome: number;
    isLocked: boolean;
    type: string;
    hoursUntilExpiry: number;
    rate: number;
  }[];
  lastUpdated: string;
}

export const useRealTimeIncome = (telegramId: string) => {
  const [income, setIncome] = useState<RealTimeIncome | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchIncome = async () => {
      try {
        const data = await apiClient.get<RealTimeIncome>(`/user/${telegramId}/real-time-income`);
        setIncome(data);
      } catch (error) {
        console.error('Error fetching real-time income:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIncome();

    // Обновляем каждые 10 секунд
    const interval = setInterval(fetchIncome, 10000);
    return () => clearInterval(interval);
  }, [telegramId]);

  return { income, isLoading };
};
```

### Покупка слота:

```typescript
// src/hooks/useSlotActions.ts
import { useState } from 'react';
import { apiClient } from '../lib/api';

export const useSlotActions = (telegramId: string) => {
  const [isLoading, setIsLoading] = useState(false);

  const buySlot = async (amount: number) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post(`/user/${telegramId}/slots/buy`, { amount });
      return response;
    } catch (error) {
      console.error('Error buying slot:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const extendSlot = async (slotId: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post(`/user/${telegramId}/slots/${slotId}/extend`);
      return response;
    } catch (error) {
      console.error('Error extending slot:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const upgradeSlot = async (slotId: string, amount: number) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post(`/user/${telegramId}/slots/${slotId}/upgrade`, { amount });
      return response;
    } catch (error) {
      console.error('Error upgrading slot:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const claimEarnings = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.post(`/user/${telegramId}/claim`);
      return response;
    } catch (error) {
      console.error('Error claiming earnings:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    buySlot,
    extendSlot,
    upgradeSlot,
    claimEarnings,
    isLoading
  };
};
```

---

## 🔄 КОНВЕРТАЦИЯ ВАЛЮТ

### Получение курса обмена:

```typescript
// src/hooks/useExchangeRate.ts
import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';

interface ExchangeRate {
  rate: number;
  baseRate: number;
  variation: number;
  lastUpdated: string;
}

export const useExchangeRate = (telegramId: string) => {
  const [rate, setRate] = useState<ExchangeRate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const data = await apiClient.get<ExchangeRate>(`/user/${telegramId}/swap/rate`);
        setRate(data);
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRate();

    // Обновляем каждые 30 секунд
    const interval = setInterval(fetchRate, 30000);
    return () => clearInterval(interval);
  }, [telegramId]);

  return { rate, isLoading };
};
```

### Конвертация валют:

```typescript
// src/hooks/useSwap.ts
import { useState } from 'react';
import { apiClient } from '../lib/api';

export const useSwap = (telegramId: string) => {
  const [isLoading, setIsLoading] = useState(false);

  const swapMNEoMNE = async (amount: number) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post(`/user/${telegramId}/swap/USD-to-MNE`, { amount });
      return response;
    } catch (error) {
      console.error('Error swapping USD to MNE:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const swapMNEToUSD = async (amount: number) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post(`/user/${telegramId}/swap/MNE-to-USD`, { amount });
      return response;
    } catch (error) {
      console.error('Error swapping MNE to USD:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getSwapHistory = async () => {
    try {
      const response = await apiClient.get(`/user/${telegramId}/swap/history`);
      return response;
    } catch (error) {
      console.error('Error fetching swap history:', error);
      throw error;
    }
  };

  return {
    swapMNEoMNE,
    swapMNEToUSD,
    getSwapHistory,
    isLoading
  };
};
```

---

## 📱 УВЕДОМЛЕНИЯ

### Получение уведомлений:

```typescript
// src/hooks/useNotifications.ts
import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const useNotifications = (telegramId: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await apiClient.get<Notification[]>(`/user/${telegramId}/notifications`);
        setNotifications(data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [telegramId]);

  const markAsRead = async (notificationId: string) => {
    try {
      await apiClient.post(`/user/${telegramId}/notifications/mark-read`, { notificationId });
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return { notifications, markAsRead, isLoading };
};
```

---

## 👥 РЕФЕРАЛЫ

### Получение данных рефералов:

```typescript
// src/hooks/useReferrals.ts
import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';

interface ReferralData {
  referralCode: string;
  referralCount: number;
}

interface ReferralList {
  id: string;
  firstName: string;
  username: string;
  avatarUrl: string;
  lastSeenAt: string;
  totalInvested: number;
  isOnline: boolean;
}

interface ReferralStats {
  totalReferralEarnings: number;
  activeReferralsCount: number;
  referralsByLevel: {
    l1: number;
    l2: number;
    l3: number;
  };
}

export const useReferrals = (telegramId: string) => {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [referralList, setReferralList] = useState<ReferralList[]>([]);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReferralData = async () => {
      try {
        const [data, list, stats] = await Promise.all([
          apiClient.get<ReferralData>(`/user/${telegramId}/referrals`),
          apiClient.get<ReferralList[]>(`/user/${telegramId}/referrals/list`),
          apiClient.get<ReferralStats>(`/user/${telegramId}/referrals/stats`)
        ]);

        setReferralData(data);
        setReferralList(list);
        setReferralStats(stats);
      } catch (error) {
        console.error('Error fetching referral data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReferralData();
  }, [telegramId]);

  return { referralData, referralList, referralStats, isLoading };
};
```

---

## 🔌 WEBSOCKET ПОДКЛЮЧЕНИЕ

### WebSocket клиент:

```typescript
// src/hooks/useWebSocket.ts
import { useEffect, useState, useRef } from 'react';

interface WebSocketMessage {
  type: string;
  data: any;
}

export const useWebSocket = (telegramId: string) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const connectWebSocket = () => {
      const wsUrl = process.env.VITE_WS_URL || 'ws://localhost:10113';
      const ws = new WebSocket(`${wsUrl}?telegramId=${telegramId}`);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setSocket(ws);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setSocket(null);

        // Переподключение через 5 секунд
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, [telegramId]);

  const sendMessage = (message: WebSocketMessage) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(message));
    }
  };

  return { socket, isConnected, lastMessage, sendMessage };
};
```

---

## 🎨 КОМПОНЕНТЫ REACT

### Компонент для отображения дохода:

```typescript
// src/components/RealTimeIncome.tsx
import React from 'react';
import { useRealTimeIncome } from '../hooks/useRealTimeIncome';

interface RealTimeIncomeProps {
  telegramId: string;
}

export const RealTimeIncome: React.FC<RealTimeIncomeProps> = ({ telegramId }) => {
  const { income, isLoading } = useRealTimeIncome(telegramId);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!income) {
    return <div>No income data available</div>;
  }

  return (
    <div className="real-time-income">
      <h3>Real-time Income</h3>
      <div className="income-display">
        <div className="current-income">
          <span>Current: {income.totalCurrentIncome.toFixed(4)} USD</span>
        </div>
        <div className="projected-income">
          <span>Projected: {income.totalProjectedIncome.toFixed(4)} USD</span>
        </div>
      </div>
      
      <div className="slots-list">
        {income.slots.map(slot => (
          <div key={slot.id} className={`slot ${slot.isLocked ? 'locked' : ''}`}>
            <div className="slot-info">
              <span>Type: {slot.type}</span>
              <span>Principal: {slot.principal} USD</span>
              <span>Rate: {slot.rate}%</span>
            </div>
            <div className="slot-income">
              <span>Current: {slot.currentIncome.toFixed(4)} USD</span>
              <span>Projected: {slot.projectedIncome.toFixed(4)} USD</span>
            </div>
            {slot.isLocked && (
              <div className="slot-locked">
                <span>Locked for {slot.hoursUntilExpiry} hours</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Компонент для конвертации валют:

```typescript
// src/components/CurrencySwap.tsx
import React, { useState } from 'react';
import { useSwap, useExchangeRate } from '../hooks/useSwap';
import { useExchangeRate as useRate } from '../hooks/useExchangeRate';

interface CurrencySwapProps {
  telegramId: string;
}

export const CurrencySwap: React.FC<CurrencySwapProps> = ({ telegramId }) => {
  const [amount, setAmount] = useState('');
  const [swapDirection, setSwapDirection] = useState<'USD-to-MNE' | 'MNE-to-USD'>('USD-to-MNE');
  
  const { swapMNEoMNE, swapMNEToUSD, isLoading } = useSwap(telegramId);
  const { rate } = useRate(telegramId);

  const handleSwap = async () => {
    const swapAmount = parseFloat(amount);
    if (isNaN(swapAmount) || swapAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      if (swapDirection === 'USD-to-MNE') {
        await swapMNEoMNE(swapAmount);
      } else {
        await swapMNEToUSD(swapAmount);
      }
      alert('Swap successful!');
      setAmount('');
    } catch (error) {
      alert('Swap failed: ' + error.message);
    }
  };

  return (
    <div className="currency-swap">
      <h3>Currency Swap</h3>
      
      {rate && (
        <div className="exchange-rate">
          <span>Current Rate: {rate.rate.toFixed(4)}</span>
          <span>Variation: {rate.variation.toFixed(2)}%</span>
        </div>
      )}

      <div className="swap-controls">
        <select 
          value={swapDirection} 
          onChange={(e) => setSwapDirection(e.target.value as any)}
        >
          <option value="USD-to-MNE">USD → MNE</option>
          <option value="MNE-to-USD">MNE → USD</option>
        </select>

        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          min="1"
          step="0.01"
        />

        <button 
          onClick={handleSwap} 
          disabled={isLoading || !amount}
        >
          {isLoading ? 'Swapping...' : 'Swap'}
        </button>
      </div>
    </div>
  );
};
```

### Компонент для уведомлений:

```typescript
// src/components/Notifications.tsx
import React from 'react';
import { useNotifications } from '../hooks/useNotifications';

interface NotificationsProps {
  telegramId: string;
}

export const Notifications: React.FC<NotificationsProps> = ({ telegramId }) => {
  const { notifications, markAsRead, isLoading } = useNotifications(telegramId);

  if (isLoading) {
    return <div>Loading notifications...</div>;
  }

  return (
    <div className="notifications">
      <h3>Notifications</h3>
      
      {notifications.length === 0 ? (
        <div>No notifications</div>
      ) : (
        <div className="notifications-list">
          {notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`notification ${notification.isRead ? 'read' : 'unread'}`}
            >
              <div className="notification-header">
                <h4>{notification.title}</h4>
                <span className="notification-time">
                  {new Date(notification.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="notification-message">
                {notification.message}
              </div>
              {!notification.isRead && (
                <button 
                  onClick={() => markAsRead(notification.id)}
                  className="mark-read-btn"
                >
                  Mark as Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## 🎯 ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ

### Главная страница приложения:

```typescript
// src/pages/Dashboard.tsx
import React from 'react';
import { useTelegramAuth } from '../hooks/useTelegramAuth';
import { useUserData } from '../hooks/useUserData';
import { useRealTimeIncome } from '../hooks/useRealTimeIncome';
import { RealTimeIncome } from '../components/RealTimeIncome';
import { CurrencySwap } from '../components/CurrencySwap';
import { Notifications } from '../components/Notifications';

export const Dashboard: React.FC = () => {
  const { user, isLoading: authLoading } = useTelegramAuth();
  const { userData, isLoading: userLoading } = useUserData(user?.id.toString() || '');
  const { income } = useRealTimeIncome(user?.id.toString() || '');

  if (authLoading || userLoading) {
    return <div>Loading...</div>;
  }

  if (!user || !userData) {
    return <div>User not found</div>;
  }

  return (
    <div className="dashboard">
      <header>
        <h1>Welcome, {user.first_name}!</h1>
        <div className="user-balance">
          <span>USD Balance: {userData.user.wallets.find(w => w.currency === 'USD')?.balance.toFixed(4)}</span>
          <span>MNE Balance: {userData.user.wallets.find(w => w.currency === 'MNE')?.balance.toFixed(4)}</span>
        </div>
      </header>

      <main>
        <RealTimeIncome telegramId={user.id.toString()} />
        <CurrencySwap telegramId={user.id.toString()} />
        <Notifications telegramId={user.id.toString()} />
      </main>
    </div>
  );
};
```

### Страница слотов:

```typescript
// src/pages/Slots.tsx
import React from 'react';
import { useTelegramAuth } from '../hooks/useTelegramAuth';
import { useSlots } from '../hooks/useSlots';
import { useSlotActions } from '../hooks/useSlotActions';

export const Slots: React.FC = () => {
  const { user } = useTelegramAuth();
  const { slots, isLoading } = useSlots(user?.id.toString() || '');
  const { buySlot, extendSlot, upgradeSlot, claimEarnings, isLoading: actionLoading } = useSlotActions(user?.id.toString() || '');

  const handleBuySlot = async (amount: number) => {
    try {
      await buySlot(amount);
      alert('Slot purchased successfully!');
    } catch (error) {
      alert('Failed to buy slot: ' + error.message);
    }
  };

  if (isLoading) {
    return <div>Loading slots...</div>;
  }

  return (
    <div className="slots-page">
      <h2>Mining Slots</h2>
      
      <div className="slots-list">
        {slots.map(slot => (
          <div key={slot.id} className={`slot ${slot.isLocked ? 'locked' : ''}`}>
            <div className="slot-info">
              <h3>Slot #{slot.id.slice(-6)}</h3>
              <p>Type: {slot.type}</p>
              <p>Principal: {slot.principal} USD</p>
              <p>Rate: {(slot.effectiveWeeklyRate * 100).toFixed(1)}%</p>
              <p>Expires: {new Date(slot.expiresAt).toLocaleString()}</p>
              {slot.isLocked && <p className="locked-indicator">🔒 Locked</p>}
            </div>
            
            <div className="slot-actions">
              {!slot.isLocked && (
                <>
                  <button onClick={() => extendSlot(slot.id)} disabled={actionLoading}>
                    Extend
                  </button>
                  <button onClick={() => upgradeSlot(slot.id, 10)} disabled={actionLoading}>
                    Upgrade
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="buy-slot">
        <h3>Buy New Slot</h3>
        <button onClick={() => handleBuySlot(10)} disabled={actionLoading}>
          Buy 10 USD Slot
        </button>
        <button onClick={() => handleBuySlot(100)} disabled={actionLoading}>
          Buy 100 USD Premium Slot
        </button>
      </div>

      <div className="claim-section">
        <button onClick={claimEarnings} disabled={actionLoading}>
          Claim All Earnings
        </button>
      </div>
    </div>
  );
};
```

---

## 🎨 СТИЛИ CSS

### Базовые стили:

```css
/* src/styles/components.css */
.real-time-income {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
}

.income-display {
  display: flex;
  justify-content: space-between;
  margin: 10px 0;
}

.current-income, .projected-income {
  font-weight: bold;
  color: #2e7d32;
}

.slot {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin: 10px 0;
  background: white;
}

.slot.locked {
  background: #fff3e0;
  border-color: #ff9800;
}

.slot-locked {
  color: #ff9800;
  font-weight: bold;
}

.currency-swap {
  background: #e3f2fd;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
}

.swap-controls {
  display: flex;
  gap: 10px;
  align-items: center;
  margin: 15px 0;
}

.notification {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin: 10px 0;
  background: white;
}

.notification.unread {
  background: #e8f5e8;
  border-color: #4caf50;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.mark-read-btn {
  background: #4caf50;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
}

.mark-read-btn:hover {
  background: #45a049;
}
```

---

## 🚀 ЗАКЛЮЧЕНИЕ

Данные примеры показывают, как интегрировать API с React приложением:

- **Хуки** для управления состоянием
- **Компоненты** для отображения данных
- **Обработка ошибок** и загрузки
- **WebSocket** для реального времени
- **Стили** для красивого интерфейса

Все примеры готовы к использованию и могут быть адаптированы под конкретные потребности приложения.

