import React from 'react';

const KpiCards = ({ stats }) => {
  if (!stats) return null;

  const calculatePercent = (val) => ((val / stats.total_registered) * 100).toFixed(1);
  
  const resolvedTrend = stats.total_resolved_yesterday > 0 
    ? (((stats.total_resolved - stats.total_resolved_yesterday) / stats.total_resolved_yesterday) * 100).toFixed(1) 
    : "0.0";

  const pendingTrend = stats.total_pending_yesterday > 0 
    ? (((stats.total_pending - stats.total_pending_yesterday) / stats.total_pending_yesterday) * 100).toFixed(1) 
    : "0.0";

  return (
    <div className="kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
      
      {/* Total Registered */}
      <div className="kpi-card blue">
        <div>
          <div className="kpi-label">Total Registered</div>
          <div className="kpi-main-val">{Number(stats.total_registered).toLocaleString()}</div>
        </div>
        <div className="kpi-split" style={{ textAlign: 'right', borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '4px' }}>
            <div><span className="split-label">Water</span><span className="split-item" style={{ color: 'var(--water-blue)' }}>{stats.total_registered_water}</span></div>
            <div><span className="split-label">Sew</span><span className="split-item" style={{ color: 'var(--sew-purple)' }}>{stats.total_registered_sewer}</span></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '4px' }}>
            <div><span className="split-label">OTHERS</span><span className="split-item" style={{ color: 'yellow' }}>{stats.total_registered_others}</span></div>
            <div><span className="split-label">TODAY</span><span className="split-item" style={{ color: 'white' }}>{stats.total_registered_today}</span></div>
          </div>
        </div>
      </div>

      {/* Resolved */}
      <div className="kpi-card green">
        <div>
          <div className="kpi-label">Resolved</div>
          <div className="kpi-val-group">
            <div className="kpi-main-val">{Number(stats.total_resolved).toLocaleString()}</div>
            <div className="kpi-percent2" style={{ color: 'var(--green-ok)' }}>{calculatePercent(stats.total_resolved)}%</div>
          </div>
          <span className="yesterday-stat">From yesterday <span className="stat-highlight">{resolvedTrend}%</span></span>
        </div>
        <div className="kpi-split" style={{ textAlign: 'right', borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '4px' }}>
            <div><span className="split-label">Water</span><span className="split-item" style={{ color: 'var(--green-ok)' }}>{stats.total_resolved_water}</span></div>
            <div><span className="split-label">Sew</span><span className="split-item" style={{ color: 'var(--green-ok)' }}>{stats.total_resolved_sewer}</span></div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2px' }}>
            <span className="split-label" style={{ color: 'yellow' }}>Others </span>
            <span className="split-item" style={{ color: 'yellow', display: 'inline' }}>{stats.total_resolved_others}</span>
          </div>
        </div>
      </div>

      {/* WIP */}
      <div className="kpi-card yellow">
        <div>
          <div className="kpi-label">Work In Progress</div>
          <div className="kpi-val-group">
            <div className="kpi-main-val">{Number(stats.total_wip).toLocaleString()}</div>
            <div className="kpi-percent2">{calculatePercent(stats.total_wip)}%</div>
          </div>
        </div>
        <div className="kpi-split" style={{ textAlign: 'right', borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '4px' }}>
            <div><span className="split-label">Water</span><span className="split-item" style={{ color: 'var(--yellow-wip)' }}>{stats.total_wip_water}</span></div>
            <div><span className="split-label">Sew</span><span className="split-item" style={{ color: 'var(--yellow-wip)' }}>{stats.total_wip_sewer}</span></div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2px' }}>
            <span className="split-label" style={{ color: 'yellow' }}>Others </span>
            <span className="split-item" style={{ color: 'yellow', display: 'inline' }}>{stats.total_wip_others}</span>
          </div>
        </div>
      </div>

      {/* Pending */}
      <div className="kpi-card red">
        <div>
          <div className="kpi-label">Pending</div>
          <div className="kpi-val-group">
            <div className="kpi-main-val" style={{ color: 'var(--red-crit)' }}>{Number(stats.total_pending).toLocaleString()}</div>
            <div className="kpi-percent2">{calculatePercent(stats.total_pending)}%</div>
          </div>
          <span className="yesterday-stat">From yesterday <span className="stat-highlight bad">{pendingTrend}%</span></span>
        </div>
        <div className="kpi-split" style={{ textAlign: 'right', borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '4px' }}>
            <div><span className="split-label">Water</span><span className="split-item" style={{ color: 'var(--red-crit)' }}>{stats.total_pending_water}</span></div>
            <div><span className="split-label">Sew</span><span className="split-item" style={{ color: 'var(--red-crit)' }}>{stats.total_pending_sewer}</span></div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2px' }}>
            <span className="split-label" style={{ color: 'yellow' }}>Others </span>
            <span className="split-item" style={{ color: 'yellow', display: 'inline' }}>{stats.total_pending_others}</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default KpiCards;