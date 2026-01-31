import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const TownCharts = ({ waterData, sewData, avgStats }) => {
    const commonOptions = {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1e293b',
                titleColor: '#f1f5f9',
                bodyColor: '#f1f5f9',
                borderColor: '#334155',
                borderWidth: 1
            }
        },
        scales: {
            x: { 
                stacked: true, 
                grid: { display: false }, 
                ticks: { 
                    color: '#94a3b8', 
                    font: { size: 7 }, // Tiny font for many towns
                    autoSkip: false, 
                    maxRotation: 90, 
                    minRotation: 90 
                } 
            },
            y: { 
                stacked: true, 
                grid: { color: 'rgba(51, 65, 85, 0.3)' }, 
                ticks: { color: '#94a3b8', font: { size: 8 } } 
            }
        }
    };

    const formatData = (dataset, resolvedColor) => ({
        labels: dataset.map(d => d.town_name),
        datasets: [
            { label: 'Pending', data: dataset.map(d => d.total_pending), backgroundColor: '#f87171', barThickness: 5 },
            { label: 'WIP', data: dataset.map(d => d.total_wip), backgroundColor: '#fbbf24', barThickness: 5 },
            { label: 'Resolved', data: dataset.map(d => d.total_resolved), backgroundColor: resolvedColor, barThickness: 5 }
        ]
    });

    return (
        <div className="chart-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', padding: '0 10px 10px 0px' }}>
            {/* Water Chart Panel */}
            <div className="panel" style={{ height: '260px', position: 'relative' }}>
                <h2 style={{ color: '#38bdf8', fontSize: '0.8rem', margin: '0 0 10px 0' }}>
                    <i className="fas fa-tint"></i> WATER: TOWN-WISE
                </h2>
                <div className="avg-time-container" style={{ position: 'absolute', right: '15px', top: '10px' }}>
                    <div className="avg-mini-card" style={{ border: '1px solid #38bdf8', padding: '2px 8px', borderRadius: '4px', textAlign: 'center', background: 'rgba(56, 189, 248, 0.05)' }}>
                        <span className="val" style={{ color: '#38bdf8', fontSize: '0.75rem', fontWeight: 'bold', display: 'block' }}>{avgStats?.water_avg_res_hrs || 0}h</span>
                        <span className="lab" style={{ fontSize: '0.5rem', color: '#94a3b8' }}>AVG RES</span>
                    </div>
                </div>
                <div style={{ height: '190px' }}>
                    <Bar options={commonOptions} data={formatData(waterData, '#38bdf8')} />
                </div>
            </div>

            {/* Sewerage Chart Panel */}
            <div className="panel" style={{ height: '260px', position: 'relative' }}>
                <h2 style={{ color: '#a78bfa', fontSize: '0.8rem', margin: '0 0 10px 0' }}>
                    <i className="fas fa-biohazard"></i> SEWERAGE: TOWN-WISE
                </h2>
                <div className="avg-time-container" style={{ position: 'absolute', right: '15px', top: '10px' }}>
                    <div className="avg-mini-card" style={{ border: '1px solid #a78bfa', padding: '2px 8px', borderRadius: '4px', textAlign: 'center', background: 'rgba(167, 139, 250, 0.05)' }}>
                        <span className="val" style={{ color: '#a78bfa', fontSize: '0.75rem', fontWeight: 'bold', display: 'block' }}>{avgStats?.sew_avg_res_hrs || 0}h</span>
                        <span className="lab" style={{ fontSize: '0.5rem', color: '#94a3b8' }}>AVG RES</span>
                    </div>
                </div>
                <div style={{ height: '190px' }}>
                    <Bar options={commonOptions} data={formatData(sewData, '#a78bfa')} />
                </div>
            </div>
        </div>
    );
};

export default TownCharts;