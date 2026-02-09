import express from 'express';
import { getSourceDeepDive } from '../controllers/sourceSliderController.js';
const router = express.Router();
router.get('/deep-dive', getSourceDeepDive);
export default router;