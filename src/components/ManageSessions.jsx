import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, Loader2, Monitor, RefreshCw, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

const ManageSessions = () => {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/users/sessions');
            if (res.data.success) setSessions(res.data.data);
        } catch (err) { 
            console.error("Error fetching telemetry logs:", err); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { 
        fetchSessions(); 
    }, []);

    // Change this function inside ManageUsers.jsx to hit the correct secure path route:
    const handleSystemLogout = async () => {
        try {
            await api.post('/auth/logout'); // Fixed to match your server.js route configuration
        } catch (err) {
            console.error("Backend clean logout signal skipped:", err);
        } finally {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('role');
            navigate('/');
        }
    };

    // Helper to format long user-agent blocks into friendly descriptions
    const cleanUserAgent = (ua) => {
        if (!ua) return 'Unknown Device';
        if (ua.includes('Windows')) return 'Chrome / Windows PC';
        if (ua.includes('Macintosh')) return 'Safari / Mac';
        if (ua.includes('Android')) return 'Mobile / Android';
        if (ua.includes('iPhone')) return 'Mobile / iPhone';
        return ua.length > 25 ? ua.substring(0, 25) + '...' : ua;
    };

    // Helper to format date strings cleanly
    const formatTimestamp = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleString('en-GB', { 
            day: '2-digit', 
            month: 'short', 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-slate-100 p-6 text-slate-900">
            {/* Navigation Header */}
            <div className="max-w-7xl mx-auto flex justify-between items-center mb-8 bg-white p-5 rounded-2xl shadow-sm border border-slate-300">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin')} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-700">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Track User Sessions Logs</h1>
                        <p className="text-slate-600 text-sm">Review real-time concurrent device footprints</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={fetchSessions} disabled={loading} className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl flex items-center gap-2 font-semibold shadow-sm transition-all disabled:opacity-50">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh Logs
                    </button>
                    <button onClick={handleSystemLogout} className="p-2.5 text-red-600 hover:bg-red-100 rounded-xl transition-colors border border-red-200" title="Secure Logout">
                        <LogOut size={20} />
                    </button>
                </div>
            </div>

            {/* Logs Table Area */}
            <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-md border border-slate-300 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-200 border-b border-slate-300">
                                <th className="p-4 text-slate-700 font-bold text-xs uppercase tracking-wider w-12 text-center">S.No</th>
                                <th className="p-4 text-slate-700 font-bold text-xs uppercase tracking-wider">Account Identity</th>
                                <th className="p-4 text-slate-700 font-bold text-xs uppercase tracking-wider">Client / Device Agent</th>
                                <th className="p-4 text-slate-700 font-bold text-xs uppercase tracking-wider">Network IP</th>
                                <th className="p-4 text-slate-700 font-bold text-xs uppercase tracking-wider">Authenticated</th>
                                <th className="p-4 text-slate-700 font-bold text-xs uppercase tracking-wider">Last Activity</th>
                                <th className="p-4 text-slate-700 font-bold text-xs uppercase tracking-wider">Terminated At</th>
                                <th className="p-4 text-slate-700 font-bold text-xs uppercase tracking-wider text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading && sessions.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-20 text-center">
                                        <Loader2 className="animate-spin mx-auto text-blue-600 mb-2" size={32} />
                                        <span className="text-slate-600 font-medium">Reading database audit telemetry...</span>
                                    </td>
                                </tr>
                            ) : sessions.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-12 text-center text-slate-500 font-medium">No records found in user_sessions table.</td>
                                </tr>
                            ) : sessions.map((session, index) => {
                                // Status conditions matching all columns
                                const isRevoked = session.is_revoked === true || session.is_revoked === 1;
                                const isLoggedOut = !!session.logout_at;
                                const isActive = !isLoggedOut && !isRevoked;

                                return (
                                    <tr key={session.id} className="hover:bg-slate-50 transition-colors text-sm">
                                        <td className="p-4 text-slate-500 font-bold text-center">{index + 1}</td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800">{session.email}</div>
                                            <div className="text-xs text-slate-400 font-mono select-all tracking-tight">{session.id}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-slate-700 font-medium">
                                                <Monitor size={15} className="text-slate-400" />
                                                {cleanUserAgent(session.user_agent)}
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono text-xs text-red font-semibold">{session.ip_address}</td>
                                        <td className="p-4 text-red font-medium">{formatTimestamp(session.login_at)}</td>
                                        <td className="p-4 text-red font-medium">{formatTimestamp(session.last_activity_at)}</td>
                                        <td className="p-4 text-red font-mono text-xs">{formatTimestamp(session.logout_at)}</td>
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="flex justify-center">
                                                {isActive ? (
                                                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                                        <CheckCircle2 size={12} /> Active
                                                    </span>
                                                ) : isRevoked ? (
                                                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                                                        <ShieldAlert size={12} /> Revoked
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase bg-slate-100 text-red border border-slate-300 flex items-center gap-1">
                                                        <AlertCircle size={12} /> Closed
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ManageSessions;