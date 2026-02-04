
const TopPerformersTable = ({ title, data }) => {
    return (
        <div className="sub-panel">
            <h2 className="top-header-pulse" style={{ color: 'var(--green-ok)', marginBottom: '5px', fontSize: '0.85rem' }}>
                <i className="fas fa-star"></i> {title}
            </h2>
            <table>
                <thead>
                    <tr>
                        <th>Name (Town)</th>
                        <th>Resolved/Total</th>
                        <th>Pending Rate</th>
                        <th>Resolution Time (Avg) </th>
                    </tr>
                </thead>
                <tbody>
                    {data?.length > 0 ? (
                        data.map((eng, idx) => (
                            <tr key={idx}>
                                <td style={{ lineHeight: '1.2' }}>
                                    <span style={{ fontWeight: 'bold' }}>{eng.xen_name}</span><br />
                                    <small style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>{eng.town_name}</small>
                                </td>
                                <td style={{ color: 'var(--green-ok)', fontWeight: 'bold' }}>
                                    {eng.resolved_count}/{eng.total_count}
                                </td>
                                <td style={{ color: 'var(--red-crit)', fontWeight: 'bold' }}>{eng.pending_rate}% ({eng.pending_count})</td>
                                <td style={{ color: '#e6e650', fontWeight: 'bold' }}>
                                {eng.avg_res_time || "Resolved None"}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.7rem' }}>No data</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default TopPerformersTable;