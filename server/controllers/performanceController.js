import db from '../db.js';
export const getUnderperformingEngineers = async (req, res) => {
    const { typeId } = req.query; // 1 for Sewerage, 2 for Water
    
    const query = `
    SELECT 
        xen_name,
        town_name,
        pending_count,
        total_count,
        pending_rate,
        avg_res_time,
        worst_score
    FROM (
        SELECT 
            u.name AS xen_name,
            t.town AS town_name,
            SUM(c.status = 0) AS pending_count,
            COUNT(c.id) AS total_count,
            ROUND((SUM(c.status = 0) / COUNT(c.id)) * 100, 2) AS pending_rate,
            ROUND(AVG(CASE WHEN c.status = 1 THEN TIMESTAMPDIFF(SECOND, c.created_at, c.updated_at) END) / 3600, 2) AS avg_res_time,
            ROUND(
                ( ( (SUM(c.status = 0) / COUNT(c.id)) * 100 ) - MIN((SUM(c.status = 0) / COUNT(c.id)) * 100) OVER() ) / 
                NULLIF(MAX((SUM(c.status = 0) / COUNT(c.id)) * 100) OVER() - MIN((SUM(c.status = 0) / COUNT(c.id)) * 100) OVER(), 0) * 60
                + ( AVG(CASE WHEN c.status = 1 THEN TIMESTAMPDIFF(SECOND, c.created_at, c.updated_at) END) - MIN(AVG(CASE WHEN c.status = 1 THEN TIMESTAMPDIFF(SECOND, c.created_at, c.updated_at) END)) OVER() ) / 
                NULLIF(MAX(AVG(CASE WHEN c.status = 1 THEN TIMESTAMPDIFF(SECOND, c.created_at, c.updated_at) END)) OVER() - MIN(AVG(CASE WHEN c.status = 1 THEN TIMESTAMPDIFF(SECOND, c.created_at, c.updated_at) END)) OVER(), 0) * 40
            , 2) AS worst_score
        FROM mobile_agent ma
        JOIN users u ON ma.user_id = u.id
        JOIN towns t ON ma.town_id = t.id
        JOIN complaint c ON c.town_id = ma.town_id AND c.type_id = ma.type_id
        WHERE ma.type_id = ? AND ma.status = 1
        GROUP BY ma.user_id, ma.town_id, u.name, t.town
    ) AS metrics
    ORDER BY worst_score DESC, avg_res_time DESC
    LIMIT 5;`;

    try {
        const [results] = await db.execute(query, [typeId]);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
export const getTopPerformers = async (req, res) => {
    const query = `
    SELECT xen_name, town_name, resolved_count, total_count, resolution_percentage, avg_res_time,
        ROUND((normalized_res_rate * 0.6) + ((100 - normalized_delay) * 0.4), 2) AS best_score
    FROM (
        SELECT u.name AS xen_name, t.town AS town_name, SUM(c.status = 1) AS resolved_count, COUNT(c.id) AS total_count,
            ROUND((SUM(c.status = 1) / COUNT(c.id)) * 100, 2) AS resolution_percentage,
            ROUND(AVG(CASE WHEN c.status = 1 THEN TIMESTAMPDIFF(SECOND, c.created_at, c.updated_at) END) / 3600, 2) AS avg_res_time,
            ( ( (SUM(c.status = 1) / COUNT(c.id)) * 100 ) - MIN((SUM(c.status = 1) / COUNT(c.id)) * 100) OVER() ) / 
            NULLIF(MAX((SUM(c.status = 1) / COUNT(c.id)) * 100) OVER() - MIN((SUM(c.status = 1) / COUNT(c.id)) * 100) OVER(), 0) * 100 AS normalized_res_rate,
            ( AVG(CASE WHEN c.status = 1 THEN TIMESTAMPDIFF(SECOND, c.created_at, c.updated_at) END) - MIN(AVG(CASE WHEN c.status = 1 THEN TIMESTAMPDIFF(SECOND, c.created_at, c.updated_at) END)) OVER() ) / 
            NULLIF(MAX(AVG(CASE WHEN c.status = 1 THEN TIMESTAMPDIFF(SECOND, c.created_at, c.updated_at) END)) OVER() - MIN(AVG(CASE WHEN c.status = 1 THEN TIMESTAMPDIFF(SECOND, c.created_at, c.updated_at) END)) OVER(), 0) * 100 AS normalized_delay
        FROM mobile_agent ma
        JOIN users u ON ma.user_id = u.id
        JOIN towns t ON ma.town_id = t.id
        JOIN complaint c ON c.town_id = ma.town_id AND c.type_id = ma.type_id
        WHERE ma.type_id = ? AND ma.status = 1
        GROUP BY ma.user_id, ma.town_id, u.name, t.town
    ) AS metrics
    ORDER BY best_score DESC, avg_res_time ASC
    LIMIT 3;`;

    try {
        // Fetch both simultaneously: 2 for Water, 1 for Sewerage
        const [waterBest] = await db.execute(query, [2]);
        const [sewBest] = await db.execute(query, [1]);
        
        res.json({
            waterBest,
            sewBest
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};