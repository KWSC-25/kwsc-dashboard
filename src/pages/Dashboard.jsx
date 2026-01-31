import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import Header from '../components/Header';
import KpiCards from '../components/KpiCards';
import UnderperformingTable from '../components/UnderperformingTable';
import TopPerformersTable from '../components/TopPerformersTable';
import TownCharts from '../components/TownCharts';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [waterPerf, setWaterPerf] = useState([]);
    const [sewerPerf, setSewerPerf] = useState([]);
    const [waterIdle, setWaterIdle] = useState([]);
    const [sewerIdle, setSewerIdle] = useState([]);
    const [topPerformers, setTopPerformers] = useState({ waterBest: [], sewBest: [] });
    
    const [waterChartData, setWaterChartData] = useState([]);
    const [sewChartData, setSewChartData] = useState([]);
    const [avgStats, setAvgStats] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [kpi, wP, sP, wI, sI, topP, cWater, cSew, aRes] = await Promise.all([
                    api.get('/kpis/stats'),
                    api.get('/performance/underperforming?typeId=2'),
                    api.get('/performance/underperforming?typeId=1'),
                    api.get('/idle?typeId=2'),
                    api.get('/idle?typeId=1'),
                    api.get('/performance/top-performers'),
                    api.get('/charts/town-wise?typeId=2'), // Water Chart
                    api.get('/charts/town-wise?typeId=1'), // Sew Chart
                    api.get('/charts/avg-resolution')      // Avg Time
                ]);

                setStats(kpi.data);
                setWaterPerf(wP.data);
                setSewerPerf(sP.data);
                setWaterIdle(wI.data);
                setSewerIdle(sI.data);
                setTopPerformers(topP.data);
                setWaterChartData(cWater.data);
                setSewChartData(cSew.data);
                setAvgStats(aRes.data);
            } catch (err) {
                console.error("Fetch Error:", err);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000); 
        return () => clearInterval(interval);
    }, []);

    if (!stats) return <div className="loading">Loading CEO Dashboard...</div>;

    return (
        <div className="dashboard-wrapper">
            <Header />
            <KpiCards stats={stats} />
            
            {/* Table Section */}
            <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', padding: '15px 0' }}>
                <UnderperformingTable 
                    title="UNDERPERFORMING ENGINEERS (WATER)" 
                    data={waterPerf} idleData={waterIdle}
                    typeColor="#38bdf8" iconClass="fas fa-tint" 
                />

                <UnderperformingTable 
                    title="UNDERPERFORMING ENGINEERS (SEWERAGE)" 
                    data={sewerPerf} idleData={sewerIdle}
                    typeColor="#a78bfa" iconClass="fas fa-biohazard" 
                />

                <div className="panel" style={{ padding: '15px' }}>
                    <TopPerformersTable title="TOP ENGINEERS (WATER)" data={topPerformers.waterBest} />
                    <div style={{ height: '10px' }}></div>
                    <TopPerformersTable title="TOP ENGINEERS (SEWERAGE)" data={topPerformers.sewBest} />
                </div>
            </div>

            {/* NEW Chart Section */}
            <TownCharts 
                waterData={waterChartData} 
                sewData={sewChartData} 
                avgStats={avgStats} 
            />
        </div>
    );
};

export default Dashboard;