import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import Header from '../components/Header';
import KpiCards from '../components/KpiCards';

const Dashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const res = await api.get('/kpis/stats');
        setStats(res.data);
      } catch (err) {
        console.error("KPI Fetch Error:", err);
      }
    };
    fetchKPIs();
    const interval = setInterval(fetchKPIs, 5000); 
    return () => clearInterval(interval);
  }, []);

  if (!stats) return <div style={{ color: 'white', padding: '20px' }}>Loading Data...</div>;

  return (
    <div className="dashboard-wrapper">
      <Header />
      <KpiCards stats={stats} />
      
      {/* Graphs and Underperforming Engineers will come here next */}
    </div>
  );
};

export default Dashboard;