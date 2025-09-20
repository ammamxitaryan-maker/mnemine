"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const boosterController_1 = require("../controllers/boosterController");
const router = (0, express_1.Router)();
// GET /api/boosters
router.get('/', boosterController_1.getBoosters);
exports.default = router;
