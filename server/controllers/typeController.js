import db from '../db.js';

export const getTypesData = async (req, res) => { 
    const {  subTypeIds } = req.query; 
    
    // Split the comma-separated string into an array
    const ids = subTypeIds ? subTypeIds.split(',').map(id => parseInt(id)) : [];

    const query = `
        SELECT 
            st.id AS subtype_id,
            st.title AS subtype_name,
            COUNT(c.id) AS total_registered,
            SUM(c.status = 1) AS total_resolved,
            SUM(c.status = 2) AS total_wip,
            SUM(c.status = 0) AS total_pending,
            ROUND((SUM(c.status = 0) / NULLIF(COUNT(c.id), 0)) * 100, 2) AS pending_percentage,
            ROUND(
                (SUM(c.status = 0) / (SELECT NULLIF(SUM(status = 0 AND created_at BETWEEN '2024-10-23' AND DATE_ADD(CURDATE(), INTERVAL 1 DAY)), 0) FROM complaint)) * 100, 
            2) AS impact_percentage
        FROM sub_types st
        LEFT JOIN complaint c ON c.subtype_id = st.id
        WHERE st.id IN (${ids.map(() => '?').join(',')}) AND c.created_at BETWEEN '2024-10-23' AND DATE_ADD(CURDATE(), INTERVAL 1 DAY)
        GROUP BY st.id, st.title
        ORDER BY FIELD(st.id, ${ids.map(() => '?').join(',')});
    `;

    try {
        // We pass the IDs twice: once for the IN clause, once for the FIELD order
        const [results] = await db.execute(query, [...ids, ...ids]);
        res.json(results);
    } catch (err) {
        console.error("Type Fetch Error:", err);
        res.status(500).json({ error: err.message });
    }
};