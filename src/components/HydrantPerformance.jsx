import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const HydrantPerformance = () => {
    const [data, setData] = useState([]);
    const [filter, setFilter] = useState('today');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const resp = await api.get('/hmp-performance');
                setData(resp.data);
            } catch (err) {
                console.error("Hydrant Performance Fetch Error:", err);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);
    const suffix = filter === 'today' ? '_today' : '_month'; 

    // Helper to get the correct display value for Dispatched
    const getDispatchValue = (row) => {
        const baseDispatch = Number(row[`dispatched${suffix}`] || 0);
        if (filter === 'month') {
            const completed = Number(row[`completed${suffix}`] || 0);
            return baseDispatch + completed;
        }
        return baseDispatch;
    };

    // Calculate Column Totals
    const colTotals = data.reduce((acc, row) => ({
        created: acc.created + Number(row[`created${suffix}`] || 0),
        dispatched: acc.dispatched + getDispatchValue(row),
        completed: acc.completed + Number(row[`completed${suffix}`] || 0),
        cancelled: acc.cancelled + Number(row[`cancelled${suffix}`] || 0),
        pending: acc.pending + Number(row[`pending${suffix}`] || 0),
    }), { created: 0, dispatched: 0, completed: 0, cancelled: 0, pending: 0 });

    // Logic for Top 3 Pending - ONLY if filter is 'today'
    let top3PendingNames = [];
    if (filter === 'today') {
        top3PendingNames = [...data]
            .sort((a, b) => Number(b[`pending${suffix}`] || 0) - Number(a[`pending${suffix}`] || 0))
            .slice(0, 3)
            .filter(row => Number(row[`pending${suffix}`]) > 0)
            .map(row => row.hydrant_name);
    }

    return (
        <div className="perf-section-container">
            <div className="perf-table-wrapper mini-table">
                <div className="section-header-row">
                    <div className="section-header-title">
                        <i className="fas fa-chart-line"></i> HYDRANT PERFORMANCE (OTS ORDERS)
                    </div>
                    
                    <div className="filter-container">
                        <select 
                            className="hmp-filter-select" 
                            value={filter} 
                            onChange={(e) => setFilter(e.target.value)}
                        >
                            <option value="today">TODAY</option>
                            <option value="month">MONTH</option>
                        </select>
                    </div>
                </div>

                <div className="table-scroll-container">
                    <table className="perf-table">
                        <thead>
                            <tr>
                                <th className="text-left">Hydrant</th>
                                <th>Created</th>
                                <th>Dispatched</th>
                                <th>Completed</th>
                                <th>Cancelled</th>
                                <th className="no-border">Pending</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, i) => {
                                // Check if this hydrant name is in the top 3 (only populated when filter is 'today')
                                const isCritical = filter === 'today' && top3PendingNames.includes(row.hydrant_name);
                                
                                return (
                                    <tr key={i} className={isCritical ? "row-alert-blink" : ""}>
                                        <td className="hydrant-name-cell">{row.hydrant_name}</td>
                                        <td className="cell-created">{row[`created${suffix}`]}</td>
                                        <td className="cell-dispatched">{getDispatchValue(row)}</td>
                                        <td className="cell-completed">{row[`completed${suffix}`]}</td>
                                        <td className="cell-cancelled">{row[`cancelled${suffix}`]}</td>
                                        <td className="cell-pending">{row[`pending${suffix}`]}</td>
                                    </tr>
                                );
                            })}
                            <tr className="row-grand-total">
                                <td className="text-left">GRAND TOTAL</td>
                                <td>{colTotals.created}</td>
                                <td>{colTotals.dispatched}</td>
                                <td>{colTotals.completed}</td>
                                <td>{colTotals.cancelled}</td>
                                <td className="grand-total-accent">{colTotals.pending}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default HydrantPerformance;