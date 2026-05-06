import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const KpiCards = ({ onPopupToggle }) => { // Add prop
  const [breakdownData, setBreakdownData] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [selectedTypeName, setSelectedTypeName] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const resp = await api.get('/kpis/stats');
        setData(resp.data);
      } catch (err) {
        console.error("KPI Fetch Error:", err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);


  // Notify dashboard when modal opens/closes
  useEffect(() => {
    if (onPopupToggle) onPopupToggle(showBreakdown);
  }, [showBreakdown, onPopupToggle]);

  const handleTypeClick = async (typeId, typeName) => {
    try {
      const resp = await api.get(`/kpis/type-breakdown?typeId=${typeId}`);
      setBreakdownData(resp.data);
      setSelectedTypeName(typeName);
      setShowBreakdown(true);
    } catch (err) {
      console.error("Breakdown Fetch Error:", err);
    }
  };

  if (!data) return <div className="loading-placeholder">Loading Stats...</div>;

  // Destructure from the internal state
  const { mainKpis: stats, assignmentStats: assignments, todaystats: today } = data;

  const regToday = today?.total_registered_today || 0;
  const resToday = today?.total_resolved_today || 0;
  const resTodayReg = today?.resolved_of_today_registered || 0;


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

  const townColWidth = window.innerWidth < 768 ? '110px' : '180px';

  return (
    <>
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
              <span style={{ fontSize: '1.2rem', color: '#fbbf24', fontWeight: '600' }}>TODAY:</span>
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

              <div style={{ 
                  padding: '2px 10px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  marginTop: '8px',
                  whiteSpace: 'nowrap' // Prevents text from breaking into two lines
              }}>
                  {/* Main Resolved Today Stat */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontSize: '1.1rem', color: '#0df3c9', fontWeight: 'bold' }}>TODAY:</span>
                      <span style={{ fontSize: '1.3rem', color: '#0df3c9', fontWeight: '700' }}>
                          {Number(resToday).toLocaleString()}
                      </span>
                  </div>

                  {/* Vertical Separator */}
                  <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.2)', margin: '0 4px' }}></div>

                  {/* Same Day Resolution Stat */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#00ccff', fontWeight: '600', letterSpacing: '0.3px' }}>
                          SAME DAY RESOLUTION:
                      </span>
                      <span style={{ fontSize: '1.1rem', color: '#00ccff', fontWeight: '700' }}>
                          {Number(resTodayReg).toLocaleString()}
                      </span>
                  </div>
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
        {/* Pending Card */}
        <div className="kpi-card red">
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "4px" }}>
              <div className="kpi-label" style={{ margin: 0 }}>Pending</div>
            </div>

            <div className="kpi-val-group">
              <div className="kpi-main-val" style={{ color: "var(--red-crit)" }}>
                {Number(stats.total_pending).toLocaleString()}
              </div>
              <div className="kpi-percent2">{calculatePercent(stats.total_pending)}%</div>
            </div>
            <div>
              <span style={{ fontSize: "0.9rem", color: "#94a3b8", fontWeight: "bold", marginRight: "5px" }}>ASG: </span>
              <span style={{ fontSize: "0.9rem", color: "var(--red-crit)", fontWeight: "500" }}>
                {Number(assignments.pending_assigned).toLocaleString()}
              </span>
            </div>
            <div>
              <span style={{ fontSize: "0.9rem", color: "#94a3b8", fontWeight: "bold", marginRight: "5px" }}>UN-ASG:</span>
              <span style={{ fontSize: "0.9rem", color: "var(--red-crit)", fontWeight: "500" }}>
                {Number(assignments.pending_unassigned).toLocaleString()}
              </span>
            </div>
            <div style={{ fontSize: "0.8rem", color: "#94a3b8", whiteSpace: "nowrap" }}>
              From Yesterday: {renderTrend(pendingTrend, true)}
            </div>
          </div>

          <div className="kpi-split" style={{ textAlign: "right", borderLeft: "2px solid rgba(255,255,255,0.1)", paddingLeft: "15px" }}>
            {/* Row 1: Water & Sewerage */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginBottom: "4px" }}>
              <div onClick={() => handleTypeClick(2, "WATER")} style={{ cursor: "pointer" }}>
                <span className="split-label">Water</span>
                <span className="split-item" style={{ color: "var(--red-crit)" }}>
                  {formatWithPerc(stats.total_pending_water, stats.total_registered_water)}
                </span>
              </div>
              <div onClick={() => handleTypeClick(1, "SEWERAGE")} style={{ cursor: "pointer" }}>
                <span className="split-label">Sew</span>
                <span className="split-item" style={{ color: "var(--red-crit)" }}>
                  {formatWithPerc(stats.total_pending_sewer, stats.total_registered_sewer)}
                </span>
              </div>
            </div>

            {/* Row 2: Billing, Bulk, New Conn, Hydrant */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginBottom: "4px" }}>
              <div onClick={() => handleTypeClick(3, "BILLING")} style={{ cursor: "pointer" }}>
                <span className="split-label">Bill</span><span className="split-item" style={{ color: "var(--red-crit)" }}>{stats.total_pending_bill}</span>
              </div>
              <div onClick={() => handleTypeClick(4, "BULK")} style={{ cursor: "pointer" }}>
                <span className="split-label">Bulk</span><span className="split-item" style={{ color: "var(--red-crit)" }}>{stats.total_pending_bulk}</span>
              </div>
              <div onClick={() => handleTypeClick(5, "NEW CONNECTION")} style={{ cursor: "pointer" }}>
                <span className="split-label">New Conn</span><span className="split-item" style={{ color: "var(--red-crit)" }}>{stats.total_pending_new_conn}</span>
              </div>
              <div onClick={() => handleTypeClick(19, "HYDRANT")} style={{ cursor: "pointer" }}>
                <span className="split-label">HYD</span><span className="split-item" style={{ color: "var(--red-crit)" }}>{stats.total_pending_hyd}</span>
              </div>
            </div>

            {/* Row 3: Info, Social, Others */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginBottom: "4px" }}>
              <div onClick={() => handleTypeClick(24, "INFORMATION REQUEST")} style={{ cursor: "pointer" }}>
                <span className="split-label">Info</span><span className="split-item" style={{ color: "var(--red-crit)" }}>{stats.total_pending_req}</span>
              </div>
              <div onClick={() => handleTypeClick(12, "SOCIAL MEDIA")} style={{ cursor: "pointer" }}>
                <span className="split-label">Social</span><span className="split-item" style={{ color: "var(--red-crit)" }}>{stats.total_pending_social}</span>
              </div>
              <div onClick={() => handleTypeClick(8, "OTHERS")} style={{ cursor: "pointer" }}>
                <span className="split-label">Others</span><span className="split-item" style={{ color: "var(--red-crit)" }}>{stats.total_pending_other}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {showBreakdown && breakdownData && (
        <div className="modal-overlay" onClick={() => setShowBreakdown(false)}
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

          <div className="modal-content" onClick={e => e.stopPropagation()}
            style={{ background: '#1e293b', width: '95%', maxWidth: '1400px', maxHeight: '90vh', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Modal Header */}
            <div className="modal-header" style={{ padding: '20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ color: '#ef4444', margin: 0, fontSize: 'clamp(1rem, 4vw, 1.5rem)', textTransform: 'uppercase', fontWeight: '800' }}>                {selectedTypeName} - SUBTYPE BREAKDOWN IN TOWNS
              </h2>
              <button onClick={() => setShowBreakdown(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '2rem', cursor: 'pointer' }}>&times;</button>
            </div>

            {/* Modal Body */}
            <div className="modal-body" style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              <div style={{
                overflow: 'auto', // Changed from overflowX: 'auto' to allow both
                borderRadius: '8px',
                border: '1px solid #334155',
                width: '100%',
                maxHeight: '70vh', // Sets a limit so the header has something to stick to
                display: 'block'
              }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, color: '#f8fafc' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 50 }}>
                    <tr style={{ background: '#0f172a' }}>
                      {/* CORNER CELL 1: Sticky Left and Top */}
                      <th style={{
                        padding: '12px 8px',
                        textAlign: 'left',
                        position: 'sticky',
                        left: 0,
                        top: 0, // Pins to top
                        background: '#0f172a',
                        borderBottom: '2px solid #334155',
                        minWidth: townColWidth,
                        zIndex: 60, // Highest priority
                        whiteSpace: 'normal',
                        lineHeight: '1.2'
                      }}>TOWN</th>

                      {/* CORNER CELL 2: Sticky Left and Top */}
                      <th style={{
                        padding: '12px 8px',
                        textAlign: 'center',
                        position: 'sticky',
                        left: townColWidth,
                        top: 0, // Pins to top
                        background: '#0f172a',
                        borderBottom: '2px solid #334155',
                        color: '#ef4444',
                        borderRight: '2px solid #334155',
                        zIndex: 60, // Highest priority
                        whiteSpace: 'normal',
                        lineHeight: '1.2'
                      }}>TOTAL PENDING</th>

                      {/* SUBTYPE HEADERS: Sticky Top only */}
                      {breakdownData.columns.map((col, i) => (
                        <th key={i} style={{
                          padding: '10px',
                          textAlign: 'center',
                          position: 'sticky',
                          top: 0, // Pins to top
                          background: '#0f172a',
                          borderBottom: '2px solid #334155',
                          fontSize: '0.75rem',
                          whiteSpace: 'normal',
                          minWidth: '100px',
                          lineHeight: '1.1',
                          zIndex: 40 // Lower than corners
                        }}>
                          {col.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  {/* ... Rest of your <tbody> and <tfoot> remain the same ... */}
                  <tbody>
                    {breakdownData.data.map((row, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                        <td style={{
                          padding: '10px 8px',
                          position: 'sticky',
                          left: 0,
                          background: '#1e293b', // Solid color hides scrolling numbers
                          borderBottom: '1px solid #334155',
                          fontWeight: 'bold',
                          fontSize: window.innerWidth < 768 ? '0.75rem' : '0.85rem',
                          whiteSpace: 'normal', // Allow 2 lines
                          wordBreak: 'break-word',
                          zIndex: 10
                        }}>
                          {row.town.replace(/\s*TOWN\s*$/i, '')}
                        </td>
                        <td style={{
                          padding: '10px 8px',
                          textAlign: 'center',
                          position: 'sticky',
                          left: townColWidth,
                          background: '#1e293b', // Solid color hides scrolling numbers
                          borderBottom: '1px solid #334155',
                          color: '#f87171',
                          fontWeight: '800',
                          borderRight: '2px solid #334155',
                          zIndex: 10
                        }}>
                          {row.total_pending_town}
                        </td>
                        {breakdownData.columns.map((col, j) => (
                          <td key={j} style={{
                            padding: window.innerWidth < 768 ? '10px 4px' : '12px 15px',
                            textAlign: 'center',
                            borderBottom: '1px solid #334155',
                            fontSize: window.innerWidth < 768 ? '0.75rem' : '0.85rem',
                            opacity: row[col] > 0 ? 1 : 0.2,
                            color: row[col] > 0 ? '#fbbf24' : '#94a3b8',
                            minWidth: window.innerWidth < 768 ? '50px' : '80px'
                          }}>
                            {row[col] || 0}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 30 }}>
                    <tr style={{ background: '#0f172a', fontWeight: 'bold' }}>
                      {/* Label Cell */}
                      <td style={{
                        padding: '12px 8px',
                        position: 'sticky',
                        left: 0,
                        background: '#0f172a',
                        borderTop: '2px solid #ef4444',
                        zIndex: 31
                      }}>GRAND TOTAL</td>

                      {/* Total Count Cell */}
                      <td style={{
                        padding: '12px 8px',
                        textAlign: 'center',
                        position: 'sticky',
                        left: townColWidth,
                        background: '#0f172a',
                        borderTop: '2px solid #ef4444',
                        color: '#ef4444',
                        borderRight: '2px solid #334155',
                        zIndex: 31
                      }}>
                        {breakdownData.data.reduce((sum, r) => sum + (Number(r.total_pending_town) || 0), 0)}
                      </td>

                      {/* Subtype Total Cells */}
                      {breakdownData.columns.map((col, i) => (
                        <td key={i} style={{
                          padding: '12px 10px',
                          textAlign: 'center',
                          background: '#0f172a',
                          borderTop: '2px solid #38bdf8',
                          color: '#38bdf8'
                        }}>
                          {breakdownData.data.reduce((sum, r) => sum + (Number(r[col]) || 0), 0)}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default KpiCards;