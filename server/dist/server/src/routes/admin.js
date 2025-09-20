"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// The middleware will extract the telegramId from the route params and verify the user is an admin.
router.get('/users/:telegramId', authMiddleware_1.isAdmin, adminController_1.getAllUsers);
router.get('/user/:userId/:telegramId', authMiddleware_1.isAdmin, adminController_1.getUserDetails);
exports.default = router;
