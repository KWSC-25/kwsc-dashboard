/* global process */
console.time('🚀 Total_Server_Startup');
import express from 'express';
import cors from 'cors';
import { dbSelector } from './middleware/dbSelector.js';
import kpiRoutes from './routes/kpiRoutes.js';
import intelRoutes from './routes/intelRoutes.js';
import performanceRoutes from './routes/performanceRoutes.js';
import typeRoutes from './routes/typeRoutes.js';
import chartRoutes from './routes/chartRoutes.js';
import sourceSliderRoutes from './routes/sourceSliderRoutes.js';
import townRoutes from './routes/TownTableRoutes.js';
import sourceRoutes from './routes/SourcesDetailsRoutes.js';
import { getSubtypeTownBreakdown } from './controllers/typeController.js';
import hmpKpiRoutes from './routes/hmpKpiRoutes.js';
import hydPerfRoutes from './routes/hydPerfRoutes.js';
import appGraphRoutes from './routes/appGraphRoutes.js';
import agingRoutes from './routes/agingRoutes.js';
import orderSummaryRoutes from './routes/orderSummaryRoutes.js';
import { getKpiTypeBreakdown } from './controllers/kpiController.js';
import { getAssignmentBreakdown } from './controllers/typeController.js';

import { protect } from './middleware/authMiddleware.js';
import { login, logout } from './controllers/authController.js'; // Added logout import
import rateLimit from 'express-rate-limit';
import userRoutes from './routes/userRoutes.js';
import redZoneRoutes from './routes/redZoneRoutes.js';
import operationalHoursRoutes from './routes/operationalHoursRoutes.js';
import lcmsRoutes from './routes/lcmsRoutes.js';
import LcmsDashboardRoutes from './routes/lcmsDashboardRoutes.js';
import newKpiRoutes from './routes/NewKpiRoutes.js';
import hydrantChartsRoutes from './routes/HydrantChartsRoutes.js';
import ZoneComplaintsRoutes from './routes/ZoneComplaintRoutes.js';
import eciRoutes from './routes/eciRoutes.js';
const loginLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, 
    max: 3, 
    message: { message: "Security Lock: Too many attempts. Please wait." }
});

const app = express();
app.use(cors());
app.use(express.json());

// Auth Endpoints
app.post('/api/login', loginLimiter, login);
app.post('/api/auth/logout', protect, logout); // Added explicit clean logout route

// Specific Route for KPI section
app.use('/api/kpis', protect, dbSelector, kpiRoutes);
app.use('/api/intel', protect, dbSelector, intelRoutes);
app.use('/api/performance', protect, dbSelector, performanceRoutes);
app.use('/api/type', protect, dbSelector, typeRoutes);
app.use('/api/charts', protect, dbSelector, chartRoutes);
app.use('/api', protect, dbSelector, sourceSliderRoutes);
app.use('/api/towns', protect, dbSelector, townRoutes);
app.use('/api/source', protect, dbSelector, sourceRoutes);
app.use('/api/type/breakdown', protect, dbSelector, getSubtypeTownBreakdown);
app.use('/api/type/assignment-breakdown', protect, dbSelector, getAssignmentBreakdown);
app.use('/api/pending-breakdown', protect, dbSelector, getKpiTypeBreakdown);
app.use('/api/hmpkpis', protect, dbSelector, hmpKpiRoutes);
app.use('/api/hyd-perf', protect, dbSelector, hydPerfRoutes);
app.use('/api/graph', protect, dbSelector, appGraphRoutes);
app.use('/api/aging', protect, dbSelector, agingRoutes);
app.use('/api/orders', protect, dbSelector, orderSummaryRoutes);
app.use('/api/admin/users', protect, dbSelector, userRoutes);
app.use('/api/redzone', protect, dbSelector, redZoneRoutes);
app.use('/api/hydrants', protect, dbSelector, operationalHoursRoutes);
app.use('/api/admin/lcms', protect, dbSelector, lcmsRoutes);
app.use('/api/lcmsDashboard', protect, dbSelector, LcmsDashboardRoutes);
app.use('/api/newkpis', protect, dbSelector, newKpiRoutes);
app.use('/api/hydrantCharts', protect, dbSelector, hydrantChartsRoutes);
app.use('/api/zone-complaints', protect, dbSelector, ZoneComplaintsRoutes);
app.use('/api/eci', protect, dbSelector, eciRoutes);



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    /* eslint-disable no-console */
    console.log(`🚀 Server on ${PORT}`);
    console.timeEnd('🚀 Total_Server_Startup');
    /* eslint-enable no-console */
});