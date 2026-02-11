import express from 'express';
import { getSourceSliderData } from '../controllers/sourceSliderController.js';

const router = express.Router();
router.get('/source-slider', getSourceSliderData);

export default router;