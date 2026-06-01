import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/api';

const HydrantPercentageStats = ({ activeFilters }) => {
    const [performanceData, setPerformanceData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Metric rows definition config 
    const metricRows = useMemo(() => [
        { label: 'AVERAGE ORDER TAT', key: 'avg_tat', isTat: true },
        { label: '% COMPLETED', key: 'completed_percentage', color: '#4caf50' },
        { label: '% PENDING', key: 'pending_percentage', color: '#f44336' },
        { label: '% DRIVER ASSIGNED', key: 'driver_assigned_percentage', color: '#ff9800' },
        { label: '% CANCELLED', key: 'cancelled_percentage', color: '#0000' }

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
        <div className="hydrant-performance-table-wrapper" style={{ background: 'rgba(20, 24, 33, 0.85)', borderRadius: '6px', padding: '16px', border: '1px solid #2e3748', width: '100%' }}>
            {/* Component Section Header */}
            <h3 style={{ margin: '0 0 14px 0', fontSize: '20px', fontWeight: '600', color: '#FFF200', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Hydrant Operational Percentage & Efficiency Performance Metrics
            </h3>

            {/* Scrollable Context Layer */}
            <div style={{ overflowX: 'auto', width: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px', color: '#e2e8f0', minWidth: '1400px' }}>
                    <thead>
                        {/* Primary Header Row: Hydrant Top Grouping */}
                        <tr style={{ background: 'rgba(46, 55, 72, 0.5)', borderTop: '1px solid #2e3748', borderBottom: '1px solid #2e3748' }}>
                            <th rowSpan={2} style={{ padding: '12px 10px', textAlign: 'left', borderRight: '2px solid #2e3748', width: '220px', color: '#fff', fontSize: '13px', fontWeight: 'bold' }}>
                                Operational Metrics
                            </th>
                            {loading && performanceData.length === 0 ? (
                                <th colSpan={16} style={{ color: '#718096', fontStyle: 'italic' }}>Loading performance structure...</th>
                            ) : performanceData.length === 0 ? (
                                <th colSpan={16} style={{ color: '#718096', fontStyle: 'italic' }}>No active hydrants matched filter parameters</th>
                            ) : (
                                performanceData.map((row, idx) => (
                                    <th 
                                        key={idx} 
                                        colSpan={2} 
                                        style={{ 
                                            padding: '8px 4px', 
                                            borderRight: '1px solid #4a5568', 
                                            color: '#ffffff', 
                                            fontWeight: '800', 
                                            fontSize: '12px', 
                                            letterSpacing: '0.3px', 
                                            textAlign: 'center',
                                            background: 'rgba(255, 255, 255, 0.02)'
                                        }}
                                    >
                                        {row.hydrant_name}
                                    </th>
                                ))
                            )}
                        </tr>
                        {/* Secondary Header Row: Source Breakdown Subcolumns */}
                        <tr style={{ borderBottom: '2px solid #2e3748', background: 'rgba(26, 32, 44, 0.4)' }}>
                            {performanceData.length > 0 && performanceData.map((_, idx) => (
                                <React.Fragment key={`sub-src-${idx}`}>
                                    <th style={{ padding: '6px 2px', fontSize: '11px', fontWeight: '700', color: '#00f2ff', width: '70px', background: 'rgba(0, 242, 255, 0.04)', textAlign:'center' }}>OTS</th>
                                    <th style={{ padding: '6px 2px', fontSize: '11px', fontWeight: '700', color: '#e2e8f0', width: '70px', borderRight: '1px solid #4a5568', textAlign:'center' }}>HMP</th>
                                </React.Fragment>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading && performanceData.length === 0 ? (
                            <tr>
                                <td style={{ padding: '30px', color: '#718096' }}>Initializing matrix grid data streams...</td>
                            </tr>
                        ) : performanceData.length === 0 ? (
                            <tr>
                                <td style={{ padding: '30px', color: '#718096' }}>No records evaluated for this transaction scope window.</td>
                            </tr>
                        ) : (
                            metricRows.map((metric, mIdx) => (
                                <tr 
                                    key={mIdx}
                                    style={{ 
                                        borderBottom: '1px solid #2e3748',
                                        background: mIdx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'
                                    }}
                                    className="hmp-table-row-hover"
                                >
                                    {/* Left Anchor Primary Metric Parameter Cell */}
                                    <td style={{ 
                                        padding: '12px 10px', 
                                        textAlign: 'left', 
                                        fontWeight: '700', 
                                        color: metric.isTat ? '#FFF200' : '#ffffff', 
                                        background: 'rgba(26, 32, 44, 0.3)', 
                                        borderRight: '2px solid #2e3748', 
                                        whiteSpace: 'nowrap' 
                                    }}>
                                        {metric.label}
                                    </td>

                                    {/* Row Cells for each Active Hydrant mapping standard OTS & HMP JSON variants */}
                                    {performanceData.map((row, rIdx) => {
                                        const otsValue = row.ots[metric.key];
                                        const hmpValue = row.hmp[metric.key];

                                        // Formatting zero parameters vs active streams
                                        const isOtsZero = otsValue === '0%' || otsValue === '00:00';
                                        const isHmpZero = hmpValue === '0%' || hmpValue === '00:00';

                                        return (
                                            <React.Fragment key={`cell-${mIdx}-${rIdx}`}>
                                                {/* OTS Value Output Cell */}
                                                <td style={{ 
                                                    padding: '10px 4px', 
                                                    fontSize: '13px', 
                                                    fontWeight: !isOtsZero ? '600' : 'normal',
                                                    color: !isOtsZero ? (metric.isTat ? '#FFF200' : metric.color) : '#4a5568',
                                                    background: 'rgba(0, 242, 255, 0.02)',
                                                    opacity: isOtsZero ? 0.3 : 1
                                                }}>
                                                    {otsValue}
                                                </td>
                                                {/* HMP Value Output Cell */}
                                                <td style={{ 
                                                    padding: '10px 4px', 
                                                    fontSize: '13px', 
                                                    fontWeight: !isHmpZero ? '600' : 'normal',
                                                    color: !isHmpZero ? (metric.isTat ? '#FFF200' : '#e2e8f0') : '#4a5568',
                                                    borderRight: '1px solid #4a5568',
                                                    opacity: isHmpZero ? 0.3 : 1
                                                }}>
                                                    {hmpValue}
                                                </td>
                                            </React.Fragment>
                                        );
                                    })}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HydrantPercentageStats;