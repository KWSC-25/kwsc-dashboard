import express from 'express';
import { 
    checkMohtasibPermission, 
    createMohtasibRecord, 
    getUserMohtasibRecords, 
    updateMohtasibRecord, 
    deleteMohtasibRecord, 
    getAllMohtasibRecordsForDashboard
} from '../controllers/mohtasibController.js';

const router = express.Router();

router.get('/check-permission', checkMohtasibPermission);
router.post('/add', createMohtasibRecord);
router.get('/records', getUserMohtasibRecords);
router.put('/update/:id', updateMohtasibRecord);
router.delete('/delete/:id', deleteMohtasibRecord);
router.get('/all-records', getAllMohtasibRecordsForDashboard);

export default router;