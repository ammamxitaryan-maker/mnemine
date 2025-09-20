"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBoosters = void 0;
const prisma_1 = __importDefault(require("../prisma"));
// GET /api/boosters
const getBoosters = async (req, res) => {
    try {
        const boosters = await prisma_1.default.booster.findMany({
            orderBy: { price: 'asc' },
        });
        res.status(200).json(boosters);
    }
    catch (error) {
        console.error('Error fetching boosters:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getBoosters = getBoosters;
