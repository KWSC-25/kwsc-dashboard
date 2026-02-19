import { hmpDb } from "../db.js";
export const getHmpKpis = async (req, res) => {
    try {
        const otsQuery = `
        SELECT 
            COALESCE(COUNT(CASE WHEN api_created_at >= CURDATE() THEN 1 END), 0) AS total_ots_today,
            COALESCE(SUM(CASE WHEN updated_at >= CURDATE() AND status IN ('pending_alignment', 'pending') THEN 1 ELSE 0 END), 0) AS pending_ots_today,
            COALESCE(SUM(CASE WHEN updated_at >= CURDATE() AND status = 'failed' THEN 1 ELSE 0 END), 0) AS cancelled_ots_hmp_today,
            COALESCE(SUM(CASE WHEN updated_at >= CURDATE() AND status = 'cancelled' THEN 1 ELSE 0 END), 0) AS cancelled_ots_consumer_today,
            COALESCE(COUNT(CASE WHEN api_created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') THEN 1 END), 0) AS total_ots_month,
            COALESCE(SUM(CASE WHEN updated_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND status IN ('pending_alignment', 'pending') THEN 1 ELSE 0 END), 0) AS pending_ots_month,
            COALESCE(SUM(CASE WHEN updated_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND status = 'failed' THEN 1 ELSE 0 END), 0) AS cancelled_ots_hmp_month,
            COALESCE(SUM(CASE WHEN updated_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND status = 'cancelled' THEN 1 ELSE 0 END), 0) AS cancelled_ots_consumer_month
        FROM ots_order
        WHERE api_created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') 
        OR updated_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`;


        const ordersQuery = `
        SELECT 
            COALESCE(SUM(CASE WHEN o.created_at >= CURDATE() AND o.order_type != 'OTS' THEN 1 ELSE 0 END), 0) AS hmp_created_today,
            COALESCE(SUM(CASE WHEN b.updated_at >= CURDATE() AND b.status = 2 THEN 1 ELSE 0 END), 0) AS total_dispatched_today,
            COALESCE(SUM(CASE WHEN b.updated_at >= CURDATE() AND b.status = 1 THEN 1 ELSE 0 END), 0) AS total_completed_today,
            COALESCE(SUM(CASE WHEN b.updated_at >= CURDATE() AND o.order_type = 'OTS' AND b.status = 2 THEN 1 ELSE 0 END), 0) AS ots_dispatched_today,
            COALESCE(SUM(CASE WHEN b.updated_at >= CURDATE() AND o.order_type != 'OTS' AND b.status = 2 THEN 1 ELSE 0 END), 0) AS hmp_dispatched_today,
            COALESCE(SUM(CASE WHEN b.updated_at >= CURDATE() AND o.order_type = 'OTS' AND b.status = 1 THEN 1 ELSE 0 END), 0) AS ots_completed_today,
            COALESCE(SUM(CASE WHEN b.updated_at >= CURDATE() AND o.order_type != 'OTS' AND b.status = 1 THEN 1 ELSE 0 END), 0) AS hmp_completed_today,
            COALESCE(SUM(CASE WHEN o.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND o.order_type != 'OTS' THEN 1 ELSE 0 END), 0) AS hmp_created_month,
            COALESCE(SUM(CASE WHEN b.updated_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND b.status = 2 THEN 1 ELSE 0 END), 0) AS total_dispatched_month,
            COALESCE(SUM(CASE WHEN b.updated_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND b.status = 1 THEN 1 ELSE 0 END), 0) AS total_completed_month,
            COALESCE(SUM(CASE WHEN b.updated_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND o.order_type = 'OTS' AND b.status = 2 THEN 1 ELSE 0 END), 0) AS ots_dispatched_month,
            COALESCE(SUM(CASE WHEN b.updated_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND o.order_type != 'OTS' AND b.status = 2 THEN 1 ELSE 0 END), 0) AS hmp_dispatched_month,
            COALESCE(SUM(CASE WHEN b.updated_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND o.order_type = 'OTS' AND b.status = 1 THEN 1 ELSE 0 END), 0) AS ots_completed_month,
            COALESCE(SUM(CASE WHEN b.updated_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND o.order_type != 'OTS' AND b.status = 1 THEN 1 ELSE 0 END), 0) AS hmp_completed_month
        FROM orders o
        LEFT JOIN billings b ON o.id = b.order_id
        WHERE o.created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') 
        OR b.updated_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`;

        const gallonsQuery = `
        SELECT 
            COALESCE(SUM(CASE WHEN b.updated_at >= CURDATE() THEN tt.capacity ELSE 0 END), 0) AS total_gallons_today,
            COALESCE(SUM(CASE WHEN b.updated_at >= CURDATE() AND o.order_type not in ('Commercial','Commercial Offline') 
                THEN tt.capacity ELSE 0 END), 0) AS total_gallons_gps_today,
            COALESCE(SUM(CASE WHEN b.updated_at >= CURDATE() AND o.order_type in ('Commercial','Commercial Offline')
                THEN tt.capacity ELSE 0 END), 0) AS total_gallons_comm_today,
                
            COALESCE(SUM(tt.capacity), 0) AS total_gallons_month,
            COALESCE(SUM(CASE WHEN o.order_type not in ('Commercial','Commercial Offline') 
                THEN tt.capacity ELSE 0 END), 0) AS total_gallons_gps_month,
            COALESCE(SUM(CASE WHEN o.order_type in ('Commercial','Commercial Offline') 
                THEN tt.capacity ELSE 0 END), 0) AS total_gallons_comm_month
        FROM billings b
        INNER JOIN orders o ON o.id = b.order_id
        INNER JOIN truck_types tt ON tt.id = o.truck_type
        WHERE b.status = 2
        AND b.updated_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01 00:00:00')`;

        const [otsData] = await hmpDb.execute(otsQuery);
        const [orderData] = await hmpDb.execute(ordersQuery);
        const [gallonData] = await hmpDb.execute(gallonsQuery);

        res.json({
            success: true,
            data: { 
                ots: otsData[0], 
                orders: orderData[0],
                gallons: gallonData[0]
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};