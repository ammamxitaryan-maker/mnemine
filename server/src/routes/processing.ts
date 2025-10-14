import { Router } from 'express';
import { getProcessingMetricsController, runManualProcessing, getProcessingStatus, getProcessingQueue } from '../controllers/processingController.js';

const router = Router();

// GET /api/admin/processing/metrics - Метрики обработки
router.get('/admin/processing/metrics', getProcessingMetricsController);

// POST /api/admin/processing/run-manual - Ручной запуск обработки
router.post('/admin/processing/run-manual', runManualProcessing);

// GET /api/admin/processing/status - Статус системы обработки
router.get('/admin/processing/status', getProcessingStatus);

// GET /api/admin/processing/queue - Очередь обработки
router.get('/admin/processing/queue', getProcessingQueue);

export default router;
