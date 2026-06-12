import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Droplets, LogOut, BarChart3, Users, Scale } from 'lucide-react';
import { handleGlobalLogout } from '../utils/authService';

const Selector = () => {
    const navigate = useNavigate();

    // 1. Read allowed dashboards array from session store safely
    const allowedDashboardsString = sessionStorage.getItem('allowedDashboards');
    const allowedDashboards = allowedDashboardsString ? JSON.parse(allowedDashboardsString) : [];
    const userRole = sessionStorage.getItem('role'); // To allow Admins bypass filters automatically

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
            id: 'lcms',
            title: 'LCMS Dashboard',
            desc: 'Legal Case Management System',
            icon: <Scale size={40} color="#5fb11c" />,
            active: true,
            path: '/dashboard'
        },
        {
            id: 'hydrantkpi',
            title: 'Hydrant KPI Dashboard',
            desc: 'Monitor water distribution and tankers',
            icon: <Droplets size={40} color="#0891b2" />,
            active: true,
            path: '/dashboard'
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
            <div className="selector-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src="/kwsc-logo.png" alt="Logo" style={{ width: '80px', marginBottom: '10px' }} />
                <h2 className="login-title-thin">Karachi Water & Sewerage Corporation</h2>
                <h1 className="welcome-text"><span>Welcome to KW&SC Dashboard Portal</span></h1>
                <p className="welcome-subtext">Please select a centralized dashboard to monitor real-time operations.</p>
            </div>

            <div className="selector-grid">
                {dashboardOptions.map((opt) => {
                    // Check individual access rights map configurations
                    // Admin roles completely bypass any dynamic filtering constraints
                    const hasAccess = !opt.active || userRole === 'admin' || allowedDashboards.includes(opt.id);

                    return (
                        <div
                            key={opt.id}
                            className={`selector-card ${!opt.active ? 'disabled-card' : ''} ${!hasAccess ? 'opacity-60 cursor-not-allowed' : ''}`}
                            onClick={() => {
                                if (!opt.active) return;

                                // 2. Trigger warning or block path redirection gracefully if they don't have access
                                if (!hasAccess) {
                                    alert("Access Denied: You do not have permissions to access this metrics dashboard. Contact your IT administrator.");
                                    return;
                                }

                                sessionStorage.setItem('activeDashboard', opt.id);
                                navigate(opt.path, { state: { initialTab: opt.id } });
                            }}
                        >
                            {!opt.active && <span className="coming-soon-tag">Coming Soon</span>}
                            {opt.active && !hasAccess && (
                                <span className="coming-soon-tag" style={{ backgroundColor: '#ef4444' }}>Locked</span>
                            )}
                            <div className="icon-wrapper">{opt.icon}</div>
                            <h3>{opt.title}</h3>
                            <p>{opt.desc}</p>
                        </div>
                    );
                })}
            </div>

            <button
                onClick={() => handleGlobalLogout(navigate)}
                className="selector-logout"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
                <LogOut size={18} /> Logout
            </button>
        </div>
    );
};

export default Selector;