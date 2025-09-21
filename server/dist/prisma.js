"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient({
    // Увеличиваем таймаут для интерактивных транзакций, чтобы избежать ошибок Socket timeout
    transactionOptions: {
        maxWait: 20000, // Максимальное время ожидания для получения транзакции (в мс)
        timeout: 20000, // Максимальное время выполнения самой транзакции (в мс)
    },
    // Production optimizations
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    // Use SQLite database file directly for local development
    datasources: {
        db: {
            url: "file:./prisma/dev.db",
        },
    },
});
exports.default = prisma;
