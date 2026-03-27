import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const RedZoneViolations = () => {
    const [data, setData] = useState({ summary: {}, list: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const resp = await api.get('/redzone/redzone-violations');
                setData(resp.data);
            } catch (err) {
                console.error("Violation Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 30000); 
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="loading-graph">ANALYZING RED ZONES...</div>;

    return (
        <div className=" header-red">
            <div className="section-header">
                <div className="section-header-red">
                    <i className="fas fa-shield-virus"></i> RED ZONE VIOLATIONS
                </div>
            </div>

            <div className="violation-summary-line">
                <div className="v-inline-stat">
                    <span className="v-label">TODAY:</span>
                    <span className="v-value text-red">{data.summary.today_count || 0}</span>
                </div>
                <div className="v-divider">|</div>
                <div className="v-inline-stat">
                    <span className="v-label">LAST 30 DAYS:</span>
                    <span className="v-value" style={{color: '#ff9f43'}}>{data.summary.monthly_count || 0}</span>
                </div>
            </div>

            <div className="table-responsive-wrapper" style={{ marginTop: '10px', maxHeight: '200px' }}>
                <table className="modern-table violation-table">
                    <thead>
                        <tr>
                            <th>DATE</th>
                            <th>TRUCK NUM</th>
                            <th>OWNER NAME</th>
                            <th>HYDRANT</th>
                            <th>ZONE</th>
                            <th>DURATION MINS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.list.map((v, i) => (
                            <tr key={i}>
                                <td className="font-bold">{new Date(v.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                                <td>
                                    <div className="truck-cell">
                                        <span className="t-num">{v.truck_num}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="truck-cell">
                                        <span className="t-owner">{v.owner_name}</span>
                                    </div>
                                </td>
                                <td>{v.hydrant_name}</td>
                                <td className="text-red">{v.red_zone_name}</td>
                                <td className="text-center font-bold">{v.duration_minutes}</td>
                                
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RedZoneViolations;