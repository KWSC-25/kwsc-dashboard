import React, { useState, useEffect } from 'react';
import { Settings, AlertCircle, ArrowLeft, ShieldAlert } from 'lucide-react';
import api from '../utils/api';
import MohtasibForm from './MohtasibForm';

const MohatsibDashboard = () => {
    const [isManagingPanel, setIsManagingPanel] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);
    const [dashboardLoading, setDashboardLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [globalRecords, setGlobalRecords] = useState([]);

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
            
            // Get current local system date (midnight) for pivot calculations
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Separate records into Upcoming/Today vs Past
            const upcomingRecords = [];
            const pastRecords = [];

            rawRecords.forEach(record => {
                if (record.event_date) {
                    const eventDate = new Date(record.event_date);
                    eventDate.setHours(0, 0, 0, 0);
                    
                    if (eventDate >= today) {
                        upcomingRecords.push(record);
                    } else {
                        pastRecords.push(record);
                    }
                } else {
                    pastRecords.push(record);
                }
            });

            // Sort upcoming records in ASCENDING order (closest future date first)
            upcomingRecords.sort((a, b) => {
                const dateA = a.event_date ? new Date(a.event_date) : new Date(0);
                const dateB = b.event_date ? new Date(b.event_date) : new Date(0);
                return dateA - dateB;
            });

            // Sort past records in DESCENDING order (most recently passed first)
            pastRecords.sort((a, b) => {
                const dateA = a.event_date ? new Date(a.event_date) : new Date(0);
                const dateB = b.event_date ? new Date(b.event_date) : new Date(0);
                return dateB - dateA;
            });

            // Merge both arrays back together
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
            {toastMessage && (
                <div className="fixed top-8 right-8 bg-red-600 text-white px-6 py-4 rounded-xl z-50 shadow-2xl flex items-center gap-3 border border-red-500 animate-in fade-in slide-in-from-top-4 duration-200">
                    <AlertCircle size={24} />
                    <span className="font-bold text-lg">{toastMessage}</span>
                </div>
            )}

            {/* Top Bar containing Action Panel toggler only */}
            <div className="flex justify-end items-center mb-6">
                <button
                    onClick={handleManagementNavigation}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white disabled:text-slate-500 font-bold text-sm px-4 py-2 rounded-lg transition-all shadow-md cursor-pointer disabled:cursor-not-allowed select-none border border-transparent"
                >
                    <Settings size={16} />
                    <span>{actionLoading ? 'Checking...' : 'Manage'}</span>
                </button>
            </div>

            {dashboardLoading ? (
                <div className="p-24 text-center bg-transparent">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-6"></div>
                    <p className="text-slate-400 font-bold text-xl tracking-wide">Retrieving Mohtasib Monitoring Index...</p>
                </div>
            ) : (
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse table-auto min-w-full">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-900/50 text-xs font-black tracking-widest text-slate-400 uppercase">
                                    <th className="p-4 pl-5 w-12 text-center">Seq</th>
                                    <th className="p-4 w-28">Date</th>
                                    <th className="p-4 w-32">Recipient</th>
                                    <th className="p-4 w-32">Letter From</th>
                                    <th className="p-4 w-36">Reference No</th>
                                    <th className="p-4 min-w-[200px]">Subject</th>
                                    <th className="p-4 w-40">Target Official</th>
                                    <th className="p-4 w-40">Assigned To</th>
                                    <th className="p-4 w-28">Stage</th>
                                    <th className="p-4 w-28">Status</th>
                                    <th className="p-4 min-w-[150px]">Action Required</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50 text-xl lg:text-2xl font-bold text-slate-300">
                                {globalRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan="11" className="p-24 text-center text-slate-500 font-semibold bg-transparent">
                                            <ShieldAlert size={56} className="mx-auto text-slate-700 mb-4" />
                                            <span className="text-2xl">No Mohtasib records recorded globally.</span>
                                        </td>
                                    </tr>
                                ) : (
                                    globalRecords.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-slate-900/40 transition-colors group">
                                            {/* Sequence */}
                                            <td className="p-4 pl-5 text-center font-mono text-slate-500 text-lg border-r border-slate-900/50">{index + 1}</td>
                                            
                                            {/* Event Date */}
                                            <td className="p-4 font-mono text-lg text-amber-500/90 whitespace-nowrap">
                                                {item.event_date ? new Date(item.event_date).toLocaleDateString('en-GB') : '-'}
                                            </td>
                                            
                                            {/* Directed To / Recipient */}
                                            <td className="p-4 text-white text-2xl uppercase tracking-wide font-black max-w-[150px] truncate">
                                                {item.letter_directed_to || '-'}
                                            </td>
                                            
                                            {/* From */}
                                            <td className="p-4 text-slate-200 text-xl max-w-[150px] truncate">
                                                {item.letter_from || '-'}
                                            </td>
                                            
                                            {/* Reference No */}
                                            <td className="p-4 font-mono text-lg text-blue-400/90 tracking-wider max-w-[180px] truncate">
                                                {item.reference_no || '-'}
                                            </td>
                                            
                                            {/* Subject */}
                                            <td className="p-4 text-slate-300 font-bold max-w-xs truncate uppercase text-xl lg:text-2xl">
                                                {item.subject || '-'}
                                            </td>
                                            
                                            {/* Target Official */}
                                            <td className="p-4 text-slate-300 text-xl max-w-[160px] truncate">
                                                {item.target_official || '-'}
                                            </td>
                                            
                                            {/* Assigned To */}
                                            <td className="p-4 text-slate-300 text-xl max-w-[160px] truncate">
                                                {item.assigned_to || '-'}
                                            </td>
                                            
                                            {/* Stage */}
                                            <td className="p-4">
                                                <span className="inline-block bg-red-950/60 text-red-400 border border-red-900/60 text-base rounded-md px-2.5 py-0.5 font-mono uppercase tracking-wide shadow-sm whitespace-nowrap">
                                                    {item.letter_stage || '-'}
                                                </span>
                                            </td>
                                            
                                            {/* Status */}
                                            <td className="p-4">
                                                <span className="inline-block bg-blue-950/60 border border-blue-900/60 text-cyan-400 text-base rounded-md px-2.5 py-0.5 font-mono uppercase tracking-wide shadow-sm whitespace-nowrap">
                                                    {item.status || '-'}
                                                </span>
                                            </td>

                                            {/* Action Required */}
                                            <td className="p-4 text-emerald-400 text-xl max-w-xs truncate">
                                                {item.action_required || '-'}
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

export default MohatsibDashboard;