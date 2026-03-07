import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import IntelCards from './IntelCards';

const Header = ({ selector }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        sessionStorage.removeItem('token');
        navigate('/');
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '-15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div>
                    <h1 style={{ margin: 0, letterSpacing: '-1px', color: '#fff' }}>
                        KW&SC <span style={{ color: 'var(--water-blue)' }}>CEO DASHBOARD</span>
                    </h1>
                    <p style={{ margin: 0, color: 'var(--text-dim)', fontWeight: 500 }}>Real-Time Complaint Monitoring System</p>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
                        {selector}
                        
                        {/* Compact Logout for CEO Header */}
                        <button 
                            onClick={handleLogout}
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-dim)',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.color = '#f87171'}
                            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
                        >
                            <LogOut size={12} />
                            LOGOUT
                        </button>
                    </div>
                </div>
            </div> 
            
            <IntelCards />
        </div>
    );
};

export default Header;