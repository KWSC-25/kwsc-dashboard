import db from '../db.js';

export const getTownStats = async (req, res) => {
    const { typeId } = req.query; // 2 for Water, 1 for Sewerage
    const query = `
        SELECT 
            t.town AS town_name,
            COUNT(c.id) AS total_registered,
            SUM(CASE WHEN c.status = 1 THEN 1 ELSE 0 END) AS resolved,
            SUM(CASE WHEN c.status = 2 THEN 1 ELSE 0 END) AS wip,
            SUM(CASE WHEN c.status = 0 THEN 1 ELSE 0 END) AS pending
        FROM towns t
        LEFT JOIN complaint c ON t.id = c.town_id 
            AND c.type_id = ? AND c.created_at BETWEEN '2024-10-23' AND DATE_ADD(CURDATE(), INTERVAL 1 DAY)
        GROUP BY t.id, t.town
        ORDER BY total_registered DESC;`; // Changed to DESC to show active towns first
    try {
        const [rows] = await db.execute(query, [typeId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};