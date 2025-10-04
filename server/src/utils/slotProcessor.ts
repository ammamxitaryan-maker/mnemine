import { processExpiredSlots } from '../controllers/slotController.js';
import { processExpiredSlotsOptimized, getProcessingMetrics, getProcessingStats } from './slotProcessorOptimized.js';

// Конфигурация обработки
const PROCESSING_INTERVAL = 5 * 60 * 1000; // 5 минут
const METRICS_INTERVAL = 60 * 60 * 1000; // 1 час

// Запускаем оптимизированную обработку слотов каждые 5 минут
setInterval(async () => {
  try {
    console.log('🔄 Starting scheduled slot processing...');
    const stats = await processExpiredSlotsOptimized();
    
    // Логируем статистику
    console.log(`📊 Processing completed:`, {
      totalSlots: stats.totalSlots,
      processed: stats.processedSlots,
      failed: stats.failedSlots,
      processingTime: `${stats.processingTimeMs}ms`,
      batches: stats.batchesProcessed,
      errors: stats.errors.length
    });

    // Если есть ошибки, логируем их
    if (stats.errors.length > 0) {
      console.warn('⚠️ Processing errors:', stats.errors);
    }
  } catch (error) {
    console.error('❌ Critical error in scheduled processing:', error);
  }
}, PROCESSING_INTERVAL);

// Мониторинг метрик каждый час
setInterval(async () => {
  try {
    const metrics = await getProcessingMetrics();
    const stats = await getProcessingStats();
    
    console.log('📈 Processing metrics:', {
      lastHour: {
        slotsProcessed: metrics.slotsProcessedLastHour,
        totalEarnings: metrics.totalEarningsLastHour,
        averageEarnings: metrics.averageEarningsPerSlot
      },
      lastDay: {
        totalSlots: stats.totalSlotsProcessed,
        totalEarnings: stats.totalEarningsDistributed,
        averageEarnings: stats.averageEarningsPerSlot
      }
    });
  } catch (error) {
    console.error('❌ Error fetching processing metrics:', error);
  }
}, METRICS_INTERVAL);

console.log('🚀 Optimized slot processor started');
console.log(`⏰ Processing interval: ${PROCESSING_INTERVAL / 1000}s`);
console.log(`📊 Metrics interval: ${METRICS_INTERVAL / 1000}s`);
