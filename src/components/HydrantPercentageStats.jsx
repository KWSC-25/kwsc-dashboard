import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/api';

const HydrantPercentageStats = ({ activeFilters, dashboardMode }) => {
    const [performanceData, setPerformanceData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Metric rows definition config - filtered based on dashboardMode
    const metricRows = useMemo(() => {
        const baseRows = [
            { label: 'AVERAGE ORDER TAT', key: 'avg_tat', isTat: true },
            { label: '% COMPLETED', key: 'completed_percentage', color: '#4caf50' },
            { label: '% PENDING (Not Assigned)', key: 'pending_percentage', color: '#f44336' },
            { label: '% DRIVER ASSIGNED', key: 'driver_assigned_percentage', color: '#ff9800' },
            { label: '% CANCELLED', key: 'cancelled_percentage', color: 'white' },

            { label: '% OTS', key: 'created_ots_percentage', color: '#38bdf8' },
            { label: '% HMP', key: 'created_hmp_percentage', color: '#a78bfa' },
        ];

        const agingRows = [
            // New Open Pending Orders Aging Rows
            { label: 'PENDING < 24H', key: 'pending_under_24h_percentage', color: '#4caf50', isAgingRow: true },
            { label: '24H < PENDING < 48H', key: 'pending_24h_48h_percentage', color: '#ff9800', isAgingRow: true },
            { label: '48H < PENDING < 72H', key: 'pending_48h_72h_percentage', color: '#facc15', isAgingRow: true },
            { label: 'PENDING > 72H', key: 'pending_above_72h_percentage', color: '#f44336', isAgingRow: true },
        ];

        // Hide aging rows when dashboard mode is TODAY
        if (dashboardMode === 'TODAY') {
            return baseRows;
        }

        return [...baseRows, ...agingRows];
    }, [dashboardMode]);

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

    // Helper function to parse human-readable TAT duration strings into total minutes
    const parseTatToMinutes = (tatStr) => {
        if (!tatStr || typeof tatStr !== 'string') return 0;
        
        let totalMinutes = 0;
        
        // Regular expression matchers for days, hours, and minutes
        const daysMatch = tatStr.match(/(\d+)\s*d/);
        const hoursMatch = tatStr.match(/(\d+)\s*h/);
        const minutesMatch = tatStr.match(/(\d+)\s*m/);
        
        if (daysMatch) totalMinutes += parseInt(daysMatch[1], 10) * 24 * 60;
        if (hoursMatch) totalMinutes += parseInt(hoursMatch[1], 10) * 60;
        if (minutesMatch) totalMinutes += parseInt(minutesMatch[1], 10);
        
        // Fallback just in case the backend sends a raw number string
        if (!daysMatch && !hoursMatch && !minutesMatch) {
            const rawNum = parseFloat(tatStr);
            return isNaN(rawNum) ? 0 : rawNum;
        }
        
        return totalMinutes;
    };

    // Compute the threshold value for the top 3 highest TOTAL avg_tat values
    const topTatThreshold = useMemo(() => {
        if (!performanceData || performanceData.length === 0) return 0;
        
        const values = performanceData
            .map(row => parseTatToMinutes(row.total?.avg_tat_total))
            .sort((a, b) => b - a);

        // Get the 3rd highest value (or the lowest if less than 3 items exist)
        const targetIdx = Math.min(2, values.length - 1);
        return values[targetIdx] || 0;
    }, [performanceData]);

    return (
        <div className="hydrant-performance-table-wrapper" style={{ background: 'rgba(20, 24, 33, 0.95)', borderRadius: '6px', padding: '20px', border: '1px solid #2e3748', width: '100%' }}>
            {/* Embedded keyframe styling for the alert animation */}
            <style>{`
                @keyframes subtle-red-blink {
                    0% { background-color: rgba(244, 67, 54, 0.15); }
                    50% { background-color: rgba(244, 67, 54, 0.45); }
                    100% { background-color: rgba(244, 67, 54, 0.15); }
                }
                .top-tat-blink-alert {
                    animation: subtle-red-blink 1s infinite ease-in-out;
                }
            `}</style>

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
                                    fontSize: '29px', 
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
                                                fontSize: '30px', 
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
                                        <th style={{ padding: '8px 4px', fontSize: '25px', fontWeight: '700', color: 'white', borderRight: '1px solid #2e3748', textAlign:'center' }}>SELF</th>
                                        <th style={{ padding: '8px 4px', fontSize: '25px', fontWeight: '700', color: 'white', borderRight: '2px solid #4a5568' ,  textAlign:'center'}}>TOTAL</th>
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
                                
                                // Identify if this row belongs to the new undivided single-column aging block
                                const isSingleColumnBlock = isRunningHoursRow || metric.isAgingRow;

                                return (
                                    <tr 
                                        key={mIdx}
                                        style={{ 
                                            borderBottom: isCancelledRow ? '4px solid #67676e' : '1px solid #2e3748',
                                            // Adds a prominent separating line right after % HMP (or at the top of the first aging row)
                                            borderTop: (isCompletedRow || isRunningHoursRow || metric.label === 'PENDING < 24H') ? '4px solid #67676e' : 'none',
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
                                            // Handle undivided metric rows condition (Running hours & custom Aging percentages)
                                            if (isSingleColumnBlock) {
                                                return (
                                                    <td 
                                                        key={`cell-single-${mIdx}-${rIdx}`}
                                                        colSpan={2}
                                                        style={{ 
                                                            padding: '14px 4px', 
                                                            fontSize: '40px', 
                                                            fontWeight: '700',
                                                            color: metric.color || '#e2e8f0',
                                                            borderRight: '2px solid #4a5568',
                                                            background: metric.isAgingRow ? 'transparent' : 'rgba(255, 242, 0, 0.04)'
                                                        }}
                                                    >
                                                        {row.total[metric.key]}
                                                    </td>
                                                );
                                            }

                                            // Default divided columns setup
                                            const selfValue = row.total[metric.key];
                                            const totalValue = row.total[`${metric.key}_total`];

                                            // Determine if this unique TOTAL cell is one of the top 3 highest values
                                            // FIXED: Parse the string to absolute minutes for the threshold comparison
                                            const parsedTotalMinutes = parseTatToMinutes(totalValue);
                                            const isTopAlertTat = metric.isTat && parsedTotalMinutes >= topTatThreshold && parsedTotalMinutes > 0;

                                            return (
                                                <React.Fragment key={`cell-group-${mIdx}-${rIdx}`}>
                                                    {/* Self Column Value */}
                                                    <td 
                                                        style={{ 
                                                            padding: '14px 4px', 
                                                            fontSize: '36px', 
                                                            fontWeight: '600',
                                                            color: metric.isTat ? '#FFF200' : (metric.color || '#e2e8f0'),
                                                            borderRight: '1px solid #2e3748'
                                                        }}
                                                    >
                                                        {selfValue}
                                                    </td>
                                                    {/* Total Column Value */}
                                                    <td 
                                                        className={isTopAlertTat ? 'top-tat-blink-alert' : ''}
                                                        style={{ 
                                                            padding: '14px 4px', 
                                                            fontSize: '36px', 
                                                            fontWeight: '600',
                                                            color: metric.isTat ? '#FFF200' : (metric.color || '#e2e8f0'),
                                                            borderRight: '2px solid #4a5568',
                                                            background: isTopAlertTat ? undefined : 'rgba(255, 255, 255, 0.01)'
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