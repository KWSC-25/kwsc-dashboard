import express from 'express';
import { getSourceDetails } from '../controllers/SourcesDetailsController.js';
const router = express.Router();
router.get('/source-details', getSourceDetails);
export default router;