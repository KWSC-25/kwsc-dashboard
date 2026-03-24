import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const HmpKpiCards = () => {
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchHmpData = async () => {
            try {
                const resp = await api.get('/hmp-kpi');
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
        daily: {
            title: "DAILY ORDERS",
            created: Number(ots.total_ots_today || 0) + Number(orders.hmp_created_today || 0),
            ots_c: ots.total_ots_today,
            hmp_c: orders.hmp_created_today,
            dispatched: orders.total_dispatched_today,
            ots_d: orders.ots_dispatched_today,
            hmp_d: orders.hmp_dispatched_today,
            completed: orders.total_completed_today,
            ots_comp: orders.ots_completed_today,
            hmp_comp: orders.hmp_completed_today,
            cancelled: Number(ots.cancelled_ots_hmp_today || 0) + Number(ots.cancelled_ots_consumer_today || 0),
            by_hmp: ots.cancelled_ots_hmp_today,
            by_cons: ots.cancelled_ots_consumer_today,
            pending: ots.pending_ots_today,
            gal_total: gallons.total_gallons_today,
            gal_gps: gallons.total_gallons_gps_today,
            gal_comm: gallons.total_gallons_comm_today,
            gal_gps_per: Number(gallons.total_gallons_gps_today / gallons.total_gallons_today * 100).toFixed(2),
            gal_comm_per: Number(gallons.total_gallons_comm_today / gallons.total_gallons_today * 100).toFixed(2)
        },
        monthly: {
            title: "MONTHLY ORDERS",
            created: Number(ots.total_ots_month || 0) + Number(orders.hmp_created_month || 0),
            ots_c: ots.total_ots_month,
            hmp_c: orders.hmp_created_month,
            dispatched: Number(orders.total_dispatched_month) + Number(orders.total_completed_month),
            ots_d: Number(orders.ots_dispatched_month) + Number(orders.ots_completed_month) ,
            hmp_d: Number(orders.hmp_dispatched_month) + Number(orders.hmp_completed_month),
            completed: orders.total_completed_month,
            ots_comp: orders.ots_completed_month,
            hmp_comp: orders.hmp_completed_month,
            cancelled: Number(ots.cancelled_ots_hmp_month || 0) + Number(ots.cancelled_ots_consumer_month || 0),
            by_hmp: ots.cancelled_ots_hmp_month,
            by_cons: ots.cancelled_ots_consumer_month,
            pending: ots.pending_ots_month,
            gal_total: gallons.total_gallons_month,
            gal_gps: gallons.total_gallons_gps_month,
            gal_comm: gallons.total_gallons_comm_month,
            gal_gps_per: Number(gallons.total_gallons_gps_month / gallons.total_gallons_month * 100).toFixed(2),
            gal_comm_per: Number(gallons.total_gallons_comm_month / gallons.total_gallons_month * 100).toFixed(2)
        }
    };

    const renderKpiRow = (key, labelClass, groupClass) => {
        const s = stats[key];
        
        // Calculate Percentages for the Balance Bar
        const totalGal = Number(s.gal_total) || 0; 
        const otsPerc = totalGal > 0 ? (Number(s.gal_gps) / totalGal) * 100 : 0;
        const hmpPerc = totalGal > 0 ? (Number(s.gal_comm) / totalGal) * 100 : 0;

        return (
            <div className={`hmp-kpi-group-wrapper ${groupClass}`}>
                <div className={`hmp-group-label ${labelClass}`}>{s.title}</div>
                <div className="hmp-kpi-grid">
                    {/* 1. Created */}
                    <div className="hmp-card hmp-grad-cyan">
                        <div className="hmp-main-row">
                            <span className="hmp-label label-cyan">TOTAL ORDERS CREATED</span>
                            <span className="hmp-total">{fmt(s.created)}</span>
                        </div>
                        <div className="hmp-sub-row">
                            <div className="hmp-sub-stat">OTS: <span className="label-cyan">{fmt(s.ots_c)}</span></div>
                            <div className="hmp-sub-stat">HMP: <span className="label-cyan">{fmt(s.hmp_c)}</span></div>
                        </div>
                    </div>

                    {/* 2. Dispatched */}
                    <div className="hmp-card hmp-grad-orange">
                        <div className="hmp-main-row">
                            <span className="hmp-label label-orange">TOTAL DISPATCHED</span>
                            <span className="hmp-total">{fmt(s.dispatched)}</span>
                        </div>
                        <div className="hmp-sub-row">
                            <div className="hmp-sub-stat">OTS: <span className="label-orange">{fmt(s.ots_d)}</span></div>
                            <div className="hmp-sub-stat">HMP: <span className="label-orange">{fmt(s.hmp_d)}</span></div>
                        </div>
                    </div>

                    {/* 3. Completed */}
                    <div className="hmp-card hmp-grad-green">
                        <div className="hmp-main-row">
                            <span className="hmp-label label-green">TOTAL COMPLETED</span>
                            <span className="hmp-total">{fmt(s.completed)}</span>
                        </div>
                        <div className="hmp-sub-row">
                            <div className="hmp-sub-stat">OTS: <span className="label-green">{fmt(s.ots_comp)}</span></div>
                            <div className="hmp-sub-stat">HMP: <span className="label-green">{fmt(s.hmp_comp)}</span></div>
                        </div>
                    </div>

                    {/* 4. Cancelled */}
                    <div className="hmp-card hmp-grad-grey">
                        <div className="hmp-main-row">
                            <span className="hmp-label">TOTAL CANCELLED</span>
                            <span className="hmp-total">{fmt(s.cancelled)}</span>
                        </div>
                        <div className="hmp-sub-row">
                            <div className="hmp-sub-stat">BY CONSUMER: <span>{fmt(s.by_cons)}</span></div>
                            <div className="hmp-sub-stat">BY HMP: <span>{fmt(s.by_hmp)}</span></div>
                        </div>
                    </div>

                    {/* 5. Pending */}
                    <div className="hmp-card hmp-grad-red">
                        <div className="hmp-main-row">
                            <span className="hmp-label label-red">PENDING ORDERS (OTS)</span>
                            <span className="hmp-total">{fmt(s.pending)}</span>
                        </div>
                       
                    </div>

                    {/* 6. Gallons Balance Card */}
                    <div className="hmp-card hmp-grad-purple">
                        <div className="hmp-main-row">
                            <span className="hmp-label label-purple">TOTAL GALLONS USED</span>
                            <span className="hmp-total">{fmt(s.gal_total)}</span>
                        </div>
                        
                        {/* Balance Bar with 50% Target Marker */}
                        <div className="hmp-dist-bar-container">
                            <div className="hmp-target-marker"></div>
                            <div className="hmp-bar-ots" style={{ width: `${otsPerc}%` }}></div>
                            <div className="hmp-bar-hmp" style={{ width: `${hmpPerc}%` }}></div>
                        </div>

                        <div className="hmp-sub-row" style={{border: 'none', paddingTop: '4px'}}>
                            <div className="hmp-sub-stat">GPS/OTHERS: <span className="label-cyan">{fmt(s.gal_gps)} <span style={{ fontWeight: 'normal' }}> ({fmt(s.gal_gps_per)}%)</span></span></div>
                            <div className="hmp-sub-stat">COMMERCIAL: <span className="label-purple">{fmt(s.gal_comm)} <span style={{ fontWeight: 'normal' }}> ({fmt(s.gal_comm_per)}%)</span></span></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="hmp-dashboard-wrapper">
            {renderKpiRow('daily', 'hmp-lbl-today', 'hmp-grp-today')}
            {renderKpiRow('monthly', 'hmp-lbl-month', 'hmp-grp-month')}
        </div>
    );
};

export default HmpKpiCards;