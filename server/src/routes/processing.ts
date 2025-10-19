import { Router } from 'express';
import {
  getProcessingStats,
  processAllSlots,
  processExpiredSlots,
  processSlotManually
} from '../controllers/processingController.js';
import { isAdmin } from '../middleware-stubs.js';

const router = Router();

// Process all active mining slots
router.post('/process-all', isAdmin, processAllSlots);

// Process expired slots
router.post('/process-expired', isAdmin, processExpiredSlots);

// Get processing statistics
router.get('/stats', isAdmin, getProcessingStats);

// Manually process a specific slot
router.post('/process-slot/:slotId', isAdmin, processSlotManually);

export default router;