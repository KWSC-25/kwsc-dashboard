import React, { useState, useEffect } from 'react';
import { Upload, FileText, Edit, Trash2, Plus, X, Eye } from 'lucide-react';
import api from '../utils/api';

const ExecutiveCommitteeUploadPanel = () => {
    const [materials, setMaterials] = useState([]);
    const [canUpload, setCanUpload] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    // Form inputs state
    const [subject, setSubject] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [pdfFile, setPdfFile] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        verifyPermissionAndLoadData();
    }, []);

    const verifyPermissionAndLoadData = async () => {
        try {
            const permRes = await api.get('/eci/check-upload-permission');
            setCanUpload(permRes.data.canUpload);
            
            if (permRes.data.canUpload) {
                await fetchMaterials();
            }
        } catch (err) {
            console.error("Initialization check pipeline error:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMaterials = async () => {
        try {
            const res = await api.get('/eci/materials');
            setMaterials(res.data.data);
        } catch (err) {
            console.error("Error retrieving uploaded items profile:", err);
        }
    };

    const handleOpenModal = (item = null) => {
        setErrorMessage('');
        if (item) {
            setEditMode(true);
            setSelectedId(item.id);
            setSubject(item.subject);
            // Formats structural timestamp string seamlessly into standard YYYY-MM-DD format
            setEventDate(new Date(item.event_date).toISOString().split('T')[0]);
            setPdfFile(null);
        } else {
            setEditMode(false);
            setSubject('');
            setEventDate('');
            setPdfFile(null);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        const formData = new FormData();
        formData.append('subject', subject);
        formData.append('event_date', eventDate);
        if (pdfFile) {
            formData.append('pdf', pdfFile);
        }

        try {
            if (editMode) {
                await api.put(`/eci/update/${selectedId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/eci/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            setIsModalOpen(false);
            fetchMaterials();
        } catch (err) {
            console.error("Submission operational failure:", err);
            setErrorMessage(err.response?.data?.message || "An unexpected error disrupted document processing.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you certain you want to permanently delete this materials listing?")) {
            try {
                await api.delete(`/eci/delete/${id}`);
                fetchMaterials();
            } catch (err) {
                console.error("Purge operations crash:", err);
                alert("Failed to delete record.");
            }
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-500 font-bold text-sm tracking-wide">Synchronizing ECI Secure Node Environments...</p>
            </div>
        );
    }

    if (!canUpload) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl font-bold text-sm flex items-center gap-3">
                <span>Access Denied: Your account configuration lacks explicit override access to make entries here.</span>
            </div>
        );
    }

    return (
        <div className="border border-slate-200 rounded-2xl shadow-xs overflow-hidden text-slate-800">
            {/* Header Content Section */}
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ">
                <div>
                    <h2 className="text-xl font-black text-white tracking-tight">Executive Committee Records Management</h2>
                    <p className="text-xs font-semibold text-slate-500 mt-1">Upload and catalog official documentation and decisions archive blocks natively linked to your profile.</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer select-none"
                >
                    <Plus size={16} />
                    <span>Add New Material</span>
                </button>
            </div>

            {/* Main Table Interface Layout Container */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className=" border-b border-slate-200 text-xs font-black tracking-wider text-white uppercase">
                            <th className="p-4 pl-6 w-16">Seq</th>
                            <th className="p-4">Document / Matter Subject</th>
                            <th className="p-4 w-44">Meeting Date</th>
                            <th className="p-4 w-48">Logged At</th>
                            <th className="p-4 w-28 text-center">Document</th>
                            <th className="p-4 w-36 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm font-bold text-slate-700">
                        {materials.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="p-12 text-center text-slate-400 font-medium bg-white">
                                    <FileText size={32} className="mx-auto text-slate-300 mb-2" />
                                    No records tracked or archived on your profile index yet.
                                </td>
                            </tr>
                        ) : (
                            materials.map((item, index) => (
                                <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                                    <td className="p-4 pl-6 font-mono text-slate-400 text-xs">{index + 1}</td>
                                    <td className="p-4 text-slate-900 font-extrabold max-w-md break-words uppercase tracking-tight">{item.subject}</td>
                                    <td className="p-4 text-slate-600 font-semibold">
                                        {new Date(item.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="p-4 text-slate-400 font-medium text-xs">
                                        {new Date(item.created_at).toLocaleString()}
                                    </td>
                                    <td className="p-4 text-center">
                                        {/* Leveraging relative static upload serving via standard window origin routing */}
                                        <a 
                                            href={`/${item.pdf_path}`} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-xs font-black text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg border border-red-200 transition-all cursor-pointer"
                                        >
                                            <Eye size={14} />
                                            <span>View</span>
                                        </a>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center items-center gap-1.5">
                                            <button 
                                                onClick={() => handleOpenModal(item)}
                                                className="inline-flex items-center p-1.5 rounded-lg text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
                                                title="Edit Metadata"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(item.id)}
                                                className="inline-flex items-center p-1.5 rounded-lg text-white bg-red-500 hover:bg-red-600 transition-colors shadow-xs cursor-pointer"
                                                title="Delete Permanent Entry"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Creation & Modification Overlay Popup Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-xl flex flex-col overflow-hidden">
                        
                        {/* Modal Header */}
                        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="text-base font-black text-slate-900">
                                {editMode ? 'Modify Cataloged Record File' : 'Index Fresh Committee Materials'}
                            </h3>
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {errorMessage && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600">
                                    {errorMessage}
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs font-black text-slate-500 tracking-wider uppercase ml-0.5">
                                    Document / Topic Subject Headline
                                </label>
                                <textarea
                                    required
                                    rows="3"
                                    placeholder="e.g. PROGRESS ON EMC DECISIONS BY CHIEF ENVIRONMENT & SOCIAL OFFICER"
                                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-blue-600 text-slate-900 font-bold text-sm transition-all resize-none uppercase"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-black text-slate-500 tracking-wider uppercase ml-0.5">
                                    Meeting / Official Incident Date
                                </label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-blue-600 text-slate-900 font-bold text-sm transition-all cursor-pointer"
                                    value={eventDate}
                                    onChange={(e) => setEventDate(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-black text-slate-500 tracking-wider uppercase ml-0.5">
                                    PDF Document File Payload {editMode && <span className="text-slate-400 font-normal normal-case">(Leave blank to retain current file)</span>}
                                </label>
                                <div className="border-2 border-dashed border-slate-200 p-4 rounded-xl hover:border-slate-300 transition-all bg-slate-50/50">
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        required={!editMode}
                                        className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-700 file:cursor-pointer hover:file:bg-blue-100 transition-all"
                                        onChange={(e) => setPdfFile(e.target.files[0])}
                                    />
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors border border-slate-200 cursor-pointer text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-xs cursor-pointer text-sm"
                                >
                                    {editMode ? 'Apply Updates' : 'Commit Upload'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExecutiveCommitteeUploadPanel;