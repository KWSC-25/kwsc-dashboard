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
            <div className="p-6 bg-transparent text-white">
                <button
                    onClick={() => setIsUploading(false)}
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white bg-transparent border-none cursor-pointer mb-5 text-xl font-bold transition-colors"
                >
                    <ArrowLeft size={16} />
                    <span>Back to Analytics Dashboard</span>
                </button>
                <ExecutiveCommitteeUploadPanel />
            </div>
        );
    }

    return (
        <div className="p-6 relative text-slate-200 bg-transparent">
            {/* Custom Warning Notification Banner Toast */}
            {toastMessage && (
                <div className="fixed top-6 right-6 bg-red-600 text-white px-6 py-4 rounded-xl z-50 shadow-xl flex items-center gap-3 border border-red-500 animate-in fade-in slide-in-from-top-4 duration-200">
                    <AlertCircle size={20} />
                    <span className="font-bold text-sm">{toastMessage}</span>
                </div>
            )}

            {/* Subheader / Table Heading Layout Group */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-slate-800/60 pb-5">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight uppercase">Executive Committee Analytics</h2>
                    <p className="text-xl font-semibold text-slate-400 mt-1">Review operational updates, global uploads, and centralized documentation files.</p>
                </div>
                <button
                    onClick={handleUploadNavigation}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white disabled:text-slate-500 font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer disabled:cursor-not-allowed select-none border border-transparent"
                >
                    <Upload size={18} />
                    <span>{actionLoading ? 'Verifying Context...' : 'Go to Upload Panel'}</span>
                </button>
            </div>

            {/* Centralized Global Feed Monitoring Matrix Grid */}
            {dashboardLoading ? (
                <div className="p-12 text-center bg-transparent">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-slate-400 font-bold text-sm tracking-wide">Retrieving Executive Committee Monitoring Index...</p>
                </div>
            ) : (
                <div className="bg-transparent overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800 text-5xl font-black tracking-wider text-slate-400 uppercase">
                                    <th className="p-4 pl-2 w-16">Seq</th>
                                    <th className="p-4 w-48">Uploader Name</th>
                                    <th className="p-4 w-50">Document / Matter Subject</th>
                                    <th className="p-4 w-44">Meeting Date</th>
                                    <th className="p-4 w-48">Uploaded At</th>
                                    <th className="p-4 w-28 text-center">Document</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50 text-sm font-semibold text-slate-300">
                                {allMaterials.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-12 text-center text-slate-500 font-medium bg-transparent">
                                            <FileText size={32} className="mx-auto text-slate-600 mb-2" />
                                            No tracking indices populated globally inside this archive yet.
                                        </td>
                                    </tr>
                                ) : (
                                    allMaterials.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-slate-900/40 transition-colors group">
                                            <td className="p-4  font-mono text-slate-500 text-xl">{index + 1}</td>
                                            <td className="p-4">
                                                <span className="bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-xs font-mono uppercase text-slate-300 group-hover:border-slate-700 transition-colors">
                                                    {item.uploader_name}
                                                </span>
                                            </td>
                                            <td className="p-4 text-white font-bold max-w-md break-words uppercase tracking-tight">
                                                {item.subject}
                                            </td>
                                            <td className="p-4 text-slate-300">
                                                {new Date(item.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="p-4 text-slate-500 font-medium text-xs">
                                                {new Date(item.created_at).toLocaleString()}
                                            </td>
                                            <td className="p-4 text-center">
                                                <a 
                                                    href={`/${item.pdf_path}`} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-red-400 bg-red-950/20 hover:bg-red-950/40 px-3 py-1.5 rounded-lg border border-red-900/50 hover:border-red-500 transition-all cursor-pointer"
                                                >
                                                    <Eye size={14} />
                                                    <span>View</span>
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