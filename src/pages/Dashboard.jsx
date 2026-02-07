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
    const [waterType, setWaterType] = useState([]);
    const [sewerType, setSewerType] = useState([]);
    const [topPerformers, setTopPerformers] = useState({ waterBest: [], sewBest: [] });
    
    const [waterChartData, setWaterChartData] = useState([]);
    const [sewChartData, setSewChartData] = useState([]);
    const [avgStats, setAvgStats] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
            // Inside your fetchData function, update the type calls:
            const [kpi, wP, sP, wI, sI, topP, cWater, cSew, aRes] = await Promise.all([
                api.get('/kpis/stats'), 
                api.get('/performance/underperforming?typeId=2'),
                api.get('/performance/underperforming?typeId=1'),
                // Pass the specific IDs here
                api.get('/type?typeId=2&subTypeIds=1,13,16'), // Water IDs
                api.get('/type?typeId=1&subTypeIds=21,108'), // Sew IDs
                api.get('/performance/top-performers'),
                api.get('/charts/town-wise?typeId=2'),
                api.get('/charts/town-wise?typeId=1'),
                api.get('/charts/avg-resolution')
            ]);

                setStats(kpi.data);
                setWaterPerf(wP.data);
                setSewerPerf(sP.data);
                setWaterType(wI.data);
                setSewerType(sI.data);
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

    if (!stats || !stats.mainKpis || !stats.todaystats) return <div className="loading">Loading CEO Dashboard...</div>;

    return (
        <div className="dashboard-wrapper">
            <Header />
            <KpiCards 
            stats={stats.mainKpis} 
            assignments={stats.assignmentStats} 
            today= {stats.todaystats}
            />            
            {/* Table Section */}
            <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', padding: '15px 0' }}>
                <UnderperformingTable 
                    title="UNDERPERFORMING ENGINEERS (WATER) LAST 3 MONTHS" 
                    data={waterPerf} TypeData={waterType}
                    typeColor="#38bdf8" iconClass="fas fa-tint" 
                />

                <UnderperformingTable 
                    title="UNDERPERFORMING ENGINEERS (SEWERAGE) LAST 3 MONTHS" 
                    data={sewerPerf} TypeData={sewerType}
                    typeColor="#a78bfa" iconClass="fas fa-biohazard" 
                />

                <div className="panel" style={{ padding: '15px' }}>
                    <TopPerformersTable title="TOP ENGINEERS (WATER) LAST 3 MONTHS" data={topPerformers.waterBest} />
                    <div style={{ height: '10px' }}></div>
                    <TopPerformersTable title="TOP ENGINEERS (SEWERAGE) LAST 3 MONTHS" data={topPerformers.sewBest} />
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