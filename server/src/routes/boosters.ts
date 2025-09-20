import { Router } from 'express';
import { getBoosters } from '../controllers/boosterController';

const router = Router();

// GET /api/boosters
router.get('/', getBoosters);

export default router;