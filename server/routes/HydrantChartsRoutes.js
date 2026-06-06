import express from 'express';
import { getPendingAgingDonutData, getTatLineChartData } from '../controllers/HydrantChartsController.js';
const router = express.Router();

router.get('/aging-donut', getPendingAgingDonutData);
router.get('/tatline-chart', getTatLineChartData);


export default router;