import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { Layers, ShieldAlert, RefreshCw, ArrowLeft } from 'lucide-react';

const ZonePerformance = ({ typeId, startDate, endDate }) => {
    const [matrixData, setMatrixData] = useState({ columns: [], data: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Tracks active drill-down context to flip between Zone view and Town view
    const [selectedZone, setSelectedZone] = useState(null);

    const fetchMatrixMetrics = useCallback(async (showSpinner = true) => {
        if (showSpinner) setLoading(true);
        try {
            const resp = await api.get('zone-complaints/zone-matrix', {
                params: { 
                    typeId, 
                    startDate, 
                    endDate,
                    // Inject active zone target context if it exists
                    zoneId: selectedZone ? selectedZone.id : undefined 
                }
            });
            if (resp.data?.success) {
                setMatrixData({
                    columns: resp.data.columns || [],
                    data: resp.data.data || []
                });
                setError(null);
            }
        } catch (err) {
            console.error("Matrix compilation pipeline bottleneck:", err);
            setError("Failed to stream real-time zonal breakdown analytics grid.");
        } finally {
            if (showSpinner) setLoading(false);
        }
    }, [typeId, startDate, endDate, selectedZone]);

    // Initial load and filter change trigger
    useEffect(() => {
        fetchMatrixMetrics(true);
    }, [fetchMatrixMetrics]);

    // Explicitly engineered 30-second localized polling thread to preserve real-time synchronicity
    useEffect(() => {
        const matrixAutoRefreshInterval = setInterval(() => {
            fetchMatrixMetrics(false); 
        }, 30000);

        return () => clearInterval(matrixAutoRefreshInterval);
    }, [fetchMatrixMetrics]);

    // Calculate vertical totals for each column dynamic key
    const columnTotals = matrixData.columns.reduce((acc, col) => {
        const totalForCol = matrixData.data.reduce((sum, row) => {
            return sum + parseInt(row[col.key] || 0, 10);
        }, 0);
        acc[col.key] = totalForCol;
        return acc;
    }, {});

    // Calculate grand total of all pending entries
    const grandTotalPending = matrixData.data.reduce((sum, row) => {
        return sum + parseInt(row.total_zone_pending || 0, 10);
    }, 0);

    if (loading) {
        return (
            <div className="bg-[#0c1122] border border-slate-800/80 rounded-xl p-8 flex flex-col items-center justify-center space-y-3 min-h-[250px]">
                <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase animate-pulse">
                    Regenerating Matrix Cross Tabulations...
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

    return (
        <div className="bg-[#0c1122] border border-slate-800/80 rounded-xl p-6 shadow-2xl space-y-5">
            
            {/* COMPONENT HEADER COMPASS BLOCK */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                    {selectedZone ? (
                        <button 
                            onClick={() => setSelectedZone(null)}
                            className="p-2 bg-[#12182c] hover:bg-slate-800 text-cyan-400 rounded-md border border-slate-800/80 transition-all flex items-center justify-center mr-1"
                            title="Back to Zonal Regions"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    ) : (
                        <Layers className="w-5 h-5 text-cyan-400" />
                    )}
                    <div>
                        <h3 className="font-black tracking-wider uppercase text-white">
                            {selectedZone ? `${selectedZone.name} Town Performance` : 'Zone Performance Analysis'}
                        </h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                            {selectedZone ? `Detailed breakdown of towns inside ${selectedZone.name}` : 'Dynamic sub-type cross-examination matrix (Pending Breakdown)'}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => fetchMatrixMetrics(true)} 
                    className="p-2 bg-[#12182c] hover:bg-slate-800 text-slate-400 hover:text-cyan-400 rounded-md border border-slate-800 transition-all"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* HIGH DENSITY RESPONSIVE GRID GRID - UPSCALED SIZE FOR BIG SCREENS */}
            <div className="overflow-x-auto rounded-xl border border-slate-800/70 bg-[#070a13]">
                <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                        <tr className="bg-[#12182c] border-b border-slate-800 text-[40px] font-black tracking-wide text-slate-300 uppercase">
                            <th className="zone-name-cell  py-4 px-5 text-slate-200 text-5xl">
                                {selectedZone ? 'TOWN REGIONS' : 'ZONAL REGIONS'}
                            </th>
                            {matrixData.columns.map((col) => (
                                <th key={col.key} className=" zone-name-cell py-4 px-3 font-mono text-3xl" >
                                    {col.label}
                                </th>
                            ))}
                            <th className="zone-name-cell py-4 px-6 text-center bg-red-950/40 text-red-400 font-black tracking-wider text-sm border-l border-slate-800">
                                TOTAL PENDING
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[14px]">
                        {matrixData.data.length === 0 ? (
                            <tr>
                                <td colSpan={matrixData.columns.length + 2} className="py-12 text-center text-slate-500 text-xs uppercase font-black tracking-widest">
                                    No records matching filtered parameters.
                                </td>
                            </tr>
                        ) : (
                            matrixData.data.map((row) => {
                                const totalPendingVal = parseInt(row.total_zone_pending || 0, 10);
                                return (
                                    <tr 
                                        key={row.zone_id} 
                                        // Trigger drilldown click event if we are viewing the general Zone list
                                        onClick={() => !selectedZone && setSelectedZone({ id: row.zone_id, name: row.zone_name })}
                                        className={`transition-colors group ${!selectedZone ? 'cursor-pointer hover:bg-[#0f1527]/90' : 'hover:bg-[#0f1527]/40'}`}
                                    >
                                        
                                        {/* ZONE/TOWN REGION IDENTIFIER CELL */}
                                        <td className=" zone-name-cell  py-4 px-5 font-sans font-black text-slate-200 text-6xl sticky left-0 bg-[#070a13] group-hover:bg-[#0f1527] transition-colors z-10 shadow-[3px_0_6px_rgba(0,0,0,0.3)]">
                                            {row.zone_name.toUpperCase()}
                                        </td>
                                        
                                        {/* DYNAMIC SUBTYPE RECORD MATRIX POINTER CELLS - FIXED VIA TARGETED CSS CLASS */}
                                        {matrixData.columns.map((col) => {
                                            const count = parseInt(row[col.key] || 0, 10);
                                            return (
                                                <td key={col.key} className={`matrix-count-cell py-4 px-3 text-center font-bold ${count > 0 ? 'text-amber-400' : 'text-slate-600'}`}>
                                                    {count.toLocaleString()}
                                                </td>
                                            );
                                        })}

                                        {/* CRITICAL ATTENTION REQUIRED: TOTAL PENDING COLUMN BACKED BY LIGHT RED GRADIENT - FIXED VIA TARGETED CSS CLASS */}
                                        <td className="py-4 px-6 text-center font-black bg-gradient-to-b from-red-950/40 to-red-900/20 text-red-400 border-l border-slate-800/80">
                                            <span className={`matrix-total-badge rounded font-black tracking-tight ${totalPendingVal > 0 ? 'bg-red-500/20 text-red-300 ring-1 ring-red-500/30' : 'bg-slate-800/50 text-slate-500'}`}>
                                                {totalPendingVal.toLocaleString()}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                    {/* VERTICAL COLUMN SUMMARY ROW FOOTER */}
                    {matrixData.data.length > 0 && (
                        <tfoot className="border-t-2 border-slate-700 bg-[#0d1428] font-mono">
                            <tr className="text-slate-200 font-black tracking-wide uppercase">
                                <td className="py-2 px-4 font-sans font-black text-3xl text-cyan-400 sticky left-0 bg-[#1b3440] z-10 shadow-[4px_0_8px_rgba(0,0,0,0.5)] whitespace-nowrap">
                                    TOTAL
                                </td>
                                
                                {matrixData.columns.map((col) => (
                                    <td key={col.key} className=" matrix-count-cell py-4 px-2 text-center text-3xl font-black text-slate-100 whitespace-nowrap bg-[#1b3440] ">
                                        {columnTotals[col.key].toLocaleString()}
                                    </td>
                                ))}
                                
                                <td className="py-6 px-8 text-center bg-red-950/60 text-red-400 font-black text-2xl border-l border-slate-800 whitespace-nowrap">
                                    <span className="matrix-total-badge px-4 py-1.5 rounded bg-red-500/30 text-red-200 ring-1 ring-red-400/40 inline-block w-full text-center">
                                        {grandTotalPending.toLocaleString()}
                                    </span>
                                </td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
};

export default ZonePerformance;