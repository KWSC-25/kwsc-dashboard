import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/api';

const HydrantCategoryTable = ({ activeFilters, onDataCalculated }) => {
    const [tableData, setTableData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Categories mapping exactly matching the keys returned by your express query selective aliases
    const categories = useMemo(() => [
        { label: 'Commercial', prefix: 'commercial_' },
        { label: 'General Public (OTS)', prefix: 'gps_ots_' },
        { label: 'Online (GPS)', prefix: 'gps_online_' },
        { label: 'DC Quota', prefix: 'dc_quota_' },
        { label: 'GPS Billing', prefix: 'gps_billing_' },
        { label: 'GPS Care Off', prefix: 'gps_careoff_' },
        { label: 'Govt Vehicle', prefix: 'govt_vehicle_' },
        { label: 'P.A.F', prefix: 'paf_' },
        { label: 'Pak Ranger', prefix: 'pak_ranger_' }
    ], []);

    // Status fields for subheaders - Highlighted CRTD with distinct style markers
    const statuses = useMemo(() => [
        { label: 'CRTD', key: 'created', color: '#00f2ff', isPrimary: true },
        { label: 'ASGD', key: 'driver_assigned', color: '#ff9800', isPrimary: false },
        { label: 'CMPL', key: 'completed', color: '#4caf50', isPrimary: false },
        { label: 'CNCL', key: 'cancelled', color: '#a0aec0', isPrimary: false },
        { label: 'PNDG', key: 'pending', color: '#f44336', isPrimary: false }
    ], []);

    // 30-second auto-refresh polling function matching dashboard state
    const fetchBreakdownData = useCallback(async (filters = activeFilters) => {
        try {
            let url = 'newkpis/order-summary';
            if (filters.startDate && filters.endDate) {
                url += `?startDate=${filters.startDate}&endDate=${filters.endDate}`;
            }
            const resp = await api.get(url);
            setTableData(resp.data.data || []);
        } catch (err) {
            console.error("Hydrant Category Breakdown Fetch Error:", err);
        }
    }, [activeFilters]);

    // Fixed cascading render warnings by handling initial load sequence gracefully
    useEffect(() => {
        let isMounted = true;
        
        const initFetch = async () => {
            setLoading(true);
            await fetchBreakdownData();
            if (isMounted) setLoading(false);
        };

        initFetch();

        const interval = setInterval(() => {
            fetchBreakdownData();
        }, 30000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [fetchBreakdownData]);

    // Compute frontend column aggregates for the summary row baseline tracker
    const totals = useMemo(() => {
        const t = {};
        categories.forEach(cat => {
            statuses.forEach(status => {
                const combinedKey = `${cat.prefix}${status.key}`;
                t[combinedKey] = tableData.reduce((acc, row) => acc + (Number(row[combinedKey]) || 0), 0);
            });
        });
        return t;
    }, [tableData, categories, statuses]);

    // Side-effect to bubble totals data upward to the dashboard container whenever data or aggregates recalculate
    useEffect(() => {
        if (onDataCalculated && Object.keys(totals).length > 0) {
            const mappedSliderPayload = categories.map(cat => ({
                name: cat.label,
                created: totals[`${cat.prefix}created`] || 0,
                assigned: totals[`${cat.prefix}driver_assigned`] || 0,
                completed: totals[`${cat.prefix}completed`] || 0,
                cancelled: totals[`${cat.prefix}cancelled`] || 0,
                pending: totals[`${cat.prefix}pending`] || 0
            }));
            onDataCalculated(mappedSliderPayload);
        }
    }, [totals, categories, onDataCalculated]);

    const fmt = (val) => (val ? Number(val).toLocaleString() : "0");

    return (
        <div className="hydrant-category-table-wrapper" style={{ background: 'rgba(20, 24, 33, 0.85)', borderRadius: '6px', padding: '16px', border: '1px solid #2e3748', width: '100%' }}>
            {/* Section Header Component */}
            <h3 style={{ margin: '0 0 14px 0', fontSize: '20px', fontWeight: '600', color: '#FFF200', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Category Based Hydrant Wise Breakdown of Orders
            </h3>

            {/* Scrollable Layout Context Layer */}
            <div style={{ overflowX: 'auto', width: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px', color: '#e2e8f0', minWidth: '1600px' }}>
                    <thead>
                        {/* Primary Category Main Group Headers */}
                        <tr style={{ background: 'rgba(46, 55, 72, 0.5)', borderTop: '1px solid #2e3748', borderBottom: '1px solid #2e3748' }}>
                            <th rowSpan={2} style={{ padding: '10px', textAlign: 'left', borderRight: '2px solid #2e3748', width: '180px', color: '#fff', fontSize: '13px', fontWeight: 'bold' }}>Hydrant Name</th>
                            {categories.map((cat, idx) => (
                                <th key={idx} colSpan={5} style={{ padding: '8px 4px', borderRight: idx !== categories.length - 1 ? '1px solid #4a5568' : 'none', color: '#fff', fontWeight: 'bold', fontSize: '12px', letterSpacing: '0.3px' , textAlign: 'center'}}>
                                    {cat.label}
                                </th>
                            ))}
                        </tr>
                        {/* Secondary Subheader Metrics: Status Layout Configuration */}
                        <tr style={{ borderBottom: '2px solid #2e3748', background: 'rgba(26, 32, 44, 0.4)' }}>
                            {categories.map((cat, cIdx) => (
                                <React.Fragment key={`sub-${cIdx}`}>
                                    {statuses.map((status, sIdx) => (
                                        <th 
                                            key={`${cIdx}-${sIdx}`} 
                                            style={{ 
                                                padding: '6px 2px', 
                                                fontSize: '11px', 
                                                fontWeight: '700',
                                                color: status.color,
                                                background: status.isPrimary ? 'rgba(0, 242, 255, 0.12)' : 'transparent',
                                                borderRight: (sIdx === statuses.length - 1 && cIdx !== categories.length - 1) ? '1px solid #4a5568' : 'none',
                                                width: '45px'
                                            }}
                                            title={status.label}
                                        >
                                            {status.label}
                                        </th>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading && tableData.length === 0 ? (
                            <tr>
                                <td colSpan={1 + categories.length * 5} style={{ padding: '30px', color: '#718096', fontSize: '13px' }}>
                                    Loading dashboard matrix breakdown metrics...
                                </td>
                            </tr>
                        ) : tableData.length === 0 ? (
                            <tr>
                                <td colSpan={1 + categories.length * 5} style={{ padding: '30px', color: '#718096', fontSize: '13px' }}>
                                    No transaction records found for selected period filter window.
                                </td>
                            </tr>
                        ) : (
                            tableData.map((row, rIdx) => (
                                <tr 
                                    key={rIdx} 
                                    style={{ 
                                        borderBottom: '1px solid #2e3748',
                                        background: rIdx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'
                                    }}
                                    className="hmp-table-row-hover"
                                >
                                    {/* Bold and White Highlighted Hydrant Identity Column */}
                                    <td style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '800', color: '#ffffff', background: 'rgba(26, 32, 44, 0.2)', borderRight: '2px solid #2e3748', whiteSpace: 'nowrap' }}>
                                        {row.hydrant_name}
                                    </td>
                                    {/* Dynamically render properties mapping the schema design matrix arrays */}
                                    {categories.map((cat, cIdx) => (
                                        <React.Fragment key={`row-${rIdx}-cat-${cIdx}`}>
                                            {statuses.map((status, sIdx) => {
                                                const key = `${cat.prefix}${status.key}`;
                                                const val = Number(row[key]) || 0;
                                                return (
                                                    <td 
                                                        key={`${cIdx}-${sIdx}`} 
                                                        style={{ 
                                                            padding: '10px 4px',
                                                            fontSize: '13px',
                                                            opacity: val === 0 ? 0.25 : 1,
                                                            fontWeight: val > 0 ? '600' : 'normal',
                                                            color: status.isPrimary && val > 0 ? '#00f2ff' : '#e2e8f0',
                                                            background: status.isPrimary ? 'rgba(0, 242, 255, 0.03)' : 'transparent',
                                                            borderRight: (sIdx === statuses.length - 1 && cIdx !== categories.length - 1) ? '1px solid #4a5568' : 'none'
                                                        }}
                                                    >
                                                        {val}
                                                    </td>
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}
                                </tr>
                            ))
                        )}
                        
                        {/* Dynamic Frontend Calculated Total Aggregate Row */}
                        {tableData.length > 0 && (
                            <tr style={{ background: 'rgba(34, 43, 59, 0.95)', borderTop: '2px solid #4a5568', borderBottom: '2px solid #4a5568', fontWeight: 'bold' }}>
                                <td style={{ padding: '12px 10px', textAlign: 'left', color: '#FFF200', borderRight: '2px solid #2e3748', fontSize: '14px', letterSpacing: '0.5px' }}>
                                    TOTALS
                                </td>
                                {categories.map((cat, cIdx) => (
                                    <React.Fragment key={`total-cat-${cIdx}`}>
                                        {statuses.map((status, sIdx) => {
                                            const combinedKey = `${cat.prefix}${status.key}`;
                                            const sumValue = totals[combinedKey] || 0;
                                            return (
                                                <td 
                                                    key={`total-${cIdx}-${sIdx}`} 
                                                    style={{ 
                                                        padding: '12px 4px', 
                                                        fontSize: '14px',
                                                        color: sumValue > 0 ? (status.isPrimary ? '#00f2ff' : '#FFF200') : '#5a6578',
                                                        background: status.isPrimary ? 'rgba(0, 242, 255, 0.08)' : 'transparent',
                                                        borderRight: (sIdx === statuses.length - 1 && cIdx !== categories.length - 1) ? '1px solid #4a5568' : 'none'
                                                    }}
                                                >
                                                    {fmt(sumValue)}
                                                </td>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HydrantCategoryTable;