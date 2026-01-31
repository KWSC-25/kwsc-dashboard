import React, { useEffect, useState } from 'react';
import api from '../utils/api';

const IntelCards = () => {
  const [intel, setIntel] = useState({ waterLogs: [], sewerLogs: [], trending: [] });

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
    // We want 2 lines per card as per your design
    const displayLogs = logs.slice(0, 2); 
    
    // Fill empty slots if less than 2 logs exist
    const lines = [...displayLogs];
    while (lines.length < 2) lines.push(null);

    return lines.map((log, idx) => (
      <div key={idx} className="log-line">
        {log ? (
          <>
            <span className="log-time" style={{ color: '#e6e650', fontFamily: 'monospace', fontWeight: 'bold', marginRight: '5px' }}>
              {formatTimestamp(log.ts)}
            </span>
            <span className="log-msg" style={{ flexGrow: 1, fontSize: '0.7rem' }}>
              {cleanTownName(log.town) } {log.action === 'REGISTERED' ? '+1' : 
              <span style={{ color: 'var(--green-ok)' }}>resolved</span>}
            </span>
          </>
        ) : (
          <span className="log-msg">---</span>
        )}
      </div>
    ));
  };

  return (
    <div className="intel-row" style={{ width: '60%', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', height: '90px' }}>
      
      {/* Card 1: Water */}
      <div className="intel-card" style={{ borderLeft: '4px solid var(--water-blue)', background: 'var(--panel-bg)', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', border: '1px solid var(--border-color)' }}>
        <div className="kpi-labelw" style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--water-blue)', marginBottom: '2px' }}>Water</div>
        {renderLogLines(intel.waterLogs)}
      </div>

      {/* Card 2: Sewerage */}
      <div className="intel-card" style={{ borderLeft: '4px solid var(--sew-purple)', background: 'var(--panel-bg)', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', border: '1px solid var(--border-color)' }}>
        <div className="kpi-labels" style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--sew-purple)', marginBottom: '2px' }}>Sewerage</div>
        {renderLogLines(intel.sewerLogs)}
      </div>

      {/* Card 3: Trending */}
      <div className="intel-card" style={{ borderLeft: '4px solid var(--yellow-wip)', background: 'var(--panel-bg)', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', border: '1px solid var(--border-color)' }}>
        <div className="kpi-labelt" style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', color: 'yellow', marginBottom: '2px' }}>Trending (Last 7 Days)</div>
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
      
    </div>
  );
};

export default IntelCards;