import { hmpDb } from "../db.js";

export const getMobileAppTrend = async (req, res) => {
    const query = `
        SELECT 
            DATE_FORMAT(api_created_at, '%b %d') AS order_date,
            COUNT(*) AS total_created_orders
        FROM ots_order
        WHERE api_created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY DATE(api_created_at)
        ORDER BY DATE(api_created_at) ASC;
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