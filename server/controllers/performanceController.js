import db from '../db.js';

const getPerformanceQuery = (typeId, limit, order) => `
SELECT 
    xen_name, town_name, total_count, pending_count, resolved_count, 
    pending_rate, resolution_percentage,
    -- Dynamic Time Formatting: Hours -> Days -> Months -> Years
    CASE 
        WHEN avg_res_time_raw >= 8760 THEN CONCAT(ROUND(avg_res_time_raw / 8760, 1), ' Years')
        WHEN avg_res_time_raw >= 720  THEN CONCAT(ROUND(avg_res_time_raw / 720, 1), ' Months')
        WHEN avg_res_time_raw >= 24   THEN CONCAT(ROUND(avg_res_time_raw / 24, 1), ' Days')
        ELSE CONCAT(ROUND(avg_res_time_raw, 1), ' Hours')
    END AS avg_res_time,
    performance_score
FROM (
    SELECT 
        u.name AS xen_name, t.town AS town_name,
        COUNT(c.id) AS total_count,
        SUM(c.status = 0) AS pending_count,
        SUM(c.status = 1) AS resolved_count,
        ROUND((SUM(c.status = 0) / COUNT(c.id)) * 100, 2) AS pending_rate,
        ROUND((SUM(c.status = 1) / COUNT(c.id)) * 100, 2) AS resolution_percentage,
        AVG(CASE WHEN c.status = 1 THEN TIMESTAMPDIFF(SECOND, c.created_at, c.updated_at) END) / 3600 AS avg_res_time_raw,
        
        ROUND(
            (
                COALESCE(((SUM(c.status = 1) / COUNT(c.id)) * 100 - MIN((SUM(c.status = 1) / COUNT(c.id)) * 100) OVER()) / 
                NULLIF(MAX((SUM(c.status = 1) / COUNT(c.id)) * 100) OVER() - MIN((SUM(c.status = 1) / COUNT(c.id)) * 100) OVER(), 0) * 35, 0)
            ) + (
                COALESCE((1 - ((SUM(c.status = 0) / COUNT(c.id)) * 100 - MIN((SUM(c.status = 0) / COUNT(c.id)) * 100) OVER()) / 
                NULLIF(MAX((SUM(c.status = 0) / COUNT(c.id)) * 100) OVER() - MIN((SUM(c.status = 0) / COUNT(c.id)) * 100) OVER(), 0)) * 35, 0)
            ) + (
                COALESCE((1 - ( (AVG(CASE WHEN c.status = 1 THEN TIMESTAMPDIFF(SECOND, c.created_at, c.updated_at) END) / 3600) - MIN(AVG(CASE WHEN c.status = 1 THEN TIMESTAMPDIFF(SECOND, c.created_at, c.updated_at) END) / 3600) OVER() ) / 
                NULLIF(MAX(AVG(CASE WHEN c.status = 1 THEN TIMESTAMPDIFF(SECOND, c.created_at, c.updated_at) END) / 3600) OVER() - MIN(AVG(CASE WHEN c.status = 1 THEN TIMESTAMPDIFF(SECOND, c.created_at, c.updated_at) END) / 3600) OVER(), 0)) * 30, 0)
            ), 2) AS performance_score
    FROM mobile_agent ma
    JOIN users u ON ma.user_id = u.id
    JOIN towns t ON ma.town_id = t.id
    JOIN complaint c ON c.town_id = ma.town_id AND c.type_id = ma.type_id
    JOIN complaint_assign_agent caa ON caa.complaint_id = c.id 
    WHERE ma.type_id = ? AND ma.status = 1  AND c.created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
    GROUP BY ma.user_id, ma.town_id, u.name, t.town
) AS metrics
ORDER BY performance_score ${order}, avg_res_time_raw ${order === 'ASC' ? 'DESC' : 'ASC'}
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

const getEngineerDetailsQuery = `
SELECT 
    u.name,
    c.type_id,
    t.title as type_title,
    st.title as subtype_title,
    COUNT(c.id) as total,
    SUM(CASE WHEN c.status = 0 THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN c.status = 1 THEN 1 ELSE 0 END) as resolved,
    SUM(CASE WHEN c.status = 2 THEN 1 ELSE 0 END) as wip
FROM users u
JOIN mobile_agent ma ON u.id = ma.user_id
JOIN complaint_assign_agent caa ON caa.agent_id = ma.id
JOIN complaint c ON caa.complaint_id = c.id
JOIN complaint_types t ON c.type_id = t.id
JOIN sub_types st ON c.subtype_id = st.id
WHERE u.name = ? 
  AND c.type_id = ?
  AND c.created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
GROUP BY u.name, c.type_id, t.title, st.title;
`;


export const getEngineerDetails = async (req, res) => {
    try {
        const { name, typeId } = req.query;
        const [results] = await db.execute(getEngineerDetailsQuery, [name, typeId]);
        
        if (results.length === 0) return res.status(404).json({ message: "No data found" });
        
        const details = {
            name: results[0].name,
            typeId: parseInt(results[0].type_id),
            total: results.reduce((acc, row) => acc + parseInt(row.total), 0),
            pending: results.reduce((acc, row) => acc + parseInt(row.pending), 0),
            resolved: results.reduce((acc, row) => acc + parseInt(row.resolved), 0),
            wip: results.reduce((acc, row) => acc + parseInt(row.wip), 0),
            breakdown: results.map(r => ({
                subtype: r.subtype_title,
                total: r.total,
                pending: r.pending,
                resolved: r.resolved,
                wip: r.wip
            }))
        };
        res.json(details);
    } catch (err) { res.status(500).json({ error: err.message }); }
};