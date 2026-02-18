import express from 'express';
import { getMobileAppTrend } from '../controllers/appGraphController.js';

const router = express.Router();

router.get('/mobile-app-trend', getMobileAppTrend);

export default router;