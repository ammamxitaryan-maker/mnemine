"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../prisma"));
const router = (0, express_1.Router)();
// GET /api/leaderboard
router.get('/', async (req, res) => {
    try {
        const topWallets = await prisma_1.default.wallet.findMany({ where: { currency: 'CFM' }, take: 10, orderBy: { balance: 'desc' }, include: { user: { select: { firstName: true, username: true } } } });
        const leaderboard = topWallets.map(w => ({ firstName: w.user.firstName || 'Anonymous', username: w.user.username, balance: w.balance }));
        res.status(200).json(leaderboard);
    }
    catch (error) {
        console.error('Error fetching leaderboard data:', error); // Added error logging
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
