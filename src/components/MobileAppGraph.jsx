import React from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement,
    LineElement, Title, Tooltip, Filler, Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

const MobileAppGraph = ({ data }) => {
    // If data is missing, we show a loading box that maintains the height
    if (!data || !data.labels || data.labels.length === 0) {
        return (
            <div className="report-content ">
                <div className="section-header">
                    <div className="section-header-purple">
                        <i className="fas fa-mobile-alt"></i> OTS ORDERS PERFORMANCE (LAST 7 DAYS)
                    </div>
                </div>
                <div className="loading-graph">SYNCHRONIZING DATA...</div>
            </div>
        );
    }

    const chartData = {
        labels: data.labels,
        datasets: [{
            label: 'APP ORDERS',
            data: data.data || [],
            fill: true,
            borderColor: '#00f2ff',
            backgroundColor: 'rgba(0, 242, 255, 0.1)',
            tension: 0.4,
            pointBackgroundColor: '#00f2ff',
            pointBorderColor: '#fff',
            pointRadius: 4,
            borderWidth: 3
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#8493a5', font: { weight: 'bold', size: 10 } }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#ffffff', font: { weight: 'bold', size: 9 } }
            }
        }
    };

    return (
        <div className="report-content header-purple">
            <div className="section-header">
                <div className="section-header-purple">
                    <i className="fas fa-mobile-alt"></i> OTS ORDERS PERFORMANCE (LAST 7 DAYS)
                </div>
            </div>
            <div className="chart-container">
                <Line data={chartData} options={options} />
            </div>
        </div>
    );
};

export default MobileAppGraph;