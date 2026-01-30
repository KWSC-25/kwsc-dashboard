import db from '../db.js';

export const getIdleComplaints = async (req, res) => {
    const { typeId } = req.query; // 1 for Sewerage, 2 for Water
    
    const query = `
        SELECT 
            c.comp_num AS complaint_no,
            st.title AS type,
            t.town AS town,
            TIMESTAMPDIFF(HOUR, c.created_at, NOW()) AS overdue_hrs
        FROM complaint c
        JOIN sub_types st ON c.subtype_id = st.id
        JOIN towns t ON c.town_id = t.id
        WHERE c.status = 0 
          AND c.type_id = ?
        ORDER BY c.created_at ASC
        LIMIT 3;
    `;

    try {
        const [results] = await db.execute(query, [typeId]);
        res.json(results);
    } catch (err) {
        console.error("Idle Fetch Error:", err);
        res.status(500).json({ error: err.message });
    }
};