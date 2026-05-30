import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const HmpKpiCards = () => {
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchHmpData = async () => {
            try {
                const resp = await api.get('hmpkpis/hmp-kpi');
                setData(resp.data.data);
            } catch (err) {
                console.error("HMP KPI Fetch Error:", err);
            }
        };

        fetchHmpData();
        const interval = setInterval(fetchHmpData, 30000);
        return () => clearInterval(interval);
    }, []);

    if (!data || !data.ots || !data.orders || !data.gallons) {
        return <div className="hmp-loading">Fetching HMP Stats...</div>;
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
            cancelled_consumer:ots.ots_cancelled_consumer_today,
            cancelled_hydrant: ots.ots_cancelled_hmp_today
        },
        daily_hmp: {
            created: orders.hmp_created_today,
            dispatched: orders.hmp_dispatched_today,
            completed: orders.hmp_completed_today,
            cancelled: orders.hmp_cancelled_today,
            pending: orders.hmp_pending_today,
        },
        monthly_ots: {
            created: ots.total_created_ots_month,
            dispatched: ots.ots_dispatched_month,
            completed: ots.ots_completed_month,
            cancelled: Number(ots.ots_cancelled_consumer_month) + Number(ots.ots_cancelled_hmp_month),
            pending: ots.ots_pending_month,
            cancelled_consumer: ots.ots_cancelled_consumer_month,
            cancelled_hydrant: ots.ots_cancelled_hmp_month
        },
        monthly_hmp: {
            created: orders.hmp_created_month,
            dispatched: orders.hmp_dispatched_month,
            completed: orders.hmp_completed_month,
            cancelled: orders.hmp_cancelled_month,
            pending: orders.hmp_pending_month,
        },
        daily_gallons: {
            gal_total: gallons.total_gallons_today,
            gal_gps: gallons.total_gallons_gps_today,
            gal_comm: gallons.total_gallons_comm_today,
            gal_gps_per: Number(gallons.total_gallons_today > 0 ? (gallons.total_gallons_gps_today / gallons.total_gallons_today * 100) : 0).toFixed(2),
            gal_comm_per: Number(gallons.total_gallons_today > 0 ? (gallons.total_gallons_comm_today / gallons.total_gallons_today * 100) : 0).toFixed(2)
        },
        monthly_gallons: {
            gal_total: gallons.total_gallons_month,
            gal_gps: gallons.total_gallons_gps_month,
            gal_comm: gallons.total_gallons_comm_month,
            gal_gps_per: Number(gallons.total_gallons_month > 0 ? (gallons.total_gallons_gps_month / gallons.total_gallons_month * 100) : 0).toFixed(2),
            gal_comm_per: Number(gallons.total_gallons_month > 0 ? (gallons.total_gallons_comm_month / gallons.total_gallons_month * 100) : 0).toFixed(2)
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
                        <span className="hmp-label label-orange">TOTAL DISPATCHED {type}</span>
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
                            {type === 'OTS' ? 'TOTAL CANCELLED' : 'TOTAL CANCELLED'}
                        </span>
                        <span className="hmp-total">{fmt(s.cancelled)}</span>
                    </div>
                    
                    {/* Secondary row breakdown layer exclusively for OTS */}
                    {type === 'OTS' && (
                        <div className="hmp-sub-row" style={{ display: 'flex', justifyContent: 'space-between', border: 'none', paddingTop: '2px', fontSize: '10px', color: '#8a99a8' }}>
                            <span style={{ color: 'white',fontSize: '13px'}}>BY CONSUMER: <strong>{fmt(s.cancelled_consumer)}</strong></span>
                            <span style={{ color: 'white',fontSize: '13px'}}>BY HYDRANT: <strong>{fmt(s.cancelled_hydrant)}</strong></span>
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
                
                {/* Balance Bar with 50% Target Marker */}
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
        <div className="hmp-dashboard-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '0px', width: '100%' }}>
            
            {/* ==================== GLOBAL DAILY SECTION ==================== */}
            <div className="hmp-kpi-group-wrapper hmp-grp-today" style={{ display: 'flex', gap: '12px', alignItems: 'stretch', position: 'relative' }}>
                {/* Border-anchored Yellow Title */}
                <div className="hmp-group-label hmp-lbl-today" style={{ color: '#FFF200' }}>DAILY ORDERS</div>
                
                {/* Left Side Grid Panels */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* 1. DAILY OTS ROW */}
                    <div className="hmp-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '8px' }}>
                        {renderOrderCards('daily_ots', 'OTS')}
                    </div>
                    
                    {/* 2. DAILY HMP ROW */}
                    <div className="hmp-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '8px' }}>
                        {renderOrderCards('daily_hmp', 'HMP')}
                    </div>
                </div>

                {/* Right Side Gallons */}
                <div style={{ width: '22%', minWidth: '240px' }}>
                    {renderGallonsCard('daily_gallons', 'TOTAL GALLONS USED')}
                </div>
            </div>

            {/* ==================== GLOBAL MONTHLY SECTION ==================== */}
            <div className="hmp-kpi-group-wrapper hmp-grp-month" style={{ display: 'flex', gap: '12px', alignItems: 'stretch', position: 'relative', marginTop: '20px' }}>
                {/* Border-anchored Blue Title */}
                <div className="hmp-group-label hmp-lbl-month" style={{ color: '#38bdf8' }}>MONTHLY ORDERS</div>
                
                {/* Left Side Grid Panels */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* 3. MONTHLY OTS ROW */}
                    <div className="hmp-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '8px' }}>
                        {renderOrderCards('monthly_ots', 'OTS')}
                    </div>
                    
                    {/* 4. MONTHLY HMP ROW */}
                    <div className="hmp-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '8px' }}>
                        {renderOrderCards('monthly_hmp', 'HMP')}
                    </div>
                </div>

                {/* Right Side Gallons */}
                <div style={{ width: '22%', minWidth: '240px' }}>
                    {renderGallonsCard('monthly_gallons', 'TOTAL GALLONS USED')}
                </div>
            </div>

        </div>
    );
};

export default HmpKpiCards;