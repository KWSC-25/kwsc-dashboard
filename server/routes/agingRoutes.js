import express from 'express';
const router = express.Router();
import { getDispatchAging } from '../controllers/AgingController.js';

router.get('/dispatch-stats',getDispatchAging);

export default router;