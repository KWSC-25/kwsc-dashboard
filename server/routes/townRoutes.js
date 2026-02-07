import express from 'express';
const router = express.Router();
// Use curly braces to import the specific function named above
import { getTownStats } from '../controllers/townController.js';

router.get('/town-stats', getTownStats);

export default router;