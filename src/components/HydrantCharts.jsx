// components/HydrantCharts.jsx
import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const HydrantCharts = ({ activeFilters }) => {
  // --- Destructure Incoming State safely to extract data tracking windows ---
  const { startDate, endDate } = activeFilters || {};

  // --- State Architecture ---
  const [donutData, setDonutData] = useState([]);
  const [totalPending, setTotalPending] = useState(0);
  const [lineChartData, setLineChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Theme Color Definitions (High-Contrast Corporate Dark Palette optimized for LED) ---
  const colors = {
    under24: '#4caf50',     // Green
    between48: '#ff9800',   // Orange
    between72: '#facc15',   // Vivid Yellow (Updated to differentiate from Red)
    above72: '#b71c1c',     // Dark Crimson Red
    hmpLine: '#a78bfa',     // HMP Purple Accent
    otsLine: '#38bdf8',     // OTS Cyan Accent
    gridStroke: '#1E293B',   // Slate Dark Border
    textMuted: '#94A3B8'    // Muted Labels
  };

  // --- API Sync Pipeline ---
  useEffect(() => {
    let isMounted = true;

    const fetchDashboardCharts = async () => {
      setLoading(true);
      setError(null);
      try {
        // Construct dynamic request query payloads matching state bounds
        const params = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        // Parallel Request Dispatches routed through Axios instance
        const [donutRes, lineRes] = await Promise.all([
          api.get('hydrantCharts/aging-donut', { params }),
          api.get('hydrantCharts/tatline-chart', { params })
        ]);

        if (!isMounted) return;

        // 1. Process Donut Data Matrix
        if (donutRes.data && donutRes.data.success) {
          const breakdown = donutRes.data.data.breakdown || [];
          setTotalPending(donutRes.data.data.totalPending || 0);

          const mappedDonut = breakdown.map((item, index) => {
            let colorCode = colors.under24;
            if (index === 1) colorCode = colors.between48;
            if (index === 2) colorCode = colors.between72;
            if (index === 3) colorCode = colors.above72;

            return {
              name: item.range,
              value: item.percentage,
              count: item.total_pending_count,
              color: colorCode
            };
          });
          setDonutData(mappedDonut);
        }

        // 2. Process Line Chart Data Matrix
        if (lineRes.data && lineRes.data.success) {
          setLineChartData(lineRes.data.data || []);
        }

      } catch (err) {
        console.error("Dashboard Engine Chart Sync Error: ", err);
        if (isMounted) {
          setError("Failed to stream real-time analytical tracking charts.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardCharts();

    // 30-Second Polling Pipeline to align metrics changes globally
    const interval = setInterval(() => {
      fetchDashboardCharts();
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [startDate, endDate]); // Fires dynamically whenever the dashboard switches context views

  // --- Custom Tooltip Components ---
  const CustomLineTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0B0F19] border border-[#1E293B] p-4 rounded-lg shadow-xl">
          <p className="text-white text-xl font-semibold mb-2">Milestone: {label}</p>
          {payload.map((entry, idx) => (
            <p key={idx} className="text-xl font-medium" style={{ color: entry.color }}>
              {entry.name === 'hmpAvgTatHours' ? 'HMP Order Average' : 'OTS Order Average'}: {entry.value.toFixed(2)} Hours
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomDonutTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const itemData = payload[0].payload;
      return (
        <div className="bg-[#0B0F19] border border-[#1E293B] p-4 rounded-lg shadow-xl">
          <p className="text-white text-xl font-semibold mb-1">{itemData.name}</p>
          <p className="text-xl font-medium" style={{ color: itemData.color }}>
            Share: {itemData.value.toFixed(2)}%
          </p>
          <p className="text-[#94A3B8] text-xl">
            Volume: {itemData.count} Orders
          </p>
        </div>
      );
    }
    return null;
  };

  // --- Loading & Error Boundary Fallbacks ---
  if (loading && donutData.length === 0 && lineChartData.length === 0) {
    return (
      <div className="w-full min-h-[450px] flex items-center justify-center bg-[#03050C] rounded-xl border border-[#111625]">
        <div className="text-lg font-bold tracking-widest text-cyan-400 animate-pulse">
        Loading...        
        </div>
      </div>
    );
  }

  if (error && donutData.length === 0 && lineChartData.length === 0) {
    return (
      <div className="w-full min-h-[450px] flex items-center justify-center bg-[#03050C] rounded-xl border border-red-900/30">
        <div className="text-lg font-semibold text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 bg-[#03050C] p-2">
      
      {/* LEFT COLUMN: TAT LINE CHART */}
      <div className="lg:col-span-7 bg-[#060814] rounded-xl p-6 border border-[#111625] shadow-2xl relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500 to-cyan-500 opacity-90" />
        
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-bold tracking-wide text-white uppercase" style={{ fontSize: '32px'}}>
              Avgerage Turnaround Time (TAT) Operational Velocity
            </h3>
          
          </div>
          
          <div className="flex items-center gap-6 text-sm font-semibold">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full" style={{ backgroundColor: colors.hmpLine }} />
              <span className="text-white text-xl" style={{ fontSize: '32px'}}>HMP</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full" style={{ backgroundColor: colors.otsLine }} />
              <span className="text-white text-xl" style={{ fontSize: '32px'}}>OTS</span>
            </div>
          </div>
        </div>

        <div className="w-full h-[490px] mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineChartData} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.gridStroke} vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke={colors.textMuted} 
                className="font-bold"
                style={{ fontSize: '22px', fill: '#94A3B8' }}
                tickLine={false} 
                dy={12}
              />
              <YAxis 
                stroke={colors.textMuted} 
                className="font-bold"
                style={{ fontSize: '22px', fill: '#94A3B8' }}
                tickLine={false} 
                dx={-8}
                label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: '#94A3B8', fontSize: 14, fontWeight: 'bold', offset: 0 }}
              />
              <Tooltip content={<CustomLineTooltip />} cursor={{ stroke: '#1E293B', strokeWidth: 2 }} />
              <Line 
                type="monotone" 
                dataKey="hmpAvgTatHours" 
                name="hmpAvgTatHours"
                stroke={colors.hmpLine} 
                strokeWidth={3.5}
                dot={{ r: 5, strokeWidth: 2, fill: '#060814' }}
                activeDot={{ r: 8 }}
              />
              <Line 
                type="monotone" 
                dataKey="otsAvgTatHours" 
                name="otsAvgTatHours"
                stroke={colors.otsLine} 
                strokeWidth={3.5}
                dot={{ r: 5, strokeWidth: 2, fill: '#060814' }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RIGHT COLUMN: PENDING AGING DONUT CHART */}
      <div className="lg:col-span-5 bg-[#060814] rounded-xl p-6 border border-[#111625] shadow-2xl relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-500 to-emerald-500 opacity-90" />
        
        <div className="mb-4">
          <h3 className="font-bold tracking-wide text-white uppercase" style={{ fontSize: '32px'}}>
            Pending Orders Aging
          </h3>
        </div>

        {/* Layout Wrapper optimized for LED dashboard walls */}
        <div className="flex flex-row items-center justify-between gap-6 w-full my-auto py-4">
          
          {/* Expanded Donut Display Area */}
          <div className="w-120.5 h-150.5 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomDonutTooltip />} />
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={115}   // Highly enlarged footprint layout
                  outerRadius={190}   // Substantially upgraded external chart diameter
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"        // Removes the default sector line outlines
                  strokeWidth={0}      // Fully collapses outline space definition
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color}  />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Central Metrics Overlay Indicator Block */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
              <span className="text-5xl font-black tracking-tight text-white">{totalPending.toLocaleString()}</span>
              <span className="text-sm font-bold tracking-widest text-[#64748B] uppercase mt-1">
                Pending Orders
              </span>
            </div>
          </div>

          {/* Compressed Dynamic High-Contrast Labels Array */}
          <div className="w-1/2 flex flex-col gap-4 pr-1">
            {donutData.map((item, index) => (
              <div key={index} className="flex flex-col p-3 rounded-lg bg-[#0B0F19]/80 border border-[#111625]">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-base font-bold text-white tracking-wide truncate" style={{ fontSize:'35px' }}>
                    {item.name}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-2 pl-5">
                  <span className="text-5xl font-black tracking-tight" style={{ color: item.color }}>
                    {item.value.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

    </div>
  );
};

export default HydrantCharts;