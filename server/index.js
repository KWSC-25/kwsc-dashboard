/* global process */
import express from 'express';
import cors from 'cors';
import kpiRoutes from './routes/kpiRoutes.js';
import intelRoutes from './routes/intelRoutes.js'
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

import { protect } from './middleware/authMiddleware.js';
import { login } from './controllers/authController.js';
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 15 minutes
    max: 3, 
    message: { message: "Security Lock: Too many attempts. Please wait." }
});



const app = express();
app.use(cors());
app.use(express.json());
app.post('/api/login', loginLimiter, login);
// Specific Route for KPI section
app.use('/api/kpis',protect, kpiRoutes);
app.use('/api/intel',protect, intelRoutes);
app.use('/api/performance',protect, performanceRoutes);
app.use('/api/type',protect, typeRoutes);
app.use('/api/charts',protect, chartRoutes);
app.use('/api',protect, sourceSliderRoutes);
app.use('/api/towns',protect, townRoutes);
app.use('/api/source',protect, sourceRoutes);
app.use('/api/type/breakdown', protect,getSubtypeTownBreakdown);
app.use('/api/pending-breakdown', protect,getKpiTypeBreakdown);
app.use('/api', protect, hmpKpiRoutes);
app.use('/api', protect, hydPerfRoutes);
app.use('/api/graph', protect, appGraphRoutes);
app.use('/api/aging',protect, agingRoutes);
app.use('/api/orders',protect, orderSummaryRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on ${PORT}`));



