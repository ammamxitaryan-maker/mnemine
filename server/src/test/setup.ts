import { vi, afterAll } from 'vitest';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '0';
process.env.TELEGRAM_BOT_TOKEN = 'test-token';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.BACKEND_URL = 'http://localhost:10112';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock process.exit to prevent tests from exiting
const originalExit = process.exit;
process.exit = vi.fn() as any;

// Restore original exit after tests
afterAll(() => {
  process.exit = originalExit;
});
