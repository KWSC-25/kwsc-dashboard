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
        const [results] = await req.db.execute(query, [...ids, ...ids]);
        res.json(results);
    } catch (err) {
        console.error("Type Fetch Error:", err);
        res.status(500).json({ error: err.message });
    }
};


// Add this to your existing typeController.js
export const getSubtypeTownBreakdown = async (req, res) => {
    const { subTypeId } = req.query;

    const query = `
        SELECT
            t.town AS town_name_emer,
            COUNT(c.id) AS total_registered_town,
            SUM(c.status = 1) AS total_resolved_town,
            SUM(c.status = 2) AS total_wip_town,
            SUM(c.status = 0) AS total_pending_town
        FROM complaint c
        JOIN towns t ON t.id = c.town_id  
            AND c.subtype_id = ?
            AND c.created_at BETWEEN '2024-10-23' AND DATE_ADD(CURDATE(), INTERVAL 1 DAY)
        GROUP BY t.id, t.town
        ORDER BY t.town ASC;
    `;

    try {
        const [results] = await req.db.execute(query, [subTypeId]);
        res.json(results);
    } catch (err) {
        console.error("Emergency Types Town Breakdown Fetch Error:", err);
        res.status(500).json({ error: err.message });
    }
};


export const getAssignmentBreakdown = async (req, res) => {
    const { townId, typeId } = req.query;

    const query = `
        SELECT 
            COALESCE(u_assigned_agent.name, u_dept.name, 'Unassigned') AS assigned_to,
            COUNT(c.id) AS complaint_count
        FROM complaint c
        LEFT JOIN complaint_assign_agent caa ON c.id = caa.complaint_id
        LEFT JOIN mobile_agent ma ON caa.agent_id = ma.id
        LEFT JOIN users u_assigned_agent ON ma.user_id = u_assigned_agent.id
        LEFT JOIN complaint_assign_department cad ON c.id = cad.complaint_id
        LEFT JOIN users u_dept ON cad.user_id = u_dept.id
        WHERE c.type_id = ?
          AND c.status = 0
          AND c.town_id = ?
          AND c.created_at >= '2024-10-23'
        GROUP BY assigned_to
        ORDER BY complaint_count DESC;
    `;

    try {
        const [results] = await req.db.execute(query, [typeId, townId]);
        res.json(results);
    } catch (err) {
        console.error("Assignment Breakdown Error:", err);
        res.status(500).json({ error: err.message });
    }
};