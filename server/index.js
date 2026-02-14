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
import asaniRoutes from './routes/asaniRoutes.js'; // Added this

const app = express();
app.use(cors());
app.use(express.json());

// Specific Route for KPI section
app.use('/api/kpis', kpiRoutes);
app.use('/api/intel', intelRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/type', typeRoutes);
app.use('/api/charts', chartRoutes);
app.use('/api', sourceSliderRoutes);
app.use('/api/towns', townRoutes);
app.use('/api/source', sourceRoutes);
app.use('/api', asaniRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on ${PORT}`));



