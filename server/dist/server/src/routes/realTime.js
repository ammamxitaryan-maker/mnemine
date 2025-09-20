"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const realTimeController_1 = require("../controllers/realTimeController");
const realTimeMiddleware_1 = require("../middleware/realTimeMiddleware");
const router = (0, express_1.Router)();
// Apply real-time middleware to all routes
router.use(realTimeMiddleware_1.realTimeMiddleware);
router.use((0, realTimeMiddleware_1.rateLimitMiddleware)(200, 60000)); // 200 requests per minute
// Real-time user data endpoint
router.get('/user/:telegramId', (0, realTimeMiddleware_1.dataFreshnessMiddleware)(15000), // 15 seconds freshness
realTimeController_1.RealTimeController.getUserData);
// Real-time market data endpoint
router.get('/market', (0, realTimeMiddleware_1.dataFreshnessMiddleware)(30000), // 30 seconds freshness
realTimeController_1.RealTimeController.getMarketData);
// Real-time slots data endpoint
router.get('/slots/:telegramId', (0, realTimeMiddleware_1.dataFreshnessMiddleware)(10000), // 10 seconds freshness
realTimeController_1.RealTimeController.getSlotsData);
// Real-time activity feed endpoint
router.get('/activity/:telegramId', (0, realTimeMiddleware_1.dataFreshnessMiddleware)(20000), // 20 seconds freshness
realTimeController_1.RealTimeController.getActivityFeed);
// Health check endpoint
router.get('/health', realTimeController_1.RealTimeController.healthCheck);
exports.default = router;
