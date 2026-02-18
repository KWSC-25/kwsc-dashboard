/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../utils/api';
import Header from '../components/Header';
import KpiCards from '../components/KpiCards';
import UnderperformingTable from '../components/UnderperformingTable';
import TopPerformersTable from '../components/TopPerformersTable';
import SourceSlider from '../components/SourceSlider';
import { motion, AnimatePresence } from 'framer-motion';
import TownTable from '../components/TownTable';
import HmpHeader from '../components/HmpHeader';
import HmpKpiCards from '../components/HmpKpiCards';
import HydrantPerformance from '../components/HydrantPerformance';
import MobileAppGraph from '../components/MobileAppGraph';

const Dashboard = () => {
    const [activeSystem, setActiveSystem] = useState('complaint'); 
    const [stats, setStats] = useState(null);
    const [waterPerf, setWaterPerf] = useState([]);
    const [sewerPerf, setSewerPerf] = useState([]);
    const [waterType, setWaterType] = useState([]);
    const [sewerType, setSewerType] = useState([]);
    const [topPerformers, setTopPerformers] = useState({ waterBest: [], sewBest: [] });
    const [sourceSliderData, setSourceSliderData] = useState([]);
    const [showSourceSlider, setShowSourceSlider] = useState(false);
    const [townWaterStats, setTownWaterStats] = useState([]);
    const [townSewStats, setTownSewStats] = useState([]);
    const [selectedEngineer, setSelectedEngineer] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [hmpStats, setHmpStats] = useState(null); 
    const [hydrantPerfData, setHydrantPerfData] = useState([]);
    const [mobileAppTrend, setMobileAppTrend] = useState(null);
    const viewTimerRef = useRef(null);

    const handleEngineerClick = async (name, typeId) => {
        try {
            const resp = await api.get(`/performance/engineer-details?name=${encodeURIComponent(name)}&typeId=${typeId}`);
            setSelectedEngineer(resp.data);
            setShowModal(true);
        } catch (err) { 
            console.error("Fetch Error:", err);
            alert("Could not fetch engineer details."); 
        }
    };

    const fetchData = useCallback(async () => {
        try {
            const [kpi, wP, sP, wI, sI, topP, sSlider, tWater, tSew, hmpKpi, hmpPerf, appTrend] = await Promise.all([
                api.get('/kpis/stats'),
                api.get('/performance/underperforming?typeId=2'),
                api.get('/performance/underperforming?typeId=1'),
                api.get('/type?typeId=2&subTypeIds=1,13,16'),
                api.get('/type?typeId=1&subTypeIds=21,108'),
                api.get('/performance/top-performers'),
                api.get('/source-slider'),
                api.get('/towns/town-stats?typeId=2'), 
                api.get('/towns/town-stats?typeId=1'),
                api.get('/hmp-kpi'),
                api.get('/hmp-performance'),
                api.get('/graph/mobile-app-trend')
            ]);

            setStats(kpi.data);
            setWaterPerf(wP.data);
            setSewerPerf(sP.data);
            setWaterType(wI.data);
            setSewerType(sI.data);
            setTopPerformers(topP.data);
            setSourceSliderData(sSlider.data);
            setTownWaterStats(tWater.data);
            setTownSewStats(tSew.data);
            setHmpStats(hmpKpi.data.data);
            setHydrantPerfData(hmpPerf.data);
            setMobileAppTrend(appTrend.data);
        } catch (err) {
            console.error("Live Update Error:", err);
        }
    }, []);

    useEffect(() => {
        const initLoad = async () => { await fetchData(); };
        initLoad();
        const interval = setInterval(() => { fetchData(); }, 5000); 
        return () => clearInterval(interval);
    }, [fetchData]); 

    useEffect(() => {
        const startTimer = (duration) => {
            if (viewTimerRef.current) clearTimeout(viewTimerRef.current);
            viewTimerRef.current = setTimeout(() => {
                setShowSourceSlider(prev => {
                    const nextState = !prev;
                    startTimer(nextState ? 30000 : 60000);
                    return nextState;
                });
            }, duration);
        };
        startTimer(60000);
        return () => { if (viewTimerRef.current) clearTimeout(viewTimerRef.current); };
    }, []);

    const SystemSelector = (
        <select 
            value={activeSystem} 
            onChange={(e) => setActiveSystem(e.target.value)}
            style={{
                background: '#1e293b',
                color: '#38bdf8',
                border: '1px solid #334155',
                padding: '5px 10px',
                borderRadius: '4px',
                fontSize: '0.85rem',
                fontWeight: '600',
                outline: 'none',
                cursor: 'pointer'
            }}
        >
            <option value="complaint">COMPLAINT SYSTEM</option>
            <option value="hydrant">HYDRANT SYSTEM</option>
        </select>
    );

    if (!stats) return <div className="loading-screen">Loading Live Dashboard...</div>;

    return (
        <div className="dashboard-fixed-container">
            {/* Header Logic: Complaint vs Hydrant */}
            {activeSystem === 'complaint' ? (
                <Header selector={SystemSelector} /> 
            ) : (
                <HmpHeader>{SystemSelector}</HmpHeader>
            )}
            
            <div className="content-padding main-scroll-area">
                {activeSystem === 'complaint' ? (
                    <>
                        {/* RESTORED ORIGINAL KPI CARDS DESIGN */}
                        <KpiCards 
                            stats={stats.mainKpis} 
                            assignments={stats.assignmentStats} 
                            today={stats.todaystats} 
                        />
                        
                        <div className="view-transition-container" style={{ minHeight: '480px' }}>
                            <AnimatePresence mode="wait">
                            {!showSourceSlider ? (
                                <motion.div key="main" initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }} transition={{ duration: 0.5, ease: "easeInOut" }}>
                                    <div className="main-tables-grid animate-fade-in">
                                        <div className="grid-3">
                                            <UnderperformingTable title="UNDERPERFORMING ENGINEERS WATER (LAST 3 MONTHS)" data={waterPerf} TypeData={waterType} typeColor="#38bdf8" iconClass="fas fa-tint" onEngineerClick={(name) => handleEngineerClick(name, 2)} />
                                            <UnderperformingTable title="UNDERPERFORMING ENGINEERS SEWERAGE (LAST 3 MONTHS)" data={sewerPerf} TypeData={sewerType} typeColor="#a78bfa" iconClass="fas fa-biohazard" onEngineerClick={(name) => handleEngineerClick(name, 1)} />
                                            <div className="panel" style={{ padding: '15px' }}>
                                                <TopPerformersTable title="TOP ENGINEERS WATER (LAST 3 MONTHS)" data={topPerformers.waterBest} onEngineerClick={(name) => handleEngineerClick(name, 2)}/>
                                                <TopPerformersTable title="TOP ENGINEERS SEWERAGE (LAST 3 MONTHS)" data={topPerformers.sewBest} onEngineerClick={(name) => handleEngineerClick(name, 1)} />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div key="slider" initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }} transition={{ duration: 0.5, ease: "easeInOut" }}>
                                    <div className="slider-wrapper animate-fade-in">
                                        <SourceSlider data={sourceSliderData} />
                                    </div>
                                </motion.div>
                            )}
                            </AnimatePresence>
                        </div>

                        <TownTable waterData={townWaterStats} sewData={townSewStats} />                
                        
                        {/* Engineer Detail Modal */}
                        {showModal && selectedEngineer && (
                            <div className="modal-overlay" onClick={() => setShowModal(false)}>
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    className="modal-content modern-modal" 
                                    onClick={e => e.stopPropagation()}
                                >
                                    <div className="modal-header">
                                        <div className="header-left">
                                            <div className="title-row">
                                                <h2 className="modal-title">Engr. {selectedEngineer.name}</h2>
                                                <span className={`dept-badge ${selectedEngineer.typeId === 1 ? 'sewerage' : 'water'}`}>
                                                    {selectedEngineer.typeId === 1 ? 'SEWERAGE' : 'WATER'}
                                                </span>
                                            </div>
                                            <span className="badge-period">Last 3 Months Analysis</span>
                                        </div>
                                        <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
                                    </div>

                                    <div className="modal-body">
                                        <div className="stats-grid">
                                            <div className="stat-card">
                                                <span className="label">Total</span>
                                                <span className="value">{selectedEngineer.total}</span>
                                            </div>
                                            <div className="stat-card pending">
                                                <span className="label">Pending</span>
                                                <span className="value">{selectedEngineer.pending}</span>
                                            </div>
                                            <div className="stat-card resolved">
                                                <span className="label">Resolved</span>
                                                <span className="value">{selectedEngineer.resolved}</span>
                                            </div>
                                            <div className="stat-card wip">
                                                <span className="label">WIP</span>
                                                <span className="value">{selectedEngineer.wip}</span>
                                            </div>
                                        </div>

                                        <div className="table-responsive-wrapper">
                                            <h4 className="section-subtitle">Subtype Breakdown</h4>
                                            <table className="modern-table">
                                                <thead>
                                                    <tr>
                                                        <th>Subtype</th>
                                                        <th className="text-center">Reg.</th>
                                                        <th className="text-center">Pen.</th>
                                                        <th className="text-center">Res.</th>
                                                        <th className="text-center">WIP</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedEngineer.breakdown.map((b, i) => (
                                                        <tr key={i}>
                                                            <td className="font-bold">{b.subtype}</td>
                                                            <td className="text-center">{b.total}</td>
                                                            <td className="text-center text-red">{b.pending}</td>
                                                            <td className="text-center text-green">{b.resolved}</td>
                                                            <td className="text-center text-yellow">{b.wip}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </>
                ) : (
                    /* HYDRANT SYSTEM VIEW */
                    <div className="hydrant-content-wrapper animate-fade-in" >
                        <HmpKpiCards data={hmpStats} />
                        {/* THREE COLUMN LAYOUT SECTION */}
                        <div className="hmp-triple-grid">
                            
                            {/* 1. Hydrant Performance (Left Column) */}
                            <div className="hmp-grid-item">
                                <HydrantPerformance data={hydrantPerfData} />
                            </div>

                            {/* 2. Mobile App Graph (Middle Column) */}
                            <div className="hmp-grid-item">
                                <MobileAppGraph data={mobileAppTrend} />
                            </div>

                            {/* 3. Operational Hours (Right Column) */}
                            <div className="hmp-grid-item">
                                <div className="report-content header-green coming-soon-box">
                                    <div className="section-header">
                                        <div className="section-header-green">
                                            <i className="fas fa-clock"></i> HYDRANTS OPERATIONAL HOURS
                                        </div>
                                    </div>
                                    <div className="placeholder-content">
                                        <div className="pulsing-text">COMING SOON...</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;