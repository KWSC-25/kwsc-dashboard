import express from 'express';
import { TodayStats } from '../controllers/NewKpiController.js';
import { OrderSummaryToday } from '../controllers/NewKpiController.js';
const router = express.Router();

router.get('/today-stats', TodayStats);
router.get('/order-summary', OrderSummaryToday);

export default router;