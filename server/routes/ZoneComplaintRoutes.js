import express from 'express';
import { getZoneKpiStats, getActiveComplaintTypes, getZoneWisePendingMatrix, getZoneWiseResolvedMatrix } from '../controllers/ZoneComplaintController.js';

const router = express.Router();

// Operational metrics execution pipelines
router.get('/kpi-stats', getZoneKpiStats);
router.get('/types', getActiveComplaintTypes);
router.get('/zone-matrix', getZoneWisePendingMatrix);
router.get('/zone-resolved-matrix', getZoneWiseResolvedMatrix)

export default router;