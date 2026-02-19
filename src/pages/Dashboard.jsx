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

const Dashboard = () => {

    const [showSourceSlider, setShowSourceSlider] = useState(false);
    const [selectedEngineer, setSelectedEngineer] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const viewTimerRef = useRef(null);

    const handleEngineerClick = async (name, typeId) => {
        try {
            // Pass both name and typeId to the backend
            const resp = await api.get(`/performance/engineer-details?name=${encodeURIComponent(name)}&typeId=${typeId}`);
            setSelectedEngineer(resp.data);
            setShowModal(true);
        } catch (err) { 
            console.error("Fetch Error:", err);
            alert("Could not fetch engineer details."); 
        }
    };
 

 

    // Effect 2: VIEW TOGGLING (60s Main Panel / 30s Slider)
    useEffect(() => {
        const startTimer = (duration) => {
            if (viewTimerRef.current) clearTimeout(viewTimerRef.current);

            viewTimerRef.current = setTimeout(() => {
                setShowSourceSlider(prev => {
                    const nextState = !prev;
                    // Switching TO Slider: 30s | Switching TO Main: 60s
                    startTimer(nextState ? 30000 : 60000);
                    return nextState;
                });
            }, duration);
        };

        startTimer(60000); // Initial 1 minute for Main Dashboard

        return () => {
            if (viewTimerRef.current) clearTimeout(viewTimerRef.current);
        };
    }, []);


    return (
        <div className="dashboard-fixed-container">
            <Header />
            <div className="content-padding main-scroll-area">
                <KpiCards/>
                
                <div className="view-transition-container" style={{ minHeight: '480px' }}>
                    <AnimatePresence mode="wait">
                    {!showSourceSlider ? (
                        <motion.div 
                            key="main"
                            initial={{ x: -100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 100, opacity: 0 }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}>
                        <div className="main-tables-grid animate-fade-in" key="main">
                            <div className="grid-3">
                                <UnderperformingTable title="UNDERPERFORMING ENGINEERS WATER (LAST 3 MONTHS)"  typeColor="#38bdf8" iconClass="fas fa-tint" onEngineerClick={(name) => handleEngineerClick(name, 2)} typeId={2} subTypeIds="1,13,16"/>
                                <UnderperformingTable title="UNDERPERFORMING ENGINEERS SEWERAGE (LAST 3 MONTHS)"  typeColor="#a78bfa" iconClass="fas fa-biohazard" onEngineerClick={(name) => handleEngineerClick(name, 1)} typeId={1} subTypeIds="21,108"/>
                                <div className="panel" style={{ padding: '15px' }}>
                                    <TopPerformersTable title="TOP ENGINEERS WATER (LAST 3 MONTHS)" onEngineerClick={(name) => handleEngineerClick(name, 2)} />
                                    <TopPerformersTable title="TOP ENGINEERS SEWERAGE (LAST 3 MONTHS)" onEngineerClick={(name) => handleEngineerClick(name, 1)} />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    ) : (
                        <motion.div 
                        key="slider"
                        initial={{ x: 100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -100, opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    >
                        <div className="slider-wrapper animate-fade-in" key="slider">
                            <SourceSlider/>
                        </div>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </div>

                <TownTable />                
               
            </div>
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
                                    {/* New Department Badge */}
                                    <span className={`dept-badge ${selectedEngineer.typeId === 1 ? 'sewerage' : 'water'}`}>
                                        {selectedEngineer.typeId === 1 ? 'SEWERAGE' : 'WATER'}
                                    </span>
                                </div>
                                <span className="badge-period">Last 3 Months Analysis</span>
                            </div>
                            <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>

                        <div className="modal-body">
                            {/* Stats Grid - Gradienty Shades */}
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
        </div>

    );
};

export default Dashboard;