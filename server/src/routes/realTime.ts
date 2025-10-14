import { Router } from 'express';
import { RealTimeController } from '../controllers/realTimeController.js';
import { realTimeMiddleware, rateLimitMiddleware, dataFreshnessMiddleware } from '../middleware-stubs.js';

const router = Router();

// Apply real-time middleware to all routes
router.use(realTimeMiddleware);
router.use(rateLimitMiddleware(200, 60000)); // 200 requests per minute

// Real-time user data endpoint
router.get('/user/:telegramId', 
  dataFreshnessMiddleware(15000), // 15 seconds freshness
  RealTimeController.getUserData
);

// Real-time market data endpoint
router.get('/market', 
  dataFreshnessMiddleware(30000), // 30 seconds freshness
  RealTimeController.getMarketData
);

// Real-time slots data endpoint
router.get('/slots/:telegramId', 
  dataFreshnessMiddleware(10000), // 10 seconds freshness
  RealTimeController.getSlotsData
);

// Real-time activity feed endpoint
router.get('/activity/:telegramId', 
  dataFreshnessMiddleware(20000), // 20 seconds freshness
  RealTimeController.getActivityFeed
);

// Health check endpoint
router.get('/health', RealTimeController.healthCheck);

export default router;
