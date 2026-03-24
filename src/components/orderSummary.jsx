import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const OrderSummary = () => {
    const [data, setData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const resp = await api.get('/orders/summary-report');
                setData(resp.data);
            } catch (err) { console.error(err); }
        };
        fetchData();
        const int = setInterval(fetchData, 30000);
        return () => clearInterval(int);
    }, []);

    const calculateTotal = (key) => data.reduce((sum, row) => sum + (Number(row[key]) || 0), 0);

    return (
        <div className="order-summary-container">
           

            <table className="summary-table">
                <thead>
                    <tr>
                        <th >HYDRANT</th>
                        <th>COMMERCIAL</th>
                        <th>GPS ONLINE</th>
                        <th >OTS </th>
                        <th>DC QUOTA</th>
                        <th>GPS BILLING</th>
                        <th>GPS CARE OFF</th>
                        <th>GOVT VEHICLE</th>
                        <th>P.A.F.</th>
                        <th>PAK RANGER</th>
                        <th >TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, i) => (
                        <tr key={i}>
                            <td className="hydrant-name" style={{  fontWeight: 'bold'}} >{row.hydrant_name?.toUpperCase()}</td>
                            <td>{row.commercial}</td>
                            <td>{row.gps_online}</td>
                            <td>{row.gps_ots || 0}</td>
                            <td>{row.dc_quota}</td>
                            <td>{row.gps_billing}</td>
                            <td>{row.gps_careoff}</td>
                            <td>{row.govt_vehicle}</td>
                            <td>{row.paf}</td>
                            <td>{row.pak_ranger}</td>
                            <td className="total-num"style={{ color: 'var(--accent-cyan)', fontWeight: 'bold'}}>{row.total}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="footer-total-row" style={{ background: 'rgba(0, 242, 255, 0.1)' }}>
                        <td style={{ color: 'var(--accent-cyan)' }}>GRAND TOTAL</td>
                        <td>{calculateTotal('commercial')}</td>
                        <td>{calculateTotal('gps_online')}</td>
                        <td>{calculateTotal('gps_ots')}</td>
                        <td>{calculateTotal('dc_quota')}</td>
                        <td>{calculateTotal('gps_billing')}</td>
                        <td>{calculateTotal('gps_careoff')}</td>
                        <td>{calculateTotal('govt_vehicle')}</td>
                        <td>{calculateTotal('paf')}</td>
                        <td>{calculateTotal('pak_ranger')}</td>
                        <td className="grand-total" style={{ color: 'yellow' }}>{calculateTotal('total')}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};

export default OrderSummary;