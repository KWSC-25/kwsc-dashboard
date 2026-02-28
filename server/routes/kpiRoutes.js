import express from 'express';
import { getKpiStats, getKpiTypeBreakdown } from '../controllers/kpiController.js';

const router = express.Router();

router.get('/stats', getKpiStats);
router.get('/pending-breakdown', getKpiTypeBreakdown);

export default router;