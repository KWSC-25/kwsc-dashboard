import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import HydrantCategoryTable from './HydrantCategoryTable'; 
import CategorySlider from './CategorySlider';
import HydrantPercentageStats from './HydrantPercentageStats'; 
import HydrantPercentageStats2 from './HydrantPercentageStats2';

const HydrantKPIDashboard = () => {
    const [data, setData] = useState(null);
    
    const todayStr = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(todayStr);
    const [endDate, setEndDate] = useState(todayStr);
    const [activeFilters, setActiveFilters] = useState({ startDate: '', endDate: '' });

    const fetchTodayStats = useCallback(async (filters = activeFilters) => {
        try {
            let url = 'newkpis/today-stats';
            if (filters.startDate && filters.endDate) {
                url += `?startDate=${filters.startDate}&endDate=${filters.endDate}`;
            }
            const resp = await api.get(url);
            setData(resp.data.data);
        } catch (err) {
            console.error("Hydrant KPI Fetch Error:", err);
        }
    }, [activeFilters]);

    useEffect(() => {
        fetchTodayStats();
        const interval = setInterval(() => fetchTodayStats(), 30000);
        return () => clearInterval(interval);
    }, [fetchTodayStats]);

    const handleApplyFilter = () => {
        setActiveFilters({ startDate, endDate });
    };

    const handleResetFilter = () => {
        setStartDate(todayStr);
        setEndDate(todayStr);
        setActiveFilters({ startDate: '', endDate: '' });
    };

    // Callback pipeline method to safely absorb computed categories array from child table element
    const handleTableDataCalculated = useCallback(() => {
    }, []);

    if (!data || !data.ots || !data.orders) {
        return <div className="hmp-loading" style={{ color: '#fff', padding: '20px' }}>Fetching Hydrant KPI Stats...</div>;
    }

    const { ots, orders } = data;
    const fmt = (val) => (val ? Number(val).toLocaleString() : "0");

    // Formatter utility to convert value into clean millions notation (e.g. 1.52M) ONLY if it reaches or crosses 1 Million (1,000,000)
    const fmtLargeUnits = (val) => {
        if (!val) return "0";
        const num = Number(val);
        if (num >= 1000000) {
            const millions = num / 1000000;
            // Uses up to 2 decimal places, slicing off trailing zeros cleanly via parseFloat
            return `${parseFloat(millions.toFixed(2))}M`;
        }
        return num.toLocaleString();
    };

    const stats = {
        daily_ots: {
            created: ots.total_created_ots_today,
            dispatched: ots.ots_dispatched_today,
            completed: ots.ots_completed_today,
            cancelled: Number(ots.ots_cancelled_consumer_today) + Number(ots.ots_cancelled_hmp_today),
            pending: ots.ots_pending_today,
            cancelled_consumer: ots.ots_cancelled_consumer_today,
            cancelled_hydrant: ots.ots_cancelled_hmp_today,
            avg_tat: ots.ots_avg_tat_readable,
            // Sub-row matrices variables mapped here
            created_gallons: ots.ots_created_gallons_today,
            dispatched_gallons: ots.ots_dispatched_gallons_today,
            completed_gallons: ots.ots_completed_gallons_today,
            cancelled_gallons: ots.ots_cancelled_gallons_today,
            pending_gallons: ots.ots_pending_gallons_today,
            created_amount: ots.ots_created_amount_today,
            dispatched_amount: ots.ots_dispatched_amount_today,
            completed_amount: ots.ots_completed_amount_today,
            cancelled_amount: ots.ots_cancelled_amount_today,
            pending_amount: ots.ots_pending_amount_today
        },
        daily_hmp: {
            created: orders.hmp_created_today,
            dispatched: orders.hmp_dispatched_today,
            completed: orders.hmp_completed_today,
            cancelled: orders.hmp_cancelled_today,
            pending: orders.hmp_pending_today,
            avg_tat: orders.hmp_avg_tat_readable,
            // Sub-row gallons matrices variables mapped here
            created_gallons: orders.hmp_created_gallons_today,
            dispatched_gallons: orders.hmp_dispatched_gallons_today,
            completed_gallons: orders.hmp_completed_gallons_today,
            cancelled_gallons: orders.hmp_cancelled_gallons_today,
            pending_gallons: orders.hmp_pending_gallons_today
        }
    };

    const renderSingleCard = (key, type, cardType) => {
        const s = stats[key];
        
        const configurations = {
            created: {
                label: `CREATED ${type}`,
                grad: "hmp-grad-cyan",
                lblClass: "label-cyan",
                count: s.created,
                gallons: s.created_gallons,
                amount: s.created_amount,
                isTatCard: false
            },
            completed: {
                label: `COMPLETED ${type}`,
                grad: "hmp-grad-green",
                lblClass: "label-green",
                count: s.completed,
                gallons: s.completed_gallons,
                amount: s.completed_amount,
                isTatCard: false
            },
            dispatched: {
                label: `DRIVER ASSIGNED ${type}`,
                grad: "hmp-grad-orange",
                lblClass: "label-orange",
                count: s.dispatched,
                gallons: s.dispatched_gallons,
                amount: s.dispatched_amount,
                isTatCard: false
            },
            pending: {
                label: `NOT ASSIGNED ${type}`,
                grad: "hmp-grad-red",
                lblClass: "label-red",
                count: s.pending,
                gallons: s.pending_gallons,
                amount: s.pending_amount,
                isTatCard: false
            },
            cancelled: {
                label: type === 'OTS' ? 'CANCELLED' : `CANCELLED ${type}`,
                grad: "hmp-grad-grey",
                lblClass: "",
                count: s.cancelled,
                gallons: s.cancelled_gallons,
                amount: s.cancelled_amount,
                isTatCard: false,
                isCancelledCard: true
            },
            tat: {
                label: `AVERAGE ORDER TAT ${type}`,
                grad: "hmp-grad-golden",
                lblClass: "label-golden",
                count: s.avg_tat,
                isTatCard: true
            }
        };

        const cfg = configurations[cardType];

        if (cfg.isTatCard) {
            return (
                <div className={`hmp-card ${cfg.grad}`} style={{ height: '100%' }}>
                    <div className="hmp-main-row">
                        <span className={`hmp-label ${cfg.lblClass}`}>{cfg.label}</span>
                        <span className="hmp-total" style={{ fontSize: '32px', textTransform: 'none' }}>{cfg.count}</span>
                    </div>
                </div>
            );
        }

        return (
            <div className={`hmp-card ${cfg.grad}`} style={{ display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center', padding: '10px 12px', height: '100%' }}>
                {/* Sub Row 1: Main Metric Total Counts */}
                <div className="hmp-main-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={`hmp-label ${cfg.lblClass}`} style={{ fontSize: '15px' }}>{cfg.label}</span>
                    <span className="hmp-total" style={{ fontSize: '40px', fontWeight: 'bold' }}>{fmt(cfg.count)}</span>
                </div>
                {/* Retained original consumer vs hydrant cancellation breakdown block */}
                {cfg.isCancelledCard && type === 'OTS' && (
                    <div className="hmp-sub-row" style={{ display: 'flex', justifyContent: 'space-between', border: 'none', paddingTop: '2px', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '2px', fontSize: '20px', color: '#8a99a8' }}>
                        <span style={{ color: 'white' }}>By Consumer: <strong>{fmt(s.cancelled_consumer)}</strong></span>
                        <span style={{ color: 'white' }}>By Hydrant: <strong>{fmt(s.cancelled_hydrant)}</strong></span>
                    </div>
                )}
                
                {/* Sub Row 2: Gallon Counts */}
                <div className="hmp-sub-row" style={{ display: 'flex', justifyContent: 'space-between', border: 'none', paddingTop: '1px', fontSize: '20px', color: '#be66e3', fontWeight:'bold' }}>
                    <span>Million GALLONS:</span>
                    <strong>{Number(cfg.gallons) >= 1000000 ? fmtLargeUnits(cfg.gallons) : `${fmt(cfg.gallons)}`}</strong>
                </div>

                {/* Sub Row 3: Amount Metric */}
                {type === 'OTS' && (
                    <div className="hmp-sub-row" style={{ display: 'flex', justifyContent: 'space-between', border: 'none', paddingTop: '1px', fontSize: '20px', color: '#e0e6ed', fontWeight:'bold' }}>
                        <span>Million AMOUNT:</span>
                        <strong>{Number(cfg.amount) >= 1000000 ? `${fmtLargeUnits(cfg.amount)}` : `${fmt(cfg.amount)}`}</strong>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="hydrant-kpi-dashboard-wrapper animate-fade-in" style={{ padding: '20px', color: '#fff', display: 'flex', flexDirection: 'column', gap: '0px', width: '100%' }}>
            
            {/* ==================== GLOBAL TODAY SECTION ==================== */}
            <div className="hmp-kpi-group-wrapper hmp-grp-today" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'stretch', position: 'relative' }}>
                
                {/* Border-anchored Yellow Title + Custom Date Filter Toolbar Layer */}
                <div className="hmp-group-label hmp-lbl-today" style={{ color: '#FFF200', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px', width: '35%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span>TODAY ORDERS</span>
                        
                        <div className="kpi-date-filter-inline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginLeft: '20px', padding: '2px 8px', background: 'rgba(0,0,0,0.4)', borderRadius: '4px', border: '1px solid #444' }} onClick={(e) => e.stopPropagation()}>
                            <label style={{ fontSize: '15px', color: '#aaa', fontWeight: 'bold' }}>From:</label>
                            <input  
                                type="date" 
                                value={startDate} 
                                onChange={(e) => setStartDate(e.target.value)}
                                style={{ background: '#222', color: '#fff', border: '1px solid #555', borderRadius: '3px', padding: '1px 4px', fontSize: '13px', cursor: 'pointer' }}
                            />
                            
                            <label style={{ fontSize: '15px', color: '#aaa', fontWeight: 'bold' }}>To:</label>
                            <input 
                                type="date" 
                                value={endDate} 
                                onChange={(e) => setEndDate(e.target.value)}
                                style={{ background: '#222', color: '#fff', border: '1px solid #555', borderRadius: '3px', padding: '1px 4px', fontSize: '13px', cursor: 'pointer' }}
                            />
                            
                            <button 
                                onClick={handleApplyFilter}
                                style={{ background: 'var(--accent-cyan, #00f2ff)', color: '#000', border: 'none', borderRadius: '3px', padding: '2px 8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                FILTER
                            </button>
                            
                            <button 
                                onClick={handleResetFilter}
                                style={{ background: '#444', color: '#fff', border: 'none', borderRadius: '3px', padding: '2px 8px', fontSize: '13px', cursor: 'pointer' }}
                            >
                                RESET
                            </button>
                        </div>
                    </div>
                </div>

                {/* Top Row: KPIs and Gallons Card Container */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch', marginTop: '10px', position: 'relative' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
                        
                        {/* ==================== SINGLE UNIFIED PENDING WRAPPER BOX ==================== */}
                        <div 
                            style={{ 
                                position: 'absolute', 
                                left: 'calc(33.333% - 4px)', // Dynamically targets the 3rd and 4th columns space out of 6
                                width: 'calc(33.333% + 8px)',
                                top: '-6px', 
                                bottom: '-6px', 
                                border: '1px solid rgba(191, 84, 46, 0.99)', 
                                backgroundColor: 'rgba(255, 255, 255, 0.03)', 
                                borderRadius: '8px', 
                                zIndex: 1, 
                                pointerEvents: 'none' // Ensures users can still click interactions inside cards
                            }}
                        >
                            {/* Unified Top-Middle Heading */}
                            <div 
                                style={{ 
                                    position: 'absolute', 
                                    top: '-17px', 
                                    left: '50%', 
                                    transform: 'translateX(-50%)', 
                                    padding: '0 12px', 
                                    fontSize: '15px', 
                                    backgroundColor: '#111622',
                                    fontWeight: 'bold', 
                                    color: '#ff4d4f', 
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Pending Orders
                            </div>
                        </div>

                        {/* 1. OTS ROW */}
                        <div className="hmp-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: '8px', alignItems: 'stretch', position: 'relative', zIndex: 2 }}>
                            <div>{renderSingleCard('daily_ots', 'OTS', 'created')}</div>
                            <div>{renderSingleCard('daily_ots', 'OTS', 'completed')}</div>
                            <div style={{ padding: '4px 0' }}>{renderSingleCard('daily_ots', 'OTS', 'dispatched')}</div>
                            <div style={{ padding: '4px 0' }}>{renderSingleCard('daily_ots', 'OTS', 'pending')}</div>
                            <div>{renderSingleCard('daily_ots', 'OTS', 'cancelled')}</div>
                            <div>{renderSingleCard('daily_ots', 'OTS', 'tat')}</div>
                        </div>
                        
                        {/* 2. HMP ROW */}
                        <div className="hmp-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: '8px', alignItems: 'stretch', position: 'relative', zIndex: 2 }}>
                            <div>{renderSingleCard('daily_hmp', 'HMP', 'created')}</div>
                            <div>{renderSingleCard('daily_hmp', 'HMP', 'completed')}</div>
                            <div style={{ padding: '4px 0' }}>{renderSingleCard('daily_hmp', 'HMP', 'dispatched')}</div>
                            <div style={{ padding: '4px 0' }}>{renderSingleCard('daily_hmp', 'HMP', 'pending')}</div>
                            <div>{renderSingleCard('daily_hmp', 'HMP', 'cancelled')}</div>
                            <div>{renderSingleCard('daily_hmp', 'HMP', 'tat')}</div>
                        </div>

                    </div>
                </div>

                {/* New Section: Hydrant Performance Grid Table */}
                <div style={{ width: '100%', marginTop: '20px' }}>
                    <HydrantPercentageStats activeFilters={activeFilters} />
                </div>

                {/* Segment-Wise Breakdown Category Table */}
                <div style={{ width: '100%', marginTop: '14px' }}>
                    <HydrantCategoryTable 
                        activeFilters={activeFilters} 
                        onDataCalculated={handleTableDataCalculated}
                    />
                </div>

                {/* New Section: Hydrant Performance Grid Table 2 */}
                <div style={{ width: '100%', marginTop: '20px' }}>
                    <HydrantPercentageStats2 activeFilters={activeFilters} />
                </div>
                
            </div>
        </div>
    );
};

export default HydrantKPIDashboard;