import db from '../db.js';

export const getKpiStats = async (req, res) => {
  try {
    const [rows] = await db.query(`
    SELECT
        /* 1. TOTAL REGISTERED CARD */
        COUNT(*) AS total_registered,
        SUM(type_id = 2) AS total_registered_water,
        SUM(type_id = 1) AS total_registered_sewer,
        SUM(type_id = 3) AS total_registered_bill,
        SUM(type_id = 4) AS total_registered_bulk,
        SUM(type_id = 5) AS total_registered_new_conn,
        SUM(type_id = 8) AS total_registered_other,
        SUM(type_id = 12) AS total_registered_social,
        SUM(type_id = 19) AS total_registered_hyd,
        SUM(type_id =24) AS total_registered_req,
        SUM(DATE(created_at) = CURDATE()) AS total_registered_today,

        /* 2. RESOLVED CARD */
        SUM(status = 1) AS total_resolved,
        SUM(status = 1 AND type_id = 2) AS total_resolved_water,
        SUM(status = 1 AND type_id = 1) AS total_resolved_sewer,
        SUM(status = 1 AND type_id NOT IN (1, 2)) AS total_resolved_others,
        -- Total resolved count as of the end of yesterday
        SUM(status = 1 AND DATE(updated_at) <= DATE_SUB(CURDATE(), INTERVAL 1 DAY)) AS total_resolved_yesterday,

        /* 3. WORK IN PROGRESS CARD */
        SUM(status = 2) AS total_wip,
        SUM(status = 2 AND type_id = 2) AS total_wip_water,
        SUM(status = 2 AND type_id = 1) AS total_wip_sewer,
        SUM(status = 2 AND type_id NOT IN (1, 2)) AS total_wip_others,

        /* 4. PENDING CARD */
        SUM(status = 0) AS total_pending,
        SUM(status = 0 AND type_id = 2) AS total_pending_water,
        SUM(status = 0 AND type_id = 1) AS total_pending_sewer,
        SUM(status = 0 AND type_id = 3) AS total_pending_bill,
        SUM(status = 0 AND type_id = 4) AS total_pending_bulk,
        SUM(status = 0 AND type_id = 5) AS total_pending_new_conn,
        SUM(status = 0 AND type_id = 8) AS total_pending_other,
        SUM(status = 0 AND type_id = 12) AS total_pending_social,
        SUM(status = 0 AND type_id = 19) AS total_pending_hyd,
        SUM(status = 0 AND type_id =24) AS total_pending_req,
        -- Total pending count as of the end of yesterday
        SUM(status = 0 AND DATE(created_at) <= DATE_SUB(CURDATE(), INTERVAL 1 DAY)) AS total_pending_yesterday

    FROM complaint;
    `);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};