import React, { useState } from 'react';

const HydrantPerformance = ({ data = [] }) => {
    const [filter, setFilter] = useState('today'); 
    const suffix = filter === 'today' ? '_today' : '_month';

    // Helper to get the correct display value for Dispatched
    const getDispatchValue = (row) => {
        const baseDispatch = Number(row[`dispatched${suffix}`] || 0);
        // If filter is Month, add Completed to the Dispatch count
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
                            {data.map((row, i) => (
                                <tr key={i}>
                                    <td className="hydrant-name-cell">{row.hydrant_name}</td>
                                    <td className="cell-created">{row[`created${suffix}`]}</td>
                                    {/* Using the helper to show Sum of Dispatch+Complete if Month is selected */}
                                    <td className="cell-dispatched">{getDispatchValue(row)}</td>
                                    <td className="cell-completed">{row[`completed${suffix}`]}</td>
                                    <td className="cell-cancelled">{row[`cancelled${suffix}`]}</td>
                                    <td className="cell-pending">{row[`pending${suffix}`]}</td>
                                </tr>
                            ))}
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