
const UnderperformingTable = ({ data, TypeData, title, typeColor, iconClass }) => {
    const themeClass = typeColor === "#38bdf8" ? "water-theme" : "sewer-theme";
    const accentColor = typeColor;
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
                                <span style={{ fontWeight: 'bold' }}>{eng.xen_name}</span><br />
                                <small style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{eng.town_name}</small>
                            </td>
                            <td style={{ fontWeight: 'bold' , color:  'var(--red-crit)' }}>{eng.pending_count}/{eng.total_count}</td>
                            <td style={{ color:  'var(--green-ok)' }}>
                                {eng.resolution_percentage}% ({eng.resolved_count})
                            </td>
                            <td style={{ color: '#e6e650', fontWeight: 'bold' }}>
                                {eng.avg_res_time || "0"}
                            </td>
                        </tr>
                    );
                    })}
                </tbody>
            </table>

            {/* Trending Types Card */}
            <div className={`type-card ${themeClass}`}>
                <div className="type-header">
                    <i className="fas fa-chart-line"></i> Trending Types (Last 3 Months)
                </div>
                
                {/* Header Row */}
                <div className="type-row-data header-row">
                    <span className="col-type">Complaint Type</span>
                    <span className="col-num" style={{color: accentColor}}>Registered</span>
                    <span className="col-num" style={{color: 'var(--green-ok)'}}>Resolved</span>
                    <span className="col-num" style={{color: '#fbbf24'}}>WIP</span>
                    <span className="col-num" style={{color: 'var(--red-crit)'}}>Pending</span>
                </div>

                {/* Data Rows */}
                {TypeData?.map((item, idx) => (
                    <div key={idx} className="type-row-data">
                        <span className="col-type" title={item.subtype_name}>{item.subtype_name}</span>
                        <span className="col-num">{item.total_registered}</span>
                        <span className="col-num">{item.total_resolved}</span>
                        <span className="col-num">{item.total_wip}</span>
                        <span className="col-num">{item.total_pending}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UnderperformingTable;