import { Router } from 'express';
import { getPerformanceMetrics, getHealthCheck, optimizePerformance } from '../controllers/performanceController.js';

const router = Router();

// Performance monitoring routes
router.get('/metrics', getPerformanceMetrics);
router.get('/health', getHealthCheck);
router.post('/optimize', optimizePerformance);

export default router;
