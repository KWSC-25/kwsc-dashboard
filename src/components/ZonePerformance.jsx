import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { Layers, ShieldAlert, RefreshCw } from 'lucide-react';

const ZonePerformance = ({ typeId, startDate, endDate }) => {
    const [matrixData, setMatrixData] = useState({ columns: [], data: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchMatrixMetrics = useCallback(async (showSpinner = true) => {
        if (showSpinner) setLoading(true);
        try {
            const resp = await api.get('zone-complaints/zone-matrix', {
                params: { typeId, startDate, endDate }
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
    }, [typeId, startDate, endDate]);

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
                    <Layers className="w-5 h-5 text-cyan-400" />
                    <div>
                        <h3 className="text-base font-black tracking-wider uppercase text-white">
                            Zone Performance Analysis
                        </h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                            Dynamic sub-type cross-examination matrix (Pending Breakdown) 
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
                            <th className="py-4 px-5 text-slate-200 text-2xl">
                                ZONAL REGIONS
                            </th>
                            {matrixData.columns.map((col) => (
                                <th key={col.key} className="py-4 px-3 font-mono  text-3xl" >
                                    {col.label}
                                </th>
                            ))}
                            <th className="py-4 px-6 text-center bg-red-950/40 text-red-400 font-black tracking-wider text-sm border-l border-slate-800">
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
                                    <tr key={row.zone_id} className="hover:bg-[#0f1527]/90 transition-colors group">
                                        
                                        {/* ZONE REGION IDENTIFIER CELL */}
                                        <td className="py-4 px-5 font-sans font-black text-slate-200 text-6xl sticky left-0 bg-[#070a13] group-hover:bg-[#0f1527] transition-colors z-10 shadow-[3px_0_6px_rgba(0,0,0,0.3)]">
                                            {row.zone_name.toUpperCase()}
                                        </td>
                                        
                                        {/* DYNAMIC SUBTYPE RECORD MATRIX POINTER CELLS */}
                                        {matrixData.columns.map((col) => {
                                            const count = parseInt(row[col.key] || 0, 10);
                                            return (
                                                <td key={col.key} className={`py-4 px-3 text-center font-bold text-base ${count > 0 ? 'text-amber-400' : 'text-slate-600'}`}>
                                                    {count.toLocaleString()}
                                                </td>
                                            );
                                        })}

                                        {/* CRITICAL ATTENTION REQUIRED: TOTAL PENDING COLUMN BACKED BY LIGHT RED GRADIENT */}
                                        <td className="py-4 px-6 text-center font-black bg-gradient-to-b from-red-950/40 to-red-900/20 text-red-400 border-l border-slate-800/80">
                                            <span className={`px-3 py-1 rounded text-base font-black tracking-tight ${totalPendingVal > 0 ? 'bg-red-500/20 text-red-300 ring-1 ring-red-500/30' : 'bg-slate-800/50 text-slate-500'}`}>
                                                {totalPendingVal.toLocaleString()}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ZonePerformance;