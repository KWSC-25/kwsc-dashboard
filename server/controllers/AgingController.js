import { hmpDb } from "../db.js";

export const getDispatchAging = async (req, res) => {
    try {
        const tableQuery = `
            SELECT 
                h.name AS hydrant_name,
                COUNT(CASE WHEN TIMESTAMPDIFF(HOUR, b.updated_at, NOW()) < 24 THEN 1 END) AS dispatched_less_than_24h,
                COUNT(CASE WHEN TIMESTAMPDIFF(HOUR, b.updated_at, NOW()) >= 24 AND TIMESTAMPDIFF(HOUR, b.updated_at, NOW()) < 48 THEN 1 END) AS dispatched_24h_to_48h,
                COUNT(CASE WHEN TIMESTAMPDIFF(HOUR, b.updated_at, NOW()) >= 48 AND TIMESTAMPDIFF(HOUR, b.updated_at, NOW()) < 72 THEN 1 END) AS dispatched_48h_to_72h,
                COUNT(CASE WHEN TIMESTAMPDIFF(HOUR, b.updated_at, NOW()) >= 72 THEN 1 END) AS dispatched_above_72h
            FROM hydrants h
            JOIN orders o ON h.id = o.hydrant_id
            JOIN billings b ON o.id = b.order_id
            WHERE o.order_type = 'OTS' 
              AND b.status = 2 
              AND b.updated_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
            GROUP BY h.id, h.name
            ORDER BY h.name;
        `;

        const chartQuery = `
            SELECT 
                COUNT(b.id) AS total_dispatched_ots,
                COUNT(CASE WHEN TIMESTAMPDIFF(HOUR, b.updated_at, NOW()) < 24 THEN 1 END) AS less_24,
                COUNT(CASE WHEN TIMESTAMPDIFF(HOUR, b.updated_at, NOW()) >= 24 AND TIMESTAMPDIFF(HOUR, b.updated_at, NOW()) < 48 THEN 1 END) AS d_24_48,
                COUNT(CASE WHEN TIMESTAMPDIFF(HOUR, b.updated_at, NOW()) >= 48 AND TIMESTAMPDIFF(HOUR, b.updated_at, NOW()) < 72 THEN 1 END) AS d_48_72,
                COUNT(CASE WHEN TIMESTAMPDIFF(HOUR, b.updated_at, NOW()) >= 72 THEN 1 END) AS above_72
            FROM orders o
            JOIN billings b ON o.id = b.order_id
            WHERE o.order_type = 'OTS' 
              AND b.status = 2 
              AND b.updated_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01');
        `;

        const [tableData] = await hmpDb.execute(tableQuery);
        const [chartData] = await hmpDb.execute(chartQuery);

        res.json({
            table: tableData,
            chart: chartData[0]
        });
    } catch (err) {
        console.error("Aging API Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};