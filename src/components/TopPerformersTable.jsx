import React from 'react';

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
            <th>Res</th>
            <th>Rate</th>
            <th>Time</th>
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
                <td style={{ color: 'var(--green-ok)', fontWeight: 'bold' }}>{eng.resolved_count}</td>
                <td style={{ color: 'var(--water-blue)', fontWeight: 'bold' }}>{eng.resolution_percentage}%</td>
                <td style={{ color: '#e6e650', fontWeight: 'bold' }}>
                  {Math.floor(eng.avg_res_time)}h {Math.round((eng.avg_res_time % 1) * 60)}m
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                No performance data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TopPerformersTable;