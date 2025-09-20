import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock Prisma
const mockPrisma = {
  $queryRaw: vi.fn(),
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  task: {
    upsert: vi.fn(),
  },
  booster: {
    upsert: vi.fn(),
  },
  wallet: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  miningSlots: {
    create: vi.fn(),
  },
};

vi.mock('./prisma', () => ({
  default: mockPrisma,
}));

// Mock WebSocket
vi.mock('./websocket/WebSocketServer', () => ({
  WebSocketServer: vi.fn().mockImplementation(() => ({
    // Mock WebSocket server methods
  })),
}));

// Mock Telegram bot
vi.mock('telegraf', () => ({
  Telegraf: vi.fn().mockImplementation(() => ({
    telegram: {
      setWebhook: vi.fn().mockResolvedValue(true),
    },
    webhookCallback: vi.fn().mockReturnValue(vi.fn()),
    start: vi.fn(),
  })),
}));

// Mock constants
vi.mock('./constants', () => ({
  tasks: [],
  boosters: [],
  BASE_STANDARD_SLOT_WEEKLY_RATE: 0.05,
  WELCOME_BONUS_AMOUNT: 100,
}));

// Mock helpers
vi.mock('./utils/helpers', () => ({
  generateUniqueReferralCode: vi.fn().mockResolvedValue('TEST123'),
}));

// Mock routes
vi.mock('./routes', () => ({
  default: express.Router(),
}));

describe('Backend Server', () => {
  let app: express.Application;

  beforeAll(async () => {
    // Set up environment variables
    process.env.NODE_ENV = 'test';
    process.env.PORT = '0'; // Use random port for tests
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    process.env.BACKEND_URL = 'http://localhost:10112';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start server successfully', async () => {
    // Mock successful database connection
    mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({ id: '1', telegramId: '6760298907' });
    mockPrisma.wallet.findFirst.mockResolvedValue(null);
    mockPrisma.wallet.create.mockResolvedValue({ id: '1', balance: 50000 });
    mockPrisma.miningSlots.create.mockResolvedValue({ id: '1' });

    // Import the app after mocks are set up
    const { default: createApp } = await import('./index');
    
    expect(createApp).toBeDefined();
  });

  it('should handle health check endpoint', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    
    const { default: createApp } = await import('./index');
    const response = await request(createApp).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
    expect(response.body.database).toBe('connected');
  });

  it('should handle database connection failure in health check', async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error('Database connection failed'));
    
    const { default: createApp } = await import('./index');
    const response = await request(createApp).get('/health');
    
    expect(response.status).toBe(503);
    expect(response.body.status).toBe('unhealthy');
    expect(response.body.database).toBe('disconnected');
  });

  it('should handle 404 errors', async () => {
    const { default: createApp } = await import('./index');
    const response = await request(createApp).get('/nonexistent');
    
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Route not found');
  });

  it('should apply rate limiting', async () => {
    const { default: createApp } = await import('./index');
    
    // Make multiple requests to trigger rate limiting
    const requests = Array(10).fill(null).map(() => 
      request(createApp).get('/api/test')
    );
    
    const responses = await Promise.all(requests);
    
    // Some requests should be rate limited
    const rateLimitedResponses = responses.filter((r: any) => r.status === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });
});
