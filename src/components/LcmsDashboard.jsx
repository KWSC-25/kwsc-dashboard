import React, { useState, useEffect } from 'react';
import { Scale, ChevronRight, AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const TableSection = ({ data, setSelectedStatus, today }) => (
    <div className="lcms-panel-content h-full">
        <table className="lcms-one-pager-table w-full">
            <thead>
                <tr>
                    {/* Fixed header visibility with explicit inline styles */}
                    <th style={{ width: '45%', color: '#f8fafc', fontWeight: '900', fontSize: '12px' }}>COURT / CASE</th>
                    <th style={{ width: '25%', color: '#f8fafc', fontWeight: '900', fontSize: '12px' }}>DATE & ADVOCATE</th>
                    <th style={{ width: '30%', color: '#f8fafc', fontWeight: '900', fontSize: '12px' }}>MATTER / DEPT</th>
                </tr>
            </thead>
            <tbody>
                {data.map((item, idx) => {
                    const itemDate = new Date(item.next_date);
                    itemDate.setHours(0, 0, 0, 0);
                    const isPast = itemDate < today;
                    const isNext = !isPast && idx === 0;

                    return (
                        <tr key={item.id} className={isNext ? 'row-next-glow' : ''}>
                            <td>
                                <div className="cell-main">{item.court_name}</div>
                                <div className="cell-case-title">{item.case_title}</div>
                            </td>
                            <td>
                                <div className="date-alert-box">
                                    {new Date(item.next_date).toLocaleDateString('en-GB')}
                                </div>
                                <div className="advocate-highlight">{item.advocate_name}</div>
                            </td>
                            <td>
                                <div className="matter-text">{item.matter_pertains}</div>
                                <button className="dept-action-btn" onClick={() => setSelectedStatus(item)}>
                                    {item.responsible_dept} <ChevronRight size={12} />
                                </button>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    </div>
);

const LcmsDashboard = () => {
    const [allCases, setAllCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [selectedStatus, setSelectedStatus] = useState(null);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    useEffect(() => {
        const getData = async () => {
            try {
                const res = await api.get('/lcmsDashboard/dashboard-cases');
                setAllCases(res.data);
                setLoading(false);
            } catch (err) { console.error(err); }
        };
        getData();
        const refreshInterval = setInterval(getData, 60000);
        return () => clearInterval(refreshInterval);
    }, []);

    useEffect(() => {
        if (allCases.length <= 10) return;
        const slideTimer = setInterval(() => {
            setPage(prev => (prev + 1) * 10 >= allCases.length ? 0 : prev + 1);
        }, 10000);
        return () => clearInterval(slideTimer);
    }, [allCases]);

    if (loading) return (
        <div className="h-screen bg-[#0a0f18] flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-500" size={48} />
        </div>
    );

    const currentSet = allCases.slice(page * 10, (page * 10) + 10);
    const leftCol = currentSet.slice(0, 5);
    const rightCol = currentSet.slice(5, 10);

    return (
        <div className="lcms-one-view-wrapper h-screen w-screen bg-[#0a0f18] text-white p-6 overflow-hidden flex flex-col">
            
            {/* KPI Row */}
            <div className="grid grid-cols-5 gap-4 mb-6 shrink-0">
                <div className="kpi-card-simple border-red">
                    <label>Total Pending</label>
                    <span className="val text-red-500">633</span>
                    <Scale className="icon-red opacity-10" size={24} />
                </div>
                <div className="kpi-card-simple border-blue">
                    <label>HC / SC Cases</label>
                    <span className="val text-blue-400">359</span>
                    <div className="sub">HC: 346 | SC: 13</div>
                </div>
                <div className="kpi-card-simple border-purple">
                    <label>Dist / Trib</label>
                    <span className="val text-purple-400">265</span>
                    <div className="sub">Dist: 265 | Trib: NIL</div>
                </div>
                <div className="kpi-card-simple border-emerald">
                    <label>Decided Feb</label>
                    <span className="val text-emerald-400">37</span>
                    <div className="sub">Current Month Target</div>
                </div>
                <div className="kpi-card-simple border-yellow">
                    <label>New Filings</label>
                    <span className="val text-yellow-500">02</span>
                    <Scale className="icon-yellow opacity-10" size={24} />
                </div>
            </div>

            {/* Unified Header */}
            <div className="flex items-center gap-3 mb-4 shrink-0">
                <span className="bg-yellow-500 text-black px-2 py-0.5 rounded text-[10px] font-black">SCHEDULE</span>
                <h2 className="text-xl font-black uppercase tracking-tight">Upcoming Hearings</h2>
            </div>

            {/* Main Content Area - Growing to fill space */}
            <div className="flex-grow min-h-0">
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={page}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        transition={{ duration: 0.4 }}
                        className="grid grid-cols-2 gap-8 h-full"
                    >
                        <TableSection data={leftCol} setSelectedStatus={setSelectedStatus} today={today} />
                        <TableSection data={rightCol} setSelectedStatus={setSelectedStatus} today={today} />
                    </motion.div>
                </AnimatePresence>
            </div>
            
            {/* Modal */}
            <AnimatePresence>
                {selectedStatus && (
                    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[999] flex items-center justify-center p-8" onClick={() => setSelectedStatus(null)}>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111827] border-2 border-yellow-500/30 p-12 rounded-3xl max-w-4xl w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-4 text-yellow-500 font-black text-2xl mb-8 uppercase tracking-tighter">
                                <AlertTriangle size={40} /> Direction & Status
                            </div>
                            <div className="text-yellow-400 text-3xl leading-snug mb-10 font-bold italic">
                                "{selectedStatus.court_status}"
                            </div>
                            <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black py-5 rounded-2xl font-black uppercase tracking-widest text-lg transition-all" onClick={() => setSelectedStatus(null)}>
                                Close Direction
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LcmsDashboard;