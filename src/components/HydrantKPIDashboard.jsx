import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const HydrantKPIDashboard = () => {
    const [data, setData] = useState(null);
    
    // Date filter component states
    const todayStr = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(todayStr);
    const [endDate, setEndDate] = useState(todayStr);
    const [activeFilters, setActiveFilters] = useState({ startDate: '', endDate: '' });

    // Fetches stats from the brand new controller path
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

    if (!data || !data.ots || !data.orders || !data.gallons) {
        return <div className="hmp-loading" style={{ color: '#fff', padding: '20px' }}>Fetching Hydrant KPI Stats...</div>;
    }

    const { ots, orders, gallons } = data;
    const fmt = (val) => (val ? Number(val).toLocaleString() : "0");

    const stats = {
        daily_ots: {
            created: ots.total_created_ots_today,
            dispatched: ots.ots_dispatched_today,
            completed: ots.ots_completed_today,
            cancelled: Number(ots.ots_cancelled_consumer_today) + Number(ots.ots_cancelled_hmp_today),
            pending: ots.ots_pending_today,
            cancelled_consumer: ots.ots_cancelled_consumer_today,
            cancelled_hydrant: ots.ots_cancelled_hmp_today
        },
        daily_hmp: {
            created: orders.hmp_created_today,
            dispatched: orders.hmp_dispatched_today,
            completed: orders.hmp_completed_today,
            cancelled: orders.hmp_cancelled_today,
            pending: orders.hmp_pending_today,
        },
        daily_gallons: {
            gal_total: gallons.total_gallons_today,
            gal_gps: gallons.total_gallons_gps_today,
            gal_comm: gallons.total_gallons_comm_today,
            gal_gps_per: Number(gallons.total_gallons_today > 0 ? (gallons.total_gallons_gps_today / gallons.total_gallons_today * 100) : 0).toFixed(2),
            gal_comm_per: Number(gallons.total_gallons_today > 0 ? (gallons.total_gallons_comm_today / gallons.total_gallons_today * 100) : 0).toFixed(2)
        }
    };

    const renderOrderCards = (key, type) => {
        const s = stats[key];
        return (
            <>
                {/* 1. Created */}
                <div className="hmp-card hmp-grad-cyan">
                    <div className="hmp-main-row">
                        <span className="hmp-label label-cyan">TOTAL CREATED {type}</span>
                        <span className="hmp-total">{fmt(s.created)}</span>
                    </div>
                </div>

                {/* 2. Dispatched */}
                <div className="hmp-card hmp-grad-orange">
                    <div className="hmp-main-row">
                        <span className="hmp-label label-orange">DRIVER ASSIGNED  {type}</span>
                        <span className="hmp-total">{fmt(s.dispatched)}</span>
                    </div>
                </div>

                {/* 3. Completed */}
                <div className="hmp-card hmp-grad-green">
                    <div className="hmp-main-row">
                        <span className="hmp-label label-green">TOTAL COMPLETED {type}</span>
                        <span className="hmp-total">{fmt(s.completed)}</span>
                    </div>
                </div>

                {/* 4. Cancelled */}
                <div className="hmp-card hmp-grad-grey" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div className="hmp-main-row">
                        <span className="hmp-label">
                            {type === 'OTS' ? 'TOTAL CANCELLED' : 'TOTAL CANCELLED ' + type}
                        </span>
                        <span className="hmp-total">{fmt(s.cancelled)}</span>
                    </div>
                    
                    {type === 'OTS' && (
                        <div className="hmp-sub-row" style={{ display: 'flex', justifyContent: 'space-between', border: 'none', paddingTop: '2px', fontSize: '10px', color: '#8a99a8' }}>
                            <span style={{ color: 'white', fontSize: '13px' }}>BY CONSUMER: <strong>{fmt(s.cancelled_consumer)}</strong></span>
                            <span style={{ color: 'white', fontSize: '13px' }}>BY HYDRANT: <strong>{fmt(s.cancelled_hydrant)}</strong></span>
                        </div>
                    )}
                </div>

                {/* 5. Pending */}
                <div className="hmp-card hmp-grad-red">
                    <div className="hmp-main-row">
                        <span className="hmp-label label-red">TOTAL PENDING {type}</span>
                        <span className="hmp-total">{fmt(s.pending)}</span>
                    </div>
                </div>
            </>
        );
    };

    const renderGallonsCard = (galKey, titleText) => {
        const g = stats[galKey];
        const totalGal = Number(g.gal_total) || 0; 
        const otsPerc = totalGal > 0 ? (Number(g.gal_gps) / totalGal) * 100 : 0;
        const hmpPerc = totalGal > 0 ? (Number(g.gal_comm) / totalGal) * 100 : 0;

        return (
            <div className="hmp-card hmp-grad-purple" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div className="hmp-main-row">
                    <span className="hmp-label label-purple">{titleText}</span>
                    <span className="hmp-total">{fmt(g.gal_total)}</span>
                </div>
                
                <div className="hmp-dist-bar-container">
                    <div className="hmp-target-marker"></div>
                    <div className="hmp-bar-ots" style={{ width: `${otsPerc}%` }}></div>
                    <div className="hmp-bar-hmp" style={{ width: `${hmpPerc}%` }}></div>
                </div>

                <div className="hmp-sub-row" style={{ border: 'none', paddingTop: '4px' }}>
                    <div className="hmp-sub-stat">GPS/OTHERS: <span className="label-cyan">{fmt(g.gal_gps)} <span style={{ fontWeight: 'normal' }}> ({fmt(g.gal_gps_per)}%)</span></span></div>
                    <div className="hmp-sub-stat">COMMERCIAL: <span className="label-purple">{fmt(g.gal_comm)} <span style={{ fontWeight: 'normal' }}> ({fmt(g.gal_comm_per)}%)</span></span></div>
                </div>
            </div>
        );
    };

    return (
        <div className="hydrant-kpi-dashboard-wrapper animate-fade-in" style={{ padding: '20px', color: '#fff', display: 'flex', flexDirection: 'column', gap: '0px', width: '100%' }}>
            
            {/* ==================== GLOBAL TODAY SECTION ==================== */}
            <div className="hmp-kpi-group-wrapper hmp-grp-today" style={{ display: 'flex', gap: '12px', alignItems: 'stretch', position: 'relative' }}>
                
                {/* Border-anchored Yellow Title + Custom Date Filter Toolbar Layer */}
                <div className="hmp-group-label hmp-lbl-today" style={{ color: '#FFF200', display: 'flex', alignItems: 'center', gap: '15px' }}>
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
                
                {/* Left Side Double Row Grid Layout (OTS Row and HMP Row inside 1 container) */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* 1. OTS ROW */}
                    <div className="hmp-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '8px' }}>
                        {renderOrderCards('daily_ots', 'OTS')}
                    </div>
                    
                    {/* 2. HMP ROW */}
                    <div className="hmp-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '8px' }}>
                        {renderOrderCards('daily_hmp', 'HMP')}
                    </div>
                </div>

                {/* Right Side Merged Today Gallons Segment */}
                <div style={{ width: '22%', minWidth: '240px' }}>
                    {renderGallonsCard('daily_gallons', 'TOTAL GALLONS USED')}
                </div>
            </div>

        </div>
    );
};

export default HydrantKPIDashboard;