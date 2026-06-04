import api from './api'; // Import your configured axios instance

export const handleGlobalLogout = async (navigate) => {
    try {
        // Sends the Authorization header via the axios middleware interceptor implicitly 
        await api.post('/auth/logout');
    } catch (err) {
        console.error("Backend clean logout signal skipped or session expired:", err);
    } finally {
        // Always flush client-side state, even if the database node is unreachable
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('role');
        navigate('/');
    }
};