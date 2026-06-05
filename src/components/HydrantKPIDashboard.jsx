import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    
    // Modes: 'TODAY' | 'TODATE' | 'CUSTOM'
    const [dashboardMode, setDashboardMode] = useState('TODAY');
    const [activeFilters, setActiveFilters] = useState({ startDate: '', endDate: '' });

    // Tracks how many 30-second ticks have passed in the current mode
    const [ticksElapsed, setTicksElapsed] = useState(0);

    // Responsive state tracker for dynamic styling adjustments
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        handleResize(); 
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch metrics pipeline bound strictly to activeFilters state mapping
    const fetchTodayStats = useCallback(async () => {
        try {
            let url = 'newkpis/today-stats';
            if (activeFilters.startDate && activeFilters.endDate) {
                url += `?startDate=${activeFilters.startDate}&endDate=${activeFilters.endDate}`;
            }
            const resp = await api.get(url);
            setData(resp.data.data);
        } catch (err) {
            console.error("Hydrant KPI Fetch Error:", err);
        }
    }, [activeFilters]);

    // Single source of truth for executing data fetches on state changes
    useEffect(() => {
        fetchTodayStats();
    }, [fetchTodayStats]);

    // Single source of truth interval loop (Runs every 30 seconds)
    useEffect(() => {
        const interval = setInterval(() => {
            // 1. Always refresh database statistics for the active view
            fetchTodayStats();

            // 2. Handle rotation logic if not in CUSTOM mode
            setDashboardMode((currentMode) => {
                if (currentMode === 'CUSTOM') return currentMode;

                let nextTicks = 0;
                setTicksElapsed((prevTicks) => {
                    nextTicks = prevTicks + 1;
                    return nextTicks;
                });

                // 5 minutes = 300,000ms / 30,000ms = 10 ticks
                if (currentMode === 'TODAY' && nextTicks >= 10) {
                    setStartDate('2026-02-01');
                    setEndDate(todayStr);
                    setActiveFilters({ startDate: '2026-02-01', endDate: todayStr });
                    setTicksElapsed(0); // Reset ticker for next mode
                    return 'TODATE';
                }

                // 15 minutes = 900,000ms / 30,000ms = 30 ticks
                if (currentMode === 'TODATE' && nextTicks >= 30) {
                    setStartDate(todayStr);
                    setEndDate(todayStr);
                    setActiveFilters({ startDate: '', endDate: '' });
                    setTicksElapsed(0); // Reset ticker for next mode
                    return 'TODAY';
                }

                return currentMode;
            });

        }, 30000);

        return () => clearInterval(interval);
    }, [todayStr, fetchTodayStats]);

    // Manual Form Filter submissions
    const handleApplyFilter = () => {
        setDashboardMode('CUSTOM');
        setActiveFilters({ startDate, endDate });
    };

    const handleResetFilter = () => {
        setStartDate(todayStr);
        setEndDate(todayStr);
        setDashboardMode('TODAY');
        setActiveFilters({ startDate: '', endDate: '' });
        setTicksElapsed(0);
    };

    // Manual navigation controls using the header arrow triggers
    const handleNavigateLeft = () => {
        setDashboardMode('TODAY');
        setStartDate(todayStr);
        setEndDate(todayStr);
        setActiveFilters({ startDate: '', endDate: '' });
        setTicksElapsed(0);
    };

    const handleNavigateRight = () => {
        setDashboardMode('TODATE');
        setStartDate('2026-02-01');
        setEndDate(todayStr);
        setActiveFilters({ startDate: '2026-02-01', endDate: todayStr });
        setTicksElapsed(0);
    };

    const handleTableDataCalculated = useCallback(() => {}, []);

    if (!data || !data.ots || !data.orders) {
        return <div className="hmp-loading" style={{ color: '#fff', padding: '20px' }}>Fetching Hydrant KPI Stats...</div>;
    }

    const { ots, orders } = data;
    const fmt = (val) => (val ? Number(val).toLocaleString() : "0");

    const fmtLargeUnits = (val) => {
        if (!val) return "0";
        const num = Number(val);
        if (num >= 1000000) {
            const millions = num / 1000000;
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
            created_gallons: ots.ots_created_gallons_today,
            dispatched_gallons: ots.ots_dispatched_gallons_today,
            completed_gallons: ots.ots_completed_gallons_today,
            cancelled_gallons: ots.ots_cancelled_gallons_today,
            pending_gallons: ots.ots_pending_gallons_today,
            created_amount: ots.ots_created_amount_today,
            dispatched_amount: ots.ots_dispatched_amount_today,
            completed_amount: ots.ots_completed_amount_today,
            cancelled_amount: ots.ots_cancelled_amount_today,
            pending_amount: ots.ots_pending_amount_today,
            pending_max_aging: ots.ots_max_pending_aging_readable,
            assigned_max_aging: ots.ots_max_assigned_aging_readable
        },
        daily_hmp: {
            created: orders.hmp_created_today,
            dispatched: orders.hmp_dispatched_today,
            completed: orders.hmp_completed_today,
            cancelled: orders.hmp_cancelled_today,
            pending: orders.hmp_pending_today,
            avg_tat: orders.hmp_avg_tat_readable,
            created_gallons: orders.hmp_created_gallons_today,
            dispatched_gallons: orders.hmp_dispatched_gallons_today,
            completed_gallons: orders.hmp_completed_gallons_today,
            cancelled_gallons: orders.hmp_cancelled_gallons_today,
            pending_gallons: orders.hmp_pending_gallons_today,
            pending_max_aging: orders.hmp_max_pending_aging_readable,
            assigned_max_aging: orders.hmp_max_assigned_aging_readable
        }
    };

    const renderSingleCard = (key, type, cardType) => {
        const s = stats[key];
        
        const configurations = {
            created: { label: `CREATED`, grad: "hmp-grad-cyan", lblClass: "label-cyan", count: s.created, gallons: s.created_gallons, amount: s.created_amount, isTatCard: false },
            completed: { label: `COMPLETED`, grad: "hmp-grad-green", lblClass: "label-green", count: s.completed, gallons: s.completed_gallons, amount: s.completed_amount, isTatCard: false },
            dispatched: { label: `DRIVER ASSIGNED ${s.assigned_max_aging ? `(${s.assigned_max_aging})` : ''}`, grad: "hmp-grad-orange", lblClass: "label-orange", count: s.dispatched, gallons: s.dispatched_gallons, amount: s.dispatched_amount, isTatCard: false },
            pending: { label: `NOT ASSIGNED ${s.pending_max_aging ? `(${s.pending_max_aging})` : ''}`, grad: "hmp-grad-red", lblClass: "label-red", count: s.pending, gallons: s.pending_gallons, amount: s.pending_amount, isTatCard: false },
            cancelled: { label: `CANCELLED`, grad: "hmp-grad-grey", lblClass: "", count: s.cancelled, gallons: s.cancelled_gallons, amount: s.cancelled_amount, isTatCard: false, isCancelledCard: true },
            tat: { label: `AVG TAT`, grad: "hmp-grad-golden", lblClass: "label-golden", count: s.avg_tat, isTatCard: true }
        };

        const cfg = configurations[cardType];

        if (cfg.isTatCard) {
            return (
                <div className={`hmp-card ${cfg.grad}`} style={{ height: '100%' }}>
                    <div className="hmp-main-row">
                        <span className={`hmp-label ${cfg.lblClass}`} style={{ fontSize: '40px' }}>{cfg.label}</span>
                        <span className="hmp-total" style={{ fontSize: '35px', textTransform: 'none' }}>{cfg.count}</span>
                    </div>
                </div>
            );
        }

        return (
            <div className={`hmp-card ${cfg.grad}`} style={{ display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center', padding: '10px 12px', height: '100%' }}>
                <div className="hmp-main-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={`hmp-label ${cfg.lblClass}`} style={{ fontSize: '35px' }}>{cfg.label}</span>
                    <span className="hmp-total" style={{ fontSize: '45px', fontWeight: 'bold' }}>{fmt(cfg.count)}</span>
                </div>
                {cfg.isCancelledCard && type === 'OTS' && (
                    <div className="hmp-sub-row" style={{ display: 'flex', justifyContent: 'space-between', border: 'none', paddingTop: '2px', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '2px', fontSize: '35px', color: '#8a99a8' }}>
                        <span style={{ color: 'white',  }}>Consumer: <strong>{fmt(s.cancelled_consumer)}</strong></span>
                        <span style={{ color: 'white' }}>Hydrant: <strong>{fmt(s.cancelled_hydrant)}</strong></span>
                    </div>
                )}
                <div className="hmp-sub-row" style={{ display: 'flex', justifyContent: 'space-between', border: 'none', paddingTop: '1px', fontSize: '30px', color: '#be66e3', fontWeight: 'bold' }}>
                    <span>GALLONS:</span>
                    <strong>{Number(cfg.gallons) >= 1000000 ? fmtLargeUnits(cfg.gallons) : `${fmt(cfg.gallons)}`}</strong>
                </div>
                {type === 'OTS' && (
                    <div className="hmp-sub-row" style={{ display: 'flex', justifyContent: 'space-between', border: 'none', paddingTop: '1px', fontSize: '30px', color: '#e0e6ed', fontWeight: 'bold' }}>
                        <span>AMOUNT:</span>
                        <strong>{Number(cfg.amount) >= 1000000 ? `${fmtLargeUnits(cfg.amount)}` : `${fmt(cfg.amount)}`}</strong>
                    </div>
                )}
            </div>
        );
    };

    const getHeaderTitle = () => {
        if (dashboardMode === 'TODAY') return 'TODAY ORDERS';
        if (dashboardMode === 'TODATE') return 'TO DATE ORDERS';
        return 'CUSTOM ORDERS';
    };

    const themeColor = dashboardMode === 'TODATE' ? '#00f2ff' : '#FFF200';

    return (
        <div 
            className="hydrant-kpi-dashboard-wrapper animate-fade-in" 
            style={{ 
                padding: '20px', 
                color: '#fff', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0px', 
                width: '100%',
                position: 'relative' 
            }}
        >
            {/* ==================== CONTROL BOX (ABSOLUTE RIGHT HIGHLIGHTED ZONE) ==================== */}
            <div 
                className="kpi-date-filter-inline" 
                style={{ 
                    position: isMobile ? 'static' : 'absolute',
                    top: '-99px', 
                    right: '310px', 
                    display: isMobile ? 'flex' : 'inline-flex', 
                    flexDirection: isMobile ? 'column' : 'row', 
                    alignItems: isMobile ? 'stretch' : 'center', 
                    gap: '24px', 
                    padding: '4px 12px', 
                    background: 'black', 
                    width: isMobile ? '100%' : 'auto',
                    zIndex: 1000
                }} 
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: '20px', color: '#fff', fontWeight: 'bold' }}>From:</label>
                    <input  
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)}
                        style={{ background: '#222', color: '#fff', border: '1px solid #777', borderRadius: '4px', padding: '12px 20px', fontSize: '28px', fontWeight: 'bold', cursor: 'pointer', flex: isMobile ? 1 : 'none', width: isMobile ? 'auto' : '260px', colorScheme: 'dark' }}
                    />
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: '20px', color: '#fff', fontWeight: 'bold' }}>To:</label>
                    <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)}
                        style={{ background: '#222', color: '#fff', border: '1px solid #777', borderRadius: '4px', padding: '12px 20px', fontSize: '28px', fontWeight: 'bold', cursor: 'pointer', flex: isMobile ? 1 : 'none', width: isMobile ? 'auto' : '260px', colorScheme: 'dark' }}
                    />
                </div>
                
                <div style={{ display: 'flex', gap: '10px', marginTop: isMobile ? '4px' : '0px' }}>
                    <button 
                        onClick={handleApplyFilter}
                        style={{ background: 'var(--accent-cyan, #00f2ff)', color: '#000', border: 'none', borderRadius: '4px', padding: '12px 26px', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', flex: isMobile ? 1 : 'none' }}
                    >
                        FILTER
                    </button>
                    
                    <button 
                        onClick={handleResetFilter}
                        style={{ background: '#444', color: '#fff', border: 'none', borderRadius: '4px', padding: '12px 26px', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', flex: isMobile ? 1 : 'none' }}
                    >
                        RESET
                    </button>
                </div>
            </div>

            {/* ==================== GLOBAL CONTROL SECTION ==================== */}
            <div className="hmp-kpi-group-wrapper hmp-grp-today" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'stretch', position: 'relative' }}>
                
                {/* Header Control Panel Bar */}
                <div className="hmp-group-label hmp-lbl-today" style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: isMobile ? 'flex-start' : 'space-between', gap: '16px', width: '100%', marginBottom: '4px' }}>
                    
                    {/* Integrated Slider Header Title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.3)', padding: '6px 14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', marginTop:'-10px' }}>
                        <button 
                            onClick={handleNavigateLeft}
                            title="Switch to Today Orders"
                            style={{ background: 'none', border: 'none', color: themeColor, fontSize: '22px', fontWeight: 'bold', cursor: 'pointer', padding: '0 5px' }}
                        >
                            &#8592;
                        </button>
                        
                        <span style={{ fontSize: '40px', fontWeight: 'bold', letterSpacing: '0.5px', whiteSpace: 'nowrap', minWidth: '190px', textAlign: 'center', color: themeColor, transition: 'color 0.4s ease' }}>
                            {getHeaderTitle()}
                        </span>

                        <button 
                            onClick={handleNavigateRight}
                            title="Switch to To Date Orders"
                            style={{ background: 'none', border: 'none', color: themeColor, fontSize: '22px', fontWeight: 'bold', cursor: 'pointer', padding: '0 5px' }}
                        >
                            &#8594;
                        </button>
                    </div>
                </div>

                {/* Top Row: Cards Grid System Wrapper */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch', marginTop: '30px', position: 'relative' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
                        
                        {/* ==================== SINGLE UNIFIED PENDING WRAPPER BOX ==================== */}
                        <div 
                            style={{ 
                                position: 'absolute', 
                                left: 'calc((100% / 6.5) * 0.5 + ((100% / 6.5) * 2) - 4px)', 
                                width: 'calc((100% / 6.5) * 2 + 8px)',
                                top: '-38px', 
                                bottom: '-9px', 
                                border: '1px solid rgba(191, 84, 46, 0.99)', 
                                backgroundColor: 'rgba(255, 255, 255, 0.03)', 
                                borderRadius: '8px', 
                                zIndex: 1, 
                                pointerEvents: 'none', 
                                display: isMobile ? 'none' : 'block' 
                            }}
                        >
                            <div 
                                style={{ 
                                    position: 'absolute', 
                                    top: '-17px', 
                                    left: '50%', 
                                    transform: 'translateX(-50%)', 
                                    padding: '0 12px', 
                                    fontSize: '35px', 
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
                        <div className="hmp-kpi-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '0.5fr repeat(6, minmax(0, 1fr))', gap: '8px', position: 'relative', zIndex: 2 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 242, 255, 0.05)', border: '1px solid rgba(0, 242, 255, 0.3)', borderRadius: '6px', padding: '2px' }}>
                                <span style={{ fontSize: '30px', fontWeight: 'bold', color: 'white', textTransform: 'uppercase', letterSpacing: '1px' }}>online</span>
                            </div>
                            <div>{renderSingleCard('daily_ots', 'OTS', 'created')}</div>
                            <div>{renderSingleCard('daily_ots', 'OTS', 'completed')}</div>
                            <div>{renderSingleCard('daily_ots', 'OTS', 'dispatched')}</div>
                            <div>{renderSingleCard('daily_ots', 'OTS', 'pending')}</div>
                            <div>{renderSingleCard('daily_ots', 'OTS', 'cancelled')}</div>
                            <div>{renderSingleCard('daily_ots', 'OTS', 'tat')}</div>
                        </div>
                        
                        {/* 2. HMP ROW */}
                        <div className="hmp-kpi-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '0.5fr repeat(6, minmax(0, 1fr))', gap: '8px', alignItems: 'stretch', position: 'relative', zIndex: 2 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(190, 102, 227, 0.05)', border: '1px solid rgba(190, 102, 227, 0.3)', borderRadius: '6px', padding: '10px' }}>
                                <span style={{ fontSize: '30px', fontWeight: 'bold', color: 'white', textTransform: 'uppercase', letterSpacing: '1px' }}>hmp</span>
                            </div>
                            <div>{renderSingleCard('daily_hmp', 'HMP', 'created')}</div>
                            <div>{renderSingleCard('daily_hmp', 'HMP', 'completed')}</div>
                            <div>{renderSingleCard('daily_hmp', 'HMP', 'dispatched')}</div>
                            <div>{renderSingleCard('daily_hmp', 'HMP', 'pending')}</div>
                            <div>{renderSingleCard('daily_hmp', 'HMP', 'cancelled')}</div>
                            <div>{renderSingleCard('daily_hmp', 'HMP', 'tat')}</div>
                        </div>

                    </div>
                </div>

                {/* Sub-component tables pipeline blocks */}
                <div style={{ width: '100%', marginTop: '20px' }}>
                    <HydrantPercentageStats activeFilters={activeFilters} />
                </div>

                <div style={{ width: '100%', marginTop: '20px' }}>
                    <HydrantPercentageStats2 activeFilters={activeFilters} />
                </div>
                
                <div style={{ width: '100%', marginTop: '14px' }}>
                    <HydrantCategoryTable 
                        activeFilters={activeFilters} 
                        onDataCalculated={handleTableDataCalculated}
                    />
                </div>
            </div>
        </div>
    );
};

export default HydrantKPIDashboard;