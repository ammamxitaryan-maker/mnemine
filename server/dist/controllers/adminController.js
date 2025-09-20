"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserDetails = exports.getAllUsers = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const dbSelects_1 = require("../utils/dbSelects");
const getAllUsers = async (req, res) => {
    try {
        const users = await prisma_1.default.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: dbSelects_1.userSelectForAdminList,
        });
        res.status(200).json(users);
    }
    catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getAllUsers = getAllUsers;
const getUserDetails = async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                ...dbSelects_1.userSelect, // Spread the common user fields
                activityLogs: { orderBy: { createdAt: 'desc' }, take: 50 },
                referrals: { select: { id: true, firstName: true, username: true }, take: 10 },
                referredBy: { select: { id: true, firstName: true, username: true } },
            },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(user);
    }
    catch (error) {
        console.error(`Error fetching details for user ${userId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getUserDetails = getUserDetails;
