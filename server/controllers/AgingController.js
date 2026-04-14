export const getDispatchAging = async (req, res) => {
    try {
        const tableQuery = `
            SELECT 
                h.name AS hydrant_name,
                -- Orders pending for less than 24 hours
                COUNT(CASE 
                    WHEN TIMESTAMPDIFF(HOUR, ots.api_created_at, NOW()) < 24 THEN 1 
                END) AS pending_less_than_24h,
                -- Orders pending for 24 to 48 hours
                COUNT(CASE 
                    WHEN TIMESTAMPDIFF(HOUR, ots.api_created_at, NOW()) >= 24 
                    AND TIMESTAMPDIFF(HOUR, ots.api_created_at, NOW()) < 48 THEN 1 
                END) AS pending_24h_to_48h,
                -- Orders pending for 48 to 72 hours
                COUNT(CASE 
                    WHEN TIMESTAMPDIFF(HOUR, ots.api_created_at, NOW()) >= 48 
                    AND TIMESTAMPDIFF(HOUR, ots.api_created_at, NOW()) < 72 THEN 1 
                END) AS pending_48h_to_72h,
                -- Orders pending for more than 72 hours
                COUNT(CASE 
                    WHEN TIMESTAMPDIFF(HOUR, ots.api_created_at, NOW()) >= 72 THEN 1 
                END) AS pending_above_72h,
                -- Total pending per hydrant
                COUNT(ots.id) AS total_pending
            FROM hydrants h
            JOIN ots_order ots ON h.ots_hydrant  = ots.hydrant_id
            WHERE ots.status IN ('pending', 'pending_alignment')
            AND (ots.api_created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') 
                OR ots.updated_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01'))
            GROUP BY h.id, h.name
            ORDER BY h.name ASC;
        `;

        const chartQuery = `
            SELECT 
                COUNT(ots.id) AS total_pending_ots,
                -- Pending for less than 24 hours
                COUNT(CASE 
                    WHEN TIMESTAMPDIFF(HOUR, ots.api_created_at, NOW()) < 24 THEN 1 
                END) AS less_24,
                -- Pending for 24 to 48 hours
                COUNT(CASE 
                    WHEN TIMESTAMPDIFF(HOUR, ots.api_created_at, NOW()) >= 24 
                    AND TIMESTAMPDIFF(HOUR, ots.api_created_at, NOW()) < 48 THEN 1 
                END) AS p_24_48,
                -- Pending for 48 to 72 hours
                COUNT(CASE 
                    WHEN TIMESTAMPDIFF(HOUR, ots.api_created_at, NOW()) >= 48 
                    AND TIMESTAMPDIFF(HOUR, ots.api_created_at, NOW()) < 72 THEN 1 
                END) AS p_48_72,
                -- Pending for more than 72 hours
                COUNT(CASE 
                    WHEN TIMESTAMPDIFF(HOUR, ots.api_created_at, NOW()) >= 72 THEN 1 
                END) AS above_72
            FROM ots_order ots
            WHERE ots.status IN ('pending', 'pending_alignment')
            AND (ots.api_created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') 
                OR ots.updated_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01'));
        `;

        const [tableData] = await req.db.execute(tableQuery);
        const [chartData] = await req.db.execute(chartQuery);

        res.json({
            table: tableData,
            chart: chartData[0]
        });
    } catch (err) {
        console.error("Aging API Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};