import express from 'express';
import { getTypesData, getSubtypeTownBreakdown } from '../controllers/typeController.js';

const router = express.Router();
router.get('/', getTypesData);
router.get('/type/breakdown', getSubtypeTownBreakdown)

export default router;  