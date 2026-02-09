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
    const [sourceData, setSourceData] = useState([]);

    const [activeSlide, setActiveSlide] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [kpi, wP, sP, wI, sI, topP, cWater, cSew, aRes, tWater, tSew, sDeep] = await Promise.all([
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
                    api.get('/towns/town-stats?typeId=1'),
                    api.get('/sources/deep-dive')
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
                setSourceData(sDeep.data);
            } catch (err) {
                console.error("Fetch Error:", err);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 10000); 
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const durations = [200000, 1000, 30000]; 
        const timer = setTimeout(() => {
            setActiveSlide((prev) => (prev === 2 ? 0 : prev + 1));
        }, durations[activeSlide]);
        return () => clearTimeout(timer);
    }, [activeSlide]);

    if (!stats || !stats.mainKpis || !stats.todaystats) return <div className="loading">Loading Dashboard...</div>;

    return (
        <div className="dashboard-viewport">
            {/* Stage width 300% for 3 slides */}
            <div className="dashboard-stage" style={{ 
                width: '300%',
                transform: `translateX(-${activeSlide * (100 / 3)}%)` 
            }}>
                
                {/* SLIDE 1: MAIN KPI */}
                <div className="view-pane" style={{ width: '33.33%' }}>
                    <Header />
                    <div className="content-padding">
                        <KpiCards stats={stats.mainKpis} assignments={stats.assignmentStats} today={stats.todaystats} />
                        <div className="grid-3">
                            <UnderperformingTable title="UNDERPERFORMING (WATER)" data={waterPerf} TypeData={waterType} typeColor="#38bdf8" iconClass="fas fa-tint" />
                            <UnderperformingTable title="UNDERPERFORMING (SEWERAGE)" data={sewerPerf} TypeData={sewerType} typeColor="#a78bfa" iconClass="fas fa-biohazard" />
                            <div className="panel" style={{ padding: '15px' }}>
                                <TopPerformersTable title="TOP (WATER)" data={topPerformers.waterBest} />
                                <TopPerformersTable title="TOP (SEWERAGE)" data={topPerformers.sewBest} />
                            </div>
                        </div>
                        <TownTable waterData={townWaterStats} sewData={townSewStats} />
                    </div>
                </div>

                {/* SLIDE 2: CHARTS */}
                <div className="view-pane" style={{ width: '33.33%' }}>
                    <div className="full-chart-header"><h1>TOWN PERFORMANCE ANALYTICS</h1></div>
                    <TownCharts waterData={waterChartData} sewData={sewChartData} avgStats={avgStats} isFullView={true} />
                </div>

                {/* SLIDE 3: SOURCE DEEP DIVE */}
                <div className="view-pane" style={{ width: '33.33%' }}>
                     <div className="md-main-title-compact">
                        <h1>LANDING SOURCE DETAILED ANALYTICS</h1>
                        <div className="live-indicator"></div>
                    </div>
                    <div className="content-padding">
                        <SourceDeepDiveTable data={sourceData} />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;