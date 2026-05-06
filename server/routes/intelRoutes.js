import express from 'express';
// Add getSpecialSources to your imports
import { getIntelData, getSpecialSources } from '../controllers/intelController.js';

const router = express.Router();

// Existing route for the top Intel Cards
router.get('/stats', getIntelData);

// NEW route for your specialized right-hand column card
router.get('/special-sources', getSpecialSources);

export default router;