import React, { useState } from 'react';
import { Upload, AlertCircle, ArrowLeft } from 'lucide-react';
import api from '../utils/api';
import ExecutiveCommitteeUploadPanel from './ExecutiveCommitteeUploadPanel';

const ExecutiveCommitteeDashboard = () => {
    const [isUploading, setIsUploading] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleUploadNavigation = async () => {
        setLoading(true);
        try {
            const response = await api.get('/eci/check-upload-permission');
            
            // Explicitly allow navigation if permission matches true
            if (response.data && response.data.canUpload === true) {
                setIsUploading(true);
            } else {
                // Stay on current page and cleanly warn the user using toast banner
                showToast("Not Permitted: You do not have permission to upload materials.");
            }
        } catch (err) {
            console.error("Authorization check pipeline failure:", err);
            
            // Safely parse server-side error messages if available
            const serverErrorMessage = err.response?.data?.message || "Failed to verify upload permissions.";
            
            if (err.response?.status !== 401) {
                showToast(serverErrorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 5000);
    };

    if (isUploading) {
        return (
            <div style={{ padding: '24px' }}>
                <button
                    onClick={() => setIsUploading(false)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: 'transparent', color: '#94a3b8', border: 'none',
                        cursor: 'pointer', marginBottom: '16px', fontSize: '0.95rem'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = '#f8fafc'}
                    onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
                >
                    <ArrowLeft size={16} />
                    Back to Analytics Dashboard
                </button>
                <ExecutiveCommitteeUploadPanel />
            </div>
        );
    }

    return (
        <div style={{ padding: '24px', position: 'relative' }}>
            {/* Custom Warning Notification Banner Toast */}
            {toastMessage && (
                <div style={{
                    position: 'fixed', top: '24px', right: '24px',
                    backgroundColor: '#ef4444', color: 'white',
                    padding: '16px 24px', borderRadius: '8px', zIndex: 9999,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                    display: 'flex', alignItems: 'center', gap: '12px'
                }}>
                    <AlertCircle size={20} />
                    <span style={{ fontWeight: '600' }}>{toastMessage}</span>
                </div>
            )}

            {/* Subheader Layout Group */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', 
                alignItems: 'center', marginBottom: '24px',
                borderBottom: '1px solid #334155', paddingBottom: '16px'
            }}>
                <div>
                    <h2 style={{ color: '#f8fafc', fontSize: '1.5rem', margin: 0 }}>Executive Committee Analytics</h2>
                    <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>Review administrative operations and system files.</p>
                </div>
                <button
                    onClick={handleUploadNavigation}
                    disabled={loading}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        backgroundColor: loading ? '#1e293b' : '#2563eb', 
                        color: loading ? '#64748b' : 'white',
                        padding: '10px 18px', borderRadius: '6px', border: 'none',
                        fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', 
                        transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                    onMouseOut={(e) => !loading && (e.currentTarget.style.backgroundColor = '#2563eb')}
                >
                    <Upload size={18} />
                    {loading ? 'Verifying Context...' : 'Go to Upload Panel'}
                </button>
            </div>

            {/* Main Content Container Base */}
            <div style={{ 
                border: '2px dashed #334155', borderRadius: '8px', 
                padding: '48px', textAlign: 'center', color: '#64748b' 
            }}>
                Operational analytics metric cards will populate here.
            </div>
        </div>
    );
};

export default ExecutiveCommitteeDashboard;