import express from 'express';
import * as performanceController from '../controllers/performanceController.js';

const router = express.Router();

// Route for underperforming engineers
router.get('/underperforming', performanceController.getUnderperformingEngineers);
router.get('/top-performers', performanceController.getTopPerformers);
export default router;