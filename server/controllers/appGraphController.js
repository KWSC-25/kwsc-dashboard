import { hmpDb } from "../db.js";

export const getMobileAppTrend = async (req, res) => {
    const query = `
        SELECT 
            DATE_FORMAT(created_at, '%b %d') AS order_date,
            COUNT(*) AS total_created_orders
        FROM ots_order
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) ASC;
    `;

    try {
        const [rows] = await hmpDb.execute(query);
        res.status(200).json({
            labels: rows.map(row => row.order_date),
            data: rows.map(row => row.total_created_orders)
        });
    } catch (error) {
        console.error("Graph Error:", error);
        res.status(500).json({ message: "Error fetching graph data" });
    }
};