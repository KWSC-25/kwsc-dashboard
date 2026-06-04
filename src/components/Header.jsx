import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ArrowLeft } from 'lucide-react';
import IntelCards from './IntelCards';
import { handleGlobalLogout } from '../utils/authService';
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
                    <h1 style={{ margin: 0, letterSpacing: '-1px', color: '#fff', fontSize:"1.8rem" , fontWeight:"bold", marginLeft: '10px'}}>
                        KW&SC <span style={{ color: 'var(--water-blue)' }}>CEO DASHBOARD</span>
                    </h1>
                    <p style={{ margin: 0, color: 'var(--text-dim)', fontWeight: 500, marginLeft: '10px' }}>Real-Time Complaint Monitoring System</p>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px', marginLeft: '10px' }}>
                        
                        {/* Compact Back for CEO Header */}
                        <button 
                            onClick={() => navigate('/select')}
                            style={{
                                background: 'transparent',
                                border: '1px solid grey',
                                color: 'white',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#d3d3d380'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <ArrowLeft size={12} />
                            BACK
                        </button>

                        {/* Compact Logout for CEO Header */}
                        <button 
                            onClick={() => handleGlobalLogout(navigate)}
                            style={{
                                background: '#ef444422',
                                border: '1px solid #f8717144',
                                color: '#f87171',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#ef444444'}
                            onMouseOut={(e) => e.currentTarget.style.background = '#ef444422'}
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