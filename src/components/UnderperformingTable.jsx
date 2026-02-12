
const UnderperformingTable = ({ data, TypeData, title, typeColor, iconClass, onEngineerClick}) => {
const themeClass = typeColor === "#38bdf8" ? "water-theme" : "sewer-theme";
    const isSewer = themeClass === "sewer-theme";const maxPendingRate = data?.length > 0 
    ? Math.max(...data.map(e => parseFloat(e.pending_rate))) 
    : 0;
// Logic to calculate the Totals for Sewerage
    const calculateSewTotals = () => {
        if (!TypeData || TypeData.length === 0) return null;
        
        return TypeData.reduce((acc, curr) => {
            return {
                subtype_name: "TOTAL",
                // Use Number() to force addition instead of concatenation
                total_registered: (Number(acc.total_registered) || 0) + Number(curr.total_registered),
                total_resolved: (Number(acc.total_resolved) || 0) + Number(curr.total_resolved),
                total_wip: (Number(acc.total_wip) || 0) + Number(curr.total_wip),
                total_pending: (Number(acc.total_pending) || 0) + Number(curr.total_pending),
                isTotalRow: true
            };
        }, { 
            total_registered: 0, 
            total_resolved: 0, 
            total_wip: 0, 
            total_pending: 0 
        });
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

                            {/* Data Rows */}
                            {TypeData?.map((item, idx) => (
                                <div key={idx} className="type-row-data">
                                    <span className="col-type">{item.subtype_name}</span>
                                    <span className="col-num">{item.total_registered}</span>
                                    <span className="col-num">{item.total_resolved}</span>
                                    <span className="col-num">{item.total_wip}</span>
                                    <span className="col-num">{item.total_pending}</span>
                                    <span className="col-num" style={{fontWeight: 'bold', color: 'yellow'}}>
                                        {item.impact_percentage}%
                                    </span>
                                </div>
                            ))}

                            {/* Conditional Sum Row for Sewerage */}
                            {isSewer && sewTotalRow && (
                                <div className="type-row-data total-row" style={{ borderTop: '2px solid #a78bfa', background: 'rgba(167, 139, 250, 0.1)' }}>
                                    <span className="col-type" style={{ fontWeight: 'bold' }}>{sewTotalRow.subtype_name}</span>
                                    <span className="col-num" style={{ fontWeight: 'bold' }}>{sewTotalRow.total_registered}</span>
                                    <span className="col-num" style={{ fontWeight: 'bold' }}>{sewTotalRow.total_resolved}</span>
                                    <span className="col-num" style={{ fontWeight: 'bold' }}>{sewTotalRow.total_wip}</span>
                                    <span className="col-num" style={{ fontWeight: 'bold' }}>{sewTotalRow.total_pending}</span>
                                    <span className="col-num">-</span> {/* No impact for total row per req */}
                                </div>
                            )}
                        </div>
                    </div>
    );
};
export default UnderperformingTable;