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
    
    const viewTimerRef = useRef(null);

    const fetchData = useCallback(async () => {
        try {
            const [kpi, wP, sP, wI, sI, topP, sSlider, tWater, tSew] = await Promise.all([
                api.get('/kpis/stats'),
                api.get('/performance/underperforming?typeId=2'),
                api.get('/performance/underperforming?typeId=1'),
                api.get('/type?typeId=2&subTypeIds=1,13,16'),
                api.get('/type?typeId=1&subTypeIds=21,108'),
                api.get('/performance/top-performers'),
                api.get('/source-slider'),
                api.get('/towns/town-stats?typeId=2'), 
                api.get('/towns/town-stats?typeId=1')
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
        } catch (err) {
            console.error("Live Update Error:", err);
        }
    }, []);

    // Effect 1: FIXED Live Data Refetching (Every 5 Seconds)
    useEffect(() => {
        // Wrapping in an async function to prevent "synchronous setState" red line
        const initLoad = async () => {
            await fetchData();
        };
        
        initLoad();

        const interval = setInterval(() => {
            fetchData();
        }, 5000); 

        return () => clearInterval(interval);
    }, [fetchData]); 

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

    if (!stats) return <div className="loading-screen">Loading Live Dashboard...</div>;

    return (
        <div className="dashboard-fixed-container">
            <Header />
            <div className="content-padding main-scroll-area">
                <KpiCards stats={stats.mainKpis} assignments={stats.assignmentStats} today={stats.todaystats} />
                
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
                                <UnderperformingTable title="UNDERPERFORMING ENGINEERS WATER (LAST 3 MONTHS)" data={waterPerf} TypeData={waterType} typeColor="#38bdf8" iconClass="fas fa-tint" />
                                <UnderperformingTable title="UNDERPERFORMING ENGINEERS SEWERAGE (LAST 3 MONTHS)" data={sewerPerf} TypeData={sewerType} typeColor="#a78bfa" iconClass="fas fa-biohazard" />
                                <div className="panel" style={{ padding: '15px' }}>
                                    <TopPerformersTable title="TOP ENGINEERS WATER (LAST 3 MONTHS)" data={topPerformers.waterBest} />
                                    <TopPerformersTable title="TOP ENGINEERS SEWERAGE (LAST 3 MONTHS)" data={topPerformers.sewBest} />
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
                            <SourceSlider data={sourceSliderData} />
                        </div>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </div>

                <TownTable waterData={townWaterStats} sewData={townSewStats} />                
               
            </div>
        </div>
    );
};

export default Dashboard;