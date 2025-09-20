import { Router } from 'express';
import { getAllUsers, getUserDetails } from '../controllers/adminController';
import { isAdmin } from '../middleware/authMiddleware';

const router = Router();

// The middleware will extract the telegramId from the route params and verify the user is an admin.
router.get('/users/:telegramId', isAdmin, getAllUsers);
router.get('/user/:userId/:telegramId', isAdmin, getUserDetails);

export default router;