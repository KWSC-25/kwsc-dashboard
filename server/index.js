/* global process */
import express from 'express';
import cors from 'cors';
import kpiRoutes from './routes/kpiRoutes.js';
import intelRoutes from './routes/intelRoutes.js'
import performanceRoutes from './routes/performanceRoutes.js';
import idleRoutes from './routes/idleRoutes.js';
const app = express();
app.use(cors());
app.use(express.json());

// Specific Route for KPI section
app.use('/api/kpis', kpiRoutes);
app.use('/api/intel', intelRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/idle', idleRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on ${PORT}`));