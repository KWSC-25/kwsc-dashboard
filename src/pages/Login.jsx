import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, AlertCircle, Clock } from 'lucide-react';

const Login = () => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [attemptsLeft, setAttemptsLeft] = useState(3);
    const [countdown, setCountdown] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        } else if (countdown === 0 && attemptsLeft <= 0) {
            setAttemptsLeft(3);
            setError('');
        }
        return () => clearInterval(timer);
    }, [countdown, attemptsLeft]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (countdown > 0) return;

        setLoading(true);
        setError('');

        try {
            const res = await api.post('/login', credentials);
            
            if (res.data.success) {
                sessionStorage.setItem('token', res.data.token);
                setAttemptsLeft(3);
                navigate('/select');
            }
        } catch (err) {
            const isRateLimited = err.response?.status === 429;
            
            setAttemptsLeft((prev) => {
                const nextValue = prev - 1;
                
                if (isRateLimited || nextValue <= 0) {
                    setCountdown(60);
                    setError('Security Lock: Too many failed attempts.');
                    return 0;
                } else {
                    // Added dynamic attempt counting to the error message
                    setError(`${err.response?.data?.message || 'Invalid credentials'}. Attempts remaining: ${nextValue}`);
                    return nextValue;
                }
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-card">
                <div className="login-header">
                    <img src="/kwsc-logo.png" alt="KW&SC Logo" className="login-logo" />
                    <h2 className="login-title-thin">Karachi Water & Sewerage Corporation</h2>
                    <h2 className="login-title-bold">Dashboard Access Control</h2>
                    <div className="login-divider"></div>
                </div>

                <div className="login-body">
                    {/* RED TIMER BANNER - Only shows when locked */}
                    {countdown > 0 && (
                        <div style={{
                            background: '#fee2e2',
                            border: '1px solid #ef4444',
                            color: '#b91c1c',
                            padding: '10px',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            fontWeight: 'bold',
                            animation: 'pulse 2s infinite'
                        }}>
                            <Clock size={18} />
                            SYSTEM LOCKED: TRY AGAIN IN {countdown}s
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="input-group">
                            <label className="input-label">Email</label>
                            <div className="input-wrapper">
                                <input 
                                    type="email"
                                    className="login-input"
                                    placeholder="Enter authorized email"
                                    disabled={countdown > 0}
                                    onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                                    required
                                />
                                <div className="input-icon-box">
                                    <User size={20} className="text-white" />
                                </div>
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Password</label>
                            <div className="input-wrapper">
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    className="login-input"
                                    placeholder="••••••••"
                                    disabled={countdown > 0}
                                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                                    required
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="password-toggle"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                                <div className="input-icon-box">
                                    <Lock size={20} className="text-white" />
                                </div>
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={loading || countdown > 0}
                            className="login-submit-btn"
                            style={{
                                opacity: countdown > 0 ? 0.6 : 1,
                                cursor: countdown > 0 ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? 'Checking...' : countdown > 0 ? 'Wait for Unlock' : 'Sign In'}
                        </button>
                    </form>

                    {error && (
                        <div className={`login-error ${countdown > 0 ? 'error-lock' : 'error-warning'}`}>
                            <AlertCircle size={14} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="login-footer">
                        <p>KWSC © Copyright 2026. All Rights Reserved.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;