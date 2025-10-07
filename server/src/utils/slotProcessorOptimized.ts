import prisma from '../prisma.js';
import { processExpiredSlots } from '../controllers/slotController.js';
import { Wallet, ActivityLogType } from '@prisma/client';

// Конфигурация для оптимизированной обработки
const PROCESSING_CONFIG = {
  BATCH_SIZE: 100,           // Размер батча
  MAX_CONCURRENT_BATCHES: 3, // Максимум параллельных батчей
  BATCH_DELAY_MS: 100,       // Задержка между батчами
  MAX_PROCESSING_TIME_MS: 4 * 60 * 1000, // Максимум 4 минуты на обработку
  RETRY_ATTEMPTS: 3,         // Количество попыток при ошибке
  RETRY_DELAY_MS: 1000,      // Задержка между попытками
};

// Статистика обработки
interface ProcessingStats {
  totalSlots: number;
  processedSlots: number;
  failedSlots: number;
  processingTimeMs: number;
  batchesProcessed: number;
  errors: string[];
}

// Кэш для часто используемых данных
const userWalletCache = new Map<string, Wallet>();

// Оптимизированная функция обработки слотов
export const processExpiredSlotsOptimized = async (): Promise<ProcessingStats> => {
  const startTime = Date.now();
  const stats: ProcessingStats = {
    totalSlots: 0,
    processedSlots: 0,
    failedSlots: 0,
    processingTimeMs: 0,
    batchesProcessed: 0,
    errors: []
  };

  try {
    console.log('🚀 Starting optimized slot processing...');
    
    // Получаем общее количество истекших слотов
    const totalExpiredSlots = await prisma.miningSlot.count({
      where: {
        isActive: true,
        expiresAt: { lte: new Date() }
      }
    });

    stats.totalSlots = totalExpiredSlots;
    console.log(`📊 Found ${totalExpiredSlots} expired slots to process`);

    if (totalExpiredSlots === 0) {
      console.log('✅ No expired slots found');
      return stats;
    }

    // Обрабатываем слоты батчами
    await processSlotsInBatches(stats);

    stats.processingTimeMs = Date.now() - startTime;
    
    console.log(`✅ Processing completed in ${stats.processingTimeMs}ms`);
    console.log(`📈 Stats: ${stats.processedSlots}/${stats.totalSlots} slots processed, ${stats.failedSlots} failed`);
    
    return stats;
  } catch (error) {
    console.error('❌ Critical error in slot processing:', error);
    stats.errors.push(`Critical error: ${error instanceof Error ? error.message : String(error)}`);
    return stats;
  }
};

// Обработка слотов батчами с оптимизациями
const processSlotsInBatches = async (stats: ProcessingStats) => {
  let offset = 0;
  const maxProcessingTime = Date.now() + PROCESSING_CONFIG.MAX_PROCESSING_TIME_MS;

  while (Date.now() < maxProcessingTime) {
    // Получаем следующий батч слотов
    const batch = await getNextSlotBatch(offset);
    
    if (batch.length === 0) {
      break; // Больше нет слотов для обработки
    }

    console.log(`🔄 Processing batch ${stats.batchesProcessed + 1}: ${batch.length} slots`);

    // Обрабатываем батч с повторными попытками
    const batchResult = await processBatchWithRetry(batch);
    
    stats.processedSlots += batchResult.processed;
    stats.failedSlots += batchResult.failed;
    stats.batchesProcessed++;
    stats.errors.push(...batchResult.errors);

    // Если это последний батч, выходим
    if (batch.length < PROCESSING_CONFIG.BATCH_SIZE) {
      break;
    }

    offset += PROCESSING_CONFIG.BATCH_SIZE;

    // Пауза между батчами для снижения нагрузки
    await new Promise(resolve => setTimeout(resolve, PROCESSING_CONFIG.BATCH_DELAY_MS));
  }
};

// Получение следующего батча слотов с оптимизацией
const getNextSlotBatch = async (offset: number) => {
  return await prisma.miningSlot.findMany({
    where: {
      isActive: true,
      expiresAt: { lte: new Date() }
    },
    select: {
      id: true,
      userId: true,
      principal: true,
      startAt: true,
      effectiveWeeklyRate: true,
      user: {
        select: {
          id: true,
          wallets: {
            where: { currency: 'USD' },
            select: { id: true, balance: true }
          }
        }
      }
    },
    take: PROCESSING_CONFIG.BATCH_SIZE,
    skip: offset,
    orderBy: { expiresAt: 'asc' }
  });
};

// Обработка батча с повторными попытками
const processBatchWithRetry = async (slots: any[]) => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= PROCESSING_CONFIG.RETRY_ATTEMPTS; attempt++) {
    try {
      return await processSlotBatch(slots);
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ Batch processing attempt ${attempt} failed:`, error instanceof Error ? error.message : String(error));
      
      if (attempt < PROCESSING_CONFIG.RETRY_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, PROCESSING_CONFIG.RETRY_DELAY_MS));
      }
    }
  }

  // Если все попытки неудачны, возвращаем ошибку
  return {
    processed: 0,
    failed: slots.length,
    errors: [`Batch processing failed after ${PROCESSING_CONFIG.RETRY_ATTEMPTS} attempts: ${lastError?.message}`]
  };
};

// Обработка одного батча слотов
const processSlotBatch = async (slots: any[]) => {
  const results = {
    processed: 0,
    failed: 0,
    errors: [] as string[]
  };

  // Группируем слоты по пользователям для оптимизации транзакций
  const slotsByUser = new Map<string, any[]>();
  
  for (const slot of slots) {
    if (!slotsByUser.has(slot.userId)) {
      slotsByUser.set(slot.userId, []);
    }
    slotsByUser.get(slot.userId)!.push(slot);
  }

  // Обрабатываем слоты по пользователям
  for (const [userId, userSlots] of slotsByUser) {
    try {
      await processUserSlots(userId, userSlots);
      results.processed += userSlots.length;
    } catch (error) {
      results.failed += userSlots.length;
      results.errors.push(`Failed to process slots for user ${userId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return results;
};

// Обработка слотов одного пользователя
const processUserSlots = async (userId: string, slots: any[]) => {
  const now = new Date();
  const MNEWallet = slots[0].user.wallets.find((w: Wallet) => w.currency === 'MNE');
  
  if (!MNEWallet) {
    throw new Error(`MNE wallet not found for user ${userId}`);
  }

  // Рассчитываем общий доход для всех слотов пользователя
  let totalEarnings = 0;
  const slotUpdates: any[] = [];
  const activityLogs: any[] = [];

  for (const slot of slots) {
    // Рассчитываем доход с момента покупки слота (всегда 30%)
    const totalTimeElapsedMs = now.getTime() - slot.startAt.getTime();
    const weeklyRate = 0.3; // Always 30% for all slots
    const earnings = slot.principal * weeklyRate * (totalTimeElapsedMs / (7 * 24 * 60 * 60 * 1000));
    
    totalEarnings += earnings;
    
    slotUpdates.push({
      where: { id: slot.id },
      data: { 
        isActive: false,
        lastAccruedAt: now
      }
    });

    activityLogs.push({
      userId: slot.userId,
      type: ActivityLogType.CLAIM,
      amount: earnings,
      description: `Automatic slot closure - earned ${earnings.toFixed(4)} MNE from ${slot.principal} MNE investment`
    });
  }

  // Выполняем все операции в одной транзакции
  await prisma.$transaction([
    // Обновляем баланс пользователя
    prisma.wallet.update({
      where: { id: MNEWallet.id },
      data: { balance: { increment: totalEarnings } }
    }),
    
    // Обновляем все слоты пользователя
    ...slotUpdates.map(update => prisma.miningSlot.update(update)),
    
    // Создаем записи в логе активности
    ...activityLogs.map(log => prisma.activityLog.create({ data: log }))
  ]);

  // Отправляем уведомления асинхронно
  for (const slot of slots) {
    const totalTimeElapsedMs = now.getTime() - slot.startAt.getTime();
    const earnings = slot.principal * slot.effectiveWeeklyRate * (totalTimeElapsedMs / (7 * 24 * 60 * 60 * 1000));
    
    // Асинхронная отправка уведомления
    sendSlotClosedNotificationAsync(userId, slot.id, earnings);
  }
};

// Асинхронная отправка уведомления
const sendSlotClosedNotificationAsync = async (userId: string, slotId: string, earnings: number) => {
  try {
    // Импортируем функцию уведомления
    const { sendSlotClosedNotification } = await import('../controllers/notificationController.js');
    await sendSlotClosedNotification(userId, slotId, earnings);
  } catch (error) {
    console.error(`Failed to send notification for slot ${slotId}:`, error);
  }
};

// Мониторинг производительности
export const getProcessingMetrics = async () => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  const metrics = await prisma.activityLog.aggregate({
    where: {
      type: ActivityLogType.CLAIM,
      createdAt: { gte: oneHourAgo },
      description: { contains: 'Automatic slot closure' }
    },
    _count: { id: true },
    _sum: { amount: true }
  });

  return {
    slotsProcessedLastHour: metrics._count.id || 0,
    totalEarningsLastHour: metrics._sum.amount || 0,
    averageEarningsPerSlot: metrics._count.id > 0 ? (metrics._sum.amount || 0) / metrics._count.id : 0
  };
};

// Очистка кэша
export const clearUserWalletCache = () => {
  userWalletCache.clear();
};

// Получение статистики обработки
export const getProcessingStats = async () => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const stats = await prisma.activityLog.groupBy({
    by: ['type'],
    where: {
      type: ActivityLogType.CLAIM,
      createdAt: { gte: oneDayAgo },
      description: { contains: 'Automatic slot closure' }
    },
    _count: { id: true },
    _sum: { amount: true }
  });

  return {
    totalSlotsProcessed: stats[0]?._count.id || 0,
    totalEarningsDistributed: stats[0]?._sum.amount || 0,
    averageEarningsPerSlot: stats[0]?._count.id > 0 ? (stats[0]?._sum.amount || 0) / stats[0]?._count.id : 0
  };
};

