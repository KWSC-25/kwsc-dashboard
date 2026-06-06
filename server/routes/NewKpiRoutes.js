import express from 'express';
import { TodayStats } from '../controllers/NewKpiController.js';
import { OrderSummaryToday } from '../controllers/NewKpiController.js';
import { HydrantPerformanceGridToday, getPendingAgingDonutData, getTatLineChartData } from '../controllers/NewKpiController.js';
const router = express.Router();

router.get('/today-stats', TodayStats);
router.get('/order-summary', OrderSummaryToday);
router.get('/hydrant-performance', HydrantPerformanceGridToday);
router.get('/aging-donut', getPendingAgingDonutData);
router.get('/tatline-chart', getTatLineChartData);


export default router;