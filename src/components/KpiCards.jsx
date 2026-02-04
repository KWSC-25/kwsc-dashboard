
const KpiCards = ({ stats }) => {
  if (!stats) return null;

  const calculatePercent = (val) => ((val / stats.total_registered) * 100).toFixed(1);
  
  const resolvedTrend = stats.total_resolved_yesterday > 0 
    ? (((stats.total_resolved - stats.total_resolved_yesterday) / stats.total_resolved_yesterday) * 100).toFixed(1) 
    : "0.0";

  const pendingTrend = stats.total_pending_yesterday > 0 
    ? (((stats.total_pending - stats.total_pending_yesterday) / stats.total_pending_yesterday) * 100).toFixed(1) 
    : "0.0";
  const renderTrend = (value, isInverse = false) => {
    const num = parseFloat(value);
    if (num === 0) return <span>{value}%</span>;
    const isPositive = num > 0;
    const color = isInverse 
      ? (isPositive ? 'var(--red-crit)' : 'var(--green-ok)') 
      : (isPositive ? 'var(--green-ok)' : 'var(--red-crit)');
    
    const icon = isPositive ? 'fa-arrow-up' : 'fa-arrow-down';

    return (
      <span style={{ color, fontWeight: 'bold' }}>
        <i className={`fas ${icon}`} style={{ marginRight: '4px', fontSize: '0.7rem' }}></i>
        {Math.abs(num)}%
      </span>
    );
  };

  return (
    <div className="kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
      
      {/* Total Registered */}
      <div className="kpi-card blue">
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="kpi-label">Total Registered</div>
          <div className="kpi-main-val" style={{ lineHeight: '1' }}>
            {Number(stats.total_registered).toLocaleString()}
          </div>
          
          {/* NEW: Today Count Highlighted */}
          <div style={{ 
            marginTop: '8px', 
            padding: '4px 8px', 
            background: 'rgba(255, 255, 255, 0.1)', 
            borderRadius: '4px',
            width: 'fit-content'
          }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold', marginRight: '5px' }}>TODAY:</span>
            <span style={{ fontSize: '1.2rem', color: '#fbbf24', fontWeight: '800' }}>
              {Number(stats.total_registered_today || 0).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="kpi-split" style={{ textAlign: 'right', borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '4px' }}>
            <div><span className="split-label">Water</span><span className="split-item" style={{ color: 'var(--water-blue)' }}>{stats.total_registered_water}</span></div>
            <div><span className="split-label">Sew</span><span className="split-item" style={{ color: 'var(--sew-purple)' }}>{stats.total_registered_sewer}</span></div>
            <div><span className="split-label">Bill</span><span className="split-item" >{stats.total_registered_bill}</span></div>
            <div><span className="split-label">Bulk</span><span className="split-item" >{stats.total_registered_bulk}</span></div>
            <div><span className="split-label">New Conn</span><span className="split-item" >{stats.total_registered_new_conn}</span></div>

          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '4px' }}>
            <div><span className="split-label">Social</span><span className="split-item" >{stats.total_registered_social}</span></div>
            <div><span className="split-label">HYD</span><span className="split-item" >{stats.total_registered_hyd}</span></div>
            <div><span className="split-label">Info</span><span className="split-item">{stats.total_registered_req}</span></div>
            <div><span className="split-label">Others</span><span className="split-item" >{stats.total_registered_other}</span></div>
          </div>
        </div>
      </div>

      {/* Resolved */}
      <div className="kpi-card green">
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="kpi-label">Resolved</div>
            <div className="kpi-val-group">
              <div className="kpi-main-val">{Number(stats.total_resolved).toLocaleString()}</div>
              <div className="kpi-percent2" style={{ color: 'var(--green-ok)' }}>{calculatePercent(stats.total_resolved)}%</div>
            </div>
          </div>

          {/* Flex container for Trend and Today Badge */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginTop: '4px',
            gap: '8px' 
          }}>
            <span className="yesterday-stat" style={{ whiteSpace: 'nowrap' }}>
              From yesterday: <span className="stat-highlight">{renderTrend(resolvedTrend)}</span>
            </span>

            {/* Today Resolved Badge */}
            <div style={{ 
              background: 'rgba(74, 222, 128, 0.2)', // Light green translucent background
              padding: '1px 10px', 
              borderRadius: '4px', 
              border: '1px solid rgba(74, 222, 128, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 'bold' }}>TODAY:</span>
              <span style={{ fontSize: '1rem', color: 'var(--green-ok)', fontWeight: '500' }}>
                {Number(stats.total_resolved_today || 0).toLocaleString()}
              </span>
            </div>
          </div>
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
          <span className="yesterday-stat">From yesterday: <span className="stat-highlight bad">{renderTrend(pendingTrend, true)}</span></span>
        </div>
        <div className="kpi-split" style={{ textAlign: 'right', borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '4px' }}>
            <div><span className="split-label">Water</span><span className="split-item" style={{ color: 'var(--red-crit)' }}>{stats.total_pending_water}</span></div>
            <div><span className="split-label">Sew</span><span className="split-item" style={{ color: 'var(--red-crit)' }}>{stats.total_pending_sewer}</span></div>
            <div><span className="split-label">Bill</span><span className="split-item"style={{ color: 'var(--red-crit)' }} >{stats.total_pending_bill}</span></div>
            <div><span className="split-label">Bulk</span><span className="split-item" style={{ color: 'var(--red-crit)' }} >{stats.total_pending_bulk}</span></div>
            <div><span className="split-label">Social</span><span className="split-item"style={{ color: 'var(--red-crit)' }} >{stats.total_pending_social}</span></div>

          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '4px' }}>

            <div><span className="split-label">New Conn</span><span className="split-item" style={{ color: 'var(--red-crit)' }} >{stats.total_pending_new_conn}</span></div>
            <div><span className="split-label">HYD</span><span className="split-item" style={{ color: 'var(--red-crit)' }} >{stats.total_pending_hyd}</span></div>
            <div><span className="split-label">Info</span><span className="split-item" style={{ color: 'var(--red-crit)' }}>{stats.total_pending_req}</span></div>
            <div><span className="split-label">Others</span><span className="split-item" style={{ color: 'var(--red-crit)' }} >{stats.total_pending_other}</span></div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default KpiCards;