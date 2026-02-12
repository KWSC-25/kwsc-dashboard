import express from 'express';
const router = express.Router();
import { getTownStats } from '../controllers/TownTableController.js'; // Must match export name

router.get('/town-stats', getTownStats);

export default router;