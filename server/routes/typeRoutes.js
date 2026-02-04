import express from 'express';
import { getTypesData } from '../controllers/typeController.js';

const router = express.Router();
router.get('/', getTypesData);

export default router;  