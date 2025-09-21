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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const search = req.query.search;
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder || 'desc';
        const skip = (page - 1) * limit;
        // Build where clause for search
        const where = search ? {
            OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { username: { contains: search, mode: 'insensitive' } },
                { telegramId: { contains: search } }
            ]
        } : {};
        const [users, totalCount] = await Promise.all([
            prisma_1.default.user.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                select: dbSelects_1.userSelectForAdminList,
                skip,
                take: limit,
            }),
            prisma_1.default.user.count({ where })
        ]);
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
