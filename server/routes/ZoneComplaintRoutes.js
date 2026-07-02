import express from 'express';
import { getZoneKpiStats, getActiveComplaintTypes, getZoneWisePendingMatrix, getZoneWiseResolvedMatrix, getMapComplaintDistribution, getComplaintBreakdownDetails } from '../controllers/ZoneComplaintController.js';

const router = express.Router();

// Operational metrics execution pipelines
router.get('/kpi-stats', getZoneKpiStats);
router.get('/types', getActiveComplaintTypes);
router.get('/zone-matrix', getZoneWisePendingMatrix);
router.get('/zone-resolved-matrix', getZoneWiseResolvedMatrix);
router.get('/map-distribution', getMapComplaintDistribution);
router.get('/zone-complaint-breakdown', getComplaintBreakdownDetails)

export default router;