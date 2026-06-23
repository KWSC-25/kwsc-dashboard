import React, { useState, useEffect, useCallback } from 'react';
import DatePicker from 'react-datepicker'; // <-- Imported DatePicker
import 'react-datepicker/dist/react-datepicker.css'; // <-- Imported Base Styles
import api from '../utils/api';
import HydrantCategoryTable from './HydrantCategoryTable'; 
import CategorySlider from './CategorySlider';
import HydrantPercentageStats from './HydrantPercentageStats'; 
import HydrantPercentageStats2 from './HydrantPercentageStats2';
import HydrantCharts from './HydrantCharts';

const HydrantKPIDashboard = () => {
    const [data, setData] = useState(null);
    const [toDateSnapshot, setToDateSnapshot] = useState(null);
    const todayStr = new Date().toISOString().split('T')[0];
    const [dashboardMode, setDashboardMode] = useState('TODATE');
    const [startDate, setStartDate] = useState('2026-02-01');
    const [endDate, setEndDate] = useState(todayStr);
    const [activeFilters, setActiveFilters] = useState({ startDate: '2026-02-01', endDate: todayStr });
    const [ticksElapsed, setTicksElapsed] = useState(0);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        handleResize(); 
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const fetchTodayStats = useCallback(async () => {
        try {
            let url = 'newkpis/today-stats';
            if (activeFilters.startDate && activeFilters.endDate) {
                url += `?startDate=${activeFilters.startDate}&endDate=${activeFilters.endDate}`;
            }
            const resp = await api.get(url);
            setData(resp.data.data);

            // --- ADD THIS BLOCK TO CAPTURE TO-DATE VALUES ---
            if (dashboardMode === 'TODATE' && resp.data.data) {
                setToDateSnapshot(resp.data.data);
            }
        } catch (err) {
            console.error("Hydrant KPI Fetch Error:", err);
        }
    }, [activeFilters, dashboardMode]); // Added dashboardMode here as a dependency

    useEffect(() => {
        fetchTodayStats();
    }, [fetchTodayStats]);

    useEffect(() => {
        if (dashboardMode === 'CUSTOM') return;

        const interval = setInterval(() => {
            fetchTodayStats();
            setTicksElapsed((prev) => prev + 1);
        }, 30000);

        return () => clearInterval(interval);
    }, [fetchTodayStats, dashboardMode]);

    useEffect(() => {
        if (dashboardMode === 'CUSTOM') return;

        if (dashboardMode === 'TODATE' && ticksElapsed >= 30) {
            setStartDate(todayStr);
            setEndDate(todayStr);
            setActiveFilters({ startDate: '', endDate: '' });
            setTicksElapsed(0);
            setDashboardMode('TODAY');
        } 
        else if (dashboardMode === 'TODAY' && ticksElapsed >= 10) {
            setStartDate('2026-02-01');
            setEndDate(todayStr);
            setActiveFilters({ startDate: '2026-02-01', endDate: todayStr });
            setTicksElapsed(0);
            setDashboardMode('TODATE');
        }
    }, [ticksElapsed, dashboardMode, todayStr]);

    const handleApplyFilter = () => {
        setDashboardMode('CUSTOM');
        setActiveFilters({ startDate, endDate });
    };

    const handleResetFilter = () => {
        setDashboardMode('TODATE');
        setStartDate('2026-02-01');
        setEndDate(todayStr);
        setActiveFilters({ startDate: '2026-02-01', endDate: todayStr });
        setTicksElapsed(0);
    };

    const handleNavigateRight = () => {
        if (dashboardMode === 'TODAY') {
            setDashboardMode('TODATE');
            setStartDate('2026-02-01');
            setEndDate(todayStr);
            setActiveFilters({ startDate: '2026-02-01', endDate: todayStr });
        } else {
            setDashboardMode('TODAY');
            setStartDate(todayStr);
            setEndDate(todayStr);
            setActiveFilters({ startDate: '', endDate: '' });
        }
        setTicksElapsed(0);
    };

    const handleNavigateLeft = () => {
        if (dashboardMode === 'TODATE') {
            setDashboardMode('TODAY');
            setStartDate(todayStr);
            setEndDate(todayStr);
            setActiveFilters({ startDate: '', endDate: '' });
        } else {
            setDashboardMode('TODATE');
            setStartDate('2026-02-01');
            setEndDate(todayStr);
            setActiveFilters({ startDate: '2026-02-01', endDate: todayStr });
        }
        setTicksElapsed(0);
    };

    const handleTableDataCalculated = useCallback(() => {}, []);

    // Helper functions to bridge library's Date objects with your system's ISO string states
    const parseStringToDate = (dateStr) => {
        if (!dateStr) return new Date();
        const [year, month, day] = dateStr.split('-');
        return new Date(year, month - 1, day);
    };

    const formatDateToString = (dateObj) => {
        if (!dateObj) return '';
        const offset = dateObj.getTimezoneOffset();
        const adjustedDate = new Date(dateObj.getTime() - (offset * 60 * 1000));
        return adjustedDate.toISOString().split('T')[0];
    };

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
            dispatched: { label: `DRIVER ASSIGNED`, grad: "hmp-grad-orange", lblClass: "label-orange", count: s.dispatched, gallons: s.dispatched_gallons, amount: s.dispatched_amount, isTatCard: false, aging: s.assigned_max_aging },
            pending: { label: `NOT ASSIGNED`, grad: "hmp-grad-red", lblClass: "label-red", count: s.pending, gallons: s.pending_gallons, amount: s.pending_amount, isTatCard: false, aging: s.pending_max_aging },
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

        const shouldShowPercentage = ['completed', 'dispatched', 'pending', 'cancelled'].includes(cardType);
        const totalCreated = Number(s.created) || 0;
        const currentCount = Number(cfg.count) || 0;
        const percentageStr = totalCreated > 0 ? ((currentCount / totalCreated) * 100).toFixed(2) : "0.00";

        return (
            <div className={`hmp-card ${cfg.grad}`} style={{ display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center', padding: '10px 12px', height: '100%' }}>
                <div className="hmp-main-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span className={`hmp-label ${cfg.lblClass}`} style={{ fontSize: '35px' }}>{cfg.label}</span>
                        {shouldShowPercentage && (
                            <span className={cfg.lblClass} style={{ fontSize: '35px', fontWeight: 'bold', marginTop: '2px' }}>
                                {percentageStr}%
                            </span>
                        )}
                    </div>
                    <span className="hmp-total" style={{ fontSize: '45px', fontWeight: 'bold' }}>{fmt(cfg.count)}</span>
                </div>
                {cfg.isCancelledCard && type === 'OTS' && (
                    <div className="hmp-sub-row" style={{ display: 'flex', justifyContent: 'space-between', border: 'none', paddingTop: '2px', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '2px', fontSize: '35px', color: '#8a99a8' }}>
                        <span style={{ color: 'white' }}>Consumer: <strong>{fmt(s.cancelled_consumer)}</strong></span>
                        <span style={{ color: 'white' }}>Hydrant: <strong>{fmt(s.cancelled_hydrant)}</strong></span>
                    </div>
                )}
                <div className="hmp-sub-row" style={{ display: 'flex', justifyContent: 'space-between', border: 'none', paddingTop: '1px', fontSize: '30px', color: '#be66e3', fontWeight: 'bold' }}>
                    <span>GALLONS:</span>
                    <strong>{Number(cfg.gallons) >= 1000000 ? fmtLargeUnits(cfg.gallons) : `${fmt(cfg.gallons)}`}</strong>
                </div>
                {cfg.aging && (
                    <div className="hmp-sub-row" style={{ display: 'flex', justifyContent: 'flex-start', border: 'none', paddingTop: '1px' }}>
                        <span className={`hmp-label ${cfg.lblClass}`} style={{ fontSize: '30px' }}>Max Aging: {cfg.aging}</span>
                    </div>
                )}
{/* --- ADD NEW DIV FOR TO DATE MINUS TODAY COUNT --- */}
                {dashboardMode === 'TODAY' && toDateSnapshot && ['dispatched', 'pending'].includes(cardType) && (
                    (() => {
                        const targetGroup = key === 'daily_ots' ? 'ots' : 'orders';
                        const targetProp = cardType === 'dispatched' 
                            ? (key === 'daily_ots' ? 'ots_dispatched_today' : 'hmp-dispatched_today') // match your backend object key
                            : (key === 'daily_ots' ? 'ots_pending_today' : 'hmp_pending_today');
                        
                        // Fallback handling checking the structural breakdown
                        const snapshotVal = Number(toDateSnapshot[targetGroup]?.[targetProp === 'hmp-dispatched_today' ? 'hmp_dispatched_today' : targetProp]) || 0;
                        const totalDiff = Math.max(0, snapshotVal - Number(cfg.count));

                        return (
                            <div className="hmp-sub-row" style={{ display: 'flex', justifyContent: 'flex-start', border: 'none', paddingTop: '4px', borderTop: '1px dashed rgba(255,255,255,0.15)', marginTop: '4px' }}>
                                <span style={{ fontSize: '28px', color: '#a0aec0', fontWeight: 'bold' }}>
                                    Backlog (To Date - Today): <strong style={{ color: '#fff' }}>{fmt(totalDiff)}</strong>
                                </span>
                            </div>
                        );
                    })()
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

    // Shared layout wrapper object for consistent picker input text sizes
    const datePickerInputStyle = {
        background: '#222',
        color: '#fff',
        border: '1px solid #777',
        borderRadius: '4px',
        padding: '12px 50px 12px 20px', // Increased right padding to leave space for icon
        fontSize: '28px',
        fontWeight: 'bold',
        cursor: 'pointer',
        width: isMobile ? '100%' : '260px'
    };

    return (
        <div 
            className="hydrant-kpi-dashboard-wrapper animate-fade-in" 
            style={{ padding: '20px', color: '#fff', display: 'flex', flexDirection: 'column', gap: '0px', width: '100%', position: 'relative' }}
        >
            {/* ==================== CONTROL BOX ==================== */}
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
                    {/* Configured format to dd-MM-yyyy with relative positioning container */}
                    <div style={{ position: 'relative', display: 'inline-block', width: isMobile ? '100%' : 'auto' }}>
                        <DatePicker
                            selected={parseStringToDate(startDate)}
                            onChange={(date) => setStartDate(formatDateToString(date))}
                            dateFormat="dd-MM-yyyy"
                            className="custom-dashboard-datepicker"
                            customInput={<input style={datePickerInputStyle} />}
                        />
                        <svg 
                            style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', width: '30px', height: '30px', color: '#fff', pointerEvents: 'none' }} 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor" 
                            strokeWidth="2"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: '20px', color: '#fff', fontWeight: 'bold' }}>To:</label>
                    {/* Configured format to dd-MM-yyyy with relative positioning container */}
                    <div style={{ position: 'relative', display: 'inline-block', width: isMobile ? '100%' : 'auto' }}>
                        <DatePicker
                            selected={parseStringToDate(endDate)}
                            onChange={(date) => setEndDate(formatDateToString(date))}
                            dateFormat="dd-MM-yyyy"
                            className="custom-dashboard-datepicker"
                            customInput={<input style={datePickerInputStyle} />}
                        />
                        <svg 
                            style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', width: '30px', height: '30px', color: '#fff', pointerEvents: 'none' }} 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor" 
                            strokeWidth="2"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
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
                
                <div className="hmp-group-label hmp-lbl-today" style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: isMobile ? 'flex-start' : 'space-between', gap: '16px', width: '100%', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.3)', padding: '0 14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', marginTop:'-10px' }}>
                        <button 
                            onClick={handleNavigateLeft}
                            title="Toggle Dashboard Mode"
                            style={{ background: 'none', border: 'none', color: themeColor, fontSize: '60px', fontWeight: 'bolder', cursor: 'pointer', padding: '0 20px' }}
                        >
                            &#8592;
                        </button>
                        <span style={{ fontSize: isMobile ? '22px' : '40px', fontWeight: 'bold', letterSpacing: '0.5px', whiteSpace: 'nowrap', minWidth: isMobile ? 'auto' : '190px', textAlign: 'center', color: themeColor, transition: 'color 0.4s ease' }}>
                            {getHeaderTitle()}
                        </span>
                        <button 
                            onClick={handleNavigateRight}
                            title="Toggle Dashboard Mode"
                            style={{ background: 'none', border: 'none', color: themeColor, fontSize: '60px', fontWeight: 'bolder', cursor: 'pointer', padding: '0 20px' }}
                        >
                            &#8594;
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch', marginTop: '30px', position: 'relative' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: 'calc((100% / 6.5) * 0.5 + ((100% / 6.5) * 2) - 4px)', width: 'calc((100% / 6.5) * 2 + 8px)', top: '-38px', bottom: '-9px', border: '1px solid rgba(191, 84, 46, 0.99)', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', zIndex: 1, pointerEvents: 'none', display: isMobile ? 'none' : 'block' }}>
                            <div style={{ position: 'absolute', top: '-17px', left: '50%', transform: 'translateX(-50%)', padding: '0 12px', fontSize: '35px', backgroundColor: '#111622', fontWeight: 'bold', color: '#ff4d4f', whiteSpace: 'nowrap' }}>
                                Pending Orders
                            </div>
                        </div>

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

                <div style={{ width: '100%', marginTop: '20px' }}>
                    <HydrantPercentageStats activeFilters={activeFilters} dashboardMode={dashboardMode} />
                </div>
                
                {(dashboardMode === 'TODATE' || dashboardMode === 'CUSTOM') && (
                    <div style={{ width: '100%', marginTop: '24px' }}>
                        <HydrantCharts activeFilters={activeFilters} />
                    </div>
                )}

                <div style={{ width: '100%', marginTop: '20px' }}>
                    <HydrantPercentageStats2 activeFilters={activeFilters} />
                </div>

                <div style={{ width: '100%', marginTop: '24px' }}>
                    <HydrantCategoryTable activeFilters={activeFilters} onDataCalculated={handleTableDataCalculated} />
                </div>
            </div>
        </div>
    );
};

export default HydrantKPIDashboard;