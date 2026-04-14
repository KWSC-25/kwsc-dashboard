export const getRedZoneViolations = async (req, res) => {
    try {
        const countQuery = `
            SELECT 
                COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_count,
                COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as monthly_count
            FROM red_zone_violations
        `;

        const listQuery = `
            SELECT 
                v.created_at,
                v.duration_minutes,
                v.latitude,
                v.longitude,
                t.truck_num,
                t.name as owner_name,
                h.name as hydrant_name,
                rz.name as red_zone_name
            FROM red_zone_violations v
            LEFT JOIN trucks t ON v.truck_id = t.id
            LEFT JOIN hydrants h ON v.hydrant_id = h.id
            LEFT JOIN red_zones rz ON v.red_zone_id = rz.id
            ORDER BY v.created_at DESC
            LIMIT 5
        `;

        const [[counts]] = await req.db.execute(countQuery);
        const [violations] = await req.db.execute(listQuery);

        res.status(200).json({
            summary: counts,
            list: violations
        });
    } catch (error) {
        console.error("Red Zone Error:", error);
        res.status(500).json({ message: "Error fetching violation data" });
    }
};