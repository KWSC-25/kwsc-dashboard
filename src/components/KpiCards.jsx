
const KpiCards = ({ stats, assignments, today }) => {
  if (!stats || !assignments || !today) return null;

  const regToday = today?.total_registered_today || 0;
  const resToday = today?.total_resolved_today || 0;

  // Global % of total registered for the main card badges
  const calculatePercent = (val) => ((val / stats.total_registered) * 100).toFixed(1);

  /**
   * Helper to calculate internal percentage and format string: Count(Perc%)
   * @param {number} count - Category count (e.g. stats.total_resolved_water)
   * @param {number} total - Card total (e.g. stats.total_resolved)
   */
  const formatWithPerc = (count, total) => {
    const c = Number(count || 0);
    const t = Number(total || 0);
    const perc = t > 0 ? ((c / t) * 100).toFixed(1) : "0.0";
    return (
      <>
        {c.toLocaleString()}
        <span style={{ fontSize: '1rem', opacity: 0.8, marginLeft: '2px', fontWeight: 'normal' }}>
          ({perc}%)
        </span>
      </>
    );
  };

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
      
{/* Total Registered - Optimized Layout */}
      <div className="kpi-card blue">
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: '160px' }}>
          <div className="kpi-label">Total Registered</div>
          <div className="kpi-main-val" style={{ lineHeight: '1', marginBottom: '4px' }}>
            {Number(stats.total_registered).toLocaleString()}
          </div>
          
          {/* ASG and UN-ASG on one line */}
            <div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold' }}>ASG: </span>
              <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: '500' }}>
                {Number(assignments.total_assigned).toLocaleString()}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold' }}>UN-ASG: </span>
              <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: '500' }}>
                {Number(assignments.total_unassigned).toLocaleString()}
              </span>
            </div>
        </div>

        <div className="kpi-split" style={{ textAlign: 'right', borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: '15px', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '6px' }}>
            <div><span className="split-label">Water</span><span className="split-item" style={{ color: 'var(--water-blue)' }}>{formatWithPerc(stats.total_registered_water, stats.total_registered)}</span></div>
            <div><span className="split-label">Sew</span><span className="split-item" style={{ color: 'var(--sew-purple)' }}>{formatWithPerc(stats.total_registered_sewer, stats.total_registered)}</span></div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '15px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div><span className="split-label">Bill</span><span className="split-item">{stats.total_registered_bill}</span></div>
              <div><span className="split-label">Bulk</span><span className="split-item">{stats.total_registered_bulk}</span></div>
              <div><span className="split-label">Social</span><span className="split-item">{stats.total_registered_social}</span></div>
              <div><span className="split-label">HYD</span><span className="split-item">{stats.total_registered_hyd}</span></div>
              <div><span className="split-label">Info</span><span className="split-item">{stats.total_registered_req}</span></div>
              <div><span className="split-label">Conn</span><span className="split-item">{stats.total_registered_new_conn}</span></div>
              <div><span className="split-label">Others</span><span className="split-item">{stats.total_registered_other}</span></div>
            </div>
            
          </div>
            <div style={{ padding: '4px 2px', display: 'flex', alignItems: 'baseline', gap: '5px' }}>
              <span style={{ fontSize: '1.2rem', color: '#fbbf24',fontWeight: '600' }}>TODAY:</span>
              <span style={{ fontSize: '1.3rem', color: '#fbbf24', fontWeight: '800' }}>{regToday.toLocaleString()}</span>
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

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', gap: '8px' }}>
            <span className="yesterday-stat" style={{ whiteSpace: 'nowrap' }}>
              From yesterday: <span className="stat-highlight">{renderTrend(resolvedTrend)}</span>
            </span>

            <div style={{ padding: '1px 10px', display: 'flex', alignItems: 'center', gap: '4px' , marginTop: '8px'}}>
              <span style={{ fontSize: '1rem', color: '#0df3c9', fontWeight: 'bold' }}>TODAY:</span>
              <span style={{ fontSize: '1.1rem', color: '#0df3c9', fontWeight: '500' }}>{Number(resToday || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="kpi-split" style={{ textAlign: 'right', borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '4px' }}>
            <div><span className="split-label">Water</span>
            <span className="split-item" style={{ color: 'var(--green-ok)' }}>{formatWithPerc(stats.total_resolved_water, stats.total_registered_water)}</span></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '4px' }}>
            <div><span className="split-label">Sewerage</span><span className="split-item" style={{ color: 'var(--green-ok)' }}>{formatWithPerc(stats.total_resolved_sewer, stats.total_registered_sewer)}</span></div>
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
            <div><span className="split-label">Water</span><span className="split-item" style={{ color: 'var(--yellow-wip)' }}>{formatWithPerc(stats.total_wip_water, stats.total_registered_water)}</span></div>
            <div><span className="split-label">Sew</span><span className="split-item" style={{ color: 'var(--yellow-wip)' }}>{formatWithPerc(stats.total_wip_sewer, stats.total_registered_sewer)}</span></div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2px' }}>
            <span className="split-label" style={{ color: 'yellow' }}>Others </span>
            <span className="split-item" style={{ color: 'yellow', display: 'inline' }}>{stats.total_wip_others}</span>
          </div>
        </div>
      </div>

      {/* Pending */}
      <div className="kpi-card red">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
            <div className="kpi-label" style={{ margin: 0 }}>Pending</div>
          </div>

          <div className="kpi-val-group">
            <div className="kpi-main-val" style={{ color: 'var(--red-crit)' }}>
              {Number(stats.total_pending).toLocaleString()}
            </div>
            <div className="kpi-percent2">{calculatePercent(stats.total_pending)}%</div>
          </div>
          <div>
            <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 'bold', marginRight: '5px' }}>ASG:: </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--red-crit)', fontWeight: '500' }}>
              {Number(assignments.pending_assigned).toLocaleString()}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 'bold', marginRight: '5px' }}>UN-ASG::</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--red-crit)', fontWeight: '500' }}>
              {Number(assignments.pending_unassigned).toLocaleString()}
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
              From Yesterday: {renderTrend(pendingTrend, true)}
          </div>
        </div>
        <div className="kpi-split" style={{ textAlign: 'right', borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '4px' }}>
            <div><span className="split-label">Water</span><span className="split-item" style={{ color: 'var(--red-crit)' }}>{formatWithPerc(stats.total_pending_water, stats.total_registered_water)}</span></div>
            <div><span className="split-label">Sew</span><span className="split-item" style={{ color: 'var(--red-crit)' }}>{formatWithPerc(stats.total_pending_sewer, stats.total_registered_sewer)}</span></div>

          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '4px' }}>
            <div><span className="split-label">Bill</span><span className="split-item" style={{ color: 'var(--red-crit)' }}>{stats.total_pending_bill}</span></div>
            <div><span className="split-label">Bulk</span><span className="split-item" style={{ color: 'var(--red-crit)' }}>{stats.total_pending_bulk}</span></div>
            <div><span className="split-label">New Conn</span><span className="split-item" style={{ color: 'var(--red-crit)' }}>{stats.total_pending_new_conn}</span></div>
            <div><span className="split-label">HYD</span><span className="split-item" style={{ color: 'var(--red-crit)' }}>{stats.total_pending_hyd}</span></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '4px' }}>
            <div><span className="split-label">Info</span><span className="split-item" style={{ color: 'var(--red-crit)' }}>{stats.total_pending_req}</span></div>
            <div><span className="split-label">Social</span><span className="split-item" style={{ color: 'var(--red-crit)' }}>{stats.total_pending_social}</span></div>
            <div><span className="split-label">Others</span><span className="split-item" style={{ color: 'var(--red-crit)' }}>{stats.total_pending_other}</span></div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default KpiCards;