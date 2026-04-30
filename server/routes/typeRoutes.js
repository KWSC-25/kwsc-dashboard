import express from 'express';
import { getTypesData, getSubtypeTownBreakdown, getAssignmentBreakdown } from '../controllers/typeController.js';

const router = express.Router();
router.get('/', getTypesData);
router.get('/type/breakdown', getSubtypeTownBreakdown)
router.get('/assignment-breakdown', getAssignmentBreakdown);

export default router;  