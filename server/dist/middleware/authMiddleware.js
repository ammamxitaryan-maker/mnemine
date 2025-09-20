"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const isAdmin = async (req, res, next) => {
    const { telegramId } = req.params;
    if (!telegramId) {
        return res.status(401).json({ error: 'Unauthorized: No user identifier provided.' });
    }
    try {
        const user = await prisma_1.default.user.findUnique({ where: { telegramId: String(telegramId) } });
        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Forbidden: Access denied.' });
        }
        next();
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error during authentication.' });
    }
};
exports.isAdmin = isAdmin;
