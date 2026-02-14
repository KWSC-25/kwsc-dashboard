import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const HmpView = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/asani-stats`);
            setStats(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Fetch Error:", err);
        }
    }, []);

    useEffect(() => {
        fetchStats();
        // Live polling every 5 seconds
        const interval = setInterval(fetchStats, 5000); 
        return () => clearInterval(interval);
    }, [fetchStats]);

    if (loading && !stats) {
        return <div style={{ color: '#00d1b2', padding: '20px', textAlign: 'center' }}>Syncing with Asani Global Database...</div>;
    }

    return (
        <div style={{ padding: '20px', color: '#fff', background: '#0b0e14', minHeight: '100vh' }}>
            <h2 style={{ color: '#00d1b2', marginBottom: '5px' }}>Hydrant Management Live Stats (Overall)</h2>
            <p style={{ color: '#555', fontSize: '12px', margin: '0 0 20px 0' }}>Data synchronized from 2026-01-01</p>
            <hr style={{ borderColor: '#2c3e50', marginBottom: '25px' }} />
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
                <div style={cardStyle}>
                    <p style={labelStyle}>Total Orders</p>
                    <p style={{ ...numStyle, color: '#3498db' }}>{stats?.TOTAL || 0}</p>
                </div>
                <div style={cardStyle}>
                    <p style={labelStyle}>Pending</p>
                    <p style={{ ...numStyle, color: '#e74c3c' }}>{stats?.PENDING || 0}</p>
                </div>
                <div style={cardStyle}>
                    <p style={labelStyle}>Dispatched</p>
                    <p style={{ ...numStyle, color: '#9b59b6' }}>{stats?.DISPATCHED || 0}</p>
                </div>
                <div style={cardStyle}>
                    <p style={labelStyle}>Completed</p>
                    <p style={{ ...numStyle, color: '#2ecc71' }}>{stats?.COMPLETED || 0}</p>
                </div>
                <div style={cardStyle}>
                    <p style={labelStyle}>Cancelled</p>
                    <p style={{ ...numStyle, color: '#95a5a6' }}>{stats?.CANCELLED || 0}</p>
                </div>
            </div>
        </div>
    );
};

const cardStyle = { padding: '25px 15px', background: '#1c1f26', border: '1px solid #2c3e50', borderRadius: '12px', textAlign: 'center' };
const labelStyle = { fontSize: '11px', color: '#bdc3c7', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1px' };
const numStyle = { fontSize: '38px', fontWeight: 'bold', margin: 0 };

export default HmpView;