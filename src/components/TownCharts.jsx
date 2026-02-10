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
                    color: '#f1f5f9', 
                    font: { 
                        size: 10, 
                        family: "'Segoe UI', sans-serif",
                        weight: '600'
                    }, 
                    autoSkip: false, 
                    maxRotation: 45, 
                    minRotation: 45,
                    padding: 10 // Space between bar and town name
                } 
            },
            y: { 
                stacked: true, 
                beginAtZero: true,
                grid: { color: 'rgba(51, 65, 85, 0.2)' }, 
                ticks: { color: '#94a3b8', font: { size: 10 } } 
            }
        }
    };

    const formatData = (dataset) => ({
        labels: (dataset || []).map(d => d.town_name.replace(/\bTOWN\b/gi, '').trim()),
        datasets: [
            { label: 'Pending', data: (dataset || []).map(d => d.total_pending), backgroundColor: '#f87171' },
            { label: 'WIP', data: (dataset || []).map(d => d.total_wip), backgroundColor: '#fbbf24' },
            { label: 'Resolved', data: (dataset || []).map(d => d.total_resolved), backgroundColor: '#4ade80' }
        ]
    });

    return (
        <div className="town-charts-flex-container">
            <div className="panel chart-panel-bottom">
                <h2 className="water-text" style={{color:'var(--water-blue)'}}><i className="fas fa-tint"></i> TOWN-WISE WATER ANALYTICS (OVERALL)</h2>
                <div className="avg-time-badge-inline water-border">
                    Avg Res: {avgStats?.water_avg_res_time || 0}
                </div>
                <div className="chart-wrapper-bottom">
                    <Bar options={commonOptions} data={formatData(waterData)} />
                </div>
            </div>

            <div className="panel chart-panel-bottom">
                <h2 className="sew-text" style={{color:'var(--sew-purple)'}}><i className="fas fa-biohazard" ></i> TOWN-WISE SEWERAGE ANALYTICS (OVERALL)</h2>
                <div className="avg-time-badge-inline sew-border">
                    Avg Res: {avgStats?.sew_avg_res_time || 0}
                </div>
                <div className="chart-wrapper-bottom">
                    <Bar options={commonOptions} data={formatData(sewData)} />
                </div>
            </div>
        </div>
    );
};

export default TownCharts;