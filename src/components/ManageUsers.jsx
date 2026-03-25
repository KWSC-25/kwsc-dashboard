import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { 
    UserPlus, Trash2, Edit, ArrowLeft, LogOut, 
    Mail, User, Shield, X, Loader2, Search 
} from 'lucide-react';

const ManageUsers = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'viewer' });

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/users');
            if (res.data.success) setUsers(res.data.data);
        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
    };

    useEffect(() => { fetchUsers(); }, []);

    const filteredUsers = users.filter(u => 
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditMode(true);
            setSelectedUserId(user.id);
            setFormData({ username: user.username, email: user.email, password: '', role: user.role });
        } else {
            setEditMode(false);
            setFormData({ username: '', email: '', password: '', role: 'viewer' });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await api.put(`/admin/users/${selectedUserId}`, formData);
            } else {
                await api.post('/admin/users/create', formData);
            }
            setShowModal(false);
            fetchUsers();
        } catch (err) { alert(err.response?.data?.message || "Operation failed"); }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this user?")) {
            await api.delete(`/admin/users/${id}`);
            fetchUsers();
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 p-6 text-slate-900">
            {/* Top Navigation Bar */}
            <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4 mb-8 bg-white p-5 rounded-2xl shadow-sm border border-slate-300">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin')} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-700">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
                        <p className="text-slate-600 text-sm">Control dashboard access and roles</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search users..." 
                            className="pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-64 text-slate-800 placeholder:text-slate-400"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold shadow-lg transition-all active:scale-95">
                        <UserPlus size={20} /> Add User
                    </button>
                    <button onClick={() => { sessionStorage.removeItem('token'); navigate('/'); }} className="p-2.5 text-red-600 hover:bg-red-100 rounded-xl transition-colors border border-red-200">
                        <LogOut size={20} />
                    </button>
                </div>
            </div>

            {/* Main Table Container */}
            <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-md border border-slate-300 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-200 border-b border-slate-300">
                                <th className="p-5 text-slate-700 font-bold text-sm uppercase tracking-wider">User Details</th>
                                <th className="p-5 text-slate-700 font-bold text-sm uppercase tracking-wider">Access Level</th>
                                <th className="p-5 text-slate-700 font-bold text-sm uppercase tracking-wider">Registration Date</th>
                                <th className="p-5 text-slate-700 font-bold text-sm uppercase tracking-wider text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="p-20 text-center">
                                        <Loader2 className="animate-spin mx-auto text-blue-600 mb-2" size={32} />
                                        <span className="text-slate-600 font-medium">Syncing database...</span>
                                    </td>
                                </tr>
                            ) : filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                                {user.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900">{user.username}</div>
                                                <div className="text-sm text-slate-600 font-medium">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className={`px-3 py-1 rounded-lg text-xs font-black tracking-wide uppercase border ${
                                            user.role === 'admin' 
                                            ? 'bg-purple-100 text-purple-800 border-purple-300' 
                                            : 'bg-blue-100 text-blue-800 border-blue-300'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-5 text-xs font-black ">
                                        {new Date(user.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="p-5">
                                        <div className="flex justify-center gap-4">
                                            <button onClick={() => handleOpenModal(user)} className="p-2 text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors shadow-sm">
                                                <Edit size={19} />
                                            </button>
                                            <button onClick={() => handleDelete(user.id)} className="p-2 text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg transition-colors shadow-sm">
                                                <Trash2 size={19} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* POPUP MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-300">
                        <div className="bg-blue-700 p-6 flex justify-between items-center text-white">
                            <div>
                                <h2 className="text-xl font-bold">{editMode ? 'Edit Account' : 'New Account'}</h2>
                                <p className="text-blue-100 text-xs mt-1 font-medium">KW&SC Dashboard Credentials</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={24}/></button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-8 space-y-5 bg-white">
                            <div className="space-y-1">
                                <label className="text-sm font-black text-slate-800 ml-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-3 text-slate-600" size={18} />
                                    <input 
                                        type="text" required 
                                        className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-300 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 font-medium transition-all"
                                        placeholder="Enter name"
                                        value={formData.username} 
                                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-black text-slate-800 ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-3 text-slate-600" size={18} />
                                    <input 
                                        type="email" required 
                                        className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-300 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 font-medium transition-all"
                                        placeholder="user@kwsc.com"
                                        value={formData.email} 
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-black text-slate-800 ml-1">
                                    {editMode ? 'Change Password' : 'Password'}
                                </label>
                                <div className="relative">
                                    <Shield className="absolute left-4 top-3 text-slate-600" size={18} />
                                    <input 
                                        type="password" 
                                        required={!editMode} 
                                        className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-300 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 font-medium transition-all"
                                        placeholder={editMode ? 'Leave blank to keep current' : '••••••••'}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-black text-slate-800 ml-1">Permission Level</label>
                                <select 
                                    className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-2xl outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 font-bold transition-all appearance-none cursor-pointer"
                                    value={formData.role} 
                                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                                >
                                    <option value="viewer">Viewer (Read Only)</option>
                                    <option value="admin">Admin (Full Control)</option>
                                </select>
                            </div>

                            <button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-200 transition-all mt-4 transform active:scale-[0.98]">
                                {editMode ? 'Save Changes' : 'Create User'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageUsers;