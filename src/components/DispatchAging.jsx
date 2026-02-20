import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const DispatchAging = () => {
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchAging = async () => {
            try {
                const resp = await api.get('/aging/dispatch-stats');
                setData(resp.data);
            } catch (err) {
                console.error("Aging Fetch Error:", err);
            }
        };
        fetchAging();
        const interval = setInterval(fetchAging, 5000);
        return () => clearInterval(interval);
    }, []);

    if (!data) return <div className="loading-placeholder">Loading Aging Analysis...</div>;

    const chartOptions = {
        cutout: '65%',
        plugins: {
            legend: { display: false },
        },
        maintainAspectRatio: false
    };
    const getCSSVar = (varName) => {
            return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
        };
        const getPerc = (count) => {
            if (!data.chart.total_dispatched_ots || data.chart.total_dispatched_ots === 0) return '0%';
            return `${((count / data.chart.total_dispatched_ots) * 100).toFixed(1)}%`;
        };
    const chartConfig = {
        labels: ['< 24h', '24h-48h', '48h-72h', '> 72h'],
        datasets: [{
            data: [data.chart.less_24, data.chart.d_24_48, data.chart.d_48_72, data.chart.above_72],
            backgroundColor: [getCSSVar('--hmp-green'), getCSSVar('--hmp-orange'), getCSSVar('--hmp-today-border'), '#ef4444'],
            borderWidth: 0,
        }]
    };

    return (
        <div className="aging-analysis-container">
            <div className="aging-table-section">
               
                <table>
                    <thead>
                        <tr>
                            <th className="gps-online-header">HYDRANT</th>
                            <th className="gps-online-header" colSpan="4">OTS ORDERS</th>
                        </tr>
                        <tr className="sub-header">
                            <th></th>
                            <th>On time (within 24h)</th>
                            <th>Delayed (Over 24h)</th>
                            <th>Critical (Over 48h)</th>
                            <th>Severe (Over 72h)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.table.map((row, i) => {
                            // Check if severe count is greater than 0
                            const isSevere = row.dispatched_above_72h > 0;
                            
                            return (
                                <tr key={i} className={isSevere ? 'blink-row' : ''}>
                                    <td className="hydrant-name-cell">{row.hydrant_name}</td>
                                    <td className="val-24w">{row.dispatched_less_than_24h}</td>
                                    <td className="val-24">{row.dispatched_24h_to_48h}</td>
                                    <td className="val-48">{row.dispatched_48h_to_72h}</td>
                                    <td className="val-72">{row.dispatched_above_72h}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="aging-chart-section">
                <div className="chart-wrapper">
                    <Doughnut data={chartConfig} options={chartOptions} />
                    <div className="chart-center-text">
                        <span className="total-num-aging">{data.chart.total_dispatched_ots}</span>
                        <span className="total-label">TOTAL</span>
                    </div>
                </div>
                <div className="chart-legend">
<div>
                        <span className="dot-a green"></span> 
                        &lt; 24 Hrs <span className="perc-tag-1">({getPerc(data.chart.less_24)})</span>
                    </div>
                    <div>
                        <span className="dot-a yellow"></span> 
                        &gt; 24 Hrs <span className="perc-tag-2">({getPerc(data.chart.d_24_48)})</span>
                    </div>
                    <div>
                        <span className="dot-a orange"></span> 
                        &gt; 48 Hrs <span className="perc-tag-3">({getPerc(data.chart.d_48_72)})</span>
                    </div>
                    <div>
                        <span className="dot-a red"></span> 
                        &gt; 72 Hrs <span className="perc-tag-4">({getPerc(data.chart.above_72)})</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DispatchAging;