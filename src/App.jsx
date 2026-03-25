import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Selector from './pages/Selector';
import ManageUsers from './components/ManageUsers';
import AdminPanel from './pages/AdminPanel';

const getRole = () => {
    const token = sessionStorage.getItem('token');
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(window.atob(base64)).role;
    } catch  {
        return null;
    }
};

const PrivateRoute = ({ children, adminOnly = false }) => {
    const token = sessionStorage.getItem('token');
    const role = getRole();

    if (!token) return <Navigate to="/" />;
    
    // 2. Extra check: If route is adminOnly but user is NOT admin, send back to selector
    if (adminOnly && role !== 'admin') {
        return <Navigate to="/select" />;
    }

    return children;
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                
                {/* 1. Protect the Admin Panel itself! */}
                <Route path="/admin" element={
                    <PrivateRoute adminOnly={true}>
                        <AdminPanel />
                    </PrivateRoute>
                }/>

                <Route path="/select" element={
                    <PrivateRoute>
                        <Selector />
                    </PrivateRoute>
                } />

                <Route path="/manage-users" element={
                    <PrivateRoute adminOnly={true}>
                        <ManageUsers />
                    </PrivateRoute>
                } />

                <Route path="/dashboard" element={
                    <PrivateRoute>
                        <Dashboard />
                    </PrivateRoute>
                } />

                {/* 2. Catch-all MUST be at the very bottom */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
}

export default App;