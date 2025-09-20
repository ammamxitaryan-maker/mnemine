"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taskController_1 = require("../controllers/taskController"); // Corrected import path
const router = (0, express_1.Router)();
// GET /api/tasks/:telegramId
router.get('/:telegramId', taskController_1.getTasks);
exports.default = router;
