import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { 
    checkUploadPermission, 
    uploadMaterial, 
    getUserMaterials, 
    updateMaterial, 
    deleteMaterial, getAllMaterialsForDashboard
} from '../controllers/eciController.js';

const router = express.Router();

// Configure disk storage for PDFs
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/eci_materials/';
        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `eci-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// File filter to restrict to PDFs only
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed!'), false);
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// Existing permission check
router.get('/check-upload-permission', checkUploadPermission);

// New Material CRUD Routes
router.post('/upload', upload.single('pdf'), uploadMaterial);
router.get('/materials', getUserMaterials);
router.put('/update/:id', upload.single('pdf'), updateMaterial);
router.delete('/delete/:id', deleteMaterial);
router.get('/all-materials', getAllMaterialsForDashboard);
export default router;