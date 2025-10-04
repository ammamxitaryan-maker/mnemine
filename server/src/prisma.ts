import { PrismaClient } from '@prisma/client';

// Ensure DATABASE_URL is set before creating PrismaClient
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://mnemine_user:2DpMhmihzMUXfaVlksxOaWvYvNlB2YtL@dpg-d38dq93e5dus73a34u3g-a.oregon-postgres.render.com/mnemine_zupy';
}

const prisma = new PrismaClient({
  // Увеличиваем таймаут для интерактивных транзакций, чтобы избежать ошибок Socket timeout
  transactionOptions: {
    maxWait: 20000, // Максимальное время ожидания для получения транзакции (в мс)
    timeout: 20000, // Максимальное время выполнения самой транзакции (в мс)
  },
  // Production optimizations
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

export default prisma;