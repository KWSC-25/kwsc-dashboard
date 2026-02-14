import express from 'express';
const router = express.Router();
import { getTownStats, getTownDetails } from '../controllers/TownTableController.js'; // Must match export name

router.get('/town-stats', getTownStats);
router.get('/town-details', getTownDetails);

export default router;