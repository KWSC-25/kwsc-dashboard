import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import Header from '../components/Header';
import KpiCards from '../components/KpiCards';
import UnderperformingTable from '../components/UnderperformingTable';
import TopPerformersTable from '../components/TopPerformersTable';
import TownCharts from '../components/TownCharts';
import TownTable from '../components/TownTable';
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
    const [townWaterStats, setTownWaterStats] = useState([]);
    const [townSewStats, setTownSewStats] = useState([]);    
    // SLIDER STATE
    const [activeSlide, setActiveSlide] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [kpi, wP, sP, wI, sI, topP, cWater, cSew, aRes,tWater,tSew] = await Promise.all([
                    api.get('/kpis/stats'), 
                    api.get('/performance/underperforming?typeId=2'),
                    api.get('/performance/underperforming?typeId=1'),
                    api.get('/type?typeId=2&subTypeIds=1,13,16'), 
                    api.get('/type?typeId=1&subTypeIds=21,108'), 
                    api.get('/performance/top-performers'),
                    api.get('/charts/town-wise?typeId=2'),
                    api.get('/charts/town-wise?typeId=1'),
                    api.get('/charts/avg-resolution'),
                    api.get('/towns/town-stats?typeId=2'), 
                    api.get('/towns/town-stats?typeId=1')
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
                setTownWaterStats(tWater.data);
                setTownSewStats(tSew.data);
            } catch (err) {
                console.error("Fetch Error:", err);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000); 
        return () => clearInterval(interval);
    }, []);

    // DYNAMIC SLIDER LOGIC
    useEffect(() => {
        const durations = [60000, 20000]; // 60s for Slide 1, 20s for Slide 2
        const timer = setTimeout(() => {
            setActiveSlide((prev) => (prev === 0 ? 1 : 0));
        }, durations[activeSlide]);

        return () => clearTimeout(timer);
    }, [activeSlide]);

    if (!stats || !stats.mainKpis || !stats.todaystats) return <div className="loading">Loading CEO Dashboard...</div>;

    return (
        <div className="dashboard-viewport">
            <div className="dashboard-stage" style={{ 
                transform: `translateX(-${activeSlide * 50}%)` 
            }}>
                
                {/* VIEW 1: MAIN DASHBOARD */}
                <div className="view-pane">
                    <Header />
                    <div className="content-padding">
                        <KpiCards 
                            stats={stats.mainKpis} 
                            assignments={stats.assignmentStats} 
                            today={stats.todaystats}
                        />
                        <div className="grid-3">
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
                        <TownTable waterData={townWaterStats} sewData={townSewStats} />
                    </div>
                </div>

                {/* VIEW 2: BIG TOWN CHARTS */}
                <div className="view-pane">
                    <div className="full-chart-header">
                        <h1>TOWN-WISE PERFORMANCE ANALYTICS</h1>
                        <div className="live-indicator"></div>
                    </div>
                    <TownCharts 
                        waterData={waterChartData} 
                        sewData={sewChartData} 
                        avgStats={avgStats} 
                        isFullView={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;