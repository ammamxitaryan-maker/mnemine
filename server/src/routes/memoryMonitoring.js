import { Router } from 'express';
import { MemoryMonitoringController } from '../controllers/memoryMonitoringController.js';

const router = Router();

// Memory monitoring routes
router.get('/status', MemoryMonitoringController.getMemoryStatus);
router.post('/cleanup', MemoryMonitoringController.performMemoryCleanup);
router.post('/thresholds', MemoryMonitoringController.updateMemoryThresholds);
router.get('/history', MemoryMonitoringController.getMemoryHistory);
router.get('/trends', MemoryMonitoringController.getMemoryTrends);
router.get('/cache-info', MemoryMonitoringController.getCacheMemoryInfo);
router.post('/force-gc', MemoryMonitoringController.forceGarbageCollection);

export default router;
