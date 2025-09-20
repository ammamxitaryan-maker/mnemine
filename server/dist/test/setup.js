"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
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
    log: vitest_1.vi.fn(),
    warn: vitest_1.vi.fn(),
    error: vitest_1.vi.fn(),
};
// Mock process.exit to prevent tests from exiting
const originalExit = process.exit;
process.exit = vitest_1.vi.fn();
// Restore original exit after tests
(0, vitest_1.afterAll)(() => {
    process.exit = originalExit;
});
