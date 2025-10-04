import { Router } from 'express';
import { adminLogin, verifyToken } from '../controllers/adminAuthController.js';

const router = Router();

// Аутентификация админа
router.post('/login', adminLogin);
router.get('/verify-token', verifyToken);

export default router;
