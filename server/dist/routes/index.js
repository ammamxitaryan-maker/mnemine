"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("./auth"));
const user_1 = __importDefault(require("./user"));
const tasks_1 = __importDefault(require("./tasks"));
const leaderboard_1 = __importDefault(require("./leaderboard"));
const boosters_1 = __importDefault(require("./boosters"));
const lottery_1 = __importDefault(require("./lottery"));
const admin_1 = __importDefault(require("./admin")); // Import admin routes
const realTime_1 = __importDefault(require("./realTime")); // Import real-time routes
const router = (0, express_1.Router)();
// Health check route
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
router.use('/auth', auth_1.default);
router.use('/user', user_1.default);
router.use('/tasks', tasks_1.default);
router.use('/leaderboard', leaderboard_1.default);
router.use('/boosters', boosters_1.default);
router.use('/lottery', lottery_1.default);
router.use('/admin', admin_1.default); // Add admin routes
router.use('/realtime', realTime_1.default); // Add real-time routes
exports.default = router;
