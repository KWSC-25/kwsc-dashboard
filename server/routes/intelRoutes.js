import express from 'express';
import { getIntelData } from '../controllers/intelController.js';

const router = express.Router();

router.get('/stats', getIntelData);

export default router;