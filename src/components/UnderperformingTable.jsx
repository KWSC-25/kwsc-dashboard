import React from 'react';

const UnderperformingTable = ({ data, idleData, title, typeColor, iconClass }) => {
const maxPendingRate = data?.length > 0 
    ? Math.max(...data.map(e => parseFloat(e.pending_rate))) 
    : 0;

    return (
        <div className="panel">
            <h2 style={{ color: typeColor }}>
                <i className={iconClass}></i> {title}
            </h2>
            <table>
                <thead>
                    <tr>
                        <th>Name (Town)</th>
                        <th>Pen/Total</th>
                        <th>Res Rate</th>
                        <th style={{ color: '#f87171' }}>Res Time (Avg)</th>
                    </tr>
                </thead>
                <tbody>
                  {data?.map((eng, idx) => {
                              const isWorstRate = parseFloat(eng.pending_rate) === maxPendingRate && maxPendingRate > 0;
                              return (
                                <tr key={idx} className={isWorstRate ? "row-alarm" : ""}>
                                  <td style={{ lineHeight: '1.2' }}>
                                <span style={{ fontWeight: 'bold' }}>{eng.xen_name}</span><br />
                                <small style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{eng.town_name}</small>
                            </td>
                            <td style={{ fontWeight: 'bold' }}>{eng.pending_count}/{eng.total_count}</td>
                            <td style={{ color: eng.resolution_percentage < 50 ? '#f87171' : 'inherit' }}>
                                {eng.resolution_percentage}%
                            </td>
                            <td style={{ color: '#f87171', fontWeight: 'bold' }}>
                                {Math.floor(eng.avg_res_time)}h {Math.round((eng.avg_res_time % 1) * 60)}m
                            </td>
                        </tr>
                    );
                    })}
                </tbody>
            </table>

            <div className="idle-card">
                <div className="idle-header">
                    <i className="fas fa-exclamation-triangle"></i> Idle complaints (need urgent action)
                </div>
                <div className="idle-row-data" style={{ fontWeight: 'bold', borderBottom: '1px solid #f87171', fontSize: '0.65rem' }}>
                    <span style={{ flex: '0.8' }}>Comp No.</span>
                    <span style={{ flex: '1.5' }}>Type</span>
                    <span style={{ flex: '1.5' }}>Town</span>
                    <span style={{ flex: '0.7', textAlign: 'right' }}>Overdue (Avg) </span>
                </div>
                {idleData?.map((item, idx) => (
                    <div key={idx} className="idle-row-data" style={{ display: 'flex', gap: '5px', fontSize: '0.65rem' }}>
                        <span style={{ flex: '0.8' }}>{item.complaint_no?.split('-')[1] || item.complaint_no}</span>
                        <span style={{ flex: '1.5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.type}</span>
                        <span style={{ flex: '1.5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.town}</span>
                        <span style={{ flex: '0.7', color: '#f87171', fontWeight: 'bold', textAlign: 'right' }}>{item.overdue_hrs}h</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UnderperformingTable;