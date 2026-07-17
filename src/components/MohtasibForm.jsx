import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import api from '../utils/api';

const MohtasibForm = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form inputs state
    const [formData, setFormData] = useState({
        letter_directed_to: '',
        letter_from: '',
        reference_no: '',
        event_date: '',
        subject: '',
        target_official: '',
        action_required: '',
        assigned_to: '',
        letter_stage: '',
        status: ''
    });

    useEffect(() => {
        fetchUserRecords();
    }, []);

    const fetchUserRecords = async () => {
        setLoading(true);
        try {
            const res = await api.get('/mohtasib/records');
            setRecords(res.data.data);
        } catch (err) {
            console.error("Failed fetching user specific Mohtasib records:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const openCreateModal = () => {
        setFormData({
            letter_directed_to: '',
            letter_from: '',
            reference_no: '',
            event_date: '',
            subject: '',
            target_official: '',
            action_required: '',
            assigned_to: '',
            letter_stage: '',
            status: ''
        });
        setEditingId(null);
        setErrorMsg('');
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setFormData({
            letter_directed_to: item.letter_directed_to,
            letter_from: item.letter_from,
            reference_no: item.reference_no,
            event_date: item.event_date ? item.event_date.split('T')[0] : '',
            subject: item.subject,
            target_official: item.target_official,
            action_required: item.action_required,
            assigned_to: item.assigned_to,
            letter_stage: item.letter_stage,
            status: item.status
        });
        setEditingId(item.id);
        setErrorMsg('');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrorMsg('');

        try {
            if (editingId) {
                await api.put(`/mohtasib/update/${editingId}`, formData);
            } else {
                await api.post('/mohtasib/add', formData);
            }
            setIsModalOpen(false);
            fetchUserRecords();
        } catch (err) {
            console.error(err);
            setErrorMsg(err.response?.data?.message || "Internal network operational issue.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this Mohtasib tracking index?")) return;
        try {
            await api.delete(`/mohtasib/delete/${id}`);
            fetchUserRecords();
        } catch (err) {
            console.error(err);
            alert("Could not delete the record. Please try again.");
        }
    };

    return (
        <div className="bg-transparent text-slate-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h3 className="text-3xl font-black text-white uppercase">Your Uploaded Entries</h3>
                    <p className="text-slate-400 font-bold mt-1">Review and manage records you have introduced into the database.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-lg font-black tracking-wide transition-colors cursor-pointer whitespace-nowrap"
                >
                    <Plus size={20} />
                    <span>Create Record</span>
                </button>
            </div>

            {loading ? (
                <div className="py-20 text-center font-bold text-xl text-slate-400">Syncing database feed...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-auto min-w-[1200px]">
                        <thead>
                            <tr className="border-b border-slate-800 text-sm font-black tracking-widest text-slate-500 uppercase">
                                <th className="p-4 pl-2 w-16">Seq</th>
                                <th className="p-4">Directed To</th>
                                <th className="p-4">From</th>
                                <th className="p-4">Reference No</th>
                                <th className="p-4">Subject</th>
                                <th className="p-4">Target Official</th>
                                <th className="p-4">Action Required</th>
                                <th className="p-4">Assigned To</th>
                                <th className="p-4">Stage</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 w-32 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-lg font-bold text-slate-300">
                            {records.length === 0 ? (
                                <tr>
                                    <td colSpan="11" className="p-16 text-center text-slate-600">
                                        No entries found under your logged-in username scope.
                                    </td>
                                </tr>
                            ) : (
                                records.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-slate-900/20 transition-colors">
                                        <td className="p-4 pl-2 font-mono text-slate-500 text-base">{index + 1}</td>
                                        <td className="p-4 text-white text-xl uppercase whitespace-nowrap">{item.letter_directed_to}</td>
                                        <td className="p-4 whitespace-nowrap">{item.letter_from}</td>
                                        <td className="p-4 font-mono text-base text-slate-400 whitespace-nowrap">{item.reference_no}</td>
                                        <td className="p-4 max-w-xs truncate text-slate-300 uppercase" title={item.subject}>{item.subject}</td>
                                        <td className="p-4 whitespace-nowrap">{item.target_official}</td>
                                        <td className="p-4 max-w-xs truncate" title={item.action_required}>{item.action_required}</td>
                                        <td className="p-4 whitespace-nowrap">{item.assigned_to}</td>
                                        <td className="p-4">
                                            <span className="bg-slate-900 border border-slate-800 text-red-400 text-sm rounded-lg px-2.5 py-1 font-mono uppercase whitespace-nowrap">
                                                {item.letter_stage}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-slate-900 border border-slate-800 text-blue-400 text-sm rounded-lg px-2.5 py-1 font-mono uppercase whitespace-nowrap">
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => openEditModal(item)}
                                                    className="p-2 text-blue-400 hover:text-white hover:bg-blue-950/40 rounded-lg transition-all border border-transparent hover:border-blue-800/40 cursor-pointer"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-2 text-red-400 hover:text-white hover:bg-red-950/40 rounded-lg transition-all border border-transparent hover:border-red-900/40 cursor-pointer"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* LIGHT THEME POPUP DIALOG WITH MAXIMUM SCROLLABILITY */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col my-8">
                        
                        {/* Light Header */}
                        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h4 className="text-xl font-black text-slate-900 uppercase tracking-wide">
                                {editingId ? 'Modify Mohtasib Entry' : 'Add New Mohtasib Entry'}
                            </h4>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-500 hover:text-slate-800 p-2 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        {errorMsg && (
                            <div className="mx-6 mt-4 p-3.5 bg-red-50 border border-red-200 text-red-600 text-sm font-bold rounded-xl flex items-center gap-2.5">
                                <AlertCircle size={20} className="shrink-0" />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        {/* Scrollable Light Form Container */}
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto max-h-[70vh] p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Letter Directed To</label>
                                    <input
                                        type="text"
                                        name="letter_directed_to"
                                        required
                                        placeholder="Enter recipient authority name"
                                        value={formData.letter_directed_to}
                                        onChange={handleInputChange}
                                        className="bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-lg p-3 text-base text-slate-900 font-semibold outline-none focus:ring-1 focus:ring-blue-600 transition-all uppercase placeholder-slate-400"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider">From</label>
                                    <input
                                        type="text"
                                        name="letter_from"
                                        required
                                        placeholder="Enter sender organization/department"
                                        value={formData.letter_from}
                                        onChange={handleInputChange}
                                        className="bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-lg p-3 text-base text-slate-900 font-semibold outline-none focus:ring-1 focus:ring-blue-600 transition-all uppercase placeholder-slate-400"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Reference No.</label>
                                    <input
                                        type="text"
                                        name="reference_no"
                                        required
                                        placeholder="Enter dispatch reference number"
                                        value={formData.reference_no}
                                        onChange={handleInputChange}
                                        className="bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-lg p-3 text-base text-slate-900 font-semibold outline-none focus:ring-1 focus:ring-blue-600 transition-all uppercase placeholder-slate-400"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Date</label>
                                    <input
                                        type="date"
                                        name="event_date"
                                        required
                                        value={formData.event_date}
                                        onChange={handleInputChange}
                                        className="bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-lg p-3 text-base text-slate-900 font-semibold outline-none focus:ring-1 focus:ring-blue-600 transition-all"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5 md:col-span-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Subject</label>
                                    <textarea
                                        name="subject"
                                        required
                                        rows="2"
                                        placeholder="Enter letter core subject context"
                                        value={formData.subject}
                                        onChange={handleInputChange}
                                        className="bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-lg p-3 text-base text-slate-900 font-semibold outline-none focus:ring-1 focus:ring-blue-600 transition-all resize-none uppercase placeholder-slate-400"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Target Official</label>
                                    <input
                                        type="text"
                                        name="target_official"
                                        required
                                        placeholder="Enter target responder officer"
                                        value={formData.target_official}
                                        onChange={handleInputChange}
                                        className="bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-lg p-3 text-base text-slate-900 font-semibold outline-none focus:ring-1 focus:ring-blue-600 transition-all uppercase placeholder-slate-400"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Action Required</label>
                                    <input
                                        type="text"
                                        name="action_required"
                                        required
                                        placeholder="Enter action (e.g. compliance report)"
                                        value={formData.action_required}
                                        onChange={handleInputChange}
                                        className="bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-lg p-3 text-base text-slate-900 font-semibold outline-none focus:ring-1 focus:ring-blue-600 transition-all uppercase placeholder-slate-400"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Assigned / Marked To</label>
                                    <input
                                        type="text"
                                        name="assigned_to"
                                        required
                                        placeholder="Enter monitoring officer assigned"
                                        value={formData.assigned_to}
                                        onChange={handleInputChange}
                                        className="bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-lg p-3 text-base text-slate-900 font-semibold outline-none focus:ring-1 focus:ring-blue-600 transition-all uppercase placeholder-slate-400"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Letter Stage (Urgency)</label>
                                    <input
                                        type="text"
                                        name="letter_stage"
                                        required
                                        placeholder="Notice, Summon, Final Warning"
                                        value={formData.letter_stage}
                                        onChange={handleInputChange}
                                        className="bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-lg p-3 text-base text-slate-900 font-semibold outline-none focus:ring-1 focus:ring-blue-600 transition-all uppercase placeholder-slate-400"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5 md:col-span-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Status</label>
                                    <input
                                        type="text"
                                        name="status"
                                        required
                                        placeholder="Pending, Reply Submitted, Closed"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        className="bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-lg p-3 text-base text-slate-900 font-semibold outline-none focus:ring-1 focus:ring-blue-600 transition-all uppercase placeholder-slate-400"
                                    />
                                </div>
                            </div>

                            {/* Light Footer */}
                            <div className="border-t border-slate-200 pt-5 flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-lg transition-all border border-slate-300 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white disabled:text-slate-500 font-black px-7 py-2.5 rounded-lg transition-all shadow-md cursor-pointer disabled:cursor-not-allowed border border-transparent"
                                >
                                    {submitting ? 'Processing Record...' : (editingId ? 'Save Edits' : 'Save Record')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MohtasibForm;