import { hmpDb } from "../db.js";
export const getHydrantPerformance = async (req, res) => {
    try {
        const query = `
        SELECT 
            h.name AS hydrant_name,
            -- TODAY'S STATS
            COALESCE(SUM(events.hmp_created_today), 0) + COALESCE(SUM(events.ots_created_today), 0) AS created_today,
            COALESCE(SUM(events.dispatched_today), 0) AS dispatched_today,
            COALESCE(SUM(events.completed_today), 0) AS completed_today,
            COALESCE(SUM(events.cancelled_today), 0) AS cancelled_today,
            COALESCE(SUM(events.pending_today), 0) AS pending_today,
            -- MONTH'S STATS
            COALESCE(SUM(events.hmp_created_month), 0) + COALESCE(SUM(events.ots_created_month), 0) AS created_month,
            COALESCE(SUM(events.dispatched_month), 0) AS dispatched_month,
            COALESCE(SUM(events.completed_month), 0) AS completed_month,
            COALESCE(SUM(events.cancelled_month), 0) AS cancelled_month,
            COALESCE(SUM(events.pending_month), 0) AS pending_month
        FROM hydrants h
        LEFT JOIN (
            -- CHANNEL 1: HMP CREATED (From Orders Table)
            -- Only counts orders that are NOT type 'OTS' to avoid double counting
            SELECT 
                o.hydrant_id AS h_id,
                SUM(CASE WHEN o.created_at >= CURDATE() AND o.order_type != 'OTS' THEN 1 ELSE 0 END) AS hmp_created_today,
                0 AS ots_created_today,
                0 AS dispatched_today, 0 AS completed_today, 0 AS cancelled_today, 0 AS pending_today,
                SUM(CASE WHEN o.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND o.order_type != 'OTS' THEN 1 ELSE 0 END) AS hmp_created_month,
                0 AS ots_created_month,
                0 AS dispatched_month, 0 AS completed_month, 0 AS cancelled_month, 0 AS pending_month
            FROM orders o
            WHERE o.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
            GROUP BY o.hydrant_id
            UNION ALL
            -- CHANNEL 2: OTS ACTIVITY (From OTS_ORDER Table)
            -- Source of truth for Created (OTS portion), Pending, and Cancelled
            SELECT 
                h_inner.id AS h_id,
                0 AS hmp_created_today,
                SUM(CASE WHEN ots.created_at >= CURDATE() THEN 1 ELSE 0 END) AS ots_created_today,
                0 AS dispatched_today,
                0 AS completed_today,
                SUM(CASE WHEN ots.updated_at >= CURDATE() AND ots.status IN ('failed', 'cancelled') THEN 1 ELSE 0 END) AS cancelled_today,
                SUM(CASE WHEN ots.updated_at >= CURDATE() AND ots.status IN ('pending', 'pending_alignment') THEN 1 ELSE 0 END) AS pending_today,
                0 AS hmp_created_month,
                SUM(CASE WHEN ots.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') THEN 1 ELSE 0 END) AS ots_created_month,
                0 AS dispatched_month,
                0 AS completed_month,
                SUM(CASE WHEN ots.updated_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND ots.status IN ('failed', 'cancelled') THEN 1 ELSE 0 END) AS cancelled_month,
                SUM(CASE WHEN ots.updated_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND ots.status IN ('pending', 'pending_alignment') THEN 1 ELSE 0 END) AS pending_month
            FROM ots_order ots
            JOIN hydrants h_inner ON ots.hydrant_id = h_inner.ots_hydrant
            WHERE ots.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') 
            OR ots.updated_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
            GROUP BY h_inner.id
            UNION ALL
            -- CHANNEL 3: BILLING PERFORMANCE (From Orders & Billings)
            -- Source of truth for Dispatched and Completed
            SELECT 
                o.hydrant_id AS h_id,
                0 AS hmp_created_today, 0 AS ots_created_today,
                SUM(CASE WHEN b.updated_at >= CURDATE() AND b.status = 2 THEN 1 ELSE 0 END) AS dispatched_today,
                SUM(CASE WHEN b.updated_at >= CURDATE() AND b.status = 1 THEN 1 ELSE 0 END) AS completed_today,
                0 AS cancelled_today, 0 AS pending_today,
                0 AS hmp_created_month, 0 AS ots_created_month,
                SUM(CASE WHEN b.updated_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND b.status = 2 THEN 1 ELSE 0 END) AS dispatched_month,
                SUM(CASE WHEN b.updated_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND b.status = 1 THEN 1 ELSE 0 END) AS completed_month,
                0 AS cancelled_month, 0 AS pending_month
            FROM orders o
            JOIN billings b ON o.id = b.order_id
            WHERE b.updated_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
            GROUP BY o.hydrant_id
        ) AS events ON h.id = events.h_id
        WHERE h.id IN (1, 2, 3, 4, 5, 6, 7, 15) 
        GROUP BY h.id, h.name;
        `;
        const [rows] = await hmpDb.execute(query);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};