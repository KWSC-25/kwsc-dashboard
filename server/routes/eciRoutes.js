import express from 'express';
import { checkUploadPermission } from '../controllers/eciController.js';

const router = express.Router();

router.get('/check-upload-permission', checkUploadPermission);

export default router;