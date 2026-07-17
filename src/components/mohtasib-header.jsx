import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ArrowLeft } from 'lucide-react'; // Added icon
import { handleGlobalLogout } from '../utils/authService';

const MohtasibHeader = ({ children }) => {
    const navigate = useNavigate();

 

    return (
        <header className="hmp-header-main">
            <div className="title-group">
                <h1><span><small style={{ fontWeight: 700, color: '#8493a5', fontSize: '2rem', marginLeft: '30px'}}>MOHTASIB OMBUDSMAN DASHBOARD</small></span></h1>

            </div>
            
            <div className="header-right-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px' , marginRight:'10px'}}>
                {/* Back Button */}
                <button 
                    onClick={() => navigate('/select')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'transparent',
                        color: 'white',
                        border: '1px solid grey',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '1.5rem',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#d3d3d380'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    <ArrowLeft size={16} />
                    Back
                </button>

                {/* Logout Button */}
                <button 
                    onClick={() => handleGlobalLogout(navigate)}
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
                        fontSize: '1.5rem',
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

export default MohtasibHeader;