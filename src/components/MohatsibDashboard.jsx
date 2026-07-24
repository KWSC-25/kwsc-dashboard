import React, { useState, useEffect } from 'react';
import { Settings, AlertCircle, ArrowLeft, ShieldAlert, X, Eye, Clock, Search, Layers, Building2, CheckCircle2, Clock3, AlertTriangle, FileText } from 'lucide-react';
import api from '../utils/api';
import MohtasibForm from './MohtasibForm';

const MohatsibDashboard = () => {
    const [isManagingPanel, setIsManagingPanel] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);
    const [dashboardLoading, setDashboardLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [globalRecords, setGlobalRecords] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Full File Examination Modal state
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Zone / Department Specific Details Popup Modal state
    const [selectedZone, setSelectedZone] = useState(null);
    const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);

    // Standard Department List for KPI mapping
    const STANDARD_DEPTS = ['Zone-I', 'Zone-II', 'Zone-III', 'Zone-IV', 'WTM', 'CCO (RRG)', 'HRDA', 'Legal'];

    // Standard Statuses for KPI mapping
    const STATUS_KEYS = {
        PENDING: 'Pending (Awaiting Action)',
        UNRESOLVED: 'Unresolved',
        IN_PROCESS: 'In Process',
        RESOLVED: 'Resolved & Closed'
    };

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
            
            const now = new Date();

            const upcomingRecords = [];
            const pastRecords = [];

            rawRecords.forEach(record => {
                const rawAppearanceDate = record.appearance_date || record.hearing_date;
                const targetDate = rawAppearanceDate ? new Date(rawAppearanceDate) : null;
                if (targetDate) {
                    if (record.appearance_time) {
                        const [h, m, s] = record.appearance_time.split(':');
                        targetDate.setHours(parseInt(h || 0, 10), parseInt(m || 0, 10), parseInt(s || 0, 10));
                    } else {
                        targetDate.setHours(23, 59, 59, 999);
                    }

                    if (targetDate >= now) {
                        upcomingRecords.push(record);
                    } else {
                        pastRecords.push(record);
                    }
                } else {
                    pastRecords.push(record);
                }
            });

            // ASCENDING for future
            upcomingRecords.sort((a, b) => {
                const rawA = a.appearance_date || a.hearing_date;
                const rawB = b.appearance_date || b.hearing_date;
                const dateA = rawA ? new Date(rawA) : new Date(0);
                const dateB = rawB ? new Date(rawB) : new Date(0);
                if (dateA.getTime() === dateB.getTime()) {
                    const timeA = a.appearance_time || "00:00:00";
                    const timeB = b.appearance_time || "00:00:00";
                    return timeA.localeCompare(timeB);
                }
                return dateA - dateB;
            });

            // DESCENDING for past
            pastRecords.sort((a, b) => {
                const rawA = a.appearance_date || a.hearing_date;
                const rawB = b.appearance_date || b.hearing_date;
                const dateA = rawA ? new Date(rawA) : new Date(0);
                const dateB = rawB ? new Date(rawB) : new Date(0);
                if (dateA.getTime() === dateB.getTime()) {
                    const timeA = a.appearance_time || "00:00:00";
                    const timeB = b.appearance_time || "00:00:00";
                    return timeB.localeCompare(timeA);
                }
                return dateB - dateA;
            });

            setGlobalRecords([...upcomingRecords, ...pastRecords]);
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

    // Corrected Local Date Formatter for Table View (DD/MM/YYYY)
    const formatDateForTable = (dateStr) => {
        if (!dateStr) return '-';
        
        if (!dateStr.includes('T')) {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
            return dateStr;
        }

        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${day}/${month}/${year}`;
    };

    const normalizeStatus = (rawStatus) => {
        if (!rawStatus) return STATUS_KEYS.PENDING;
        const lower = rawStatus.toLowerCase().trim();
        if (Object.values(STATUS_KEYS).includes(rawStatus)) return rawStatus;
        if (lower.includes('un-resolved') || lower.includes('unresolved')) return STATUS_KEYS.UNRESOLVED;
        if (lower.includes('in process')) return STATUS_KEYS.IN_PROCESS;
        if (lower.includes('disposed') || lower.includes('resolved')) return STATUS_KEYS.RESOLVED;
        return STATUS_KEYS.PENDING;
    };

    const getStatusBadgeStyle = (status) => {
        const norm = normalizeStatus(status);
        switch (norm) {
            case STATUS_KEYS.PENDING:
                return 'bg-amber-950/80 text-amber-300 border-amber-800/80';
            case STATUS_KEYS.UNRESOLVED:
                return 'bg-rose-950/80 text-rose-300 border-rose-800/80';
            case STATUS_KEYS.IN_PROCESS:
                return 'bg-blue-950/80 text-blue-300 border-blue-800/80';
            case STATUS_KEYS.RESOLVED:
                return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80';
            default:
                return 'bg-slate-900 text-slate-300 border-slate-700';
        }
    };

    const checkIsImminentAlert = (appearanceDateStr, appearanceTimeStr) => {
        if (!appearanceDateStr) return false;
        const now = new Date();
        const targetDateTime = new Date(appearanceDateStr);
        
        if (appearanceTimeStr) {
            const [hours, minutes, seconds] = appearanceTimeStr.split(':');
            targetDateTime.setHours(parseInt(hours || 0, 10), parseInt(minutes || 0, 10), parseInt(seconds || 0, 10));
        } else {
            targetDateTime.setHours(23, 59, 59, 999);
        }

        const timeDifferenceMs = targetDateTime.getTime() - now.getTime();
        const fortyEightHoursInMs = 48 * 60 * 60 * 1000;

        return timeDifferenceMs > 0 && timeDifferenceMs <= fortyEightHoursInMs;
    };

    const checkIsDateCrossed = (appearanceDateStr, appearanceTimeStr) => {
        if (!appearanceDateStr) return true;
        const now = new Date();
        const targetDateTime = new Date(appearanceDateStr);
        
        if (appearanceTimeStr) {
            const [hours, minutes, seconds] = appearanceTimeStr.split(':');
            targetDateTime.setHours(parseInt(hours || 0, 10), parseInt(minutes || 0, 10), parseInt(seconds || 0, 10));
        } else {
            targetDateTime.setHours(23, 59, 59, 999);
        }

        return targetDateTime < now;
    };

    const handleOpenDetails = (record) => {
        setSelectedRecord(record);
        setIsModalOpen(true);
    };

    const handleOpenZoneModal = (deptName) => {
        setSelectedZone(deptName);
        setIsZoneModalOpen(true);
    };

    // SEARCH FILTER OVER ALL DB COLUMNS (INCLUDES FORMATTED & RAW DATES)
    const filteredRecords = globalRecords.filter(item => {
        if (!searchTerm) return true;
        const clean = searchTerm.toLowerCase().trim();

        const rawAppearanceDate = item.appearance_date || item.hearing_date || '';
        const formattedAppearanceDate = formatDateForTable(rawAppearanceDate);
        const formattedEventDate = formatDateForTable(item.event_date);
        
        const fieldsToSearch = [
            item.case_no,
            item.reference_no,
            item.subject,
            item.ceo_dak_receipt_no,
            item.previous_letter_no,
            item.letter_directed_to,
            item.letter_from,
            item.secretariat,
            item.assigned_to,
            item.department_assigned,
            item.cc_to,
            item.letter_stage,
            item.status,
            item.action_required,
            item.event_date,
            formattedEventDate,
            rawAppearanceDate,
            formattedAppearanceDate,
            item.appearance_time
        ];

        return fieldsToSearch.some(val => val && String(val).toLowerCase().includes(clean));
    });

    // FILTERED RECORDS FOR DEPARTMENT / ZONE MODAL
    const selectedZoneRecords = globalRecords.filter(item => {
        if (!selectedZone) return false;
        const dept = (item.department_assigned || '').trim();
        if (selectedZone === 'Others') {
            return !STANDARD_DEPTS.includes(dept);
        }
        return dept === selectedZone;
    });

    // KPI CALCULATIONS
    const kpiStatusCounts = {
        total: globalRecords.length,
        pending: 0,
        unresolved: 0,
        inProcess: 0,
        resolved: 0
    };

    const kpiDeptCounts = {
        'Zone-I': 0,
        'Zone-II': 0,
        'Zone-III': 0,
        'Zone-IV': 0,
        'WTM': 0,
        'CCO (RRG)': 0,
        'HRDA': 0,
        'Legal': 0,
        'Others': 0
    };

    globalRecords.forEach(item => {
        // Status KPI mapping
        const norm = normalizeStatus(item.status);
        if (norm === STATUS_KEYS.PENDING) kpiStatusCounts.pending++;
        else if (norm === STATUS_KEYS.UNRESOLVED) kpiStatusCounts.unresolved++;
        else if (norm === STATUS_KEYS.IN_PROCESS) kpiStatusCounts.inProcess++;
        else if (norm === STATUS_KEYS.RESOLVED) kpiStatusCounts.resolved++;

        // Department KPI mapping
        const dept = (item.department_assigned || '').trim();
        if (STANDARD_DEPTS.includes(dept)) {
            kpiDeptCounts[dept]++;
        } else {
            kpiDeptCounts['Others']++;
        }
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
        <div className="p-6 sm:p-8 relative text-slate-200 bg-transparent min-h-screen">
            <style>{`
                @keyframes subtlePulseRed {
                    0%, 100% { background-color: rgba(225, 29, 72, 0.12); border-color: rgba(225, 29, 72, 0.5); }
                    50% { background-color: rgba(225, 29, 72, 0.28); border-color: rgba(225, 29, 72, 0.9); }
                }
                .animate-pulse-subtle {
                    animation: subtlePulseRed 1.8s infinite ease-in-out;
                }
            `}</style>

            {toastMessage && (
                <div className="fixed top-8 right-8 bg-rose-600 text-white px-6 py-4 rounded-xl z-50 shadow-2xl flex items-center gap-3 border border-rose-500 animate-in fade-in slide-in-from-top-4 duration-200">
                    <AlertCircle size={24} />
                    <span className="font-bold text-lg">{toastMessage}</span>
                </div>
            )}

            {/* TOP HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-800 pb-4">
                <div>
                    <span className="bg-amber-500 text-slate-950 px-3 py-1 text-xs font-black uppercase tracking-wider rounded-md mr-3 inline-block">EXECUTIVE MONITORING</span>
                    <h1 className="text-2xl font-black text-white inline-block tracking-wide uppercase align-middle mt-1 md:mt-0">
                        Mohtasib Case Tracking Registry
                    </h1>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                    <button
                        onClick={handleManagementNavigation}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white disabled:text-slate-500 font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer border border-transparent whitespace-nowrap"
                    >
                        <Settings size={16} />
                        <span>{actionLoading ? 'Checking...' : 'Manage Index'}</span>
                    </button>
                </div>
            </div>

            {/* ALL-COLUMN SEARCH BAR */}
            <div className="mb-6">
                <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <Search size={20} />
                    </div>
                    <input 
                        type="text"
                        placeholder="Search across all columns (DAK Receipt, Case No, Ref No, Directed To, Subject, Dept, Status, Dates...)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-blue-500 text-white placeholder-slate-400 text-base font-medium pl-12 pr-10 py-3 rounded-xl outline-none shadow-inner transition-all focus:ring-2 focus:ring-blue-500/30"
                    />
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')} 
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white bg-transparent border-none cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* KPI ROW 1: STATUS SUMMARY COUNTS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
                {/* Total Rows */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 shadow-sm">
                    <div className="flex justify-between items-center text-slate-400 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider">Total Records</span>
                        <Layers size={16} className="text-blue-400" />
                    </div>
                    <div className="text-2xl font-black text-white font-mono">{kpiStatusCounts.total}</div>
                </div>

                {/* Pending */}
                <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-3.5 shadow-sm">
                    <div className="flex justify-between items-center text-amber-400 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider">Pending (Awaiting Action)</span>
                        <Clock3 size={16} />
                    </div>
                    <div className="text-2xl font-black text-amber-300 font-mono">{kpiStatusCounts.pending}</div>
                </div>

                {/* Unresolved */}
                <div className="bg-rose-950/20 border border-rose-800/40 rounded-xl p-3.5 shadow-sm">
                    <div className="flex justify-between items-center text-rose-400 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider">Unresolved</span>
                        <AlertTriangle size={16} />
                    </div>
                    <div className="text-2xl font-black text-rose-300 font-mono">{kpiStatusCounts.unresolved}</div>
                </div>

                {/* In Process */}
                <div className="bg-blue-950/20 border border-blue-800/40 rounded-xl p-3.5 shadow-sm">
                    <div className="flex justify-between items-center text-blue-400 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider">In Process</span>
                        <FileText size={16} />
                    </div>
                    <div className="text-2xl font-black text-blue-300 font-mono">{kpiStatusCounts.inProcess}</div>
                </div>

                {/* Resolved & Closed */}
                <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-3.5 shadow-sm col-span-2 sm:col-span-1">
                    <div className="flex justify-between items-center text-emerald-400 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider">Resolved</span>
                        <CheckCircle2 size={16} />
                    </div>
                    <div className="text-2xl font-black text-emerald-300 font-mono">{kpiStatusCounts.resolved}</div>
                </div>
            </div>

            {/* KPI ROW 2: DEPARTMENT ASSIGNED BREAKDOWN (INTERACTIVE CLICKABLE CARDS) */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 mb-6 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400 mb-3 tracking-wider">
                    <Building2 size={15} className="text-sky-400" />
                    <span>Department / Zone Distribution (Click card to view details)</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
                    {STANDARD_DEPTS.map(dept => (
                        <div 
                            key={dept} 
                            onClick={() => handleOpenZoneModal(dept)}
                            className="bg-slate-950/60 border border-slate-800/80 hover:border-sky-500/60 hover:bg-slate-900 p-2.5 text-center cursor-pointer rounded-lg transition-all transform hover:-translate-y-0.5 group"
                        >
                            <div className="text-[11px] font-bold text-slate-400 group-hover:text-sky-300 truncate transition-colors">{dept}</div>
                            <div className="text-lg font-black text-sky-300 font-mono mt-0.5">{kpiDeptCounts[dept]}</div>
                        </div>
                    ))}
                    {/* Others */}
                    <div 
                        onClick={() => handleOpenZoneModal('Others')}
                        className="bg-slate-950/60 border border-slate-800/80 hover:border-purple-500/60 hover:bg-slate-900 p-2.5 text-center cursor-pointer rounded-lg transition-all transform hover:-translate-y-0.5 group"
                    >
                        <div className="text-[11px] font-bold text-slate-400 group-hover:text-purple-300 truncate transition-colors">Others</div>
                        <div className="text-lg font-black text-purple-300 font-mono mt-0.5">{kpiDeptCounts['Others']}</div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT DATA TABLE */}
            {dashboardLoading ? (
                <div className="p-24 text-center bg-transparent">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-6"></div>
                    <p className="text-slate-400 font-bold text-xl tracking-wide">Retrieving Mohtasib Registry Index...</p>
                </div>
            ) : globalRecords.length === 0 ? (
                <div className="p-24 text-center bg-slate-950/40 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md">
                    <ShieldAlert size={64} className="mx-auto text-slate-700 mb-4" />
                    <h3 className="text-2xl font-bold text-slate-400">No Mohtasib records recorded globally.</h3>
                </div>
            ) : filteredRecords.length === 0 ? (
                <div className="p-24 text-center bg-slate-950/40 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md">
                    <AlertCircle size={48} className="mx-auto text-slate-600 mb-4" />
                    <h3 className="text-xl font-bold text-slate-400">No entries matched your cross-column search query.</h3>
                </div>
            ) : (
                <div className="overflow-x-auto bg-slate-950/50 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md">
                    <table className="w-full text-left border-collapse table-auto min-w-[1700px]">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/90 text-xs font-black tracking-widest text-slate-400 uppercase">
                                <th className="p-4 pl-3 w-12 text-center">S.No</th>
                                <th className="p-4">CEO DAK Receipt</th>
                                <th className="p-4">Case No</th>
                                <th className="p-4">Ref No</th>
                                <th className="p-4">Appearance Date & Time</th>
                                <th className="p-4">Letter Directed To</th>
                                <th className="p-4">Letter From</th>
                                <th className="p-4">Dept Assigned</th>
                                <th className="p-4">Secretariat</th>
                                <th className="p-4">Subject Matter</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-sm font-semibold text-slate-300">
                            {filteredRecords.map((item, index) => {
                                const appearanceDateStr = item.appearance_date || item.hearing_date;
                                const isAlertActive = checkIsImminentAlert(appearanceDateStr, item.appearance_time);
                                const isCrossed = checkIsDateCrossed(appearanceDateStr, item.appearance_time);
                                const normStatus = normalizeStatus(item.status);

                                return (
                                    <tr 
                                        key={item.id || index}
                                        className={`transition-colors duration-200 ${
                                            isAlertActive 
                                                ? 'animate-pulse-subtle' 
                                                : isCrossed
                                                    ? 'bg-slate-950/40 opacity-45 hover:opacity-75'
                                                    : 'hover:bg-slate-900/40'
                                        }`}
                                    >
                                        {/* Seq */}
                                        <td className="p-4 pl-3 font-mono text-slate-500 font-bold text-center">
                                            {index + 1}
                                        </td>

                                        {/* CEO DAK Receipt No */}
                                        <td className="p-4 font-mono font-bold text-cyan-400 whitespace-nowrap">
                                            {item.ceo_dak_receipt_no || '-'}
                                        </td>

                                        {/* Case No */}
                                        <td className="p-4 font-mono font-bold text-amber-400 whitespace-nowrap">
                                            {item.case_no || '-'}
                                        </td>

                                        {/* Ref No */}
                                        <td className="p-4 font-mono font-bold text-amber-400 whitespace-nowrap">
                                            {item.reference_no || '-'}
                                        </td>

                                        {/* Appearance Date & Time */}
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className={`font-mono font-bold text-base ${
                                                    isAlertActive ? 'text-rose-400' : isCrossed ? 'text-slate-500 line-through' : 'text-amber-300'
                                                }`}>
                                                    {formatDateForTable(appearanceDateStr)}
                                                </span>
                                                <span className="font-mono text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                                    <Clock size={12} className="text-slate-500" />
                                                    {formatTime12h(item.appearance_time)}
                                                </span>
                                                {isAlertActive && (
                                                    <span className="mt-1 text-[10px] font-black uppercase text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/80 inline-block w-fit animate-pulse">
                                                        CEO Attention (&lt;48h)
                                                    </span>
                                                )}
                                                {isCrossed && (
                                                    <span className="mt-1 text-[10px] font-bold uppercase text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 inline-block w-fit">
                                                        Date Passed
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Directed To */}
                                        <td className="p-4 text-white font-bold uppercase whitespace-nowrap max-w-xs truncate" title={item.letter_directed_to}>
                                            {item.letter_directed_to || '-'}
                                        </td>

                                        {/* From */}
                                        <td className="p-4 uppercase whitespace-nowrap max-w-xs truncate" title={item.letter_from}>
                                            {item.letter_from || '-'}
                                        </td>

                                        {/* Dept Assigned */}
                                        <td className="p-4 whitespace-nowrap">
                                            <span className="bg-sky-950/60 text-sky-300 border border-sky-800/50 text-xs px-2.5 py-1 rounded-lg font-bold">
                                                {item.department_assigned || '-'}
                                            </span>
                                        </td>

                                        {/* Secretariat */}
                                        <td className="p-4 whitespace-nowrap text-slate-400">
                                            {item.secretariat || '-'}
                                        </td>

                                        {/* Subject */}
                                        <td className="p-4 max-w-md truncate uppercase text-slate-300" title={item.subject}>
                                            {item.subject || '-'}
                                        </td>

                                        {/* Status */}
                                        <td className="p-4 whitespace-nowrap">
                                            <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${getStatusBadgeStyle(normStatus)}`}>
                                                {normStatus}
                                            </span>
                                        </td>

                                        {/* Action / View Button */}
                                        <td className="p-4 text-center whitespace-nowrap">
                                            <button
                                                onClick={() => handleOpenDetails(item)}
                                                className="inline-flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600 border border-blue-500/40 hover:border-blue-500 text-blue-300 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                                            >
                                                <Eye size={14} />
                                                <span>View</span>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* FULL DETAILS POPUP MODAL */}
            {isModalOpen && selectedRecord && (
                <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden transform scale-100 transition-transform my-8">
                        {/* Header */}
                        <div className="bg-slate-950/80 p-5 border-b border-slate-800 flex justify-between items-center">
                            <div>
                                <span className="text-[10px] tracking-widest uppercase font-black px-2.5 py-1 rounded bg-blue-950 text-blue-400 border border-blue-900/60">
                                    Full File Examination
                                </span>
                                <h2 className="text-xl font-black text-white mt-1.5 tracking-wide font-mono uppercase">
                                    Case No: {selectedRecord.case_no || 'N/A'}
                                </h2>
                                <h3 className="text-xl font-black text-white mt-1.5 tracking-wide font-mono uppercase">
                                    Ref: {selectedRecord.reference_no || 'N/A'}
                                </h3>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors bg-transparent border-none cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Complete Field View Grid */}
                        <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto text-slate-200">
                            {checkIsImminentAlert(selectedRecord.appearance_date || selectedRecord.hearing_date, selectedRecord.appearance_time) && (
                                <div className="p-4 bg-rose-950/40 border border-rose-900/80 rounded-xl flex items-start gap-3">
                                    <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={20} />
                                    <div>
                                        <h4 className="text-sm font-black text-rose-400 uppercase tracking-wide">High Urgency Attention Active</h4>
                                        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                                            This hearing timeline falls inside the target 48-hour response window.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-mono text-slate-500 font-bold uppercase block mb-1">CEO DAK Receipt No</label>
                                    <div className="text-sm font-bold font-mono text-cyan-400 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
                                        {selectedRecord.ceo_dak_receipt_no || '-'}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] font-mono text-slate-500 font-bold uppercase block mb-1">Previous Letter / Hawal No</label>
                                    <div className="text-sm font-bold font-mono text-slate-300 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
                                        {selectedRecord.previous_letter_no || '-'}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] font-mono text-slate-500 font-bold uppercase block mb-1">Letter Date</label>
                                    <div className="text-sm font-bold font-mono text-white bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
                                        {formatDateForTable(selectedRecord.event_date)}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] font-mono text-slate-500 font-bold uppercase block mb-1">Appearance Date & Time</label>
                                    <div className="text-sm font-bold font-mono text-amber-400 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center">
                                        <span>{formatDateForTable(selectedRecord.appearance_date || selectedRecord.hearing_date)}</span>
                                        <span className="text-emerald-400">{formatTime12h(selectedRecord.appearance_time)}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] font-mono text-slate-500 font-bold uppercase block mb-1">Letter Addressed To</label>
                                    <div className="text-sm font-bold text-white bg-slate-950/50 p-2.5 rounded-lg border border-slate-800 uppercase">
                                        {selectedRecord.letter_directed_to || '-'}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] font-mono text-slate-500 font-bold uppercase block mb-1">Letter From</label>
                                    <div className="text-sm font-bold text-white bg-slate-950/50 p-2.5 rounded-lg border border-slate-800 uppercase">
                                        {selectedRecord.letter_from || '-'}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] font-mono text-slate-500 font-bold uppercase block mb-1">Secretariat</label>
                                    <div className="text-sm font-bold text-slate-300 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
                                        {selectedRecord.secretariat || '-'}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] font-mono text-slate-500 font-bold uppercase block mb-1">Department Assigned</label>
                                    <div className="text-sm font-bold text-sky-400 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
                                        {selectedRecord.department_assigned || '-'}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] font-mono text-slate-500 font-bold uppercase block mb-1">Assigned To</label>
                                    <div className="text-sm font-bold text-slate-300 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800 uppercase">
                                        {selectedRecord.assigned_to || '-'}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] font-mono text-slate-500 font-bold uppercase block mb-1">Letter Stage</label>
                                    <div className="text-sm font-bold text-rose-400 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800 font-mono uppercase">
                                        {selectedRecord.letter_stage || '-'}
                                    </div>
                                </div>
                            </div>

                            {/* Full-width Detailed Columns */}
                            <div className="space-y-4 border-t border-slate-800/80 pt-4">
                                <div>
                                    <label className="text-[11px] font-mono text-slate-500 font-bold uppercase block mb-1">Status</label>
                                    <div className="p-2.5 bg-slate-950/50 border border-slate-800 rounded-lg">
                                        <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-md border ${getStatusBadgeStyle(selectedRecord.status)}`}>
                                            {normalizeStatus(selectedRecord.status)}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] font-mono text-slate-500 font-bold uppercase block mb-1">CC To / Information Copies</label>
                                    <p className="text-slate-300 text-sm font-medium bg-slate-950/50 border border-slate-800 p-3 rounded-lg leading-relaxed">
                                        {selectedRecord.cc_to || '-'}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-[11px] font-mono text-slate-500 font-bold uppercase block mb-1">Subject Matter</label>
                                    <p className="text-slate-200 text-sm font-bold bg-slate-950/50 border border-slate-800 p-3.5 rounded-xl uppercase leading-relaxed">
                                        {selectedRecord.subject || '-'}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-[11px] font-mono text-slate-500 font-bold uppercase block mb-1">Action Required</label>
                                    <p className="text-emerald-400 text-sm font-bold bg-emerald-950/20 border border-emerald-900/40 p-3.5 rounded-xl leading-relaxed">
                                        {selectedRecord.action_required || 'No explicit procedural action outlined.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-slate-950/80 p-4 border-t border-slate-800 flex justify-end">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-colors border-none cursor-pointer"
                            >
                                Close File
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DEPARTMENT / ZONE RECORDS DETAILS POPUP MODAL */}
            {isZoneModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8">
                        
                        {/* Header */}
                        <div className="bg-slate-950/80 p-5 border-b border-slate-800 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
                                    <Building2 size={22} />
                                </div>
                                <div>
                                    <span className="text-[10px] tracking-widest uppercase font-black px-2.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-900/60">
                                        Department Breakdown View
                                    </span>
                                    <h2 className="text-xl font-black text-white mt-1 tracking-wide font-mono uppercase">
                                        {selectedZone} Records
                                    </h2>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsZoneModalOpen(false)}
                                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors bg-transparent border-none cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Streamlined Modal Table Container */}
                        <div className="p-6 overflow-y-auto max-h-[65vh]">
                            {selectedZoneRecords.length === 0 ? (
                                <div className="py-16 text-center text-slate-500 font-bold">
                                    No records currently assigned to {selectedZone}.
                                </div>
                            ) : (
                                <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/40">
                                    <table className="w-full text-left border-collapse table-auto min-w-[850px]">
                                        <thead>
                                            <tr className="border-b border-slate-800 bg-slate-950 text-xs font-black tracking-widest text-slate-400 uppercase">
                                                <th className="p-3.5 pl-4 w-12 text-center">S.No</th>
                                                <th className="p-3.5">CEO DAK Receipt</th>
                                                <th className="p-3.5">Case No</th>
                                                <th className="p-3.5">Ref No</th>
                                                <th className="p-3.5">Appearance Date & Time</th>
                                                <th className="p-3.5">Subject Matter</th>
                                                <th className="p-3.5">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/60 text-xs font-semibold text-slate-300">
                                            {selectedZoneRecords.map((item, idx) => {
                                                const appearanceDateStr = item.appearance_date || item.hearing_date;
                                                const normStatus = normalizeStatus(item.status);
                                                return (
                                                    <tr key={item.id || idx} className="hover:bg-slate-800/40 transition-colors">
                                                        <td className="p-3.5 pl-4 font-mono text-slate-500 text-center font-bold">
                                                            {idx + 1}
                                                        </td>
                                                        <td className="p-3.5 font-mono font-bold text-cyan-400 whitespace-nowrap">
                                                            {item.ceo_dak_receipt_no || '-'}
                                                        </td>
                                                        <td className="p-3.5 font-mono font-bold text-amber-400 whitespace-nowrap">
                                                            {item.case_no || '-'}
                                                        </td>
                                                        <td className="p-3.5 font-mono font-bold text-amber-400 whitespace-nowrap">
                                                            {item.reference_no || '-'}
                                                        </td>
                                                        <td className="p-3.5 whitespace-nowrap font-mono">
                                                            <span className="text-amber-300 font-bold">
                                                                {formatDateForTable(appearanceDateStr)}
                                                            </span>
                                                            <span className="text-slate-500 ml-2">
                                                                {formatTime12h(item.appearance_time)}
                                                            </span>
                                                        </td>
                                                        <td className="p-3.5 max-w-xs truncate text-slate-200 uppercase font-bold" title={item.subject}>
                                                            {item.subject || '-'}
                                                        </td>
                                                        <td className="p-3.5 whitespace-nowrap">
                                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${getStatusBadgeStyle(normStatus)}`}>
                                                                {normStatus}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="bg-slate-950/80 p-4 border-t border-slate-800 flex justify-between items-center">
                            <span className="text-xs text-slate-400 font-bold px-2">
                                Total {selectedZone} Records: <span className="text-white font-mono">{selectedZoneRecords.length}</span>
                            </span>
                            <button 
                                onClick={() => setIsZoneModalOpen(false)}
                                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-colors border-none cursor-pointer"
                            >
                                Close Modal
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div> 
    );
};

export default MohatsibDashboard;