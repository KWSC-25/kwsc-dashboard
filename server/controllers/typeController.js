import db from '../db.js';

export const getTypesData = async (req, res) => { 
    const { typeId } = req.query; // 1 for Sewerage, 2 for Water
    
    const query = `
        SELECT 
            st.title AS subtype_name,
            COUNT(c.id) AS total_registered,
            SUM(c.status = 1) AS total_resolved,
            SUM(c.status = 2) AS total_wip,
            SUM(c.status = 0) AS total_pending
        FROM complaint c
        JOIN sub_types st ON c.subtype_id = st.id
        WHERE c.type_id = ?
        AND c.created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
        GROUP BY st.id, st.title
        ORDER BY total_registered DESC
        LIMIT 3;
    `;

    try {
        const [results] = await db.execute(query, [typeId]);
        res.json(results);
    } catch (err) {
        console.error("Type Fetch Error:", err);
        res.status(500).json({ error: err.message });
    }
};