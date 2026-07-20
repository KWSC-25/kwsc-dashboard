import React, { useState, useEffect } from 'react';
import { Settings, AlertCircle, ArrowLeft, ShieldAlert, X, Eye, Calendar, Clock, Briefcase, Search } from 'lucide-react';
import api from '../utils/api';
import MohtasibForm from './MohtasibForm';

const MohatsibDashboard = () => {
    const [isManagingPanel, setIsManagingPanel] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);
    const [dashboardLoading, setDashboardLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [globalRecords, setGlobalRecords] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal state management for tracking detailed views
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (!isManagingPanel) {
            fetchMohtasibDashboardRecords();
        }
    }, [isManagingPanel]);

    const fetchMohtasibDashboardRecords = async () => {
        setDashboardLoading(true);
        try {
            const res = await api.get('/mohtasib/all-records');
            const rawRecords = res.data.data || [];
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const upcomingRecords = [];
            const pastRecords = [];

            rawRecords.forEach(record => {
                if (record.appearance_date) {
                    const appearanceDate = new Date(record.appearance_date);
                    appearanceDate.setHours(0, 0, 0, 0);
                    
                    if (appearanceDate >= today) {
                        upcomingRecords.push(record);
                    } else {
                        pastRecords.push(record);
                    }
                } else {
                    pastRecords.push(record);
                }
            });

            // Sort upcoming records in ASCENDING order (closest future appearance date first)
            upcomingRecords.sort((a, b) => {
                const dateA = a.appearance_date ? new Date(a.appearance_date) : new Date(0);
                const dateB = b.appearance_date ? new Date(b.appearance_date) : new Date(0);
                if (dateA.getTime() === dateB.getTime()) {
                    const timeA = a.appearance_time || "00:00:00";
                    const timeB = b.appearance_time || "00:00:00";
                    return timeA.localeCompare(timeB);
                }
                return dateA - dateB;
            });

            // Sort past records in DESCENDING order (most recently passed appearance first)
            pastRecords.sort((a, b) => {
                const dateA = a.appearance_date ? new Date(a.appearance_date) : new Date(0);
                const dateB = b.appearance_date ? new Date(b.appearance_date) : new Date(0);
                if (dateA.getTime() === dateB.getTime()) {
                    const timeA = a.appearance_time || "00:00:00";
                    const timeB = b.appearance_time || "00:00:00";
                    return timeB.localeCompare(timeA);
                }
                return dateB - dateA;
            });

            const chronologicallySorted = [...upcomingRecords, ...pastRecords];
            setGlobalRecords(chronologicallySorted);
        } catch (err) {
            console.error("Error loading centralized Mohtasib dashboard:", err);
            showToast("Failed to sync structural Mohtasib monitoring records.");
        } finally {
            setDashboardLoading(false);
        }
    };

    const handleManagementNavigation = async () => {
        setActionLoading(true);
        try {
            const response = await api.get('/mohtasib/check-permission');
            if (response.data && response.data.canManage === true) {
                setIsManagingPanel(true);
            } else {
                showToast("Access Denied: Your account profile lacks Mohtasib management permissions.");
            }
        } catch (err) {
            console.error("Authorization checks failed:", err);
            const serverErrorMessage = err.response?.data?.message || "Failed to verify administrative credentials.";
            showToast(serverErrorMessage);
        } finally {
            setActionLoading(false);
        }
    };

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 5000);
    };

    const formatTime12h = (timeStr) => {
        if (!timeStr) return '-';
        const [hourStr, minuteStr] = timeStr.split(':');
        const hour = parseInt(hourStr, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${minuteStr} ${ampm}`;
    };

    /**
     * Checks if a target record falls within the critical 48-hour window from right now.
     * Evaluates both the specific appearance date and its designated execution hour/minute.
     */
    const checkIsImminentAlert = (appearanceDateStr, appearanceTimeStr) => {
        if (!appearanceDateStr) return false;
        
        const now = new Date();
        const targetDateTime = new Date(appearanceDateStr);
        
        if (appearanceTimeStr) {
            const [hours, minutes, seconds] = appearanceTimeStr.split(':');
            targetDateTime.setHours(parseInt(hours || 0, 10));
            targetDateTime.setMinutes(parseInt(minutes || 0, 10));
            targetDateTime.setSeconds(parseInt(seconds || 0, 10));
        } else {
            targetDateTime.setHours(0, 0, 0, 0);
        }

        const timeDifferenceMs = targetDateTime.getTime() - now.getTime();
        const fortyEightHoursInMs = 48 * 60 * 60 * 1000;

        // Active only if date is in the future, yet falls within the 48 hour threshold
        return timeDifferenceMs > 0 && timeDifferenceMs <= fortyEightHoursInMs;
    };
    
    const handleOpenDetails = (record) => {
        setSelectedRecord(record);
        setIsModalOpen(true);
    };

    /**
     * Helper logic to safely check if an appearance date has passed relative to today
     */
    const checkIsDateCrossed = (appearanceDateStr) => {
        if (!appearanceDateStr) return true;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const appearanceDate = new Date(appearanceDateStr);
        appearanceDate.setHours(0, 0, 0, 0);
        return appearanceDate < today;
    };

    // Derived State: Filter global items based on user criteria (Ref Number or Subject Content)
    const filteredRecords = globalRecords.filter(item => {
        const refNo = (item.reference_no || '').toLowerCase();
        const subject = (item.subject || '').toLowerCase();
        const searchClean = searchTerm.toLowerCase();
        return refNo.includes(searchClean) || subject.includes(searchClean);
    });

    if (isManagingPanel) {
        return (
            <div className="p-8 bg-transparent text-white">
                <button
                    onClick={() => setIsManagingPanel(false)}
                    className="inline-flex items-center gap-3 text-slate-400 hover:text-white bg-transparent border-none cursor-pointer mb-8 text-2xl font-bold transition-colors"
                >
                    <ArrowLeft size={28} />
                    <span>Back to Dashboard View</span>
                </button>
                <MohtasibForm />
            </div>
        );
    }

    return (
        <div className="p-8 relative text-slate-200 bg-transparent min-h-screen">
            {/* Injecting a dedicated keyframe style block directly for standard Tailwind configuration security */}
            <style>{`
                @keyframes subtlePulseRed {
                    0%, 100% { background-color: rgba(239, 68, 68, 0.04); border-color: rgba(239, 68, 68, 0.3); }
                    50% { background-color: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.6); }
                }
                .animate-pulse-subtle {
                    animation: subtlePulseRed 2s infinite ease-in-out;
                }
            `}</style>

            {toastMessage && (
                <div className="fixed top-8 right-8 bg-red-600 text-white px-6 py-4 rounded-xl z-50 shadow-2xl flex items-center gap-3 border border-red-500 animate-in fade-in slide-in-from-top-4 duration-200">
                    <AlertCircle size={24} />
                    <span className="font-bold text-lg">{toastMessage}</span>
                </div>
            )}

{/* Top Header Action Row with unified flex layout */}
            <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4 gap-4">
                <div className="flex-shrink-0">
                    <span className="bg-amber-500 text-slate-950 px-3 py-1 text-xs font-black uppercase tracking-wider rounded-md mr-3 inline-block vertical-middle">SCHEDULE</span>
                    <h1 className="text-2xl font-black text-white inline-block tracking-wide uppercase align-middle">
                        Upcoming Hearings/Events ({filteredRecords.length})
                    </h1>
                </div>

                {/* Search Bar and Manage Button row container */}
                <div className="flex items-center gap-4 flex-1 justify-end max-w-xl">
                    {!dashboardLoading && globalRecords.length > 0 && (
                        <div className="w-full relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                                <Search size={18} />
                            </div>
                            <input 
                                type="text"
                                placeholder="Search by Reference No or Subject Matter..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-900/60 border border-white-800/90 focus:border-white-700 text-white placeholder-slate-500 text-sm font-bold pl-11 pr-4 py-2.5 rounded-xl outline-none shadow-inner transition-all focus:ring-1 focus:ring-slate-700"
                            />
                            {searchTerm && (
                                <button 
                                    onClick={() => setSearchTerm('')} 
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-white bg-transparent border-none cursor-pointer"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    )}
                    
                    <button
                        onClick={handleManagementNavigation}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white disabled:text-slate-500 font-bold text-sm px-5 py-2.5 rounded-lg transition-all shadow-md cursor-pointer disabled:cursor-not-allowed select-none border border-transparent whitespace-nowrap"
                    >
                        <Settings size={16} />
                        <span>{actionLoading ? 'Checking...' : 'Manage Index'}</span>
                    </button>
                </div>
            </div>

            {dashboardLoading ? (
                <div className="p-24 text-center bg-transparent">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-6"></div>
                    <p className="text-slate-400 font-bold text-xl tracking-wide">Retrieving Mohtasib Monitoring Index...</p>
                </div>
            ) : globalRecords.length === 0 ? (
                <div className="p-24 text-center bg-slate-950/40 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-md">
                    <ShieldAlert size={64} className="mx-auto text-slate-700 mb-4" />
                    <h3 className="text-2xl font-bold text-slate-400">No Mohtasib records recorded globally.</h3>
                </div>
            ) : filteredRecords.length === 0 ? (
                <div className="p-24 text-center bg-slate-950/40 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-md">
                    <AlertCircle size={48} className="mx-auto text-slate-600 mb-4" />
                    <h3 className="text-xl font-bold text-slate-400">No parameters matched your explicit tracking search query.</h3>
                </div>
            ) : (
                /* Two Column Layout Matching the Shared Screen Visual Reference */
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                    {filteredRecords.map((item, index) => {
                        const isAlertActive = checkIsImminentAlert(item.appearance_date, item.appearance_time);
                        const isCrossed = checkIsDateCrossed(item.appearance_date);
                        
                        return (
                            <div 
                                key={item.id || index}
                                onClick={() => handleOpenDetails(item)}
                                className={`group relative p-6 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[190px] ${
                                    isAlertActive 
                                        ? 'animate-pulse-subtle shadow-[0_0_15px_rgba(239,68,68,0.15)]' 
                                        : isCrossed
                                            ? 'bg-slate-950/20 opacity-50 hover:opacity-80 border-slate-900 shadow-sm'
                                            : 'bg-slate-900/40 hover:bg-slate-900/70 border-slate-800/80 hover:border-slate-700 shadow-md'
                                }`}
                            >
                                {/* Imminent System Attention Tag Badge */}
                                {isAlertActive && (
                                    <div className="absolute -top-3 left-4 bg-red-600 text-white text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded uppercase shadow-md flex items-center gap-1 animate-bounce">
                                        <AlertCircle size={10} />
                                        <span>CEO Attention Required (&lt;48 Hours)</span>
                                    </div>
                                )}

                                {/* Crossed Date Watermark Label */}
                                {isCrossed && (
                                    <div className="absolute -top-2.5 left-4 bg-slate-800 text-slate-400 text-[9px] font-bold tracking-wider px-2 py-0.5 rounded border border-slate-700 shadow-sm">
                                        APPEARANCE DATE CROSSED
                                    </div>
                                )}

                                {/* Row Header Info */}
                                <div className="grid grid-cols-12 gap-4 items-start mb-4">
                                    {/* Column 1: Core Entity Details */}
                                    <div className="col-span-6 border-r border-slate-800/60 pr-2">
                                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Recipient / Case Target</div>
                                        <div className="text-lg font-black text-white tracking-wide uppercase truncate">
                                            {item.letter_directed_to || '-'}
                                        </div>
                                        <div className="text-s text-yellow font-mono font-bold mt-1 truncate tracking-tight">
                                            Ref: {item.reference_no || '-'}
                                        </div>
                                    </div>

                                    {/* Column 2: Explicit Timestamps */}
                                    <div className="col-span-3 border-r border-slate-800/60 px-2">
                                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Appearance Details</div>
                                        <div className={`text-base font-black font-mono tracking-wide ${isAlertActive ? 'text-red-400' : isCrossed ? 'text-slate-500' : 'text-amber-500/90'}`}>
                                            {item.appearance_date ? new Date(item.appearance_date).toLocaleDateString('en-GB') : '-'}
                                        </div>
                                        {/* Display appearance time below the appearance date layout wrapper */}
                                        <div className="text-xs font-bold font-mono text-slate-400 mt-1 flex items-center gap-1">
                                            <Clock size={11} className="text-slate-500" />
                                            <span>{formatTime12h(item.appearance_time)}</span>
                                        </div>
                                    </div>

                                    {/* Column 3: Source & Department Metadata */}
                                    <div className="col-span-3 pl-2 truncate">
                                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Origin / Sender</div>
                                        <div className="text-sm font-bold text-slate-300 uppercase truncate">
                                            {item.letter_from || '-'}
                                        </div>
                                    </div>
                                </div>

                                {/* Row Body Subject Message */}
                                <div className="mb-4">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Subject Matter</div>
                                    <p className="text-slate-300 font-bold text-sm leading-snug tracking-wide line-clamp-2 uppercase group-hover:text-white transition-colors">
                                        {item.subject || 'No Subject Listed'}
                                    </p>
                                </div>

                                {/* Row Footer Interactions */}
                                <div className="flex justify-between items-center border-t border-slate-800/50 pt-3 mt-auto">
                                    <div className="flex gap-2 items-center">
                                        <span className="bg-slate-800/90 text-slate-400 text-[10px] rounded px-2 py-0.5 font-mono uppercase tracking-wide border border-slate-700/60">
                                            {item.letter_stage || 'N/A'}
                                        </span>
                                        <span className="bg-slate-950 text-cyan-400 text-[10px] rounded px-2 py-0.5 font-mono uppercase tracking-wide border border-slate-800/80">
                                            {item.status || 'N/A'}
                                        </span>
                                    </div>

                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenDetails(item);
                                        }}
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 group-hover:text-blue-300 transition-colors bg-transparent border-none cursor-pointer"
                                    >
                                        <Eye size={14} />
                                        <span>Details</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Immersive Detail Modal Popup Dialog overlay */}
            {isModalOpen && selectedRecord && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden transform scale-100 transition-transform">
                        {/* Header banner area */}
                        <div className="bg-slate-950/70 p-6 border-b border-slate-800 flex justify-between items-center">
                            <div>
                                <span className="text-[10px] tracking-widest uppercase font-black px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-900/50">
                                    Full File Examination
                                </span>
                                <h2 className="text-xl font-black text-white mt-2 tracking-wide uppercase font-mono">
                                    {selectedRecord.reference_no || 'Missing Reference ID'}
                                </h2>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors bg-transparent border-none cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Informational Parameter Block Grid containing verbatim Database Column Identifiers */}
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            {checkIsImminentAlert(selectedRecord.appearance_date, selectedRecord.appearance_time) && (
                                <div className="p-4 bg-red-950/40 border border-red-900/60 rounded-xl flex items-start gap-3">
                                    <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                                    <div>
                                        <h4 className="text-sm font-black text-red-400 uppercase tracking-wide">High Urgency Attention State Active</h4>
                                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                                            This hearing timeline parameters execute inside the target 48-hour management response window.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Row 1 */}
                                <div>
                                    <label className="text-[11px] font-mono text-slate-500 font-bold uppercase tracking-wider block mb-1">event_date</label>
                                    <div className="text-sm font-bold font-mono text-white bg-slate-950/30 p-2.5 rounded border border-slate-800/40">
                                        {selectedRecord.event_date ? new Date(selectedRecord.event_date).toLocaleDateString('en-GB') : '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[11px] font-mono text-slate-500 font-bold uppercase tracking-wider block mb-1">reference_no</label>
                                    <div className="text-sm font-bold font-mono text-white bg-slate-950/30 p-2.5 rounded border border-slate-800/40">
                                        {selectedRecord.reference_no || '-'}
                                    </div>
                                </div>

                                {/* Row 2 */}
                                <div>
                                    <label className="text-[11px] font-mono text-slate-500 font-bold uppercase tracking-wider block mb-1">appearance_date</label>
                                    <div className="text-sm font-bold font-mono text-amber-500 bg-slate-950/30 p-2.5 rounded border border-slate-800/40">
                                        {selectedRecord.appearance_date ? new Date(selectedRecord.appearance_date).toLocaleDateString('en-GB') : '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[11px] font-mono text-slate-500 font-bold uppercase tracking-wider block mb-1">appearance_time</label>
                                    <div className="text-sm font-bold font-mono text-emerald-400 bg-slate-950/30 p-2.5 rounded border border-slate-800/40">
                                        {formatTime12h(selectedRecord.appearance_time)}
                                    </div>
                                </div>

                                {/* Row 3 */}
                                <div>
                                    <label className="text-[11px] font-mono text-slate-500 font-bold uppercase tracking-wider block mb-1">letter_directed_to</label>
                                    <div className="text-sm font-bold text-white bg-slate-950/30 p-2.5 rounded border border-slate-800/40 uppercase">
                                        {selectedRecord.letter_directed_to || '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[11px] font-mono text-slate-500 font-bold uppercase tracking-wider block mb-1">letter_from</label>
                                    <div className="text-sm font-bold text-white bg-slate-950/30 p-2.5 rounded border border-slate-800/40 uppercase">
                                        {selectedRecord.letter_from || '-'}
                                    </div>
                                </div>

                                {/* Row 4 */}
                                <div>
                                    <label className="text-[11px] font-mono text-slate-500 font-bold uppercase tracking-wider block mb-1">secretariat</label>
                                    <div className="text-sm font-bold text-white bg-slate-950/30 p-2.5 rounded border border-slate-800/40 uppercase">
                                        {selectedRecord.secretariat || '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[11px] font-mono text-slate-500 font-bold uppercase tracking-wider block mb-1">assigned_to</label>
                                    <div className="text-sm font-bold text-slate-300 bg-slate-950/30 p-2.5 rounded border border-slate-800/40 flex items-center gap-2 uppercase">
                                        <Briefcase size={14} className="text-slate-500" />
                                        <span>{selectedRecord.assigned_to || 'Unassigned'}</span>
                                    </div>
                                </div>

                                {/* Row 5 */}
                                <div>
                                    <label className="text-[11px] font-mono text-slate-500 font-bold uppercase tracking-wider block mb-1">letter_stage</label>
                                    <span className="inline-block bg-red-950/60 text-red-400 border border-red-900/60 text-xs font-mono rounded px-3 py-2.5 uppercase tracking-wider w-full text-center">
                                        {selectedRecord.letter_stage || '-'}
                                    </span>
                                </div>
                                <div>
                                    <label className="text-[11px] font-mono text-slate-500 font-bold uppercase tracking-wider block mb-1">status</label>
                                    <span className="inline-block bg-blue-950/60 border border-blue-900/60 text-cyan-400 text-xs font-mono rounded px-3 py-2.5 uppercase tracking-wider w-full text-center">
                                        {selectedRecord.status || '-'}
                                    </span>
                                </div>
                            </div>

                            {/* Full-width Columns */}
                            <div className="border-t border-slate-800/80 pt-4 space-y-4">
                                <div>
                                    <label className="text-[11px] font-mono text-slate-500 font-bold uppercase tracking-wider block mb-1">subject</label>
                                    <p className="text-slate-200 text-sm font-bold leading-relaxed bg-slate-950/30 border border-slate-800/50 p-4 rounded-xl uppercase">
                                        {selectedRecord.subject || '-'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-[11px] font-mono text-slate-500 font-bold uppercase tracking-wider block mb-1">action_required</label>
                                    <p className="text-emerald-400 text-sm font-bold leading-relaxed bg-emerald-950/20 border border-emerald-900/40 p-4 rounded-xl">
                                        {selectedRecord.action_required || 'No procedural operations marked at this current index juncture.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer Closing Action Row */}
                        <div className="bg-slate-950/50 p-4 border-t border-slate-800 flex justify-end">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-colors border-none cursor-pointer"
                            >
                                Dismiss Review
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div> 
    );
};

export default MohatsibDashboard;