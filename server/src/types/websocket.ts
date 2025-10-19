/**
 * WebSocket types for real-time communication
 * Defines all WebSocket message types and events
 */

// Base WebSocket message structure
export interface WebSocketMessage<T = unknown> {
  type: string;
  data: T;
  timestamp: string;
  requestId?: string;
}

// WebSocket event types
export type WebSocketEventType =
  | 'USER_CONNECTED'
  | 'USER_DISCONNECTED'
  | 'EARNINGS_UPDATE'
  | 'BALANCE_UPDATE'
  | 'SLOT_UPDATE'
  | 'LOTTERY_UPDATE'
  | 'NOTIFICATION'
  | 'SYSTEM_MESSAGE'
  | 'ERROR'
  | 'PING'
  | 'PONG';

// Connection events
export interface UserConnectedEvent {
  type: 'USER_CONNECTED';
  data: {
    userId: string;
    telegramId: string;
    username: string | null;
    isOnline: boolean;
    connectedAt: string;
  };
}

export interface UserDisconnectedEvent {
  type: 'USER_DISCONNECTED';
  data: {
    userId: string;
    telegramId: string;
    disconnectedAt: string;
  };
}

// Earnings events
export interface EarningsUpdateEvent {
  type: 'EARNINGS_UPDATE';
  data: {
    userId: string;
    slotId: string;
    earnings: number;
    totalEarnings: number;
    currency: 'USD' | 'NON';
    timestamp: string;
  };
}

// Balance events
export interface BalanceUpdateEvent {
  type: 'BALANCE_UPDATE';
  data: {
    userId: string;
    currency: 'USD' | 'NON';
    newBalance: number;
    change: number;
    reason: string;
    timestamp: string;
  };
}

// Slot events
export interface SlotUpdateEvent {
  type: 'SLOT_UPDATE';
  data: {
    userId: string;
    slotId: string;
    status: 'ACTIVE' | 'EXPIRED' | 'CLAIMED' | 'LOCKED';
    earnings?: number;
    expiresAt?: string;
    timestamp: string;
  };
}

// Lottery events
export interface LotteryUpdateEvent {
  type: 'LOTTERY_UPDATE';
  data: {
    lotteryId: string;
    event: 'DRAW_STARTED' | 'DRAW_COMPLETED' | 'TICKET_PURCHASED' | 'WINNER_ANNOUNCED';
    jackpot?: number;
    winningNumbers?: string;
    winners?: Array<{
      userId: string;
      username: string | null;
      prizeAmount: number;
    }>;
    timestamp: string;
  };
}

// Notification events
export interface NotificationEvent {
  type: 'NOTIFICATION';
  data: {
    userId: string;
    notificationId: string;
    title: string;
    message: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    category: 'SYSTEM' | 'BUSINESS' | 'SECURITY' | 'PROMOTION';
    timestamp: string;
  };
}

// System message events
export interface SystemMessageEvent {
  type: 'SYSTEM_MESSAGE';
  data: {
    message: string;
    level: 'INFO' | 'WARNING' | 'ERROR';
    category: 'MAINTENANCE' | 'UPDATE' | 'ANNOUNCEMENT' | 'ALERT';
    timestamp: string;
  };
}

// Error events
export interface ErrorEvent {
  type: 'ERROR';
  data: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
  };
}

// Ping/Pong events
export interface PingEvent {
  type: 'PING';
  data: {
    timestamp: string;
  };
}

export interface PongEvent {
  type: 'PONG';
  data: {
    timestamp: string;
    serverTime: string;
  };
}

// Union type for all WebSocket events
export type WebSocketEvent =
  | UserConnectedEvent
  | UserDisconnectedEvent
  | EarningsUpdateEvent
  | BalanceUpdateEvent
  | SlotUpdateEvent
  | LotteryUpdateEvent
  | NotificationEvent
  | SystemMessageEvent
  | ErrorEvent
  | PingEvent
  | PongEvent;

// WebSocket connection info
export interface WebSocketConnection {
  id: string;
  userId: string;
  telegramId: string;
  connectedAt: Date;
  lastPingAt: Date;
  isAlive: boolean;
  subscriptions: Set<string>;
}

// WebSocket subscription types
export type SubscriptionType =
  | 'USER_UPDATES'
  | 'EARNINGS'
  | 'BALANCE'
  | 'SLOTS'
  | 'LOTTERY'
  | 'NOTIFICATIONS'
  | 'SYSTEM_MESSAGES'
  | 'LEADERBOARD';

// WebSocket message handlers
export interface WebSocketMessageHandler<T = unknown> {
  (message: WebSocketMessage<T>, connection: WebSocketConnection): Promise<void> | void;
}

// WebSocket event emitter
export interface WebSocketEventEmitter {
  emit(event: WebSocketEvent): void;
  emitToUser(userId: string, event: WebSocketEvent): void;
  emitToAll(event: WebSocketEvent): void;
  emitToSubscribers(subscription: SubscriptionType, event: WebSocketEvent): void;
}

// WebSocket manager interface
export interface WebSocketManager {
  addConnection(connection: WebSocketConnection): void;
  removeConnection(connectionId: string): void;
  getConnection(connectionId: string): WebSocketConnection | undefined;
  getConnectionsByUser(userId: string): WebSocketConnection[];
  subscribe(connectionId: string, subscription: SubscriptionType): void;
  unsubscribe(connectionId: string, subscription: SubscriptionType): void;
  broadcast(event: WebSocketEvent): void;
  broadcastToUser(userId: string, event: WebSocketEvent): void;
  broadcastToSubscribers(subscription: SubscriptionType, event: WebSocketEvent): void;
  ping(connectionId: string): void;
  pong(connectionId: string): void;
  isAlive(connectionId: string): boolean;
  getStats(): {
    totalConnections: number;
    activeConnections: number;
    usersOnline: number;
    subscriptions: Record<SubscriptionType, number>;
  };
}

// Type guards
export const isWebSocketMessage = (data: unknown): data is WebSocketMessage => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    'data' in data &&
    'timestamp' in data
  );
};

export const isEarningsUpdateEvent = (event: WebSocketEvent): event is EarningsUpdateEvent => {
  return event.type === 'EARNINGS_UPDATE';
};

export const isBalanceUpdateEvent = (event: WebSocketEvent): event is BalanceUpdateEvent => {
  return event.type === 'BALANCE_UPDATE';
};

export const isSlotUpdateEvent = (event: WebSocketEvent): event is SlotUpdateEvent => {
  return event.type === 'SLOT_UPDATE';
};

export const isLotteryUpdateEvent = (event: WebSocketEvent): event is LotteryUpdateEvent => {
  return event.type === 'LOTTERY_UPDATE';
};

export const isNotificationEvent = (event: WebSocketEvent): event is NotificationEvent => {
  return event.type === 'NOTIFICATION';
};

export const isSystemMessageEvent = (event: WebSocketEvent): event is SystemMessageEvent => {
  return event.type === 'SYSTEM_MESSAGE';
};

export const isErrorEvent = (event: WebSocketEvent): event is ErrorEvent => {
  return event.type === 'ERROR';
};

// Helper functions for creating events
export const createEarningsUpdateEvent = (
  userId: string,
  slotId: string,
  earnings: number,
  totalEarnings: number,
  currency: 'USD' | 'NON'
): EarningsUpdateEvent => ({
  type: 'EARNINGS_UPDATE',
  data: {
    userId,
    slotId,
    earnings,
    totalEarnings,
    currency,
    timestamp: new Date().toISOString(),
  },
});

export const createBalanceUpdateEvent = (
  userId: string,
  currency: 'USD' | 'NON',
  newBalance: number,
  change: number,
  reason: string
): BalanceUpdateEvent => ({
  type: 'BALANCE_UPDATE',
  data: {
    userId,
    currency,
    newBalance,
    change,
    reason,
    timestamp: new Date().toISOString(),
  },
});

export const createNotificationEvent = (
  userId: string,
  notificationId: string,
  title: string,
  message: string,
  priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal',
  category: 'SYSTEM' | 'BUSINESS' | 'SECURITY' | 'PROMOTION' = 'SYSTEM'
): NotificationEvent => ({
  type: 'NOTIFICATION',
  data: {
    userId,
    notificationId,
    title,
    message,
    priority,
    category,
    timestamp: new Date().toISOString(),
  },
});

export const createSystemMessageEvent = (
  message: string,
  level: 'INFO' | 'WARNING' | 'ERROR' = 'INFO',
  category: 'MAINTENANCE' | 'UPDATE' | 'ANNOUNCEMENT' | 'ALERT' = 'ANNOUNCEMENT'
): SystemMessageEvent => ({
  type: 'SYSTEM_MESSAGE',
  data: {
    message,
    level,
    category,
    timestamp: new Date().toISOString(),
  },
});

export const createErrorEvent = (
  code: string,
  message: string,
  details?: Record<string, unknown>
): ErrorEvent => ({
  type: 'ERROR',
  data: {
    code,
    message,
    details,
    timestamp: new Date().toISOString(),
  },
});
