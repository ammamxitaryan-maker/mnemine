import { Router } from 'express';
import { getTasks } from '../controllers/taskController'; // Corrected import path

const router = Router();

// GET /api/tasks/:telegramId
router.get('/:telegramId', getTasks);

export default router;