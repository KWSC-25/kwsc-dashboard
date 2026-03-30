import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, ArrowLeft, Loader2, CheckCircle, AlertCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api'; 

const LcmsAdmin = () => {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
    
    // Search & Pagination States
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 6;

    const navigate = useNavigate();

    const fetchCases = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/lcms/all-cases');
            setCases(res.data);
        } catch {
            setStatusMsg({ type: 'error', text: 'Failed to load cases.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCases(); }, []);

    // Filter Logic
    const filteredCases = cases.filter(item => 
        item.case_title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination Logic
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = filteredCases.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(filteredCases.length / rowsPerPage);

    const handleExcelUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('excel', file);

        try {
            setUploading(true);
            setStatusMsg({ type: 'info', text: 'Appending new cases to database...' });
            await api.post('/admin/lcms/import-excel', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setStatusMsg({ type: 'success', text: 'Data added successfully!' });
            fetchCases(); 
        } catch {
            setStatusMsg({ type: 'error', text: 'Upload failed. Check column headers.' });
        } finally {
            setUploading(false);
            setTimeout(() => setStatusMsg({ type: '', text: '' }), 5000);
        }
    };

    return (
        <div className="lcms-admin-container min-h-screen bg-slate-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <button 
                            onClick={() => navigate('/admin')} 
                            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-2 font-medium"
                        >
                            <ArrowLeft size={18} /> Back to Admin Console
                        </button>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">LCMS Master Data</h1>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-4">
                        {/* Search Bar */}
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text"
                                placeholder="Search Case Title..."
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm !text-black"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1); // Reset to page 1 on search
                                }}
                            />
                        </div>

                        <label className={`
                            flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all cursor-pointer shadow-lg
                            ${uploading ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-105 active:scale-95'}
                        `}>
                            {uploading ? <Loader2 className="animate-spin" size={20} /> : <FileSpreadsheet size={20} />}
                            {uploading ? 'UPLOADING...' : 'IMPORT EXCEL'}
                            <input type="file" hidden accept=".xlsx, .xls" onChange={handleExcelUpload} disabled={uploading} />
                        </label>
                    </div>
                </div>

                {/* Status Alerts */}
                {statusMsg.text && (
                    <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border ${
                        statusMsg.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 
                        statusMsg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 
                        'bg-blue-50 border-blue-200 text-blue-700'
                    }`}>
                        {statusMsg.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
                        <span className="font-bold">{statusMsg.text}</span>
                    </div>
                )}

                {/* Data Table */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-800 text-white uppercase text-[11px] tracking-widest font-bold">
                                    <th className="p-5 w-16">S.No</th>
                                    <th className="p-5">Court Name & Case Title</th>
                                    <th className="p-5">Next Date</th>
                                    <th className="p-5">Advocate</th>
                                    <th className="p-5">Matter Pertains</th>
                                    <th className="p-5">Responsible Dept</th>
                                    <th className="p-5">Court Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="p-20 text-center">
                                            <Loader2 className="animate-spin mx-auto text-slate-400 mb-2" size={40} />
                                            <p className="text-slate-400 font-medium uppercase tracking-tighter">Loading Database...</p>
                                        </td>
                                    </tr>
                                ) : currentRows.length > 0 ? (
                                    currentRows.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-5 !text-slate-400 font-bold">
                                                {indexOfFirstRow + index + 1}
                                            </td>
                                            <td className="p-5">
                                                <div className="font-bold !text-black leading-tight">{item.court_name}</div>
                                                <div className="!text-slate-500 text-xs mt-1">{item.case_title}</div>
                                            </td>
                                            <td className="p-5">
                                                <span className="!text-black font-mono font-bold text-sm">
                                                    {item.next_date ? new Date(item.next_date).toLocaleDateString('en-GB') : 'N/A'}
                                                </span>
                                            </td>
                                            <td className="p-5 !text-black font-medium">
                                                {item.advocate_name}
                                            </td>
                                            <td className="p-5 !text-black font-medium">
                                                {item.matter_pertains}
                                            </td>
                                            <td className="p-5">
                                                <span className="!text-black font-black text-[11px] uppercase">
                                                    {item.responsible_dept}
                                                </span>
                                            </td>
                                            <td className="p-5">
                                                <div className="!text-slate-600 text-[11px] leading-relaxed max-w-xs">
                                                    {item.court_status}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="p-20 text-center !text-slate-400 font-medium">
                                            No cases found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {filteredCases.length > rowsPerPage && (
                        <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-sm !text-slate-500 font-medium">
                                Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filteredCases.length)} of {filteredCases.length} entries
                            </span>
                            <div className="flex items-center gap-2">
                                <button 
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                    className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft size={20} className="!text-black" />
                                </button>
                                <div className="flex gap-1">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`px-3 py-1 rounded-lg text-sm font-bold transition-all ${
                                                currentPage === i + 1 
                                                ? 'bg-slate-800 text-white shadow-md' 
                                                : 'text-slate-600 hover:bg-white border border-transparent hover:border-slate-200'
                                            }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <button 
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                    className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronRight size={20} className="!text-black" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LcmsAdmin;