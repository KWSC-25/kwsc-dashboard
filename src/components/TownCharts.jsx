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
        barPercentage: 0.6,
        categoryPercentage: 0.8,
        borderRadius: 2,
        scales: {
            x: { 
                stacked: true, 
                grid: { display: false }, 
                ticks: { 
                    color: '#f1f5f9', 
                    font: { 
                        size: 9, 
                        family: "'Segoe UI', sans-serif",
                        weight: '600',
                        letterSpacing: 1 // Letter spacing handled in CSS via font property if needed
                    }, 
                    autoSkip: false, 
                    maxRotation: 45, 
                    minRotation: 45,
                    padding: 5
                } 
            },
            y: { 
                stacked: true,
                type: 'linear', // Using linear but with a min suggested to help visibility
                beginAtZero: true,
                suggestedMax: 10, // Helps keep small bars visible
                grid: { color: 'rgba(51, 65, 85, 0.3)' }, 
                ticks: { color: '#94a3b8', font: { size: 8 } } 
            }
        }
    };

    const formatData = (dataset) => ({
        labels: dataset.map(d => d.town_name.replace(/\bTOWN\b/gi, '').trim()),
        datasets: [
            { 
                label: 'Pending', 
                data: dataset.map(d => d.total_pending), 
                backgroundColor: '#f87171', 
                borderRadius: 2
            },
            { 
                label: 'WIP', 
                data: dataset.map(d => d.total_wip), 
                backgroundColor: '#fbbf24' 
            },
            { 
                label: 'Resolved', 
                data: dataset.map(d => d.total_resolved), 
                backgroundColor: '#4ade80' // MD wants GREEN for both
            }
        ]
    });

    return (
        <div className="chart-grid">
            {/* Water Chart Panel */}
            <div className="panel chart-panel">
                <h2 className=" water-text" style={{ color: 'var(--water-blue)'}}>
                    <i className="fas fa-tint" style={{ color: 'var(--water-blue)'}}></i> WATER: TOWN-WISE
                </h2>
                <div className="avg-time-container">
                    <div className="avg-mini-card water-border">
                        <span className="val water-text">{avgStats?.water_avg_res_time || 0}</span>
                        <span className="lab">AVG RES</span>
                    </div>
                </div>
                <div className="chart-wrap">
                    <Bar 
                        options={commonOptions} 
                        data={formatData(waterData)} 
                    />
                </div>
            </div>

            {/* Sewerage Chart Panel */}
            <div className="panel chart-panel">
                <h2 className="sew-text" style={{ color: 'var(--sew-purple)'}}>
                    <i className="fas fa-biohazard" style={{ color: 'var(--sew-purple)'}}></i> SEWERAGE: TOWN-WISE
                </h2>
                <div className="avg-time-container">
                    <div className="avg-mini-card sew-border">
                        <span className="val sew-text">{avgStats?.sew_avg_res_time || 0}</span>
                        <span className="lab">AVG RES</span>
                    </div>
                </div>
                <div className="chart-wrap">
                    <Bar 
                        options={commonOptions} 
                        data={formatData(sewData)} 
                    />
                </div>
            </div>
        </div>
    );
};

export default TownCharts;