export const getTownStats = async (req, res) => {
    const { typeId } = req.query; 
    const query = `
        SELECT 
            t.id AS town_id,   /* <--- ADD THIS LINE */
            t.town AS town_name,
            COUNT(c.id) AS total_registered,
            COALESCE(SUM(c.status = 1), 0) AS resolved,
            COALESCE(SUM(c.status = 2), 0) AS wip,
            COALESCE(SUM(c.status = 0), 0) AS pending
        FROM towns t
        LEFT JOIN complaint c ON t.id = c.town_id 
            AND c.type_id = ? 
            AND c.created_at BETWEEN '2024-10-23' AND DATE_ADD(CURDATE(), INTERVAL 1 DAY)
        GROUP BY t.id, t.town
        ORDER BY total_registered DESC;`;
    try {
        const [rows] = await req.db.execute(query, [typeId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getTownDetails = async (req, res) => {
    const { townId, typeId } = req.query;

    // Use the verified table/column names from your working source query
    const query = `
        SELECT 
            ct.title AS type_name,
            st.title AS subtype_name,
            COUNT(c.id) AS reg,
            COALESCE(SUM(c.status = 1), 0) AS res,
            COALESCE(SUM(c.status = 0), 0) AS pen,
            COALESCE(SUM(c.status = 2), 0) AS wip
        FROM complaint c
        INNER JOIN complaint_types ct ON c.type_id = ct.id
        LEFT JOIN sub_types st ON c.subtype_id = st.id
        WHERE c.town_id = ? AND c.type_id = ?
        AND c.created_at BETWEEN '2024-10-23' AND DATE_ADD(CURDATE(), INTERVAL 1 DAY)
        GROUP BY ct.title, st.title
        ORDER BY reg DESC;`;

    try {
        // Validation to prevent SQL from running with 'undefined'
        if (!townId || townId === 'undefined') {
            return res.status(400).json({ error: "townId is required" });
        }

        const [rows] = await req.db.execute(query, [townId, typeId]);
        res.json(rows);
    } catch (err) {
        console.error("SQL Error:", err.message);
        res.status(500).json({ error: err.message });
    }
};