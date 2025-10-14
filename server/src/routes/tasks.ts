import { Router } from 'express';
import { getTasks } from '../controllers/taskController.js'; // Corrected import path
import { authenticateUser, extractUserIdFromParams } from '../middleware-stubs.js';

const router = Router();

// GET /api/tasks/:telegramId - with authentication
router.get('/:telegramId', authenticateUser, extractUserIdFromParams, getTasks);

export default router;