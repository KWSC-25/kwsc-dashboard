import express from 'express';
import { getDashboardCases } from '../controllers/lcmsDashboardController.js';

const router = express.Router();


router.get('/dashboard-cases', getDashboardCases);

export default router;