import React, { useState, useEffect } from 'react';
import { Upload, AlertCircle, ArrowLeft, FileText, Eye } from 'lucide-react';
import api from '../utils/api';
import ExecutiveCommitteeUploadPanel from './ExecutiveCommitteeUploadPanel';

const ExecutiveCommitteeDashboard = () => {
    const [isUploading, setIsUploading] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);
    const [dashboardLoading, setDashboardLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [allMaterials, setAllMaterials] = useState([]);

    useEffect(() => {
        if (!isUploading) {
            fetchGlobalDashboardRecords();
        }
    }, [isUploading]);

    const fetchGlobalDashboardRecords = async () => {
        setDashboardLoading(true);
        try {
            const res = await api.get('/eci/all-materials');
            setAllMaterials(res.data.data);
        } catch (err) {
            console.error("Error loading centralized command feed:", err);
            showToast("Failed to sync structural dashboard monitoring arrays.");
        } finally {
            setDashboardLoading(false);
        }
    };

    const handleUploadNavigation = async () => {
        setActionLoading(true);
        try {
            const response = await api.get('/eci/check-upload-permission');
            
            if (response.data && response.data.canUpload === true) {
                setIsUploading(true);
            } else {
                showToast("Not Permitted: Your operational account profile lacks explicit upload authority.");
            }
        } catch (err) {
            console.error("Authorization check pipeline failure:", err);
            const serverErrorMessage = err.response?.data?.message || "Failed to verify upload permissions.";
            if (err.response?.status !== 401) {
                showToast(serverErrorMessage);
            }
        } finally {
            setActionLoading(false);
        }
    };

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 5000);
    };

    if (isUploading) {
        return (
            <div className="p-8 bg-transparent text-white">
                <button
                    onClick={() => setIsUploading(false)}
                    className="inline-flex items-center gap-3 text-slate-400 hover:text-white bg-transparent border-none cursor-pointer mb-8 text-2xl font-bold transition-colors"
                >
                    <ArrowLeft size={28} />
                    <span>Back to Analytics Dashboard</span>
                </button>
                <ExecutiveCommitteeUploadPanel />
            </div>
        );
    }

    return (
        <div className="p-8 relative text-slate-200 bg-transparent min-h-screen">
            {/* Custom Warning Notification Banner Toast */}
            {toastMessage && (
                <div className="fixed top-8 right-8 bg-red-600 text-white px-8 py-5 rounded-2xl z-50 shadow-2xl flex items-center gap-4 border border-red-500 animate-in fade-in slide-in-from-top-4 duration-200">
                    <AlertCircle size={28} />
                    <span className="font-black text-xl">{toastMessage}</span>
                </div>
            )}

            {/* Subheader / Table Heading Layout Group */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10 border-b border-slate-800/80 pb-6">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tight uppercase">Executive Committee Analytics</h2>
                    <p className="text-lg font-semibold text-slate-400 mt-2">Review operational updates, global uploads, and centralized documentation files.</p>
                </div>
                <button
                    onClick={handleUploadNavigation}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white disabled:text-slate-500 font-black text-lg px-6 py-3.5 rounded-xl transition-all shadow-lg cursor-pointer disabled:cursor-not-allowed select-none border border-transparent"
                >
                    <Upload size={22} />
                    <span>{actionLoading ? 'Verifying Context...' : 'Go to Upload Panel'}</span>
                </button>
            </div>

            {/* Centralized Global Feed Monitoring Matrix Grid */}
            {dashboardLoading ? (
                <div className="p-24 text-center bg-transparent">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-6"></div>
                    <p className="text-slate-400 font-bold text-xl tracking-wide">Retrieving Executive Committee Monitoring Index...</p>
                </div>
            ) : (
                <div className="bg-transparent overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse table-auto">
                            <thead>
                                <tr className="border-b border-slate-700/60 text-9xl text-slate-400 ">
                                    <th className="p-6 pl-2 w-20">Seq</th>
                                    <th className="p-6 w-64">Uploader Name</th>
                                    <th className="p-6">Document / Matter Subject</th>
                                    <th className="p-6 w-60">Meeting Date</th>
                                    <th className="p-6 w-64">Uploaded At</th>
                                    <th className="p-6 w-40 text-center">Document</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60  font-bold text-slate-300">
                                {allMaterials.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-24 text-center text-slate-500 font-semibold bg-transparent">
                                            <FileText size={56} className="mx-auto text-slate-700 mb-4" />
                                            <span className="text-2xl">No tracking indices populated globally inside this archive yet.</span>
                                        </td>
                                    </tr>
                                ) : (
                                    allMaterials.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-slate-900/30 transition-colors group">
                                            <td className="p-6 pl-2 font-mono text-slate-500 text-6xl">{index + 1}</td>
                                            <td className="p-6 text-9xl">
                                                <span className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5  uppercase text-slate-300 group-hover:border-slate-600 transition-colors">
                                                    {item.uploader_name}
                                                </span>
                                            </td>
                                            <td className="p-6 text-white font-black text-6xl max-w-xl break-words uppercase tracking-wide">
                                                {item.subject}
                                            </td>
                                            <td className="p-6 text-slate-300 text-xl">
                                                {new Date(item.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="p-6 text-slate-500 font-medium text-base font-mono">
                                                {new Date(item.created_at).toLocaleString()}
                                            </td>
                                            <td className="p-6 text-center">
                                                <a 
                                                    href={`/${item.pdf_path}`} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-2 text-base font-black text-red-400 bg-red-950/20 hover:bg-red-950/50 px-4 py-2.5 rounded-xl border border-red-900/60 hover:border-red-500 transition-all cursor-pointer whitespace-nowrap"
                                                >
                                                    <Eye size={18} />
                                                    <span>View Document</span>
                                                </a>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExecutiveCommitteeDashboard;