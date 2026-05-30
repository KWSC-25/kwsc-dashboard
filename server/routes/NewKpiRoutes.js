import express from 'express';
import { TodayStats } from '../controllers/NewKpiController.js';

const router = express.Router();

router.get('/today-stats', TodayStats);

export default router;