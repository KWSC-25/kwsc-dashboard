import db from '../db.js';

export const getTownWiseStats = async (req, res) => {
    // typeId: 2 for Water, 1 for Sewerage
    const { typeId } = req.query;

    const query = `
        SELECT 
            t.town AS town_name,
            COUNT(c.id) AS total_registered,
            SUM(CASE WHEN c.status = 1 THEN 1 ELSE 0 END) AS total_resolved,
            SUM(CASE WHEN c.status = 2 THEN 1 ELSE 0 END) AS total_wip,
            SUM(CASE WHEN c.status = 0 THEN 1 ELSE 0 END) AS total_pending
        FROM towns t
        LEFT JOIN complaint c ON t.id = c.town_id 
            AND c.type_id = ? AND c.created_at BETWEEN '2024-10-23' AND DATE_ADD(CURDATE(), INTERVAL 1 DAY)
        GROUP BY t.id, t.town
        ORDER BY total_registered ASC;
    `;

    try {
        const [results] = await db.execute(query, [typeId]);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getAvgResolutionStats = async (req, res) => {
    const query = `
SELECT 
    -- Format Water Average
    CASE 
        WHEN water_raw >= 8760 THEN CONCAT(ROUND(water_raw / 8760, 1), ' Years')
        WHEN water_raw >= 720  THEN CONCAT(ROUND(water_raw / 720, 1), ' Months')
        WHEN water_raw >= 24   THEN CONCAT(ROUND(water_raw / 24, 1), ' Days')
        ELSE CONCAT(ROUND(water_raw, 1), ' Hours')
    END AS water_avg_res_time,
    
    -- Format Sewerage Average
    CASE 
        WHEN sew_raw >= 8760 THEN CONCAT(ROUND(sew_raw / 8760, 1), ' Years')
        WHEN sew_raw >= 720  THEN CONCAT(ROUND(sew_raw / 720, 1), ' Months')
        WHEN sew_raw >= 24   THEN CONCAT(ROUND(sew_raw / 24, 1), ' Days')
        ELSE CONCAT(ROUND(sew_raw, 1), ' Hours')
    END AS sew_avg_res_time
FROM (
    SELECT 
        AVG(CASE WHEN type_id = 2 AND status = 1 THEN TIMESTAMPDIFF(SECOND, created_at, updated_at) END) / 3600 AS water_raw,
        AVG(CASE WHEN type_id = 1 AND status = 1 THEN TIMESTAMPDIFF(SECOND, created_at, updated_at) END) / 3600 AS sew_raw
    FROM complaint
    WHERE status = 1 AND created_at BETWEEN '2024-10-23' AND CURDATE() + 1

) AS global_metrics;
    `;

    try {
        const [results] = await db.execute(query);
        res.json(results[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};