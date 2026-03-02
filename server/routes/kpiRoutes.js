import express from 'express';
import { getKpiStats, getKpiTypeBreakdown } from '../controllers/kpiController.js';

const router = express.Router();

router.get('/stats', getKpiStats);
router.get('/type-breakdown', getKpiTypeBreakdown);

export default router;