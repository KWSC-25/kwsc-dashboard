import db from '../db.js';

export const getIdleComplaints = async (req, res) => {
    const { typeId } = req.query; // 1 for Sewerage, 2 for Water
    
    const query = `
        SELECT 
            complaint_no,
            type,
            town,
            CASE 
                WHEN overdue_hrs_raw >= 8760 THEN CONCAT(ROUND(overdue_hrs_raw / 8760, 1), ' Years')
                WHEN overdue_hrs_raw >= 720  THEN CONCAT(ROUND(overdue_hrs_raw / 720, 1), ' Months')
                WHEN overdue_hrs_raw >= 24   THEN CONCAT(ROUND(overdue_hrs_raw / 24, 1), ' Days')
                ELSE CONCAT(ROUND(overdue_hrs_raw, 1), ' Hours')
            END AS overdue_hrs
        FROM (
            SELECT 
                c.comp_num AS complaint_no,
                st.title AS type,
                t.town AS town,
                TIMESTAMPDIFF(HOUR, c.created_at, NOW()) AS overdue_hrs_raw
            FROM complaint c
            JOIN sub_types st ON c.subtype_id = st.id
            JOIN towns t ON c.town_id = t.id
            JOIN complaint_assign_agent caa on caa.complaint_id = c.id 
            WHERE c.status = 0 
            AND c.type_id = ?
            AND c.created_at != c.updated_at 
        ) AS idle_metrics
        ORDER BY overdue_hrs_raw DESC 
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