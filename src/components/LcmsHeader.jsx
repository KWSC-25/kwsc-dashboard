import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Gavel } from 'lucide-react';

const LcmsHeader = ({ children }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        sessionStorage.removeItem('token');
        navigate('/');
    };

    return (
        <header className="hmp-header-main" >
            <div className="title-group">
                <h1 style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    LCMS <span><small style={{ fontWeight: 700, color: '#8493a5', fontSize: '1.3rem'}}>LEGAL CASE MANAGEMENT SYSTEM</small></span>
                </h1>
            </div>
            
            <div className="header-right-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div className="system-switcher-container">
                    {children}
                </div>
                <button 
                    onClick={handleLogout}
                    className="logout-btn-styled" // Use your existing styles or the inline one from HmpHeader
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px', background: '#ef444422',
                        color: '#f87171', border: '1px solid #f8717144', padding: '6px 12px',
                        borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem'
                    }}
                >
                    <LogOut size={16} />
                    Logout
                </button>
            </div>
        </header>
    );
};

export default LcmsHeader;