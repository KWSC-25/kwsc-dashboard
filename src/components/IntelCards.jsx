import React, { useEffect, useState } from 'react';
import api from '../utils/api';

const IntelCards = () => {
  const [intel, setIntel] = useState({ waterLogs: [], sewerLogs: [], trending: []})
  const [sourceIndex, setSourceIndex] = useState(0);
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
    if (sources.length <= 1) return;

    const timer = setInterval(() => {
      setSourceIndex((prev) => (prev + 1) % sources.length);
    }, 5000); // Slides every 5 seconds

    return () => clearInterval(timer);
  }, [sources.length]);

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
      
      <div className="intel-card" style={{ 
            borderLeft: '4px solid #00ffcc', 
            background: 'var(--panel-bg)', 
            borderRadius: '8px', 
            padding: '8px', 
            border: '1px solid var(--border-color)',
            transition: 'all 0.5s ease' // Smooth fade effect
          }}>
            {/* Dynamic Header */}
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#00ffcc', marginBottom: '10px' }}>
              Source: {currentSource.source}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '0.9rem', color: 'var(--water-blue)' }}>REG</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--water-blue)' }}>
                  {currentSource.total_registered}
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '0.9rem', color: 'var(--red-crit)' }}>PEN</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--red-crit)' }}>
                  {currentSource.total_pending}
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '0.9rem', color: 'var(--green-ok)' }}>RES</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--green-ok)' }}>
                  {currentSource.total_resolved}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.9rem', color: 'var(--yellow-wip)' }}>WIP</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--yellow-wip)' }}>
                  {currentSource.total_wip}
                </div>
              </div>
            </div>

            {/* Optional: Visual Dots to show multiple sources exist */}
            {sources.length > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '8px' }}>
                {sources.map((_, i) => (
                  <div key={i} style={{ 
                    width: '5px', height: '5px', borderRadius: '50%', 
                    background: i === sourceIndex ? '#00ffcc' : '#334155' 
                  }} />
                ))}
              </div>)}
        </div>
    </div>
  );
};

export default IntelCards;