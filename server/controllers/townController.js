import db from '../db.js';

export const getTownStats = async (req, res) => {
    const query = `
        SELECT 
            t.town AS town_name,
            COUNT(c.id) AS total_registered,
            SUM(CASE WHEN c.status = 1 THEN 1 ELSE 0 END) AS resolved,
            SUM(CASE WHEN c.status = 0 THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN c.status = 2 THEN 1 ELSE 0 END) AS wip
        FROM towns t
        LEFT JOIN complaint c ON c.town_id = t.id 
            AND c.created_at BETWEEN '2024-10-23' AND DATE_ADD(CURDATE(), INTERVAL 1 DAY)
        GROUP BY t.town
        ORDER BY t.town ASC;
    `;
    try {
        const [rows] = await db.execute(query);
        res.json(rows);
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({ error: err.message });
    }
};