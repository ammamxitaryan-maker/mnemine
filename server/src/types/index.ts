/**
 * Centralized type exports for Mnemine server
 * Provides all types in a single import point
 */

import { Request, Response, NextFunction } from 'express';

// API types
export * from './api.js';

// Business logic types
export * from './business.js';

// WebSocket types
export * from './websocket.js';

// Re-export Prisma types for convenience
export type {
  User,
  Wallet,
  MiningSlot,
  Task,
  CompletedTask,
  ActivityLog,
  Lottery,
  LotteryTicket,
  ExchangeRate,
  SwapTransaction,
  Notification,
  UserRole,
  Investment,
  Withdrawal,
  ReferralEarning,
  DailyPayout,
  DailyPayoutDetail,
  AccountFreeze,
  InvestmentType,
  InvestmentStatus,
  WithdrawalStatus,
  WithdrawalType,
  ReferralEarningType,
  PayoutStatus,
  FreezeReason,
  ActivityLogType,
} from '@prisma/client';

// Common utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

// Database operation types
export type CreateData<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateData<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;
export type DatabaseEntity<T> = T & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

// Service response types
export type ServiceResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type ServiceResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

// Controller types
export interface ControllerRequest extends Request {
  user?: {
    id: string;
    telegramId: string;
    role: string;
  };
  requestId: string;
}

export interface ControllerResponse extends Response {
  // Add any custom response methods here
}

// Middleware types
export type MiddlewareFunction = (
  req: ControllerRequest,
  res: ControllerResponse,
  next: NextFunction
) => Promise<void> | void;

// Validation types
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
    value?: unknown;
  }>;
}

// Cache types
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  key?: string;
  tags?: string[];
}

export interface CacheManager {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  exists(key: string): Promise<boolean>;
}

// Event types
export interface DomainEvent {
  id: string;
  type: string;
  aggregateId: string;
  aggregateType: string;
  data: Record<string, unknown>;
  metadata: Record<string, unknown>;
  timestamp: Date;
  version: number;
}

export interface EventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>;
}

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): void;
  unsubscribe(eventType: string, handler: EventHandler<DomainEvent>): void;
}

// Configuration types
export interface AppConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  database: {
    url: string;
    maxConnections: number;
    connectionTimeout: number;
  };
  redis?: {
    url: string;
    password?: string;
  };
  telegram: {
    botToken: string;
    webhookUrl?: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  encryption: {
    key: string;
  };
  session: {
    secret: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  logging: {
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
    enableConsoleReplacement: boolean;
  };
}

// Health check types
export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  database: {
    status: 'connected' | 'disconnected' | 'error';
    responseTime?: number;
  };
  redis?: {
    status: 'connected' | 'disconnected' | 'error';
    responseTime?: number;
  };
  services: Record<string, {
    status: 'up' | 'down' | 'error';
    responseTime?: number;
    error?: string;
  }>;
}

// Performance monitoring types
export interface PerformanceMetrics {
  timestamp: string;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
  };
  database: {
    activeConnections: number;
    totalQueries: number;
    averageQueryTime: number;
    slowQueries: number;
  };
  cache: {
    hitRate: number;
    missRate: number;
    totalRequests: number;
  };
  api: {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    requestsPerSecond: number;
  };
}

// Security types
export interface SecurityEvent {
  type: 'SUSPICIOUS_ACTIVITY' | 'RATE_LIMIT_EXCEEDED' | 'INVALID_TOKEN' | 'UNAUTHORIZED_ACCESS';
  userId?: string;
  ip: string;
  userAgent: string;
  details: Record<string, unknown>;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SecurityManager {
  logEvent(event: SecurityEvent): Promise<void>;
  isBlocked(ip: string): Promise<boolean>;
  blockIp(ip: string, reason: string, duration?: number): Promise<void>;
  unblockIp(ip: string): Promise<void>;
  getSecurityReport(startDate: Date, endDate: Date): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    topIps: Array<{ ip: string; count: number }>;
    recentEvents: SecurityEvent[];
  }>;
}
