import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react'; // Added icon

const HmpHeader = ({ children }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        sessionStorage.removeItem('token'); // Clear session
        navigate('/'); // Redirect to login
    };

    return (
        <header className="hmp-header-main">
            <div className="title-group">
                <h1>Hydrant <span><small style={{ fontWeight: 700, color: '#8493a5', fontSize: '1.3rem'}}>MANAGEMENT DASHBOARD (LIVE)</small></span></h1>
            </div>
            
            <div className="header-right-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div className="system-switcher-container">
                    {children}
                </div>
                
                {/* Logout Button */}
                <button 
                    onClick={handleLogout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#ef444422',
                        color: '#f87171',
                        border: '1px solid #f8717144',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#ef444444'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#ef444422'}
                >
                    <LogOut size={16} />
                    Logout
                </button>
            </div>
        </header>
    );
};

export default HmpHeader;