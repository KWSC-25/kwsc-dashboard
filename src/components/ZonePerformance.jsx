import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { Layers, RefreshCw, ArrowLeft, CheckCircle2, X, Calendar, User, FileText, Hash, MapPin } from 'lucide-react';

// Helper function to format hours into Xmonth Xd Xh readable strings
const formatAgingHours = (hoursNum) => {
    if (!hoursNum || hoursNum <= 0) return '0hour';
    
    let totalHours = Math.round(hoursNum);
    const hoursInMonth = 30 * 24;
    const hoursInDay = 24;

    let months = Math.floor(totalHours / hoursInMonth);
    totalHours %= hoursInMonth;

    let days = Math.floor(totalHours / hoursInDay);
    let hours = totalHours % hoursInDay;

    let result = [];
    if (months > 0) result.push(`${months}month`);
    if (days > 0) result.push(`${days}day`);
    if (hours > 0 || result.length === 0) result.push(`${hours}hour`);

    return result.join(' ');
};

const ZonePerformance = ({ typeId, startDate, endDate }) => {
    // State Matrices for both Pending and Resolved Breakdowns
    const [pendingMatrix, setPendingMatrix] = useState({ columns: [], data: [] });
    const [resolvedMatrix, setResolvedMatrix] = useState({ columns: [], data: [] });
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Tracks active drill-down context to flip between Zone view and Town view globally
    const [selectedZone, setSelectedZone] = useState(null);

    // --- Modal Popup Management State Layouts ---
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        loading: false,
        title: '',
        subtitle: '',
        data: []
    });

    const fetchAllMatrixMetrics = useCallback(async (showSpinner = true) => {
        if (showSpinner) setLoading(true);
        try {
            const queryParams = { 
                typeId, 
                startDate, 
                endDate,
                zoneId: selectedZone ? selectedZone.id : undefined 
            };

            // Run both analytics data streaming operations in parallel
            const [pendingResp, resolvedResp] = await Promise.all([
                api.get('zone-complaints/zone-matrix', { params: queryParams }),
                api.get('zone-complaints/zone-resolved-matrix', { params: queryParams })
            ]);

            if (pendingResp.data?.success && resolvedResp.data?.success) {
                setPendingMatrix({
                    columns: pendingResp.data.columns || [],
                    data: pendingResp.data.data || []
                });
                setResolvedMatrix({
                    columns: resolvedResp.data.columns || [],
                    data: resolvedResp.data.data || []
                });
                setError(null);
            }
        } catch (err) {
            console.error("Matrix analytical cross-tabulation engine bottleneck:", err);
            setError("Failed to stream real-time zonal performance breakdown data structures.");
        } finally {
            if (showSpinner) setLoading(false);
        }
    }, [typeId, startDate, endDate, selectedZone]);

    // Initial load and filter change trigger hook
    useEffect(() => {
        fetchAllMatrixMetrics(true);
    }, [fetchAllMatrixMetrics]);

    // 30-second centralized polling thread to maintain complete data synchronicity
    useEffect(() => {
        const matrixAutoRefreshInterval = setInterval(() => {
            fetchAllMatrixMetrics(false); 
        }, 30000);

        return () => clearInterval(matrixAutoRefreshInterval);
    }, [fetchAllMatrixMetrics]);

    // --- Modal Breakdown Aggregation Engine (Only triggered for Pending) ---
    const handleCellDetailsClick = async (e, row, col, statusType) => {
        e.stopPropagation(); // Block parent <tr> click triggers when popping modals
        
        setModalConfig({
            isOpen: true,
            loading: true,
            title: col.label,
            subtitle: `${row.zone_name.toUpperCase()} • PENDING CASES`,
            data: []
        });

        try {
            const response = await api.get('zone-complaints/zone-complaint-breakdown', {
                params: {
                    typeId,
                    startDate,
                    endDate,
                    zoneId: row.zone_id,
                    subtypeKey: col.key,
                    status: statusType,
                    isDrillDown: selectedZone ? 'true' : 'false'
                }
            });

            if (response.data?.success) {
                setModalConfig(prev => ({
                    ...prev,
                    loading: false,
                    data: response.data.data || []
                }));
            }
        } catch (err) {
            console.error("Failed fetching breakdown details target parameters:", err);
            setModalConfig(prev => ({ ...prev, loading: false }));
        }
    };

    if (loading) {
        return (
            <div className="bg-[#0c1122] border border-slate-800/80 rounded-xl p-8 flex flex-col items-center justify-center space-y-3 min-h-[400px]">
                <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase animate-pulse">
                    Regenerating Matrix Cross Tabulations & Performance KPIs...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-[#0c1122] border border-rose-900/30 rounded-xl p-6 text-center text-rose-400 text-xs font-black uppercase tracking-wider">
                {error}
            </div>
        );
    }

    // --- Helper Math Closures for Matrix Computations ---
    const computeTableMetrics = (matrix, totalKey, agingKey) => {
        const columnTotals = matrix.columns.reduce((acc, col) => {
            acc[col.key] = matrix.data.reduce((sum, row) => sum + parseInt(row[col.key] || 0, 10), 0);
            return acc;
        }, {});

        const grandTotal = matrix.data.reduce((sum, row) => sum + parseInt(row[totalKey] || 0, 10), 0);

        const totalWeightedHours = matrix.data.reduce((sum, row) => {
            const count = parseInt(row[totalKey] || 0, 10);
            const avgAging = parseFloat(row[agingKey] || 0);
            return sum + (count * avgAging);
        }, 0);

        const grandAverageAging = grandTotal > 0 ? (totalWeightedHours / grandTotal) : 0;

        return { columnTotals, grandTotal, grandAverageAging };
    };

    const pendingMetrics = computeTableMetrics(pendingMatrix, 'total_zone_pending', 'avg_pending_aging');
    const resolvedMetrics = computeTableMetrics(resolvedMatrix, 'total_zone_resolved', 'avg_resolution_tat');

    return (
        <div className="space-y-8 relative">
            {/* CENTRAL BANNER COMMAND AND NAVIGATION HEADLINE */}
            <div className="bg-[#0c1122] border border-slate-800/80 rounded-xl p-6 shadow-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {selectedZone && (
                        <button 
                            onClick={() => setSelectedZone(null)}
                            className="p-2 bg-[#12182c] hover:bg-slate-800 text-cyan-400 rounded-md border border-slate-800/80 transition-all flex items-center justify-center mr-1"
                            title="Back to Global Zonal Overview"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    )}
                    <div>
                        <h2 className="text-xl font-black tracking-wider uppercase text-white">
                            {selectedZone ? `${selectedZone.name} Town Performance` : 'Zonal Performance Cross-Examination Grid'}
                        </h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                            {selectedZone ? `Detailed breakdowns for towns in ${selectedZone.name}` : 'Central performance monitoring matrices for all zones'}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => fetchAllMatrixMetrics(true)} 
                    className="p-2 bg-[#12182c] hover:bg-slate-800 text-slate-400 hover:text-cyan-400 rounded-md border border-slate-800 transition-all"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* TABLE 1: ZONE-WISE PENDING BREAKDOWN */}
            <div className="bg-[#0c1122] border border-slate-800/80 rounded-xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Layers className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-black tracking-wider uppercase text-slate-200 text-sm">Zone-Wise Pending Breakdown</h3>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800/70 bg-[#070a13]">
                    <table className="w-full text-left border-collapse min-w-[1050px]">
                        <thead>
                            <tr className="bg-[#12182c] border-b border-slate-800 font-black tracking-wide text-slate-300 uppercase text-xs">
                                <th className="zone-name-cell py-4 px-5 text-slate-200">{selectedZone ? 'TOWN REGIONS' : 'ZONAL REGIONS'}</th>
                                {pendingMatrix.columns.map(col => <th key={col.key} className="zone-name-cell py-4 px-3 font-mono">{col.label}</th>)}
                                <th className="py-4 px-6 text-center bg-red-950/40 text-red-400 border-l border-slate-800">TOTAL PENDING</th>
                                <th className="py-4 px-6 text-center bg-amber-950/20 text-amber-400 border-l border-slate-800">AVERAGE PENDING AGING</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono text-[14px]">
                            {pendingMatrix.data.length === 0 ? (
                                <tr>
                                    <td colSpan={pendingMatrix.columns.length + 3} className="py-12 text-center text-slate-500 text-xs uppercase font-black tracking-widest">No matching pending parameters detected.</td>
                                </tr>
                            ) : (
                                pendingMatrix.data.map((row) => {
                                    const totalVal = parseInt(row.total_zone_pending || 0, 10);
                                    const avgAging = parseFloat(row.avg_pending_aging || 0);
                                    return (
                                        <tr 
                                            key={row.zone_id} 
                                            onClick={() => !selectedZone && setSelectedZone({ id: row.zone_id, name: row.zone_name })}
                                            className={`transition-colors group ${!selectedZone ? 'cursor-pointer hover:bg-[#0f1527]/90' : 'hover:bg-[#0f1527]/40'}`}
                                        >
                                            <td className="zone-name-cell py-4 px-5 font-sans font-black text-slate-200 sticky left-0 bg-[#070a13] group-hover:bg-[#0f1527] transition-colors z-10 shadow-[3px_0_6px_rgba(0,0,0,0.3)]">{row.zone_name.toUpperCase()}</td>
                                            {pendingMatrix.columns.map((col) => {
                                                const count = parseInt(row[col.key] || 0, 10);
                                                return (
                                                    <td 
                                                        key={col.key} 
                                                        onClick={(e) => selectedZone && count > 0 && handleCellDetailsClick(e, row, col, 0)}
                                                        className={`matrix-count-cell py-4 px-3 text-center font-bold transition-all ${
                                                            count > 0 
                                                                ? selectedZone
                                                                    ? 'text-amber-400 hover:bg-amber-500/10 cursor-pointer underline decoration-dotted decoration-amber-500/50 underline-offset-4'
                                                                    : 'text-amber-400'
                                                                : 'text-slate-600'
                                                        }`}
                                                    >
                                                        {count.toLocaleString()}
                                                    </td>
                                                );
                                            })}
                                            <td className="py-4 px-6 text-center font-black bg-gradient-to-b from-red-950/40 to-red-900/20 text-red-400 border-l border-slate-800/80">
                                                <span className={`matrix-count-cell px-2 py-0.5 rounded font-black tracking-tight ${totalVal > 0 ? 'bg-red-500/20 text-red-300 ring-1 ring-red-500/30' : 'bg-slate-800/50 text-slate-500'}`}>{totalVal.toLocaleString()}</span>
                                            </td>
                                            <td className="py-4 px-6 text-center font-black bg-gradient-to-b from-amber-950/20 to-amber-900/5 text-amber-400 border-l border-slate-800/80">
                                                <span className={`matrix-count-cell px-2 py-0.5 rounded font-black tracking-tight ${avgAging > 0 ? 'bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20' : 'bg-slate-800/50 text-slate-500'}`}>{formatAgingHours(avgAging)}</span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                        {pendingMatrix.data.length > 0 && (
                            <tfoot className="border-t-2 border-slate-700 bg-[#0d1428] font-mono text-xs">
                                <tr className="text-slate-200 font-black tracking-wide uppercase">
                                    <td className="py-4 px-5 font-sans font-black text-cyan-400 sticky left-0 bg-[#0d1428] z-10">TOTAL</td>
                                    {pendingMatrix.columns.map(col => <td key={col.key} className="matrix-count-cell py-4 px-2 text-center text-slate-100 font-black bg-[#12182c]/40">{pendingMetrics.columnTotals[col.key].toLocaleString()}</td>)}
                                    <td className="py-4 px-6 text-center bg-red-950/60 text-red-400 font-black border-l border-slate-800">
                                        <span className="matrix-count-cell px-3 py-1 rounded bg-red-500/30 text-red-200 ring-1 ring-red-400/40 inline-block w-full text-center">{pendingMetrics.grandTotal.toLocaleString()}</span>
                                    </td>
                                    <td className="py-4 px-6 text-center bg-amber-950/40 text-amber-400 font-black border-l border-slate-800">
                                        <span className="matrix-count-cell px-3 py-1 rounded bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/30 inline-block w-full text-center">{formatAgingHours(pendingMetrics.grandAverageAging)}</span>
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* TABLE 2: ZONE-WISE RESOLVED BREAKDOWN (Click capabilities removed here) */}
            <div className="bg-[#0c1122] border border-slate-800/80 rounded-xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-black tracking-wider uppercase text-slate-200 text-sm">Zone-Wise Resolved Breakdown</h3>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800/70 bg-[#070a13]">
                    <table className="w-full text-left border-collapse min-w-[1050px]">
                        <thead>
                            <tr className="bg-[#12182c] border-b border-slate-800 font-black tracking-wide text-slate-300 uppercase text-xs">
                                <th className="zone-name-cell py-4 px-5 text-slate-200">{selectedZone ? 'TOWN REGIONS' : 'ZONAL REGIONS'}</th>
                                {resolvedMatrix.columns.map(col => <th key={col.key} className="zone-name-cell py-4 px-3 font-mono">{col.label}</th>)}
                                <th className="py-4 px-6 text-center bg-emerald-950/40 text-emerald-400 border-l border-slate-800">TOTAL RESOLVED</th>
                                <th className="py-4 px-6 text-center bg-cyan-950/20 text-cyan-400 border-l border-slate-800">AVERAGE RESOLUTION TAT</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono text-[14px]">
                            {resolvedMatrix.data.length === 0 ? (
                                <tr>
                                    <td colSpan={resolvedMatrix.columns.length + 3} className="py-12 text-center text-slate-500 text-xs uppercase font-black tracking-widest">No matching resolved metrics located inside target timelines.</td>
                                </tr>
                            ) : (
                                resolvedMatrix.data.map((row) => {
                                    const totalVal = parseInt(row.total_zone_resolved || 0, 10);
                                    const avgTat = parseFloat(row.avg_resolution_tat || 0);
                                    return (
                                        <tr 
                                            key={row.zone_id} 
                                            onClick={() => !selectedZone && setSelectedZone({ id: row.zone_id, name: row.zone_name })}
                                            className={`transition-colors group ${!selectedZone ? 'cursor-pointer hover:bg-[#0f1527]/90' : 'hover:bg-[#0f1527]/40'}`}
                                        >
                                            <td className="zone-name-cell py-4 px-5 font-sans font-black text-slate-200 sticky left-0 bg-[#070a13] group-hover:bg-[#0f1527] transition-colors z-10 shadow-[3px_0_6px_rgba(0,0,0,0.3)]">{row.zone_name.toUpperCase()}</td>
                                            {resolvedMatrix.columns.map((col) => {
                                                const count = parseInt(row[col.key] || 0, 10);
                                                return (
                                                    <td 
                                                        key={col.key} 
                                                        className={`matrix-count-cell py-4 px-3 text-center font-bold text-slate-400`}
                                                    >
                                                        {count.toLocaleString()}
                                                    </td>
                                                );
                                            })}
                                            <td className="py-4 px-6 text-center font-black bg-gradient-to-b from-emerald-950/40 to-emerald-900/20 text-emerald-400 border-l border-slate-800/80">
                                                <span className={`matrix-count-cell px-2 py-0.5 rounded font-black tracking-tight ${totalVal > 0 ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30' : 'bg-slate-800/50 text-slate-500'}`}>{totalVal.toLocaleString()}</span>
                                            </td>
                                            <td className="py-4 px-6 text-center font-black bg-gradient-to-b from-cyan-950/20 to-cyan-900/5 text-cyan-400 border-l border-slate-800/80">
                                                <span className={`matrix-count-cell px-2 py-0.5 rounded font-black tracking-tight ${avgTat > 0 ? 'bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500/20' : 'bg-slate-800/50 text-slate-500'}`}>{formatAgingHours(avgTat)}</span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                        {resolvedMatrix.data.length > 0 && (
                            <tfoot className="border-t-2 border-slate-700 bg-[#0d1428] font-mono text-xs">
                                <tr className="text-slate-200 font-black tracking-wide uppercase">
                                    <td className="py-4 px-5 font-sans font-black text-cyan-400 sticky left-0 bg-[#0d1428] z-10">TOTAL</td>
                                    {resolvedMatrix.columns.map(col => <td key={col.key} className="matrix-count-cell py-4 px-2 text-center text-slate-100 font-black bg-[#12182c]/40">{resolvedMetrics.columnTotals[col.key].toLocaleString()}</td>)}
                                    <td className="py-4 px-6 text-center bg-emerald-950/60 text-emerald-400 font-black border-l border-slate-800">
                                        <span className="matrix-count-cell px-3 py-1 rounded bg-emerald-500/30 text-emerald-200 ring-1 ring-emerald-400/40 inline-block w-full text-center">{resolvedMetrics.grandTotal.toLocaleString()}</span>
                                    </td>
                                    <td className="py-4 px-6 text-center bg-cyan-950/40 text-cyan-400 font-black border-l border-slate-800">
                                        <span className="matrix-count-cell px-3 py-1 rounded bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/30 inline-block w-full text-center">{formatAgingHours(resolvedMetrics.grandAverageAging)}</span>
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* --- DETAILED COMPLAINT BREAKDOWN OPERLAY TABULAR MODAL --- */}
            {modalConfig.isOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
                    <div className="bg-[#0c1122] border border-slate-800 w-full max-w-5xl rounded-xl shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
                        
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-800">
                            <div>
                                <h4 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                                    {modalConfig.title} Breakdown
                                </h4>
                                <p className="text-[11px] text-slate-400 font-black tracking-wide uppercase mt-0.5">
                                    {modalConfig.subtitle}
                                </p>
                            </div>
                            <button 
                                onClick={() => setModalConfig(prev => ({ ...prev, isOpen: false, data: [] }))}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Content Frame */}
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            {modalConfig.loading ? (
                                <div className="py-20 flex flex-col items-center justify-center space-y-3">
                                    <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                        Compiling Complaint Records From Database...
                                    </p>
                                </div>
                            ) : modalConfig.data.length === 0 ? (
                                <div className="py-16 text-center text-slate-500 text-xs font-black uppercase tracking-wider">
                                    No granular records found matching filters.
                                </div>
                            ) : (
                                <div className="overflow-x-auto border border-slate-800/70 rounded-xl bg-[#070a13]">
                                    <table className="w-full text-left border-collapse font-mono text-xs">
                                        <thead>
                                            <tr className="bg-[#12182c] border-b border-slate-800 font-black tracking-wide text-slate-300 uppercase">
                                                <th className="py-3 px-4 text-slate-400 w-[60px]">S.No</th>
                                                <th className="py-3 px-4 text-cyan-400 w-[140px]"><span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5" /> COMPLAINT NUMBER</span></th>
                                                <th className="py-3 px-4 w-[180px]"><span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> CUSTOMER NAME</span></th>
                                                <th className="py-3 px-4 w-[140px]"><span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-amber-500" /> UC TITLE</span></th>
                                                <th className="py-3 px-4"><span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> DESCRIPTION</span></th>
                                                <th className="py-3 px-4 text-center w-[180px]"><span className="flex items-center gap-1 justify-center"><Calendar className="w-3.5 h-3.5" /> DATE & TIME</span></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                                            {modalConfig.data.map((complaint, index) => (
                                                <tr key={complaint.comp_num || index} className="hover:bg-[#0f1527]/50 transition-colors">
                                                    <td className="py-3 px-4 text-slate-500 font-bold">{index + 1}</td>
                                                    <td className="py-3 px-4 font-black text-cyan-400 tracking-tight whitespace-nowrap">{complaint.comp_num}</td>
                                                    <td className="py-3 px-4 font-bold text-slate-200 truncate max-w-[180px]" title={complaint.customer_name}>{complaint.customer_name || 'N/A'}</td>
                                                    <td className="py-3 px-4 font-black text-amber-400 truncate max-w-[140px]" title={complaint.title}>{complaint.title || 'N/A'}</td>
                                                    <td className="py-3 px-4 text-slate-400 leading-relaxed font-sans text-[13px] break-words max-w-sm">{complaint.description || <span className="italic text-slate-600">No content details provided</span>}</td>
                                                    <td className="py-3 px-4 text-center text-slate-400 font-medium whitespace-nowrap">
                                                        {new Date(complaint.created_at).toLocaleString('en-GB', { hour12: true, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ZonePerformance;