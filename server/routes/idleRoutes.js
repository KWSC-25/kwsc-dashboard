import express from 'express';
import { getIdleComplaints } from '../controllers/idleController.js';

const router = express.Router();
router.get('/', getIdleComplaints);

export default router;