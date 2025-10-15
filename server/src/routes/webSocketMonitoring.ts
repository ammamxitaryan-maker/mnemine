import { Router } from 'express';
import { WebSocketMonitoringController } from '../controllers/webSocketMonitoringController.js';

const router = Router();

// WebSocket monitoring routes
router.get('/status', WebSocketMonitoringController.getWebSocketStatus);
router.get('/connections', WebSocketMonitoringController.getConnections);
router.get('/performance', WebSocketMonitoringController.getPerformanceMetrics);
router.get('/subscriptions', WebSocketMonitoringController.getSubscriptionStats);
router.get('/health', WebSocketMonitoringController.getHealthStatus);

// WebSocket management routes
router.post('/broadcast', WebSocketMonitoringController.sendBroadcast);
router.post('/disconnect', WebSocketMonitoringController.disconnectUser);
router.post('/config', WebSocketMonitoringController.updateConfiguration);
router.post('/cleanup', WebSocketMonitoringController.forceCleanup);

export default router;