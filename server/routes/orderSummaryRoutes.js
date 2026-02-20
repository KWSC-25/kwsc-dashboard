
import express from 'express';
import { getOrderSummary } from '../controllers/orderSummaryController.js';
import { getGallonSummaryReport } from '../controllers/orderSummaryController.js';
const router = express.Router();

router.get('/summary-report', getOrderSummary);
router.get('/gallon-summary-report' ,getGallonSummaryReport)

export default router;