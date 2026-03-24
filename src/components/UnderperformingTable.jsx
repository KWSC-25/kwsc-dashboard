import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const UnderperformingTable = ({ title, typeColor, iconClass, onEngineerClick, typeId, subTypeIds, onPopupToggle }) => {
    const [state, setState] = useState(null);
    // New state for the town-wise breakdown popup
    const [breakdown, setBreakdown] = useState({ visible: false, data: [], name: '' });

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [perfResp, typeResp] = await Promise.all([
                    api.get(`/performance/underperforming?typeId=${typeId}`),
                    api.get(`/type?typeId=${typeId}&subTypeIds=${subTypeIds}`)
                ]);
                setState({
                    performers: perfResp.data,
                    analytics: typeResp.data
                });
            } catch (err) {
                console.error("Underperforming Fetch Error:", err);
            }
        };

        fetchAll();
        const interval = setInterval(fetchAll, 30000);
        return () => clearInterval(interval);
    }, [typeId, subTypeIds]);

    // Add this inside the component
    useEffect(() => {
        if (onPopupToggle) onPopupToggle(breakdown.visible);
    }, [breakdown.visible, onPopupToggle]);

    // Function to fetch the town-wise breakdown without triggering slider reset
    const handleSubtypeClick = async (id, name) => {
        try {
            const resp = await api.get(`/type/breakdown?subTypeId=${id}`);
            setBreakdown({ visible: true, data: resp.data, name: name });
        } catch (err) {
            console.error("Error fetching breakdown:", err);
        }
    };

    if (!state) return <div className="loading-placeholder">Loading...</div>;

    const { performers: data, analytics: TypeData } = state;
    const themeClass = typeColor === "#38bdf8" ? "water-theme" : "sewer-theme";
    const isSewer = themeClass === "sewer-theme";

    const maxPendingRate = data?.length > 0 
        ? Math.max(...data.map(e => parseFloat(e.pending_rate))) 
        : 0;

    const calculateSewTotals = () => {
        if (!TypeData || TypeData.length === 0) return null;
        return TypeData.reduce((acc, curr) => ({
            subtype_name: "TOTAL",
            total_registered: (Number(acc.total_registered) || 0) + Number(curr.total_registered),
            total_resolved: (Number(acc.total_resolved) || 0) + Number(curr.total_resolved),
            total_wip: (Number(acc.total_wip) || 0) + Number(curr.total_wip),
            total_pending: (Number(acc.total_pending) || 0) + Number(curr.total_pending),
            isTotalRow: true
        }), { total_registered: 0, total_resolved: 0, total_wip: 0, total_pending: 0 });
    };

    const sewTotalRow = isSewer ? calculateSewTotals() : null;

    return (
        <div className="panel">
            <h2 style={{ color: typeColor }}>
                <i className={iconClass}></i> {title}
            </h2>
            <table>
                <thead>
                    <tr>
                        <th>Name (Town)</th>
                        <th>Pending/Total</th>
                        <th>Resolution Rate</th>
                        <th>Resolution Time (Avg)</th>
                    </tr>
                </thead>
                <tbody>
                  {data?.map((eng, idx) => {
                        const isWorstRate = parseFloat(eng.pending_rate) === maxPendingRate && maxPendingRate > 0;
                        return (
                            <tr key={idx} className={isWorstRate ? "row-alarm" : ""}>
                                <td style={{ lineHeight: '1.2' }}>
                                    <span 
                                        style={{ fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }} 
                                        onClick={() => onEngineerClick(eng.xen_name)}
                                    >
                                        {eng.xen_name}
                                    </span>                                 
                                    <br />
                                    <small style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{eng.town_name}</small>
                                </td>
                                <td style={{ fontWeight: 'bold' , color:  'var(--red-crit)' }}>{eng.pending_count}/{eng.total_count}</td>
                                <td style={{ color:  'var(--green-ok)' }}>
                                    {eng.resolution_percentage}% ({eng.resolved_count})
                                </td>
                                <td style={{ color: '#e6e650', fontWeight: 'bold' }}>
                                    {eng.avg_res_time || "Resolved None"}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <div className={`type-card ${themeClass}`}>
                <div className="type-header">
                    <i className="fas fa-chart-line"></i> Emergency Types Analytics (Overall)
                </div>
                
                <div className="type-row-data header-row">
                    <span className="col-type">Complaint Type</span>
                    <span className="col-num" style={{color: 'var(--water-blue)'}}>Reg.</span>
                    <span className="col-num" style={{color: 'var(--green-ok)'}}>Res.</span>
                    <span className="col-num" style={{color: '#fbbf24'}}>WIP</span>
                    <span className="col-num" style={{color: 'var(--red-crit)'}}>Pen.</span>
                    <span className="col-num">Impact %</span>
                </div>

                {TypeData?.map((item, idx) => (
                    <div key={idx} className="type-row-data">
                        <span 
                            className="col-type" 
                            style={{ cursor: 'pointer', textDecoration: 'underline' }}
                            onClick={() => handleSubtypeClick(item.subtype_id, item.subtype_name)}
                        >
                            {item.subtype_name}
                        </span>
                        <span className="col-num">{item.total_registered}</span>
                        <span className="col-num">{item.total_resolved}</span>
                        <span className="col-num">{item.total_wip}</span>
                        <span className="col-num">{item.total_pending}</span>
                        <span className="col-num" style={{fontWeight: 'bold', color: 'yellow'}}>
                            {item.impact_percentage}%
                        </span>
                    </div>
                ))}

                {isSewer && sewTotalRow && (
                    <div className="type-row-data total-row" style={{ borderTop: '2px solid #a78bfa', background: 'rgba(167, 139, 250, 0.1)' }}>
                        <span className="col-type" style={{ fontWeight: 'bold' }}>{sewTotalRow.subtype_name}</span>
                        <span className="col-num" style={{ fontWeight: 'bold' }}>{sewTotalRow.total_registered}</span>
                        <span className="col-num" style={{ fontWeight: 'bold' }}>{sewTotalRow.total_resolved}</span>
                        <span className="col-num" style={{ fontWeight: 'bold' }}>{sewTotalRow.total_wip}</span>
                        <span className="col-num" style={{ fontWeight: 'bold' }}>{sewTotalRow.total_pending}</span>
                        <span className="col-num">-</span>
                    </div>
                )}
            </div>

            {/* Town-wise Distribution Popup */}
            {breakdown.visible && (
                <div className="modal-overlay" onClick={() => setBreakdown({ ...breakdown, visible: false })}>
                    <div className="modal-content analytics-popup" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="title-group">
                                {/* Dynamic color: Sewer = purple, Water = blue */}
                                <h3 style={{ color: isSewer ? '#a78bfa' : '#38bdf8', margin: 0 }}>
                                    COMPLAINT TYPE: {breakdown.name}
                                </h3>
                                <small style={{ color: '#94a3b8' }}>TOWN-WISE DISTRIBUTION</small>
                            </div>
                            <button className="close-btn" onClick={() => setBreakdown({ ...breakdown, visible: false })}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <table className="popup-table">
                                <thead>
                                    <tr>
                                        <th align="left">TOWN NAME</th>
                                        <th>REG</th>
                                        <th>RES</th>
                                        <th>WIP</th>
                                        <th>PEN</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {breakdown.data.map((row, i) => (
                                        <tr key={i}>
                                            <td align="left" style={{ fontWeight: 'bold' }}>{row.town_name_emer}</td>
                                            <td style={{ color: '#38bdf8' }}>{row.total_registered_town}</td>
                                            <td style={{ color: '#4ade80' }}>{row.total_resolved_town}</td>
                                            <td style={{ color: '#fbbf24' }}>{row.total_wip_town}</td>
                                            <td style={{ color: '#f87171' }}>{row.total_pending_town}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="total-row-popup" style={{ fontWeight: 'bold', borderTop: '1px solid #444', height: '35px' }}>
                                        <td align="left">TOTAL</td>
                                        <td>{breakdown.data.reduce((a, b) => a + Number(b.total_registered_town || 0), 0)}</td>
                                        <td>{breakdown.data.reduce((a, b) => a + Number(b.total_resolved_town || 0), 0)}</td>
                                        <td>{breakdown.data.reduce((a, b) => a + Number(b.total_wip_town || 0), 0)}</td>
                                        <td>{breakdown.data.reduce((a, b) => a + Number(b.total_pending_town || 0), 0)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UnderperformingTable;