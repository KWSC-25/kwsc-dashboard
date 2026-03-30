import express from 'express';
import { getRedZoneViolations } from '../controllers/redZoneController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.get('/redzone-violations', protect, getRedZoneViolations);

export default router;