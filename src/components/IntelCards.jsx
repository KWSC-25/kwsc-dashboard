import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
const IntelCards = () => {
  const [intel, setIntel] = useState({ waterLogs: [], sewerLogs: [], trending: [], sources: [] });
  const [sourceIndex, setSourceIndex] = useState(0);
  const [selectedSourceData, setSelectedSourceData] = useState(null);
  const [showModal, setShowModal] = useState(false);
    const sources = intel.sources || [];

  useEffect(() => {
    const fetchIntel = async () => {
      try {
        const res = await api.get('/intel/stats');
        setIntel(res.data);
      } catch (err) {
        console.error("Error fetching Intel:", err);
      }
    };
    fetchIntel();
    const interval = setInterval(fetchIntel, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-slide logic
  useEffect(() => {
    if (sources.length <= 1 || showModal) return;

    const timer = setInterval(() => {
      setSourceIndex((prev) => (prev + 1) % sources.length);
    }, 5000); // Slides every 5 seconds

    return () => clearInterval(timer);
  }, [sources.length, showModal]);

  const handleSourceClick = async (sourceName) => {
      try {
        const res = await api.get(`/source/source-details?source=${encodeURIComponent(sourceName)}`);
        setSelectedSourceData(res.data);
        setShowModal(true);
      } catch (err) {
        console.error("Error fetching Source details:", err);
      }
    };
  // Safeguard if no data exists
  if (sources.length === 0) return <div>No Source Data</div>;

  const currentSource = sources[sourceIndex];

  const cleanTownName = (name) => {
      if (!name) return "";
      return name.replace(/\bTOWN\b/gi, '').trim();
    };
  const formatTimestamp = (ts) => {
      if (!ts) return "---";
      const d = new Date(ts);
      const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
      return `[${time} | ${date}]`;
    };

    const renderLogLines = (logs) => {
        const displayLogs = logs.slice(0, 2); 
        const lines = [...displayLogs];
        while (lines.length < 2) lines.push(null);

        return lines.map((log, idx) => {
          const isNew = log && (new Date() - new Date(log.ts)) < 10000;

          return (
            <div 
              key={idx} 
              className={`log-line ${isNew ? 'blink-new' : ''}`} // Add blink class here
              style={{ transition: 'all 0.2s ease' }}
            >
              {log ? (
                <>
                  <span className="log-time" style={{ color: '#e6e650', fontFamily: 'monospace', fontWeight: 'bold', marginRight: '5px' }}>
                    {formatTimestamp(log.ts)}
                  </span>
                  <span className="log-msg" style={{ flexGrow: 1, fontSize: '0.7rem' }}>
                      {cleanTownName(log.town)} {log.action === 'REGISTERED' ? (
                          <span style={{ color: 'var(--water-blue)' }}>| LAST REGISTERED</span>
                      ) : (
                          <span style={{ color: 'var(--green-ok)' }}>| LAST RESOLVED</span>
                      )}
                  </span>
                </>
              ) : ( 
                <span className="log-msg" style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>---</span>
              )}
            </div>
          );
        });
      };

  const handlePrevSource = (e) => {
    e.stopPropagation(); // Prevents opening the modal
    setSourceIndex((prev) => (prev === 0 ? sources.length - 1 : prev - 1));
  };

  const handleNextSource = (e) => {
    e.stopPropagation(); // Prevents opening the modal
    setSourceIndex((prev) => (prev + 1) % sources.length);
  };

  return (
    <div className="intel-row" >
      {/* Card 1: Water */}
      <div className="intel-card" style={{ borderLeft: '4px solid var(--water-blue)', background: 'var(--panel-bg)', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', border: '1px solid var(--border-color)' }}>
        <div className="kpi-labelw" style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--water-blue)', marginBottom: '2px' }}>Water</div>
        {renderLogLines(intel.waterLogs)}
      </div>

      {/* Card 2: Sewerage */}
      <div className="intel-card" style={{ borderLeft: '4px solid var(--sew-purple)', background: 'var(--panel-bg)', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', border: '1px solid var(--border-color)' }}>
        <div className="kpi-labels" style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--sew-purple)', marginBottom: '2px' }}>Sewerage</div>
        {renderLogLines(intel.sewerLogs)}
      </div>

      {/* Card 3: Trending */}
      <div className="intel-card" style={{ borderLeft: '4px solid var(--yellow-wip)', background: 'var(--panel-bg)', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', border: '1px solid var(--border-color)' }}>
        <div className="kpi-labelt" style={{ fontSize: '0.9rem', fontWeight: 400, textTransform: 'uppercase', color: 'yellow', marginBottom: '2px' }}>Trending (Last 7 Days)</div>
        {intel.trending.length > 0 ? (
          intel.trending.map((item, idx) => (
            <div key={idx} className="trend-item" style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span style={{fontSize: '0.7rem'}}>{item.subtype_name}</span> 
              <span className="trend-count" style={{ color: 'var(--yellow-wip)' }}>{item.total_count}</span>
            </div>
          ))
        ) : (
          <div className="trend-item"><span style={{fontSize: '0.7rem'}}>No data</span></div>
        )}
      </div>
{/* ROTATING SOURCE CARD */}
      <div className="intel-card source-card-clickable" onClick={() => handleSourceClick(currentSource.source)} style={{ cursor: 'pointer' }}>
        <div className="source-header-row">
          <div style={{ fontSize: '1rem', fontWeight: 600, color: '#00ffcc' }}>Source: {currentSource.source}</div>
        </div>
        <div className="source-stats-grid">
          <div><div className="stat-label blue">REG</div><div className="stat-value blue">{currentSource.total_registered}</div></div>
          <div><div className="stat-label red">PEN</div><div className="stat-value red">{currentSource.total_pending}</div></div>
          <div><div className="stat-label green">RES</div><div className="stat-value green">{currentSource.total_resolved}</div></div>
          <div><div className="stat-label yellow">WIP</div><div className="stat-value yellow">{currentSource.total_wip}</div></div>
        </div>
        {/* UPDATED NAVIGATION SECTION */}
          <div className="source-nav-container">
              <i className="fas fa-chevron-left nav-arrow" onClick={handlePrevSource}></i>
              <div className="source-dots">
                  {sources.map((_, i) => (
                    <div key={i} className={`dot ${i === sourceIndex ? 'active' : ''}`} />
                  ))}
              </div>
              <i className="fas fa-chevron-right nav-arrow" onClick={handleNextSource}></i>
          </div>
        </div>
       
      

      {/* MODAL */}
      <AnimatePresence>
        {showModal && selectedSourceData && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9 }}
              className="modal-content source-modal" 
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2 className="modal-title">
                  <span style={{ color: '#00ffcc' }}>Source: {selectedSourceData.source}</span> Detailed Analytics
                </h2>

                {/* FIXED: Using selectedSourceData.grandTotals instead of currentSource */}
                <div className="modal-source-totals">
                  <div className="modal-source-totals-row" style={{ display: 'flex', gap: '8px', marginLeft: 'auto', marginRight: '15px' }}>
                      <div className="source-badge b-blue">
                        <span className="b-label">REG</span>
                        <span className="b-val">{selectedSourceData.grandTotals.reg}</span>
                      </div>
                      <div className="source-badge b-red">
                        <span className="b-label">PEN</span>
                        <span className="b-val">{selectedSourceData.grandTotals.pen}</span>
                      </div>
                      <div className="source-badge b-green">
                        <span className="b-label">RES</span>
                        <span className="b-val">{selectedSourceData.grandTotals.res}</span>
                      </div>
                      <div className="source-badge b-yellow">
                        <span className="b-label">WIP</span>
                        <span className="b-val">{selectedSourceData.grandTotals.wip}</span>
                      </div>
                  </div>
             
                </div>
                <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
              </div>

              <div className="modal-body">
                {selectedSourceData.breakdown.map((type, idx) => (
                  <div key={idx} className="type-section">
                    <div className="type-summary-bar">
                      <span className="type-title">{type.typeName}</span>
                      <div className="type-totals">
                        <span>Reg: {type.typeTotal}</span>
                        <span className="text-green">Res: {type.typeRes}</span>
                        <span className="text-red">Pen: {type.typePen}</span>
                      </div>
                    </div>
                    <table className="modern-table">
                        <thead>
                            <tr><th>Subtype</th><th>Reg</th><th>Res</th><th>Pen</th><th>WIP</th></tr>
                        </thead>
                        <tbody>
                            {type.subtypes.map((st, sIdx) => (
                                <tr key={sIdx}>
                                    <td>{st.subtype_name || 'General'}</td>
                                    <td>{st.total_reg}</td>
                                    <td className="text-green">{st.total_res}</td>
                                    <td className="text-red">{st.total_pen}</td>
                                    <td className="text-yellow">{st.total_wip}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IntelCards;