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

  return (
    <div className="intel-row" style={{ width: '60%', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', height: '90px' }}>
      
      {/* Card 1: Water (Empty for now) */}
      <div className="intel-card" style={{ borderLeft: '4px solid var(--water-blue)' }}>
        <div className="kpi-labelw" style={{ fontSize: '0.6rem', marginBottom: '2px' }}>Water</div>
        <div className="log-line"><span className="log-msg">---</span></div>
        <div className="log-line"><span className="log-msg">---</span></div>
      </div>

      {/* Card 2: Sewerage (Empty for now) */}
      <div className="intel-card" style={{ borderLeft: '4px solid var(--sew-purple)' }}>
        <div className="kpi-labels" style={{ fontSize: '0.6rem', marginBottom: '2px' }}>Sewerage</div>
        <div className="log-line"><span className="log-msg">---</span></div>
        <div className="log-line"><span className="log-msg">---</span></div>
      </div>

      {/* Card 3: Trending (Live Data) */}
      <div className="intel-card" style={{ borderLeft: '4px solid var(--yellow-wip)' }}>
        <div className="kpi-labelt" style={{ fontSize: '0.6rem', marginBottom: '2px' }}>Trending (Last 7 Days)</div>
        {intel.trending.length > 0 ? (
          intel.trending.map((item, idx) => (
            <div key={idx} className="trend-item">
              <span style={{fontSize: '0.7rem'}}>{item.subtype_name}</span> 
              <span className="trend-count">{item.total_count}</span>
            </div>
          ))
        ) : (
          <div className="trend-item"><span>No data</span></div>
        )}
      </div>
      
    </div>
  );
};

export default IntelCards;