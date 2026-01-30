import express from 'express';
import { getKpiStats } from '../controllers/kpiController.js';

const router = express.Router();

router.get('/stats', getKpiStats);

export default router;