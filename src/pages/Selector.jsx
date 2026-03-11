import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Droplets, LogOut, Construction, ShieldAlert, BarChart3, Users } from 'lucide-react';

const Selector = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        sessionStorage.removeItem('token');
        navigate('/');
    };

    const dashboardOptions = [
        {
            id: 'complaint',
            title: 'Complaint Management',
            desc: 'View daily KPIs and performance metrics',
            icon: <LayoutDashboard size={40} color="#2563eb" />,
            active: true,
            path: '/dashboard'
        },
        {
            id: 'hydrant',
            title: 'Hydrant Management',
            desc: 'Monitor water distribution and tankers',
            icon: <Droplets size={40} color="#0891b2" />,
            active: true,
            path: '/dashboard'
        },
        {
            id: 'inventory',
            title: 'Manhole Inventory System',
            desc: 'Manhole and asset tracking utility',
            icon: <Construction size={40} color="#64748b" />,
            active: false
        },
        {
            id: 'security',
            title: 'New Dashboard',
            desc: '',
            icon: <ShieldAlert size={40} color="#64748b" />,
            active: false
        },
        {
            id: 'analytics',
            title: 'New Dashboard',
            desc: '',
            icon: <BarChart3 size={40} color="#64748b" />,
            active: false
        },
        {
            id: 'hr',
            title: 'New Dashboard',
            desc: '',
            icon: <Users size={40} color="#64748b" />,
            active: false
        }
    ];

    return (
        <div className="selector-container">
            <div className="selector-header">
                <img src="/kwsc-logo.png" alt="Logo" style={{ width: '80px', marginBottom: '10px' }} />
                <h2 className="login-title-thin">Karachi Water & Sewerage Corporation</h2>
                <h1 className="welcome-text"><span>Welcome to KW&SC Dashboard Portal</span></h1>
                <p className="welcome-subtext">Please select a centralized dashboard to monitor real-time operations.</p>
            </div>

            <div className="selector-grid">
                {dashboardOptions.map((opt) => (
                    <div 
                        key={opt.id}
                        className={`selector-card ${!opt.active ? 'disabled-card' : ''}`}
                        onClick={() => opt.active && navigate(opt.path, { state: { initialTab: opt.id } })}
                    >
                        {!opt.active && <span className="coming-soon-tag">Coming Soon</span>}
                        <div className="icon-wrapper">{opt.icon}</div>
                        <h3>{opt.title}</h3>
                        <p>{opt.desc}</p>
                    </div>
                ))}
            </div>

            <button onClick={handleLogout} className="selector-logout">
                <LogOut size={18} /> Logout
            </button>
        </div>
    );
};

export default Selector;