import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Loader2, 
  FileText, 
  Clock, 
  AlertTriangle, 
  FileEdit, 
  CheckCircle2, 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft,
  Calendar,
  Coins
} from 'lucide-react';

const EfilingDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedYear, setSelectedYear] = useState('2026-27');
    const [expandedCategories, setExpandedCategories] = useState({});

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    const FISCAL_YEARS = ['2026-27', '2025-26'];

    const fetchEfilingStats = async (year) => {
        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_EFILING_API_URL ;
            const token = import.meta.env.VITE_EFILING_BEARER_TOKEN;

            const response = await axios.get(apiUrl, {
                params: { year },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data?.success) {
                setData(response.data);
                setError(null);
            } else {
                setError('Failed to load valid dashboard response');
            }
        } catch (err) {
            console.error('Efiling fetch error:', err);
            setError(err.response?.data?.error || err.message || 'API Connection Error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEfilingStats(selectedYear);
        setCurrentPage(1); // Reset to page 1 on year change
        const interval = setInterval(() => fetchEfilingStats(selectedYear), 60000);
        return () => clearInterval(interval);
    }, [selectedYear]);

    const toggleCategory = (id) => {
        setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const formatCurrency = (val) => {
        const amount = Number(val) || 0;
        return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(amount);
    };

    const extractStatusCounts = (dist) => {
        if (!dist || typeof dist !== 'object') return { draft: 0, inProgress: 0 };
        let draft = 0;
        let inProgress = 0;

        Object.entries(dist).forEach(([key, val]) => {
            const k = key.toUpperCase();
            if (k.includes('DRAFT')) draft += Number(val) || 0;
            if (k.includes('PROGRESS') || k.includes('PENDING') || k.includes('APPROVED')) inProgress += Number(val) || 0;
        });

        return { draft, inProgress };
    };

    if (loading && !data) {
        return (
            <div className="h-screen w-screen bg-[#070b14] flex flex-col items-center justify-center gap-4 text-blue-400">
                <Loader2 className="animate-spin" size={56} />
                <p className="text-lg font-semibold tracking-wide text-gray-300">Loading Dashboard Metrics...</p>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="h-screen w-screen bg-[#070b14] text-red-400 flex flex-col items-center justify-center gap-4">
                <AlertTriangle size={56} />
                <h2 className="text-2xl font-bold">Failed to connect to E-Filing API</h2>
                <p className="text-base text-gray-400">{error}</p>
            </div>
        );
    }

    const status = data?.status_counts || {};
    const closedFiles = (Number(status.completed) || 0) + (Number(status.rejected) || 0);
    const closedWorkRelated = (Number(status.completed_work_related) || 0) + (Number(status.rejected_work_related) || 0);

    // Filter categories with non-zero files
    const nonZeroCategories = (data?.category_wise_counts || []).filter(
        (cat) => (Number(cat.total_files) || 0) > 0
    );

    // Calculate total estimated cost across all categories
    const totalEstimatedAmount = (data?.category_wise_counts || []).reduce(
        (sum, cat) => sum + (Number(cat.total_estimated_cost) || 0),
        0
    );

    // Calculate Pagination
    const totalPages = Math.ceil(nonZeroCategories.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedCategories = nonZeroCategories.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return (
        <div className="min-h-screen w-full bg-[#070b14] text-slate-100 p-8 flex flex-col gap-8 selection:bg-blue-500 selection:text-white">

            {/* Top Bar / Dropdown Only */}
            <div className="flex items-center justify-end bg-[#0e1626]/80 backdrop-blur border border-slate-800/80 p-5 rounded-xl shadow-xl">
                <div className="flex items-center gap-3 bg-[#141e33] border border-slate-700/60 px-4 py-2.5 rounded-xl shadow-inner">
                    <Calendar size={15} className="text-blue-400" />
                    <label className="text-base font-bold text-slate-300">Fiscal Year:</label>
                    <select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="bg-transparent text-base font-extrabold text-blue-400 focus:outline-none cursor-pointer pr-1"
                    >
                        {FISCAL_YEARS.map(fy => (
                            <option key={fy} value={fy} className="bg-[#0e1626] text-white">{fy}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">

                {/* 1. Total Files Created */}
                <div className="relative group bg-gradient-to-b from-[#111a2e] to-[#0c1322] border border-slate-800 hover:border-blue-500/50 p-5 rounded-2xl shadow-lg transition-all duration-300 overflow-hidden">
                    <div className="flex justify-between items-start">
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Files</span>
                        <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl"><FileText size={22} /></div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-4xl font-black text-white tracking-tight">{status.total_files || 0}</h3>
                        <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-300">
                            <span>Work Related:</span>
                            <strong className="font-extrabold text-sm">{status.total_work_related || 0}</strong>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all pointer-events-none" />
                </div>

                {/* 2. In Progress */}
                <div className="relative group bg-gradient-to-b from-[#111a2e] to-[#0c1322] border border-slate-800 hover:border-amber-500/50 p-5 rounded-2xl shadow-lg transition-all duration-300 overflow-hidden">
                    <div className="flex justify-between items-start">
                        <span className="text-sm font-bold text-amber-400/90 uppercase tracking-wider">In Progress</span>
                        <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl"><Clock size={22} /></div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-4xl font-black text-amber-400 tracking-tight">{status.in_progress || 0}</h3>
                        <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-300">
                            <span>Work Related:</span>
                            <strong className="font-extrabold text-sm">{status.in_progress_work_related || 0}</strong>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all pointer-events-none" />
                </div>

                {/* 3. SLA Breached */}
                <div className="relative group bg-gradient-to-b from-[#111a2e] to-[#0c1322] border border-slate-800 hover:border-rose-500/50 p-5 rounded-2xl shadow-lg transition-all duration-300 overflow-hidden">
                    <div className="flex justify-between items-start">
                        <span className="text-sm font-bold text-rose-400 uppercase tracking-wider">SLA Breached</span>
                        <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl"><AlertTriangle size={22} /></div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-4xl font-black text-rose-400 tracking-tight">{status.overdue || 0}</h3>
                        <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-300">
                            <span>Work Related:</span>
                            <strong className="font-extrabold text-sm">{status.overdue_work_related || 0}</strong>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-28 h-28 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all pointer-events-none" />
                </div>

                {/* 4. Draft */}
                <div className="relative group bg-gradient-to-b from-[#111a2e] to-[#0c1322] border border-slate-800 hover:border-gray-500/50 p-5 rounded-2xl shadow-lg transition-all duration-300 overflow-hidden">
                    <div className="flex justify-between items-start">
                        <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Draft</span>
                        <div className="p-2.5 bg-emerald-500/10 text-gray-400 rounded-xl"><FileEdit size={22} /></div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-4xl font-black text-gray-400 tracking-tight">{status.draft || 0}</h3>
                        <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-gray-300">
                            <span>Work Related:</span>
                            <strong className="font-extrabold text-sm">{status.draft_work_related || 0}</strong>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all pointer-events-none" />
                </div>

                {/* 5. Closed Files */}
                <div className="relative group bg-gradient-to-b from-[#111a2e] to-[#0c1322] border border-slate-800 hover:border-teal-500/50 p-5 rounded-2xl shadow-lg transition-all duration-300 overflow-hidden">
                    <div className="flex justify-between items-start">
                        <span className="text-sm font-bold text-teal-400 uppercase tracking-wider">Closed Files</span>
                        <div className="p-2.5 bg-indigo-500/10 text-teal-400 rounded-xl"><CheckCircle2 size={22} /></div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-4xl font-black text-teal-400 tracking-tight">{closedFiles}</h3>
                        <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-teal-300">
                            <span>Work Related:</span>
                            <strong className="font-extrabold text-sm">{closedWorkRelated}</strong>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all pointer-events-none" />
                </div>

                {/* 6. Total Amount */}
                <div className="relative group bg-gradient-to-b from-[#111a2e] to-[#0c1322] border border-slate-800 hover:border-indigo-500/50 p-5 rounded-2xl shadow-lg transition-all duration-300 overflow-hidden">
                    <div className="flex justify-between items-start">
                        <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Total Amount</span>
                        <div className="p-2.5 bg-teal-500/10 text-indigo-400 rounded-xl"><Coins size={22} /></div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-2xl font-black text-indigo-400 tracking-tight">{formatCurrency(totalEstimatedAmount)}</h3>
                        <div className="mt-4 inline-flex items-center gap-2 px-2.5 py-2 rounded-lg bg-teal-500/10 border border-teal-500/20 text-xs font-semibold text-indigo-300">
                            <span>Estimated Total Cost</span>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-28 h-28 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/10 transition-all pointer-events-none" />
                </div>

            </div>

            {/* Category Wise Table */}
            <div className="bg-[#0e1626]/90 border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white tracking-wide">Category Wise Expenditure & Volume</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 bg-[#121c30]/80 text-slate-300 text-xs uppercase font-bold tracking-wider">
                                <th className="py-3.5 px-4 text-left w-2/5">Category / Type Name</th>
                                <th className="py-3.5 px-4 text-center w-32">No. of Files</th>
                                <th className="py-3.5 px-4 text-right w-64">Estimated Cost (In Progress)</th>
                                <th className="py-3.5 px-4 text-center w-72">Status Breakdown</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-sm">
                            {paginatedCategories.length > 0 ? (
                                paginatedCategories.map((cat) => {
                                    const isExpanded = expandedCategories[cat.id];
                                    const catCounts = extractStatusCounts(cat.status_distribution);
                                    const hasSubTypes = Array.isArray(cat.type_breakdown) && cat.type_breakdown.length > 0;

                                    return (
                                        <React.Fragment key={cat.id}>
                                            {/* Main Category Row */}
                                            <tr 
                                                onClick={() => hasSubTypes && toggleCategory(cat.id)}
                                                className={`group transition-colors duration-150 ${hasSubTypes ? 'cursor-pointer hover:bg-slate-800/50' : ''} ${isExpanded ? 'bg-slate-800/40' : ''}`}
                                            >
                                                <td className="py-3.5 px-4 font-bold text-slate-100 text-sm text-left">
                                                    <div className="flex items-center gap-2">
                                                        {hasSubTypes ? (
                                                            <span className="p-1 rounded bg-slate-800 text-slate-300 group-hover:text-blue-400 transition-colors">
                                                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                            </span>
                                                        ) : (
                                                            <span className="w-6" />
                                                        )}
                                                        <span>{cat.category_name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 text-center font-extrabold text-blue-400 text-base">
                                                    {cat.total_files || 0}
                                                </td>
                                                <td className="py-3.5 px-4 text-center font-extrabold text-emerald-400 text-base">
                                                    {formatCurrency(cat.total_estimated_cost)}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-gray-400">
                                                            Draft: {catCounts.draft}
                                                        </span>
                                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                                                            In Progress: {catCounts.inProgress}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Sub-types Expanded Rows */}
                                            {isExpanded && hasSubTypes && cat.type_breakdown.map((type) => {
                                                const typeCounts = extractStatusCounts(type.status_distribution);
                                                return (
                                                    <tr key={type.type_id} className="bg-[#0b1220]/80 border-l-4 border-l-blue-500 hover:bg-slate-800/30 transition-colors">
                                                        <td className="py-3 px-4 pl-10 text-xs font-semibold text-slate-300 text-left">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-slate-500 font-mono">↳</span>
                                                                <span>{type.type_name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 text-center text-xs font-bold text-slate-300">
                                                            {type.total_files || 0}
                                                        </td>
                                                        <td className="py-3 px-4 text-center text-xs font-bold text-emerald-300">
                                                            {formatCurrency(type.total_estimated_cost)}
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <div className="flex items-center justify-center gap-2 opacity-90">
                                                                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-gray-400 border border-emerald-500/20">
                                                                    Draft: {typeCounts.draft}
                                                                </span>
                                                                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                                    In Progress: {typeCounts.inProgress}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </React.Fragment>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="4" className="py-8 text-center text-slate-400 text-base font-semibold">
                                        No categories with files available for this fiscal year.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer with Pagination Controls */}
                <div className="p-5 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-400">
                        Showing {nonZeroCategories.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + ITEMS_PER_PAGE, nonZeroCategories.length)} of {nonZeroCategories.length} categories
                    </span>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-xl bg-[#141e33] border border-slate-700/60 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="text-sm font-bold text-slate-300 px-2">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-2 rounded-xl bg-[#141e33] border border-slate-700/60 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default EfilingDashboard;