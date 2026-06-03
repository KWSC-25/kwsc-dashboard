import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/api';

const HydrantPercentageStats = ({ activeFilters }) => {
    const [performanceData, setPerformanceData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Metric rows definition config 
    const metricRows = useMemo(() => [
        { label: 'AVERAGE ORDER TAT', key: 'avg_tat', isTat: true },
        { label: '% COMPLETED', key: 'completed_percentage', color: '#4caf50' },
        { label: '% PENDING (Not Assigned)', key: 'pending_percentage', color: '#f44336' },
        { label: '% DRIVER ASSIGNED', key: 'driver_assigned_percentage', color: '#ff9800' },
        { label: '% CANCELLED', key: 'cancelled_percentage', color: 'white' },

        { label: '% OTS', key: 'created_ots_percentage', color: '#38bdf8' },
        { label: '% HMP', key: 'created_hmp_percentage', color: '#a78bfa' },
        { label: 'Hydrant Running Hours', key: 'running_hours', color: '#FFF200' }
    ], []);

    const fetchPerformanceGrid = useCallback(async (filters = activeFilters) => {
        try {
            let url = 'newkpis/hydrant-performance';
            if (filters.startDate && filters.endDate) {
                url += `?startDate=${filters.startDate}&endDate=${filters.endDate}`;
            }
            const resp = await api.get(url);
            setPerformanceData(resp.data.data || []);
        } catch (err) {
            console.error("Hydrant Performance Grid Fetch Error:", err);
        }
    }, [activeFilters]);

    useEffect(() => {
        let isMounted = true;
        
        const initFetch = async () => {
            setLoading(true);
            await fetchPerformanceGrid();
            if (isMounted) setLoading(false);
        };

        initFetch();

        const interval = setInterval(() => {
            fetchPerformanceGrid();
        }, 30000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [fetchPerformanceGrid]);

    return (
        <div className="hydrant-performance-table-wrapper" style={{ background: 'rgba(20, 24, 33, 0.95)', borderRadius: '6px', padding: '20px', border: '1px solid #2e3748', width: '100%' }}>
            {/* Component Section Header */}
            <h3 style={{ margin: '0 0 18px 0', fontSize: '32px', fontWeight: '700', color: '#FFF200', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Hydrant Wise Performance (Overall Average)
            </h3>

            {/* Scrollable Context Layer */}
            <div style={{ overflowX: 'auto', width: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', color: '#e2e8f0', minWidth: '1200px' }}>
                    <thead>
                        {/* Primary Header Row: Hydrant Top Grouping */}
                        <tr style={{ background: 'rgba(46, 55, 72, 0.6)', borderTop: '2px solid #4a5568', borderBottom: '1px solid #2e3748' }}>
                            <th 
                                rowSpan={2} 
                                style={{ 
                                    padding: '16px 12px', 
                                    textAlign: 'left', 
                                    borderRight: '3px solid #4a5568', 
                                    width: '280px', 
                                    color: '#fff', 
                                    fontSize: '24px', 
                                    fontWeight: 'bold' 
                                }}
                            >
                                Operational Metrics
                            </th>
                            {loading && performanceData.length === 0 ? (
                                <th colSpan={14} style={{ color: '#718096', fontStyle: 'italic', fontSize: '18px' }}>Loading performance structure...</th>
                            ) : performanceData.length === 0 ? (
                                <th colSpan={14} style={{ color: '#718096', fontStyle: 'italic', fontSize: '18px' }}>No active hydrants matched filter parameters</th>
                            ) : (
                                performanceData.map((row, idx) => {
                                    const displayedName = row.hydrant_name 
                                        ? row.hydrant_name.replace('CRUSH PLANT', 'CP') 
                                        : '';

                                    return (
                                        <th 
                                            key={idx} 
                                            colSpan={2}
                                            style={{ 
                                                padding: '14px 6px', 
                                                borderRight: '2px solid #4a5568', 
                                                color: '#ffffff', 
                                                fontWeight: '800', 
                                                fontSize: '22px', 
                                                letterSpacing: '1px', 
                                                textAlign: 'center',
                                                background: 'rgba(255, 255, 255, 0.03)'
                                            }}
                                        >
                                            {displayedName}
                                        </th>
                                    );
                                })
                            )}
                        </tr>
                        {/* Secondary Sub-Header Row: Self & Total splits */}
                        {performanceData.length > 0 && (
                            <tr style={{ background: 'rgba(34, 41, 56, 0.7)', borderBottom: '2px solid #4a5568' }}>
                                {performanceData.map((_, idx) => (
                                    <React.Fragment key={`sub-th-${idx}`}>
                                        <th style={{ padding: '8px 4px', fontSize: '16px', fontWeight: '700', color: 'white', borderRight: '1px solid #2e3748', textAlign:'center' }}>SELF</th>
                                        <th style={{ padding: '8px 4px', fontSize: '16px', fontWeight: '700', color: 'white', borderRight: '2px solid #4a5568' ,  textAlign:'center'}}>TOTAL</th>
                                    </React.Fragment>
                                ))}
                            </tr>
                        )}
                    </thead>
                    <tbody>
                        {loading && performanceData.length === 0 ? (
                            <tr>
                                <td style={{ padding: '40px', color: '#718096', fontSize: '18px' }}>Initializing matrix grid data streams...</td>
                            </tr>
                        ) : performanceData.length === 0 ? (
                            <tr>
                                <td style={{ padding: '40px', color: '#718096', fontSize: '18px' }}>No records evaluated for this transaction scope window.</td>
                            </tr>
                        ) : (
                            metricRows.map((metric, mIdx) => {
                                const isCompletedRow = metric.label === '% COMPLETED';
                                const isCancelledRow = metric.label === '% CANCELLED';
                                const isRunningHoursRow = metric.label === 'Hydrant Running Hours';

                                return (
                                    <tr 
                                        key={mIdx}
                                        style={{ 
                                            borderBottom: isCancelledRow ? '4px solid #67676e' : '1px solid #2e3748',
                                            borderTop: (isCompletedRow || isRunningHoursRow) ? '4px solid #67676e' : 'none',
                                            background: mIdx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'
                                        }}
                                        className="hmp-table-row-hover"
                                    >
                                        {/* Left Anchor Primary Metric Label Cell */}
                                        <td style={{ 
                                            padding: '16px 12px', 
                                            textAlign: 'left', 
                                            fontWeight: '700', 
                                            fontSize: '28px',
                                            color: metric.isTat ? '#FFF200' : '#ffffff', 
                                            background: 'rgba(26, 32, 44, 0.4)', 
                                            borderRight: '3px solid #4a5568', 
                                            whiteSpace: 'nowrap' 
                                        }}>
                                            {metric.label}
                                        </td>

                                        {/* Data Value Output Cells */}
                                        {performanceData.map((row, rIdx) => {
                                            // Handle the un-divided bottom running hours row condition
                                            if (isRunningHoursRow) {
                                                return (
                                                    <td 
                                                        key={`cell-running-${mIdx}-${rIdx}`}
                                                        colSpan={2}
                                                        style={{ 
                                                            padding: '14px 4px', 
                                                            fontSize: '30px', 
                                                            fontWeight: '700',
                                                            color: metric.color || '#e2e8f0',
                                                            borderRight: '2px solid #4a5568',
                                                            background: 'rgba(255, 242, 0, 0.04)'
                                                        }}
                                                    >
                                                        {row.total[metric.key]}
                                                    </td>
                                                );
                                            }

                                            // Default divided columns setup
                                            const selfValue = row.total[metric.key];
                                            const totalValue = row.total[`${metric.key}_total`];

                                            return (
                                                <React.Fragment key={`cell-group-${mIdx}-${rIdx}`}>
                                                    {/* Self Column Value */}
                                                    <td 
                                                        style={{ 
                                                            padding: '14px 4px', 
                                                            fontSize: '32px', 
                                                            fontWeight: '600',
                                                            color: metric.isTat ? '#FFF200' : (metric.color || '#e2e8f0'),
                                                            borderRight: '1px solid #2e3748'
                                                        }}
                                                    >
                                                        {selfValue}
                                                    </td>
                                                    {/* Total Column Value */}
                                                    <td 
                                                        style={{ 
                                                            padding: '14px 4px', 
                                                            fontSize: '32px', 
                                                            fontWeight: '600',
                                                            color: metric.isTat ? '#FFF200' : (metric.color || '#e2e8f0'),
                                                            borderRight: '2px solid #4a5568',
                                                            background: 'rgba(255, 255, 255, 0.01)'
                                                        }}
                                                    >
                                                        {totalValue}
                                                    </td>
                                                </React.Fragment>
                                            );
                                        })}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HydrantPercentageStats;