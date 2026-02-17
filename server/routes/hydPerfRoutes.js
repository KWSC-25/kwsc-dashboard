import express from 'express';
const router = express.Router();
import { getHydrantPerformance } from '../controllers/hydPerfController.js';
router.get('/hmp-performance', getHydrantPerformance);

export default router;