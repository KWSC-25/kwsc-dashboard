import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const HydrantPerformance = () => {
    // Helper to get today's date string in YYYY-MM-DD format
    const getTodayStr = () => new Date().toISOString().split('T')[0];

    const [data, setData] = useState([]);
    
    // Internal date filter states initialized to today's date by default
    const [startDate, setStartDate] = useState(getTodayStr());
    const [endDate, setEndDate] = useState(getTodayStr());

    // Local temporary input states to hold modifications before submission
    const [localStartDate, setLocalStartDate] = useState(getTodayStr());
    const [localEndDate, setLocalEndDate] = useState(getTodayStr());

    // Keep inputs aligned if the filter gets reset externally
    useEffect(() => {
        setLocalStartDate(startDate);
        setLocalEndDate(endDate);
    }, [startDate, endDate]);

    // Trigger fetch on initial load, interval, or when local inputs change
    useEffect(() => {
        const fetchData = async () => {
            try {
                const resp = await api.get('hyd-perf/hmp-performance', {
                    params: { startDate, endDate }
                });
                setData(resp.data);
            } catch (err) {
                console.error("Hydrant Performance Fetch Error:", err);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [startDate, endDate]); // Safely tracks changes and refetches cleanly

    // Handle single-input fallbacks and trigger state submit
    const handleApplyFilters = (e) => {
        e.preventDefault();
        let finalStart = localStartDate;
        let finalEnd = localEndDate;

        // If from date is selected but to date is empty, default it to today
        if (finalStart && !finalEnd) {
            finalEnd = getTodayStr();
            setLocalEndDate(finalEnd);
        }

        setStartDate(finalStart);
        setEndDate(finalEnd);
    };

    // Handle clearing/resetting filters back to today's defaults
    const handleResetFilters = () => {
        const today = getTodayStr();
        setLocalStartDate(today);
        setLocalEndDate(today);
        setStartDate(today);
        setEndDate(today);
    };

    // Calculate Column Totals dynamically based on active filtered rows
    const colTotals = data.reduce((acc, row) => ({
        created: acc.created + Number(row.created || 0),
        dispatched: acc.dispatched + Number(row.dispatched || 0),
        completed: acc.completed + Number(row.completed || 0),
        cancelled: acc.cancelled + Number(row.cancelled || 0),
        pending: acc.pending + Number(row.pending || 0),
    }), { created: 0, dispatched: 0, completed: 0, cancelled: 0, pending: 0 });

    // Critical blink alert triggers only when showing today's values
    const isDefaultFilter = startDate === getTodayStr() && endDate === getTodayStr();
    let top3PendingNames = [];
    if (isDefaultFilter) {
        top3PendingNames = [...data]
            .sort((a, b) => Number(b.pending || 0) - Number(a.pending || 0))
            .slice(0, 3)
            .filter(row => Number(row.pending) > 0)
            .map(row => row.hydrant_name);
    }

    return (
        <div className="perf-section-container">
            <div className="perf-table-wrapper mini-table">
                {/* Header row configured to hold title and inputs perfectly on the same line */}
                <div className="section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px' }}>
                    <div className="section-header-title">
                        <i className="fas fa-chart-line"></i> HYDRANT WISE (OTS ORDERS)
                    </div>
                    
                    {/* Inline Filter Controls on the same single line */}
                    <form onSubmit={handleApplyFilters} className="filter-container" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        
                        <span style={{ color: '#9ca3af', fontSize: '12px' }}>From</span>
                        <input 
                            type="date" 
                            className="hmp-filter-date-input"
                            value={localStartDate} 
                            onChange={(e) => setLocalStartDate(e.target.value)} 
                            style={{ background: '#111827', color: '#fff', border: '1px solid #374151', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', outline: 'none' }}
                        />
                        
                        <span style={{ color: '#9ca3af', fontSize: '12px' }}>To</span>
                        <input 
                            type="date" 
                            className="hmp-filter-date-input"
                            value={localEndDate} 
                            onChange={(e) => setLocalEndDate(e.target.value)} 
                            style={{ background: '#111827', color: '#fff', border: '1px solid #374151', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', outline: 'none' }}
                        />

                        <button 
                            type="submit"
                            style={{ background: '#00cfde', color: '#0b0f19', border: 'none', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                        >
                            APPLY
                        </button>

                        <button 
                            type="button"
                            onClick={handleResetFilters}
                            style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                        >
                            RESET
                        </button>
                    </form>
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
                                const isCritical = isDefaultFilter && top3PendingNames.includes(row.hydrant_name);
                                
                                return (
                                    <tr key={i} className={isCritical ? "row-alert-blink" : ""}>
                                        <td className="hydrant-name-cell">{row.hydrant_name}</td>
                                        <td className="cell-created">{row.created}</td>
                                        <td className="cell-dispatched">{row.dispatched}</td>
                                        <td className="cell-completed">{row.completed}</td>
                                        <td className="cell-cancelled">{row.cancelled}</td>
                                        <td className="cell-pending">{row.pending}</td>
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