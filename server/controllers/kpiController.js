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

    FROM complaint
    WHERE created_at BETWEEN '2024-10-23' AND CURDATE() + 1
    `);
    const [rows2] = await db.query(`

        SELECT
    SUM(is_assigned = 1) AS total_assigned,
    SUM(is_assigned = 0) AS total_unassigned,
    SUM(is_assigned = 1 AND status = 0) AS pending_assigned,
    SUM(is_assigned = 0 AND status = 0) AS pending_unassigned
FROM (
    SELECT c.id, c.status,
        (all_assignments.complaint_id IS NOT NULL) AS is_assigned
    FROM complaint c
    LEFT JOIN (
        SELECT complaint_id FROM complaint_assign_agent
        UNION
        SELECT complaint_id FROM complaint_assign_department
    ) AS all_assignments ON c.id = all_assignments.complaint_id
    WHERE c.created_at BETWEEN '2024-10-23' AND DATE_ADD(CURDATE(), INTERVAL 1 DAY)
) AS assignment_status;
  `);

  //today
    const [today] = await db.query(`
    SELECT
        SUM(DATE(created_at) = CURDATE()) AS total_registered_today,
        SUM(status = 1 AND DATE(updated_at) = CURDATE()) AS total_resolved_today

    FROM complaint
    `);
    res.json({mainKpis: rows[0],
      assignmentStats: rows2[0],
      todaystats: today[0]});

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};