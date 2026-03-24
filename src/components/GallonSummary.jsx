import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const GallonSummary = () => {
    const [data, setData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const resp = await api.get('/orders/gallon-summary-report');
                setData(resp.data);
            } catch (err) { console.error(err); }
        };
        fetchData();
        const int = setInterval(fetchData, 30000);
        return () => clearInterval(int);
    }, []);

    // Column-wise totals (Grand Totals at bottom)
    const calculateTotal = (key) => data.reduce((sum, row) => sum + (Number(row[key]) || 0), 0);

    // Row-wise total (Horizontal sum for each Hydrant)
    const calculateRowTotal = (row) => {
        const keys = [
            'commercial_gallons', 'gps_ots_gallons', 'gps_online_gallons', 
            'dc_quota_gallons', 'gps_billing_gallons', 'gps_careoff_gallons', 
            'govt_vehicle_gallons', 'paf_gallons', 'pak_ranger_gallons'
        ];
        return keys.reduce((sum, key) => sum + (Number(row[key]) || 0), 0);
    };

    return (
        <div className="order-summary-container">
            <table className="summary-table">
                <thead>
                    <tr>
                        <th>HYDRANT</th>
                        <th>COMMERCIAL</th>
                        <th>GPS ONLINE</th>
                        <th>OTS</th>
                        <th>DC QUOTA</th>
                        <th>GPS BILLING</th>
                        <th>GPS CARE OFF</th>
                        <th>GOVT VEHICLE</th>
                        <th>P.A.F.</th>
                        <th>PAK RANGER</th>
                        <th>TOTAL GALLONS</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, i) => (
                        <tr key={i}>
                            <td  style={{ color: 'var(--sew-purple)', fontWeight: 'bold', textAlign:'left' }}>{row.hydrant_name?.toUpperCase()}</td>
                            <td>{row.commercial_gallons.toLocaleString()}</td>
                            <td>{row.gps_online_gallons.toLocaleString()}</td>
                            <td>{row.gps_ots_gallons.toLocaleString()}</td>
                            <td>{row.dc_quota_gallons.toLocaleString()}</td>
                            <td>{row.gps_billing_gallons.toLocaleString()}</td>
                            <td>{row.gps_careoff_gallons.toLocaleString()}</td>
                            <td>{row.govt_vehicle_gallons.toLocaleString()}</td>
                            <td>{row.paf_gallons.toLocaleString()}</td>
                            <td>{row.pak_ranger_gallons.toLocaleString()}</td>
                            <td style={{color: 'var(--sew-purple)', fontWeight: 'bold' }}>
                                {calculateRowTotal(row).toLocaleString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="footer-total-row-o" style={{ background: 'rgba(210, 98, 220, 0.1)' }}>
                        <td style={{ color: 'var(--accent-cyan)' }}>GRAND TOTAL</td>
                        <td>{calculateTotal('commercial_gallons').toLocaleString()}</td>
                        <td>{calculateTotal('gps_online_gallons').toLocaleString()}</td>
                        <td>{calculateTotal('gps_ots_gallons').toLocaleString()}</td>
                        <td>{calculateTotal('dc_quota_gallons').toLocaleString()}</td>
                        <td>{calculateTotal('gps_billing_gallons').toLocaleString()}</td>
                        <td>{calculateTotal('gps_careoff_gallons').toLocaleString()}</td>
                        <td>{calculateTotal('govt_vehicle_gallons').toLocaleString()}</td>
                        <td>{calculateTotal('paf_gallons').toLocaleString()}</td>
                        <td>{calculateTotal('pak_ranger_gallons').toLocaleString()}</td>
                        <td className="grand-total" style={{ color: 'yellow' }}>
                            {data.reduce((sum, row) => sum + calculateRowTotal(row), 0).toLocaleString()}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};

export default GallonSummary;