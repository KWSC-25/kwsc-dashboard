import express from 'express';
import { getHmpKpis } from '../controllers/hmpKpiController.js';

const router = express.Router();

router.get('/hmp-kpi', getHmpKpis);

export default router;