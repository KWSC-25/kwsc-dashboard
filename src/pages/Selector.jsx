import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Droplets, LogOut } from 'lucide-react';

const Selector = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        sessionStorage.removeItem('token');
        navigate('/');
    };

    return (
        <div className="selector-container" style={{
            height: '100vh', 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            background: '#f4f7fe'
        }}>
            <img src="/kwsc-logo.png" alt="Logo" style={{ width: '100px', marginBottom: '10px' }} />
            <h2 className="login-title-thin">Karachi Water & Sewerage Corporation</h2>
            <h2 style={{ color: '#1a335d', marginBottom: '40px', fontWeight: 'bold' }}>
                Select Dashboard
            </h2>

            <div style={{ display: 'flex', gap: '30px' }}>
                {/* Complaint Card */}
                <div 
                    onClick={() => navigate('/dashboard', { state: { initialTab: 'complaint' } })}
                    className="selector-card"
                >
                    <LayoutDashboard size={48} color="#2563eb" />
                    <h3>Complaint Management</h3>
                    <p>View daily KPIs and performance metrics</p>
                </div>

                {/* Hydrant Card */}
                <div 
                    onClick={() => navigate('/dashboard', { state: { initialTab: 'hydrant' } })}
                    className="selector-card"
                >
                    <Droplets size={48} color="#0891b2" />
                    <h3>Hydrant Management</h3>
                    <p>Monitor water distribution and tankers</p>
                </div>
            </div>

            <button onClick={handleLogout} className="selector-logout">
                <LogOut size={18} /> Logout
            </button>
        </div>
    );
};

export default Selector;