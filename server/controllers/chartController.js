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
            AND c.type_id = ? 
        GROUP BY t.id, t.town
        ORDER BY t.town ASC;
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
            ROUND(AVG(CASE WHEN type_id = 2 AND status = 1 THEN TIMESTAMPDIFF(SECOND, created_at, updated_at) END) / 3600, 1) AS water_avg_res_hrs,
            ROUND(AVG(CASE WHEN type_id = 1 AND status = 1 THEN TIMESTAMPDIFF(SECOND, created_at, updated_at) END) / 3600, 1) AS sew_avg_res_hrs
        FROM complaint
        WHERE status = 1 
    `;

    try {
        const [results] = await db.execute(query);
        res.json(results[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};