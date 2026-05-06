/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
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
import DispatchAging from '../components/DispatchAging';
import OrderSummary from '../components/orderSummary';
import GallonSummary from '../components/GallonSummary';
import LcmsHeader from '../components/LcmsHeader';
import LcmsDashboard from '../components/LcmsDashboard';
import RedZoneViolations from '../components/RedZoneViolations';
import HydrantOperationalHours from '../components/HydrantOperationalHours';

const Dashboard = () => {
    const location = useLocation();
    // It checks if 'location.state.initialTab' exists; otherwise, it defaults to 'complaint'
    const [activeSystem, setActiveSystem] = useState(location.state?.initialTab || 'complaint');
    const [reportView, setReportView] = useState('aging');
    const [showSourceSlider, setShowSourceSlider] = useState(false);
    const [selectedEngineer, setSelectedEngineer] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
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



    useEffect(() => {
        const startTimer = (duration) => {
            if (viewTimerRef.current) clearTimeout(viewTimerRef.current);
            viewTimerRef.current = setTimeout(() => {
                // IF POPUP IS OPEN, DO NOT SWITCH SLIDER, JUST RESTART TIMER
                if (isPopupOpen || showModal) {
                    startTimer(duration);
                    return;
                }

                setShowSourceSlider(prev => {
                    const nextState = !prev;
                    startTimer(nextState ? 15000 : 120000);
                    return nextState;
                });
            }, duration);
        };
        startTimer(120000);
        return () => { if (viewTimerRef.current) clearTimeout(viewTimerRef.current); };
    }, [isPopupOpen, showModal]); // Add dependencies here

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
            <option value="lcms">LCMS DASHBOARD</option>
        </select>
    );


    return (
        <div className="dashboard-fixed-container">
            {/* Header Logic */}
            {activeSystem === 'complaint' ? (
                <Header selector={SystemSelector} />
            ) : activeSystem === 'hydrant' ? (
                <HmpHeader>{SystemSelector}</HmpHeader>
            ) : (
                <LcmsHeader>{SystemSelector}</LcmsHeader>
            )}

            <div className="content-padding main-scroll-area">
                {activeSystem === 'complaint' && (
                    <>
                        {/* RESTORED ORIGINAL KPI CARDS DESIGN */}
                        <KpiCards />

                        <div className="view-transition-container" style={{ minHeight: '480px' }}>
                            <AnimatePresence mode="wait">
                                {!showSourceSlider ? (
                                    <motion.div key="main" initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }} transition={{ duration: 0.5, ease: "easeInOut" }}>
                                        <div className="main-tables-grid animate-fade-in">
                                            <div className="grid-3">
                                                {/* LEFT COLUMN */}
                                                <div className="panel-container">
                                                    {/* Apply the panel class here ONCE to wrap both */}
                                                    <div className="panel" style={{ padding: '15px' }}> 
                                                        
                                                        {/* WATER TABLE */}
                                                        <UnderperformingTable 
                                                            title="UNDERPERFORMING ENGINEERS WATER (LAST 3 MONTHS)" 
                                                            onPopupToggle={setIsPopupOpen} 
                                                            typeColor="#38bdf8" 
                                                            iconClass="fas fa-tint" 
                                                            onEngineerClick={(name) => handleEngineerClick(name, 2)} 
                                                            typeId={2} 
                                                            subTypeIds="1,13,16"
                                                            hideAnalytics={true}
                                                            isMerged={true} 
                                                        />

                                                        {/* Small spacer or thin line - use minimal margin to keep them tight */}
                                                        <div style={{ 
                                                            height: '1px', 
                                                            background: '#334155', 
                                                            margin: '10px 0', 
                                                            opacity: 0.3 
                                                        }}></div>

                                                        {/* SEWERAGE TABLE */}
                                                        <UnderperformingTable 
                                                            title="UNDERPERFORMING ENGINEERS SEWERAGE (LAST 3 MONTHS)" 
                                                            onPopupToggle={setIsPopupOpen} 
                                                            typeColor="#a78bfa" 
                                                            iconClass="fas fa-biohazard" 
                                                            onEngineerClick={(name) => handleEngineerClick(name, 1)} 
                                                            typeId={1} 
                                                            subTypeIds="21,108"
                                                            hideAnalytics={false}
                                                            isMerged={true} 
                                                        />
                                                        
                                                    </div>
                                                </div>

                                                {/* RIGHT COLUMN: Top Performers */}
                                                <div className="panel" style={{ padding: '15px' }}>
                                                    <TopPerformersTable title="TOP ENGINEERS WATER (LAST 3 MONTHS)" onEngineerClick={(name) => handleEngineerClick(name, 2)} />
                                                    <TopPerformersTable title="TOP ENGINEERS SEWERAGE (LAST 3 MONTHS)" onEngineerClick={(name) => handleEngineerClick(name, 1)} />
                                                </div>
                                                {/* MIDDLE COLUMN: Empty */}
                                                <div className="empty-section"></div>

                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div key="slider" initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }} transition={{ duration: 0.5, ease: "easeInOut" }}>
                                        <div className="slider-wrapper animate-fade-in">
                                            <SourceSlider />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <TownTable />

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
                )}
                {activeSystem === 'hydrant' && (
                    /* HYDRANT SYSTEM VIEW */
                    <div className="hydrant-content-wrapper animate-fade-in" >
                        <HmpKpiCards />
                        {/* THREE COLUMN LAYOUT SECTION */}
                        <div className="hmp-triple-grid">

                            {/* 1. Hydrant Performance (Left Column) */}
                            <div className="hmp-grid-item">
                                <HydrantPerformance />
                            </div>

                            {/* 2. Mobile App Graph (Middle Column) */}
                            <div className="hmp-grid-item">
                                <MobileAppGraph />
                            </div>

                            {/* 3. Operational Hours (Right Column) */}
                            <div className="hmp-grid-item">
                                <div className="report-content header-green coming-soon-box">
                                    <div className="section-header">
                                        <div className="section-header-green">
                                            <i className="fas fa-clock"></i> HYDRANTS OPERATIONAL HOURS
                                        </div>
                                    </div>
                                    <div className="table-scroll-container" style={{ maxHeight: '450px' }}>
                                        <HydrantOperationalHours />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="dashboard-grid">
                            {/* LEFT SIDE: AGING / SUMMARY REPORTS */}
                            <div className="report-content header-orange">
                                <div className='section-header' >
                                    {/* Dynamic Title Class based on View */}
                                    <div className={
                                        reportView === 'aging' ? 'section-header-aging' :
                                            reportView === 'summary' ? 'section-header-orders' : 'section-header-summary'
                                    }>
                                        <i className={
                                            reportView === 'aging' ? 'fas fa-hourglass-half' :
                                                reportView === 'summary' ? 'fas fa-file-invoice' : 'fas fa-droplet'
                                        }></i>
                                        {reportView === 'aging' ? ' HYDRANTS AGING ANALYSIS (OTS PENDING ORDERS)' :
                                            reportView === 'summary' ? ' HYDRANTS DAILY ORDER SUMMARY (Created & Dispatched Today)' : ' HYDARNTS DAILY GALLONS SUMMARY (Created, Dispatched & Completed Today)'}
                                    </div>

                                    {/* Nav Buttons moved inside the header div on the right */}
                                    <div className="report-nav-bar">
                                        <button onClick={() => setReportView('aging')} className={`nav-btn-a ${reportView === 'aging' ? 'active' : ''}`}>Aging Analysis</button>
                                        <button onClick={() => setReportView('summary')} className={`nav-btn-s ${reportView === 'summary' ? 'active' : ''}`}>Order Summary</button>
                                        <button onClick={() => setReportView('gallons')} className={`nav-btn-o ${reportView === 'gallons' ? 'active' : ''}`}>Gallons Summary</button>
                                    </div>
                                </div>

                                <div className="table-scroll-container">
                                    {reportView === 'aging' && <DispatchAging />}
                                    {reportView === 'summary' && <OrderSummary />}
                                    {reportView === 'gallons' && <GallonSummary />}
                                </div>
                            </div>

                            {/* RIGHT SIDE: RED ZONE VIOLATIONS */}
                            <div className="report-content header-red">
                                <RedZoneViolations />
                            </div>
                        </div>
                    </div>
                )}
                {activeSystem === 'lcms' && (
                    <LcmsDashboard /> // We will create this
                )}
            </div>
        </div>
    );
};

export default Dashboard;