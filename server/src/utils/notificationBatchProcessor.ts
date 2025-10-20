import prisma from '../prisma.js';

// Конфигурация для batch-отправки уведомлений
const NOTIFICATION_CONFIG = {
  BATCH_SIZE: 100,                    // Размер батча для отправки
  MAX_CONCURRENT_BATCHES: 3,          // Максимум параллельных батчей
  BATCH_DELAY_MS: 200,                // Задержка между батчами
  MAX_PROCESSING_TIME_MS: 10 * 60 * 1000, // Максимум 10 минут на обработку
  RETRY_ATTEMPTS: 3,                  // Количество попыток при ошибке
  RETRY_DELAY_MS: 1000,               // Задержка между попытками
};

// Интерфейс для результата batch-отправки
interface BatchNotificationResult {
  sentCount: number;
  queuedCount: number;
  failedCount: number;
  errors: string[];
  processingTimeMs: number;
}

// Интерфейс для уведомления в очереди
interface QueuedNotification {
  userId: string;
  type: string;
  title: string;
  message: string;
  priority: number;
  scheduledFor?: Date;
}

// Очередь уведомлений в памяти
const notificationQueue: QueuedNotification[] = [];
let isProcessing = false;

// Отправка batch-уведомлений
export const sendBatchNotifications = async (
  userIds: string[], 
  type: string, 
  title: string, 
  message: string
): Promise<BatchNotificationResult> => {
  const startTime = Date.now();
  const result: BatchNotificationResult = {
    sentCount: 0,
    queuedCount: 0,
    failedCount: 0,
    errors: [],
    processingTimeMs: 0
  };

  try {
    console.log(`📢 Starting batch notification processing for ${userIds.length} users`);
    
    // Если пользователей много, добавляем в очередь
    if (userIds.length > 500) {
      const queuedNotifications = userIds.map(userId => ({
        userId,
        type,
        title,
        message,
        priority: 1, // Обычный приоритет
        scheduledFor: new Date()
      }));
      
      notificationQueue.push(...queuedNotifications);
      result.queuedCount = userIds.length;
      
      // Запускаем обработку очереди асинхронно
      processNotificationQueue();
      
      result.processingTimeMs = Date.now() - startTime;
      return result;
    }

    // Обрабатываем пользователей батчами
    await processUserBatches(userIds, type, title, message, result);
    
    result.processingTimeMs = Date.now() - startTime;
    
    console.log(`✅ Batch notification completed:`, {
      sent: result.sentCount,
      failed: result.failedCount,
      time: `${result.processingTimeMs}ms`,
      errors: result.errors.length
    });
    
    return result;
  } catch (error) {
    console.error('❌ Critical error in batch notification processing:', error);
    result.errors.push(`Critical error: ${error instanceof Error ? error.message : String(error)}`);
    result.processingTimeMs = Date.now() - startTime;
    return result;
  }
};

// Обработка пользователей батчами
const processUserBatches = async (
  userIds: string[], 
  type: string, 
  title: string, 
  message: string,
  result: BatchNotificationResult
) => {
  const batches = chunkArray(userIds, NOTIFICATION_CONFIG.BATCH_SIZE);
  let batchIndex = 0;

  for (const batch of batches) {
    try {
      console.log(`📤 Processing notification batch ${batchIndex + 1}/${batches.length}: ${batch.length} users`);
      
      const batchResult = await processNotificationBatch(batch, type, title, message);
      
      result.sentCount += batchResult.sent;
      result.failedCount += batchResult.failed;
      result.errors.push(...batchResult.errors);
      
      batchIndex++;
      
      // Пауза между батчами
      if (batchIndex < batches.length) {
        await new Promise(resolve => setTimeout(resolve, NOTIFICATION_CONFIG.BATCH_DELAY_MS));
      }
    } catch (error) {
      console.error(`❌ Error processing batch ${batchIndex + 1}:`, error);
      result.failedCount += batch.length;
      result.errors.push(`Batch ${batchIndex + 1} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

// Обработка одного батча уведомлений
const processNotificationBatch = async (
  userIds: string[], 
  type: string, 
  title: string, 
  message: string
) => {
  const result = { sent: 0, failed: 0, errors: [] as string[] };
  
  try {
    // Создаем уведомления для батча
    const notifications = userIds.map(userId => ({
      userId,
      type,
      title,
      message,
      isRead: false,
      createdAt: new Date()
    }));

    // Вставляем уведомления батчем
    await prisma.notification.createMany({
      data: notifications,
      skipDuplicates: true // Пропускаем дубликаты
    });

    result.sent = userIds.length;
    console.log(`✅ Batch processed: ${userIds.length} notifications sent`);
    
  } catch (error) {
    console.error('❌ Error in notification batch:', error);
    result.failed = userIds.length;
    result.errors.push(`Batch processing failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  return result;
};

// Обработка очереди уведомлений
const processNotificationQueue = async () => {
  if (isProcessing) {
    console.log('⏳ Notification queue is already being processed');
    return;
  }

  isProcessing = true;
  console.log(`🔄 Starting notification queue processing: ${notificationQueue.length} items`);

  try {
    while (notificationQueue.length > 0) {
      const batch = notificationQueue.splice(0, NOTIFICATION_CONFIG.BATCH_SIZE);
      
      if (batch.length === 0) break;

      console.log(`📤 Processing queue batch: ${batch.length} notifications`);
      
      // Группируем по типу уведомления для оптимизации
      const groupedNotifications = groupNotificationsByType(batch);
      
      for (const [, notifications] of groupedNotifications) {
        await processGroupedNotifications(notifications);
      }

      // Пауза между батчами
      if (notificationQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, NOTIFICATION_CONFIG.BATCH_DELAY_MS));
      }
    }

    console.log('✅ Notification queue processing completed');
  } catch (error) {
    console.error('❌ Error processing notification queue:', error);
  } finally {
    isProcessing = false;
  }
};

// Группировка уведомлений по типу
const groupNotificationsByType = (notifications: QueuedNotification[]) => {
  const grouped = new Map<string, QueuedNotification[]>();
  
  for (const notification of notifications) {
    if (!grouped.has(notification.type)) {
      grouped.set(notification.type, []);
    }
    grouped.get(notification.type)!.push(notification);
  }
  
  return grouped;
};

// Обработка сгруппированных уведомлений
const processGroupedNotifications = async (notifications: QueuedNotification[]) => {
  try {
    const dbNotifications = notifications.map(n => ({
      userId: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: false,
      createdAt: new Date()
    }));

    await prisma.notification.createMany({
      data: dbNotifications,
      skipDuplicates: true
    });

    console.log(`✅ Processed ${notifications.length} ${notifications[0].type} notifications`);
  } catch (error) {
    console.error('❌ Error processing grouped notifications:', error);
  }
};

// Разделение массива на чанки
const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

// Добавление уведомления в очередь
export const queueNotification = (notification: QueuedNotification) => {
  notificationQueue.push(notification);
  
  // Если очередь не обрабатывается, запускаем обработку
  if (!isProcessing) {
    processNotificationQueue();
  }
};

// Получение статистики очереди
export const getQueueStats = () => {
  return {
    queueLength: notificationQueue.length,
    isProcessing,
    config: NOTIFICATION_CONFIG
  };
};

// Очистка очереди
export const clearNotificationQueue = () => {
  notificationQueue.length = 0;
  console.log('🗑️ Notification queue cleared');
};

// Автоматическая обработка очереди каждые 30 секунд
setInterval(() => {
  if (notificationQueue.length > 0 && !isProcessing) {
    console.log(`⏰ Scheduled queue processing: ${notificationQueue.length} items`);
    processNotificationQueue();
  }
}, 30 * 1000);

console.log('📢 Notification batch processor initialized');
