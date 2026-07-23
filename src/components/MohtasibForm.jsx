import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, AlertCircle, Search } from 'lucide-react';
import api from '../utils/api';

const MohtasibForm = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Predefined Status Options
    const STATUS_OPTIONS = [
        'Pending (Awaiting Action)',
        'Unresolved',
        'In Process',
        'Resolved & Closed'
    ];

    // Helper for Status Badge & Select Colors
    const getStatusStyle = (status) => {
        switch (status) {
            case 'Pending (Awaiting Action)':
                return 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
            case 'Unresolved':
                return 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
            case 'In Process':
                return 'bg-blue-100 text-blue-800 border-blue-300 font-bold';
            case 'Resolved & Closed':
                return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
            default:
                return 'bg-slate-100 text-slate-800 border-slate-300 font-bold';
        }
    };

    // Dropdown helpers for Action Required
    const [actionSelectValue, setActionSelectValue] = useState('');
    const [customActionText, setCustomActionText] = useState('');

    // Dropdown helpers for Department Assigned
    const [deptSelectValue, setDeptSelectValue] = useState('');
    const [customDeptText, setCustomDeptText] = useState('');

    // Predefined Dept options
    const standardDepts = ['Zone-I', 'Zone-II', 'Zone-III', 'Zone-IV', 'WTM', 'CCO (RRG)', 'HRDA', 'Legal'];

    // Form inputs state
    const [formData, setFormData] = useState({
        case_no: '',
        subject: '',
        letter_directed_to: '',
        letter_from: '',
        reference_no: '',
        event_date: '',
        appearance_date: '',
        appearance_time: '',
        secretariat: '',
        action_required: '',
        assigned_to: '',
        letter_stage: '',
        status: 'Pending (Awaiting Action)',
        ceo_dak_receipt_no: '',
        previous_letter_no: '',
        department_assigned: '',
        cc_to: ''
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

    // Action Dropdown Handler
    const handleActionDropdownChange = (e) => {
        const val = e.target.value;
        setActionSelectValue(val);
        if (val !== 'other') {
            setFormData(prev => ({ ...prev, action_required: val }));
        } else {
            setFormData(prev => ({ ...prev, action_required: customActionText }));
        }
    };

    const handleCustomActionChange = (e) => {
        const val = e.target.value;
        setCustomActionText(val);
        setFormData(prev => ({ ...prev, action_required: val }));
    };

    // Department Assigned Dropdown Handler
    const handleDeptDropdownChange = (e) => {
        const val = e.target.value;
        setDeptSelectValue(val);
        if (val !== 'other') {
            setFormData(prev => ({ ...prev, department_assigned: val }));
        } else {
            setFormData(prev => ({ ...prev, department_assigned: customDeptText }));
        }
    };

    const handleCustomDeptChange = (e) => {
        const val = e.target.value;
        setCustomDeptText(val);
        setFormData(prev => ({ ...prev, department_assigned: val }));
    };

    // Corrected Local Date Extractor for Form Inputs (YYYY-MM-DD)
    const formatDateForInput = (dateStr) => {
        if (!dateStr) return '';
        if (!dateStr.includes('T')) return dateStr;
        
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr.split('T')[0];

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Corrected Local Date Formatter for Table View (DD/MM/YYYY)
    const formatDateForTable = (dateStr) => {
        if (!dateStr) return '-';
        
        if (!dateStr.includes('T')) {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
            return dateStr;
        }

        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${day}/${month}/${year}`;
    };

    const openCreateModal = () => {
        setFormData({
            case_no: '',
            subject: '',
            letter_directed_to: '',
            letter_from: '',
            reference_no: '',
            event_date: '',
            appearance_date: '',
            appearance_time: '',
            secretariat: '',
            action_required: '',
            assigned_to: '',
            letter_stage: '',
            status: 'Pending (Awaiting Action)',
            ceo_dak_receipt_no: '',
            previous_letter_no: '',
            department_assigned: '',
            cc_to: ''
        });
        setActionSelectValue('');
        setCustomActionText('');
        setDeptSelectValue('');
        setCustomDeptText('');
        setEditingId(null);
        setErrorMsg('');
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        // Setup Action Required
        const dbAction = item.action_required || '';
        if (dbAction === 'Appear in Person' || dbAction === 'Report Submission' || dbAction === '') {
            setActionSelectValue(dbAction);
            setCustomActionText('');
        } else {
            setActionSelectValue('other');
            setCustomActionText(dbAction);
        }

        // Setup Department Assigned
        const dbDept = item.department_assigned || '';
        if (standardDepts.includes(dbDept) || dbDept === '') {
            setDeptSelectValue(dbDept);
            setCustomDeptText('');
        } else {
            setDeptSelectValue('other');
            setCustomDeptText(dbDept);
        }

        // Standardize Time formatting (HH:MM:SS -> HH:MM)
        let initialTime = '';
        if (item.appearance_time) {
            const parts = item.appearance_time.split(':');
            initialTime = `${parts[0]}:${parts[1]}`;
        }

        // Support both appearance_date and hearing_date properties from DB response
        const hearingDate = item.appearance_date || item.hearing_date || '';

        setFormData({
            case_no: item.case_no || '',
            subject: item.subject || '',
            letter_directed_to: item.letter_directed_to || '',
            letter_from: item.letter_from || '',
            reference_no: item.reference_no || '',
            event_date: formatDateForInput(item.event_date),
            appearance_date: formatDateForInput(hearingDate),
            appearance_time: initialTime,
            secretariat: item.secretariat || '',
            action_required: dbAction,
            assigned_to: item.assigned_to || '',
            letter_stage: item.letter_stage || '',
            status: item.status,
            ceo_dak_receipt_no: item.ceo_dak_receipt_no || '',
            previous_letter_no: item.previous_letter_no || '',
            department_assigned: dbDept,
            cc_to: item.cc_to || ''
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

    const formatTime12h = (timeStr) => {
        if (!timeStr) return '-';
        const [hourStr, minuteStr] = timeStr.split(':');
        const hour = parseInt(hourStr, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${minuteStr} ${ampm}`;
    };

    // Filter records across all search-relevant fields
    const filteredRecords = records.filter(item => {
        if (!searchTerm) return true;
        const clean = searchTerm.toLowerCase().trim();
        
        const fieldsToSearch = [
            item.case_no,
            item.ceo_dak_receipt_no,
            item.previous_letter_no,
            item.reference_no,
            item.letter_directed_to,
            item.letter_from,
            item.secretariat,
            item.department_assigned,
            item.cc_to,
            item.subject,
            item.action_required,
            item.assigned_to,
            item.letter_stage,
            item.status
        ];

        return fieldsToSearch.some(val => val && String(val).toLowerCase().includes(clean));
    });

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

            {/* SEARCH BAR */}
            <div className="mb-6">
                <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <Search size={20} />
                    </div>
                    <input 
                        type="text"
                        placeholder="Search across uploaded entries (Case No, DAK Receipt, Ref No, Directed To, Subject, Dept...)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-blue-500 text-white placeholder-slate-400 text-base font-medium pl-12 pr-10 py-3 rounded-xl outline-none shadow-inner transition-all focus:ring-2 focus:ring-blue-500/30"
                    />
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')} 
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white bg-transparent border-none cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="py-20 text-center font-bold text-xl text-slate-400">Syncing database feed...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-auto min-w-[1900px]">
                        <thead>
                            <tr className="border-b border-slate-800 text-sm font-black tracking-widest text-slate-500 uppercase">
                                <th className="p-4 pl-2 w-12">S.NO</th>
                                <th className="p-4">Case No</th>
                                <th className="p-4">CEO DAK Receipt No</th>
                                <th className="p-4">Prev Letter / Hawal</th>
                                <th className="p-4">Appearance Date</th>
                                <th className="p-4">Time</th>
                                <th className="p-4">Directed To</th>
                                <th className="p-4">Letter From</th>
                                <th className="p-4">Secretariat</th>
                                <th className="p-4">Letter Ref No</th> 
                                <th className="p-4">Dept Assigned</th>
                                <th className="p-4">CC To</th>
                                <th className="p-4">Subject</th>
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
                                    <td colSpan="19" className="p-16 text-center text-slate-600">
                                        No entries found under your logged-in username scope.
                                    </td>
                                </tr>
                            ) : filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan="19" className="p-16 text-center text-slate-500 font-bold">
                                        No records matched your search term.
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.map((item, index) => {
                                    const normStatus = item.status;
                                    const hearingDate = item.appearance_date || item.hearing_date;
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-900/20 transition-colors">
                                            <td className="p-4 pl-2 font-mono text-slate-500 text-base">{index + 1}</td>
                                            <td className="p-4 font-mono text-base text-amber-400 whitespace-nowrap">{item.case_no || '-'}</td>
                                            <td className="p-4 font-mono text-base text-cyan-400 whitespace-nowrap">{item.ceo_dak_receipt_no || '-'}</td>
                                            <td className="p-4 font-mono text-base text-slate-400 whitespace-nowrap">{item.previous_letter_no || '-'}</td>
                                            <td className="p-4 font-mono text-base whitespace-nowrap text-amber-500">
                                                {formatDateForTable(hearingDate)}
                                            </td>
                                            <td className="p-4 font-mono text-base whitespace-nowrap text-emerald-400">
                                                {formatTime12h(item.appearance_time)}
                                            </td>
                                            <td className="p-4 text-white text-xl uppercase whitespace-nowrap">{item.letter_directed_to}</td>
                                            <td className="p-4 whitespace-nowrap">{item.letter_from}</td>
                                            <td className="p-4 whitespace-nowrap">{item.secretariat || '-'}</td>
                                            <td className="p-4 font-mono text-base text-slate-400 whitespace-nowrap">{item.reference_no}</td>
                                            <td className="p-4 text-sky-400 whitespace-nowrap">{item.department_assigned || '-'}</td>
                                            <td className="p-4 max-w-xs truncate text-slate-400" title={item.cc_to}>{item.cc_to || '-'}</td>
                                            <td className="p-4 max-w-xs truncate text-slate-300 uppercase" title={item.subject}>{item.subject || '-'}</td>
                                            <td className="p-4 max-w-xs truncate" title={item.action_required}>{item.action_required || '-'}</td>
                                            <td className="p-4 whitespace-nowrap">{item.assigned_to || '-'}</td>
                                            <td className="p-4">
                                                {item.letter_stage ? (
                                                    <span className="bg-slate-900 border border-slate-800 text-red-400 text-sm rounded-lg px-2.5 py-1 font-mono uppercase whitespace-nowrap">
                                                        {item.letter_stage}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="p-4">
                                                <span className={`border text-xs rounded-lg px-2.5 py-1 whitespace-nowrap uppercase tracking-wider ${getStatusStyle(normStatus)}`}>
                                                    {normStatus}
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
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* LIGHT THEME POPUP DIALOG */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col my-8">
                        
                        {/* Light Header */}
                        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h4 className="text-xl font-bold text-slate-800">
                                {editingId ? "Modify Mohtasib Record" : "Introduce New OMBUDSMAN Registry Entry"}
                            </h4>
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form Area */}
                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[75vh] space-y-5 text-slate-800">

                            {/* Case Number & Subject Matter at Top */}
                            <div className="space-y-4 bg-amber-50/50 p-4 rounded-xl border border-amber-200/60">
                                <div>
                                    <label className="block text-sm font-black text-slate-800 mb-1">Case Number *</label>
                                    <input 
                                        type="text" 
                                        name="case_no" 
                                        value={formData.case_no} 
                                        onChange={handleInputChange}
                                        required
                                        placeholder="e.g. POS/242/KHE/2019/DG-II or WMS-ONL/23050/26"
                                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Subject Matter *</label>
                                    <textarea 
                                        name="subject" 
                                        rows="2" 
                                        value={formData.subject} 
                                        onChange={handleInputChange} 
                                        required
                                        placeholder="Write subject matter of complaint..."
                                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium resize-y"
                                    ></textarea>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* CEO DAK Receipt Number */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">CEO DAK Receipt Number *</label>
                                    <input 
                                        type="text" 
                                        name="ceo_dak_receipt_no" 
                                        value={formData.ceo_dak_receipt_no} 
                                        onChange={handleInputChange} 
                                        required 
                                        placeholder="e.g. DAK-2026-99"
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                                    />
                                </div>

                                {/* Previous Letter No. / Hawal */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Previous Letter No. / Hawala</label>
                                    <input 
                                        type="text" 
                                        name="previous_letter_no" 
                                        value={formData.previous_letter_no} 
                                        onChange={handleInputChange} 
                                        placeholder="e.g. HWL/882/2025"
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                                    />
                                </div>

                                {/* Directed To */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Letter Addressed To *</label>
                                    <input 
                                        type="text" 
                                        name="letter_directed_to" 
                                        value={formData.letter_directed_to} 
                                        onChange={handleInputChange} 
                                        required 
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                                    />
                                </div>

                                {/* From */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Letter From *</label>
                                    <input 
                                        type="text" 
                                        name="letter_from" 
                                        value={formData.letter_from} 
                                        onChange={handleInputChange} 
                                        required 
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                                    />
                                </div>

                                {/* Secretariat (Ombudsman Sindh Dropdown) */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Secretariat *</label>
                                    <select 
                                        name="secretariat" 
                                        value={formData.secretariat} 
                                        onChange={handleInputChange} 
                                        required 
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                                    >
                                        <option value="">-- Choose Secretariat --</option>
                                        <option value="Provincial Ombudsman Sindh">Provincial Ombudsman Sindh</option>
                                        <option value="Federal Ombudsman Sindh">Federal Ombudsman Sindh</option>
                                    </select>
                                </div>

                                {/* Reference No */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Letter Reference No *</label>
                                    <input 
                                        type="text" 
                                        name="reference_no" 
                                        value={formData.reference_no} 
                                        onChange={handleInputChange} 
                                        required 
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                                    />
                                </div>

                                {/* Event Date */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Letter Date *</label>
                                    <input 
                                        type="date" 
                                        name="event_date" 
                                        value={formData.event_date} 
                                        onChange={handleInputChange} 
                                        required 
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                                    />
                                </div>

                                {/* Appearance Date */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Appearance/Hearing Date *</label>
                                    <input 
                                        type="date" 
                                        name="appearance_date" 
                                        value={formData.appearance_date} 
                                        onChange={handleInputChange} 
                                        required 
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                                    />
                                </div>

                                {/* Appearance Time */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Appearance Time *</label>
                                    <input 
                                        type="time" 
                                        name="appearance_time" 
                                        value={formData.appearance_time} 
                                        onChange={handleInputChange} 
                                        required 
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                                    />
                                </div>

                                {/* Assigned To */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Assigned To</label>
                                    <input 
                                        type="text" 
                                        name="assigned_to" 
                                        value={formData.assigned_to} 
                                        onChange={handleInputChange} 
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                                    />
                                </div>

                                {/* Letter Stage */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Letter Stage</label>
                                    <input 
                                        type="text" 
                                        name="letter_stage" 
                                        value={formData.letter_stage} 
                                        onChange={handleInputChange} 
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                                    />
                                </div>

                                {/* Color-coded Dynamic Status Dropdown */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Status *</label>
                                    <select 
                                        name="status" 
                                        value={formData.status} 
                                        onChange={handleInputChange} 
                                        required
                                        className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${getStatusStyle(formData.status)}`}
                                    >
                                        {STATUS_OPTIONS.map(opt => (
                                            <option key={opt} value={opt} className="bg-white text-slate-800 font-normal">
                                                {opt}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Department / Zone Assigned Dropdown + Manual Entry */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200 pt-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Department / Zone Assigned *</label>
                                    <select 
                                        value={deptSelectValue} 
                                        onChange={handleDeptDropdownChange} 
                                        required
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                                    >
                                        <option value="">-- Choose Department / Zone --</option>
                                        {standardDepts.map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                        <option value="other">Other (Type custom department...)</option>
                                    </select>
                                </div>

                                {deptSelectValue === 'other' && (
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Specify Custom Department *</label>
                                        <input 
                                            type="text" 
                                            value={customDeptText} 
                                            onChange={handleCustomDeptChange} 
                                            required
                                            placeholder="Write customized department here" 
                                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Copy for Information / CC to */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Copy for Information / CC to</label>
                                <input 
                                    type="text" 
                                    name="cc_to" 
                                    value={formData.cc_to} 
                                    onChange={handleInputChange} 
                                    placeholder="e.g. Managing Director, Chief Engineer, Executive Engineer Zone-I (Separate multiple with commas)" 
                                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                                />
                                <p className="text-xs text-slate-500 mt-1">You can enter multiple designated persons separated by commas.</p>
                            </div>

                            {/* Action Required dropdown & text field input split */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200 pt-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Action Required</label>
                                    <select 
                                        value={actionSelectValue} 
                                        onChange={handleActionDropdownChange} 
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                                    >
                                        <option value="">-- No Action Chosen --</option>
                                        <option value="Appear in Person">Appear in Person</option>
                                        <option value="Report Submission">Report Submission</option>
                                        <option value="other">Other (Type custom value...)</option>
                                    </select>
                                </div>

                                {actionSelectValue === 'other' && (
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Specify Custom Action Required</label>
                                        <input 
                                            type="text" 
                                            value={customActionText} 
                                            onChange={handleCustomActionChange} 
                                            placeholder="Write customized action parameter here" 
                                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                                        />
                                    </div>
                                )}
                            </div>

                            {errorMsg && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
                                    <AlertCircle size={18} />
                                    <span className="font-semibold text-sm">{errorMsg}</span>
                                </div>
                            )}

                            {/* Form Submission Footer */}
                            <div className="p-5 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 -mx-6 -mb-6 mt-8 rounded-b-2xl">
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)} 
                                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-5 py-2.5 rounded-lg text-sm font-bold transition-all border-none cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={submitting} 
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-black tracking-wide transition-all border-none cursor-pointer disabled:bg-slate-400 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Saving...' : 'Save Record'}
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