import db from '../db.js';

export const getKpiStats = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
          COUNT(*) AS total_registered,
          SUM(type_id = 2) AS total_registered_water,
          SUM(type_id = 1) AS total_registered_sewer,
          SUM(type_id NOT IN (1, 2)) AS total_registered_others, SUM(DATE(created_at) = CURDATE()) AS total_registered_today,
          SUM(status = 1) AS total_resolved,
          SUM(status = 1 AND type_id = 2) AS total_resolved_water,
          SUM(status = 1 AND type_id = 1) AS total_resolved_sewer,
          SUM(status = 1 AND type_id NOT IN (1, 2)) AS total_resolved_others,
          SUM(status = 1 AND DATE(updated_at) <= DATE_SUB(CURDATE(), INTERVAL 1 DAY)) AS total_resolved_yesterday,
          SUM(status = 2) AS total_wip,
          SUM(status = 2 AND type_id = 2) AS total_wip_water,
          SUM(status = 2 AND type_id = 1) AS total_wip_sewer,
          SUM(status = 2 AND type_id NOT IN (1, 2)) AS total_wip_others,
          SUM(status = 0) AS total_pending,
          SUM(status = 0 AND type_id = 2) AS total_pending_water,
          SUM(status = 0 AND type_id = 1) AS total_pending_sewer,
          SUM(status = 0 AND type_id NOT IN (1, 2)) AS total_pending_others,
          SUM(status = 0 AND DATE(created_at) <= DATE_SUB(CURDATE(), INTERVAL 1 DAY)) AS total_pending_yesterday
      FROM complaint
    `);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};