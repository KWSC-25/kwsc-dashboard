
import express from 'express';
import { getAsaniStats } from '../controllers/asaniController.js';

const router = express.Router();
router.get('/asani-stats', getAsaniStats);


export default router;