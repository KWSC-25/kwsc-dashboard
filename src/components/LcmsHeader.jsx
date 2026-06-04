import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Gavel, ArrowLeft } from 'lucide-react';
import { handleGlobalLogout } from '../utils/authService';

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
            
            <div className="header-right-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginRight: '10px' }}>
                <button 
                    onClick={() => navigate('/select')}
                    className="logout-btn-styled" // Use your existing styles or the inline one from HmpHeader
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent',
                        color: 'white', border: '1px solid grey', padding: '6px 12px',
                        borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem'
                    }}
                >
                    <ArrowLeft size={16} />
                    Back
                </button>
                
                <button 
                    onClick={() => handleGlobalLogout(navigate)}
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