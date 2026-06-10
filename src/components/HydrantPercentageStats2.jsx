import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/api';

const HydrantPercentageStats2 = ({ activeFilters }) => {
    const [performanceData, setPerformanceData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Metric rows definition config 
    const metricRows = useMemo(() => [
        { label: 'AVERAGE ORDER TAT', key: 'avg_tat', isTat: true },
        { label: '% COMPLETED', key: 'completed_percentage', color: '#4caf50' },
        { label: '% PENDING (Not Assigned)', key: 'pending_percentage', color: '#f44336' },
        { label: '% DRIVER ASSIGNED', key: 'driver_assigned_percentage', color: '#ff9800' },
        { label: '% CANCELLED', key: 'cancelled_percentage', color: 'white' },
    ], []);

    // Extract the third highest total avg_tat value to find the top 3 threshold
    const topTatThreshold = useMemo(() => {
        if (!performanceData || performanceData.length === 0) return null;
        
        const tatValues = performanceData
            .map(row => {
                const val = parseFloat(row?.total?.avg_tat);
                return isNaN(val) ? -1 : val;
            })
            .filter(val => val >= 0)
            .sort((a, b) => b - a); // Sort descending

        // Get the 3rd value (or the last one if fewer than 3 elements exist)
        if (tatValues.length === 0) return null;
        const targetIndex = Math.min(2, tatValues.length - 1);
        return tatValues[targetIndex];
    }, [performanceData]);

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
            {/* Inject keyframe animations safely for executive dashboard alerting */}
            <style>
                {`
                    @keyframes redBlinkBackground {
                        0% { background-color: rgba(244, 67, 54, 0.15); }
                        50% { background-color: rgba(244, 67, 54, 0.65); }
                        100% { background-color: rgba(244, 67, 54, 0.15); }
                    }
                    .top-tat-blink-cell {
                        animation: redBlinkBackground 1s infinite ease-in-out !important;
                    }
                `}
            </style>

            {/* Component Section Header */}
            <h3 style={{ margin: '0 0 14px 0', fontSize: '30px', fontWeight: '600', color: '#FFF200', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Hydrant Wise Performance (OTS & HMP)
            </h3>

            {/* Scrollable Context Layer */}
            <div style={{ overflowX: 'auto', width: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px', color: '#e2e8f0', minWidth: '1600px' }}>
                    <thead>
                        {/* Primary Header Row: Hydrant Top Grouping */}
                        <tr style={{ background: 'rgba(46, 55, 72, 0.5)', borderTop: '1px solid #2e3748', borderBottom: '1px solid #2e3748' }}>
                            <th rowSpan={2} style={{ padding: '12px 10px', textAlign: 'left', borderRight: '2px solid #2e3748', width: '220px', color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>
                                Operational Metrics
                            </th>
                            {loading && performanceData.length === 0 ? (
                                <th colSpan={24} style={{ color: '#718096', fontStyle: 'italic' }}>Loading performance structure...</th>
                            ) : performanceData.length === 0 ? (
                                <th colSpan={24} style={{ color: '#718096', fontStyle: 'italic' }}>No active hydrants matched filter parameters</th>
                            ) : (
                                performanceData.map((row, idx) => {
                                    const displayedName = row.hydrant_name 
                                        ? row.hydrant_name.replace('CRUSH PLANT', 'CP') 
                                        : '';

                                    return (
                                    <th 
                                        key={idx} 
                                        colSpan={3} 
                                        style={{ 
                                            padding: '8px 4px', 
                                            borderRight: '2px solid #4a5568', 
                                            color: '#ffffff', 
                                            fontWeight: '800', 
                                            fontSize: '25px', 
                                            letterSpacing: '0.9px', 
                                            textAlign: 'center',
                                            background: 'rgba(255, 255, 255, 0.02)'
                                        }}
                                    >
                                        {displayedName}
                                        </th>
                                    );
                                })
                            )}
                        </tr>
                        {/* Secondary Header Row: Source Breakdown Subcolumns */}
                        <tr style={{ borderBottom: '2px solid #2e3748', background: 'rgba(26, 32, 44, 0.4)' }}>
                            {performanceData.length > 0 && performanceData.map((_, idx) => (
                                <React.Fragment key={`sub-src-${idx}`}>
                                    <th style={{ padding: '6px 2px', fontSize: '18px', fontWeight: '700', color: '#00f2ff', width: '65px', background: 'rgba(0, 242, 255, 0.04)', textAlign:'center' }}>OTS</th>
                                    <th style={{ padding: '6px 2px', fontSize: '18px', fontWeight: '700', color: '#e2e8f0', width: '65px', textAlign:'center' }}>HMP</th>
                                    <th style={{ padding: '6px 2px', fontSize: '18px', fontWeight: '700', color: '#a78bfa', width: '65px', borderRight: '2px solid #4a5568', background: 'rgba(255, 242, 0, 0.04)', textAlign:'center' }}>TOTAL</th>
                                </React.Fragment>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading && performanceData.length === 0 ? (
                            <tr>
                                <td colSpan={25} style={{ padding: '30px', color: '#718096' }}>Initializing matrix grid data streams...</td>
                            </tr>
                        ) : performanceData.length === 0 ? (
                            <tr>
                                <td colSpan={25} style={{ padding: '30px', color: '#718096' }}>No records evaluated for this transaction scope window.</td>
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
                                        padding: '8px 8px', 
                                        textAlign: 'left',
                                        fontSize:'20px', 
                                        fontWeight: '500', 
                                        color: metric.isTat ? '#FFF200' : '#ffffff', 
                                        background: 'rgba(26, 32, 44, 0.3)', 
                                        borderRight: '2px solid #2e3748', 
                                        whiteSpace: 'nowrap' 
                                    }}>
                                        {metric.label}
                                    </td>

                                    {/* Columns mapping OTS, HMP, and Total explicitly */}
                                    {performanceData.map((row, rIdx) => {
                                        const otsValue = row.ots[metric.key];
                                        const hmpValue = row.hmp[metric.key];
                                        const totalValue = row.total[metric.key];

                                        // Condition checking if current row is avg_tat and meets top 3 threshold criteria
                                        const parsedTotalValue = parseFloat(totalValue);
                                        const isTopTat = metric.isTat && 
                                            topTatThreshold !== null && 
                                            !isNaN(parsedTotalValue) && 
                                            parsedTotalValue >= topTatThreshold && 
                                            parsedTotalValue > 0;

                                        return (
                                            <React.Fragment key={`cell-${mIdx}-${rIdx}`}>
                                                {/* OTS Column */}
                                                <td style={{ 
                                                    padding: '10px 4px', 
                                                    fontSize: '19px', 
                                                    fontWeight: '600',
                                                    color: metric.isTat ? '#FFF200' : (metric.color || '#00f2ff'),
                                                    background: 'rgba(0, 242, 255, 0.02)'
                                                }}>
                                                    {otsValue}
                                                </td>
                                                {/* HMP Column */}
                                                <td style={{ 
                                                    padding: '10px 4px', 
                                                    fontSize: '19px', 
                                                    fontWeight: '600',
                                                    color: metric.isTat ? '#FFF200' : (metric.color || '#00f2ff')
                                                }}>
                                                    {hmpValue}
                                                </td>
                                                {/* Combined Total Column */}
                                                <td 
                                                    className={isTopTat ? "top-tat-blink-cell" : ""}
                                                    style={{ 
                                                        padding: '10px 4px', 
                                                        fontSize: '19px', 
                                                        fontWeight: '700',
                                                        color: metric.isTat ? '#FFF200' : (metric.color || '#ffffff'),
                                                        borderRight: '2px solid #4a5568',
                                                        background: isTopTat ? undefined : 'rgba(255, 242, 0, 0.02)'
                                                    }}
                                                >
                                                    {totalValue}
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

export default HydrantPercentageStats2;