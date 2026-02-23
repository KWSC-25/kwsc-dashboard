import express from 'express';
const router = express.Router();
import { getTownStats, getTownDetails } from '../controllers/TownTableController.js'; 

router.get('/town-stats', getTownStats);
router.get('/town-details', getTownDetails);

export default router;