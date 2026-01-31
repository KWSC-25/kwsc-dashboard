import express from 'express';
import { getTownWiseStats, getAvgResolutionStats } from '../controllers/chartController.js';

const router = express.Router();

router.get('/town-wise', getTownWiseStats);
router.get('/avg-resolution', getAvgResolutionStats);

export default router;