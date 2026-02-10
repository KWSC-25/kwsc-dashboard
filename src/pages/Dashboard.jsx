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
                const [kpi, wP, sP, wI, sI, topP, cWater, cSew, aRes] = await Promise.all([
                    api.get('/kpis/stats'), 
                    api.get('/performance/underperforming?typeId=2'),
                    api.get('/performance/underperforming?typeId=1'),
                    api.get('/type?typeId=2&subTypeIds=1,13,16'), 
                    api.get('/type?typeId=1&subTypeIds=21,108'), 
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
        const interval = setInterval(fetchData, 30000); 
        return () => clearInterval(interval);
    }, []);

    if (!stats || !stats.mainKpis || !stats.todaystats) {
        return <div className="loading">Loading Dashboard...</div>;
    }

    return (
        <div className="dashboard-fixed-container">
            <Header />
            <div className="content-padding main-scroll-area">
                {/* TOP SECTION: KPI CARDS */}
                <KpiCards stats={stats.mainKpis} assignments={stats.assignmentStats} today={stats.todaystats} />
                
                {/* MIDDLE SECTION: TABLES */}
                <div className="grid-3">
                    <UnderperformingTable title="UNDERPERFORMING (WATER)" data={waterPerf} TypeData={waterType} typeColor="#38bdf8" iconClass="fas fa-tint" />
                    <UnderperformingTable title="UNDERPERFORMING (SEWERAGE)" data={sewerPerf} TypeData={sewerType} typeColor="#a78bfa" iconClass="fas fa-biohazard" />
                    <div className="panel" style={{ padding: '15px' }}>
                        <TopPerformersTable title="TOP (WATER)" data={topPerformers.waterBest} />
                        <TopPerformersTable title="TOP (SEWERAGE)" data={topPerformers.sewBest} />
                    </div>
                </div>

                {/* BOTTOM SECTION: CHARTS */}
                <div className="charts-bottom-section">
                    {/* <h1 className="section-divider-title">TOWN PERFORMANCE ANALYTICS</h1> */}
                    <TownCharts 
                        waterData={waterChartData} 
                        sewData={sewChartData} 
                        avgStats={avgStats} 
                        isFullView={false} 
                    />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;