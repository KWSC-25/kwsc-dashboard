import express from 'express';
import { importLcmsExcel, getAllCases } from '../controllers/lcmsController.js';
import multer from 'multer';

const router = express.Router();

// Memory storage keeps the file in RAM for processing
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }); 

router.get('/all-cases', getAllCases);
router.post('/import-excel', upload.single('excel'), importLcmsExcel);

export default router;