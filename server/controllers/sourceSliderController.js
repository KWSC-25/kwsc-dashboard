import db from '../db.js';

export const getSourceDeepDive = async (req, res) => {
    try {
        const query = `
            SELECT 
                source,
                COUNT(*) AS total_reg,
                SUM(type_id = 2) AS reg_water,
                SUM(type_id = 1) AS reg_sewer,
                SUM(type_id NOT IN (1, 2)) AS reg_other,
                SUM(status = 1) AS total_res,
                SUM(status = 1 AND type_id = 2) AS res_water,
                SUM(status = 1 AND type_id = 1) AS res_sewer,
                SUM(status = 1 AND type_id NOT IN (1, 2)) AS res_other,
                SUM(status = 2) AS total_wip,
                SUM(status = 2 AND type_id = 2) AS wip_water,
                SUM(status = 2 AND type_id = 1) AS wip_sewer,
                SUM(status = 2 AND type_id NOT IN (1, 2)) AS wip_other,
                SUM(status = 0) AS total_pen,
                SUM(status = 0 AND type_id = 2) AS pen_water,
                SUM(status = 0 AND type_id = 1) AS pen_sewer,
                SUM(status = 0 AND type_id NOT IN (1, 2)) AS pen_other
            FROM complaint
            WHERE created_at BETWEEN '2024-10-23' AND DATE_ADD(CURDATE(), INTERVAL 1 DAY)
            GROUP BY source
            ORDER BY total_reg DESC;
        `;

        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};