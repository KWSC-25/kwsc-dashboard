import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import ZonePerformance from './ZonePerformance'; 
import ZoneComplaintMap from './ZoneComplaintMap';
import { 
    Activity, 
    CheckCircle2, 
    AlertCircle, 
    Clock, 
    Calendar, 
    Filter, 
    RefreshCw, 
    ArrowUpRight, 
    TrendingUp
} from 'lucide-react';

const ZoneComplaintDashboard = () => {
    // --- STATE MANAGEMENT PIPELINES ---
    const [complaintTypes, setComplaintTypes] = useState([]);
    // Default directly to 1 (Sewerage) instead of 'ALL'
    const [selectedType, setSelectedType] = useState(1); 
    
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Core parameters passed directly into the API Telemetry Hook
    const [startDate, setStartDate] = useState('2024-10-23');
    const [endDate, setEndDate] = useState(todayStr);

    // Staging states to isolate unsubmitted UI changes while picker is open
    const [tempStartDate, setTempStartDate] = useState('2024-10-23');
    const [tempEndDate, setTempEndDate] = useState(todayStr);
    
    const [loading, setLoading] = useState(true);
    const [isRefetching, setIsRefetching] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' or 'map'

    // Responsive screen context monitoring
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        handleResize(); 
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    /**
     * Pulls operational drop-down metadata from the server db instances
     */
    const fetchDropdownMetadata = async () => {
        try {
            const res = await api.get('zone-complaints/types');
            setComplaintTypes(res.data || []);
        } catch (err) {
            console.error("Error loading category taxonomy metadata:", err);
            setComplaintTypes([
                { id: 1, title: 'Sewerage' },
                { id: 2, title: 'Water' },
                { id: 3, title: 'Billing' }
            ]);
        }
    };

    /**
     * Compiles current system state performance calculations 
     */
    const fetchTelemetryMetrics = useCallback(async (showOverlaySpinner = false) => {
        if (showOverlaySpinner) setLoading(true);
        else setIsRefetching(true);

        try {
            const resp = await api.get('zone-complaints/kpi-stats', {
                params: {
                    typeId: selectedType,
                    startDate,
                    endDate
                }
            });
            setData(resp.data);
            setError(null);
        } catch (err) {
            console.error("KPI Pipeline transmission bottleneck:", err);
            setError("Failed to compile active dashboard statistics.");
        } finally {
            setLoading(false);
            setIsRefetching(false);
        }
    }, [selectedType, startDate, endDate]);

    // Hook initialization sequence
    useEffect(() => {
        fetchDropdownMetadata();
    }, []);

    // Primary state configuration effect watchers
    useEffect(() => {
        fetchTelemetryMetrics(true);

        // Standard 30-second localized automation polling sequence loops
        const internalClockRefetch = setInterval(() => {
            fetchTelemetryMetrics(false);
        }, 30000);

        return () => clearInterval(internalClockRefetch);
    }, [fetchTelemetryMetrics]);

    // Isolated Event Mutation Handlers to Prevent Native Page Reloads
    const handleTypeChange = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedType(Number(e.target.value));
    };

    const handleStartDateChange = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setTempStartDate(e.target.value);
    };

    const handleEndDateChange = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setTempEndDate(e.target.value);
    };

    const handleApplyTimeline = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setStartDate(tempStartDate);
        setEndDate(tempEndDate);
    };

    const handleSelectToday = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setTempStartDate(todayStr);
        setTempEndDate(todayStr);
        setStartDate(todayStr);
        setEndDate(todayStr);
    };

    const handleResetFilter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedType(1); // Clear reset to Sewerage primary context
        setStartDate('2024-10-23');
        setEndDate(todayStr);
        setTempStartDate('2024-10-23');
        setTempEndDate(todayStr);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#070a13] flex flex-col items-center justify-center text-slate-400 space-y-4">
                <div className="w-10 h-10 border-4 border-[#00f2ff] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-black tracking-widest text-[#00f2ff] uppercase animate-pulse">
                    Synchronizing Zonal Analytics Telemetry...
                </p>
            </div>
        );
    }

    const main = data?.mainKpis || {};

    const calcPercentage = (slice, base) => {
        const dividend = parseInt(slice || 0, 10);
        const divisor = parseInt(base || 0, 10);
        if (divisor === 0) return "0.00";
        return ((dividend / divisor) * 100).toFixed(2);
    };

    return (
        <div className="bg-[#060913] text-slate-100 p-5 space-y-6 select-none font-sans">
            
            {/* ==================== ADMINISTRATIVE FILTER ACTION HUB ==================== */}
            <div className="bg-[#0c1122] border border-slate-800/80 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-2xl relative">
                <div className="flex flex-wrap items-center gap-4 w-full justify-end">
                    
                    {/* DROP-DOWN SELECT ENGINE */}
                    <div className="flex items-center gap-2 bg-[#12182c] border border-slate-800 rounded-lg px-3 py-2 focus-within:border-cyan-500/70 transition-all flex-1 md:flex-none">
                        <Filter className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Types:</span>
                        <select
                            value={selectedType}
                            onChange={handleTypeChange}
                            className="bg-transparent text-white font-black text-xs outline-none cursor-pointer pr-4 border-none focus:ring-0"
                        >
                            {complaintTypes.map((t) => (
                                <option key={t.id} value={t.id} className="bg-[#12182c] text-white font-semibold">
                                    {t.title.toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* DURATION RANGE SELECTION WINDOWS */}
                    <div className="flex items-center gap-3 bg-[#12182c] border border-slate-800 rounded-lg px-3 py-2 flex-1 md:flex-none">
                        <Calendar className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Timeline:</span>
                        <div className="flex items-center gap-2 text-xs font-black text-indigo-300">
                            <input 
                                type="date" 
                                value={tempStartDate}
                                onChange={handleStartDateChange}
                                className="bg-transparent border-none outline-none focus:text-white cursor-pointer"
                                style={{ colorScheme: 'dark' }}
                            />
                            <span className="text-slate-600 font-medium">TO</span>
                            <input 
                                type="date" 
                                value={tempEndDate}
                                onChange={handleEndDateChange}
                                className="bg-transparent border-none outline-none focus:text-white cursor-pointer"
                                style={{ colorScheme: 'dark' }}
                            />
                        </div>
                    </div>

                    {/* QUICK TODAY TOGGLE INTERACTION BUTTON */}
                    <button
                        type="button"
                        onClick={handleSelectToday}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg transition-all flex-1 md:flex-none shadow-lg shadow-indigo-600/20"
                    >
                        Today
                    </button>

                    {/* CONTROL ACTION TRIGGER BUTTONS */}
                    <button
                        type="button"
                        onClick={handleApplyTimeline}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg transition-all flex-1 md:flex-none shadow-lg shadow-cyan-600/20"
                    >
                        Apply Filter
                    </button>

                    <button
                        type="button"
                        onClick={handleResetFilter}
                        className="bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg transition-all flex-1 md:flex-none"
                    >
                        Clear Filters
                    </button>
                    <button
                        type="button"
                        onClick={e => { e.preventDefault(); setActiveView('map'); }}
                        className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg transition-all shadow-lg shadow-cyan-600/10"
                    >
                        Go to Map View
                    </button>
                </div>
            </div>

            {/* ==================== CORE HIGH-CONTRAST METRICS HUB ==================== */}
            {error ? (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-black rounded-xl uppercase tracking-wider">
                    Error parsing node stream context: {error}
                </div>
            ) : (
                <div className={`grid grid-cols-1 gap-5 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
                    
                    {/* CARD 01: CUMULATIVE REGISTRY TICKETS */}
                    <div className="bg-[#0c1122] border-l-4 border-l-cyan-400 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden group shadow-lg shadow-black/20">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Registered</p>
                        <div className="flex items-baseline justify-between mt-2">
                            <span className="text-4xl font-black text-white font-mono tracking-tighter">
                                {parseInt(main.total_registered || 0, 10).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* CARD 02: CLOSED SUCCESS CONTRACT TERMINATIONS */}
                    <div className="bg-[#0c1122] border-l-4 border-l-emerald-400 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden group shadow-lg shadow-black/20">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Resolved</p>
                        <div className="flex items-baseline justify-between mt-2">
                            <span className="text-4xl font-black text-emerald-400 font-mono tracking-tighter">
                                {parseInt(main.total_resolved || 0, 10).toLocaleString()}
                            </span>
                            <span className="text-sm font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                                {calcPercentage(main.total_resolved, main.total_registered)}%
                            </span>
                        </div>
                    </div>

                    {/* CARD 03: WORKING IN PROGRESS RUNTIME ALLOCATIONS */}
                    <div className="bg-[#0c1122] border-l-4 border-l-amber-400 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden group shadow-lg shadow-black/20">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Work In Progress</p>
                        <div className="flex items-baseline justify-between mt-2">
                            <span className="text-4xl font-black text-amber-400 font-mono tracking-tighter">
                                {parseInt(main.total_wip || 0, 10).toLocaleString()}
                            </span>
                            <span className="text-sm font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                                {calcPercentage(main.total_wip, main.total_registered)}%
                            </span>
                        </div>
                    </div>

                    {/* CARD 04: BACKLOG SYSTEM QUEUE OUTSTANDINGS */}
                    <div className="bg-[#0c1122] border-l-4 border-l-rose-500 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden group shadow-lg shadow-black/20">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Pending Backlog</p>
                        <div className="flex items-baseline justify-between mt-2">
                            <span className="text-4xl font-black text-rose-500 font-mono tracking-tighter">
                                {parseInt(main.total_pending || 0, 10).toLocaleString()}
                            </span>
                            <span className="text-sm font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded">
                                {calcPercentage(main.total_pending, main.total_registered)}%
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {activeView === 'dashboard' ? (
                <ZonePerformance 
                    typeId={selectedType}
                    startDate={startDate}
                    endDate={endDate}
                />
            ) : (
                <ZoneComplaintMap 
                    globalFilters={{
                        typeId: selectedType,
                        startDate: startDate,
                        endDate: endDate
                    }}
                    onBackToDashboard={() => setActiveView('dashboard')}
                />
            )}
        </div>
    );
};

export default ZoneComplaintDashboard;