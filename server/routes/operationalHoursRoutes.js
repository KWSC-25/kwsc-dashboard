import express from 'express';
import { getHydrantOperationalStatus } from '../controllers/operationalHoursController.js';

const router = express.Router();

// Apply protect middleware to ensure only logged-in users see the dashboard data
router.get('/operational-status', getHydrantOperationalStatus);

export default router;