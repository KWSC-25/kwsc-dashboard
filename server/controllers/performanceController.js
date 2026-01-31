import db from '../db.js';

const getPerformanceQuery = (typeId, limit, order) => `
SELECT 
    xen_name, town_name, total_count, pending_count, resolved_count, 
    pending_rate, resolution_percentage, avg_res_time, performance_score
FROM (
    SELECT 
        u.name AS xen_name, t.town AS town_name,
        COUNT(c.id) AS total_count,
        SUM(c.status = 0) AS pending_count,
        SUM(c.status = 1) AS resolved_count,
        ROUND((SUM(c.status = 0) / COUNT(c.id)) * 100, 2) AS pending_rate,
        ROUND((SUM(c.status = 1) / COUNT(c.id)) * 100, 2) AS resolution_percentage,
        ROUND(AVG(CASE WHEN c.status = 1 THEN TIMESTAMPDIFF(SECOND, c.created_at, c.updated_at) END) / 3600, 2) AS avg_res_time,
        ROUND(
            (
                ( ( (SUM(c.status = 1) / COUNT(c.id)) * 100 ) - MIN((SUM(c.status = 1) / COUNT(c.id)) * 100) OVER() ) / 
                NULLIF(MAX((SUM(c.status = 1) / COUNT(c.id)) * 100) OVER() - MIN((SUM(c.status = 1) / COUNT(c.id)) * 100) OVER(), 0) * 35
            ) + (
                ( 100 - (
                    ( ( (SUM(c.status = 0) / COUNT(c.id)) * 100 ) - MIN((SUM(c.status = 0) / COUNT(c.id)) * 100) OVER() ) / 
                    NULLIF(MAX((SUM(c.status = 0) / COUNT(c.id)) * 100) OVER() - MIN((SUM(c.status = 0) / COUNT(c.id)) * 100) OVER(), 0) * 100
                ) ) * 0.35
            ) + (
                ( 100 - (
                    ( AVG(CASE WHEN c.status = 1 THEN TIMESTAMPDIFF(SECOND, c.created_at, c.updated_at) END) - MIN(AVG(CASE WHEN c.status = 1 THEN TIMESTAMPDIFF(SECOND, c.created_at, c.updated_at) END)) OVER() ) / 
                    NULLIF(MAX(AVG(CASE WHEN c.status = 1 THEN TIMESTAMPDIFF(SECOND, c.created_at, c.updated_at) END)) OVER() - MIN(AVG(CASE WHEN c.status = 1 THEN TIMESTAMPDIFF(SECOND, c.created_at, c.updated_at) END)) OVER(), 0) * 100
                ) ) * 0.30
            ), 2) AS performance_score
    FROM mobile_agent ma
    JOIN users u ON ma.user_id = u.id
    JOIN towns t ON ma.town_id = t.id
    JOIN complaint c ON c.town_id = ma.town_id AND c.type_id = ma.type_id
    WHERE ma.type_id = ? AND ma.status = 1
    GROUP BY ma.user_id, ma.town_id, u.name, t.town
) AS metrics
ORDER BY performance_score ${order}, avg_res_time ${order === 'ASC' ? 'DESC' : 'ASC'}
LIMIT ${limit};`;

export const getUnderperformingEngineers = async (req, res) => {
    try {
        const [results] = await db.execute(getPerformanceQuery(req.query.typeId, 5, 'ASC'), [req.query.typeId]);
        res.json(results);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

export const getTopPerformers = async (req, res) => {
    try {
        const [waterBest] = await db.execute(getPerformanceQuery(2, 3, 'DESC'), [2]);
        const [sewBest] = await db.execute(getPerformanceQuery(1, 3, 'DESC'), [1]);
        res.json({ waterBest, sewBest });
    } catch (err) { res.status(500).json({ error: err.message }); }
};