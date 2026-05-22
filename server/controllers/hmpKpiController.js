export const getHmpKpis = async (req, res) => {
    try { 
        // 1. Pre-calculate dates in Node.js to make queries "SARGable"
        const now = new Date();
        const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const startOfMonthDateTime = `${startOfMonth} 00:00:00`;

        // 2. OTS Query - Using parameters (?) instead of CURDATE()
        const otsQuery = `
        SELECT 
            COUNT(CASE WHEN api_created_at >= ? THEN 1 END) AS total_ots_today,
            SUM(CASE WHEN api_created_at >= ? AND status IN ('pending_alignment', 'pending') THEN 1 ELSE 0 END) AS pending_ots_today,
            SUM(CASE WHEN updated_at >= ? AND status = 'failed' THEN 1 ELSE 0 END) AS cancelled_ots_hmp_today,
            SUM(CASE WHEN updated_at >= ? AND status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_ots_consumer_today,
            COUNT(CASE WHEN api_created_at >= ? THEN 1 END) AS total_ots_month,
            SUM(CASE WHEN api_created_at >= ? AND status IN ('pending_alignment', 'pending') THEN 1 ELSE 0 END) AS pending_ots_month,
            SUM(CASE WHEN updated_at >= ? AND status = 'failed' THEN 1 ELSE 0 END) AS cancelled_ots_hmp_month,
            SUM(CASE WHEN updated_at >= ? AND status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_ots_consumer_month
        FROM ots_order
        WHERE api_created_at >= ? OR updated_at >= ?`;

        const otsParams = [today, today, today, today, startOfMonth, startOfMonth, startOfMonth, startOfMonth, startOfMonth, startOfMonth];

        // 3. Orders Query
        const ordersQuery = `
        SELECT 
            SUM(CASE WHEN o.created_at >= ? AND o.order_type != 'OTS' THEN 1 ELSE 0 END) AS hmp_created_today,
            SUM(CASE WHEN b.updated_at >= ? AND b.status = 2 THEN 1 ELSE 0 END) AS total_dispatched_today,
            SUM(CASE WHEN b.updated_at >= ? AND b.status = 1 THEN 1 ELSE 0 END) AS total_completed_today,
            SUM(CASE WHEN b.updated_at >= ? AND o.order_type = 'OTS' AND b.status = 2 THEN 1 ELSE 0 END) AS ots_dispatched_today,
            SUM(CASE WHEN b.updated_at >= ? AND o.order_type != 'OTS' AND b.status = 2 THEN 1 ELSE 0 END) AS hmp_dispatched_today,
            SUM(CASE WHEN b.updated_at >= ? AND o.order_type = 'OTS' AND b.status = 1 THEN 1 ELSE 0 END) AS ots_completed_today,
            SUM(CASE WHEN b.updated_at >= ? AND o.order_type != 'OTS' AND b.status = 1 THEN 1 ELSE 0 END) AS hmp_completed_today,
            SUM(CASE WHEN o.created_at >= ? AND o.order_type != 'OTS' THEN 1 ELSE 0 END) AS hmp_created_month,
            SUM(CASE WHEN b.updated_at >= ? AND b.status = 2 THEN 1 ELSE 0 END) AS total_dispatched_month,
            SUM(CASE WHEN b.updated_at >= ? AND b.status = 1 THEN 1 ELSE 0 END) AS total_completed_month,
            SUM(CASE WHEN b.updated_at >= ? AND o.order_type = 'OTS' AND b.status = 2 THEN 1 ELSE 0 END) AS ots_dispatched_month,
            SUM(CASE WHEN b.updated_at >= ? AND o.order_type != 'OTS' AND b.status = 2 THEN 1 ELSE 0 END) AS hmp_dispatched_month,
            SUM(CASE WHEN b.updated_at >= ? AND o.order_type = 'OTS' AND b.status = 1 THEN 1 ELSE 0 END) AS ots_completed_month,
            SUM(CASE WHEN b.updated_at >= ? AND o.order_type != 'OTS' AND b.status = 1 THEN 1 ELSE 0 END) AS hmp_completed_month
        FROM orders o
        LEFT JOIN billings b ON o.id = b.order_id
        WHERE o.created_at >= ? OR b.updated_at >= ?`;

        const orderParams = [today, today, today, today, today, today, today, startOfMonth, startOfMonth, startOfMonth, startOfMonth, startOfMonth, startOfMonth, startOfMonth, startOfMonth, startOfMonth];

        // 4. Gallons Query
        const gallonsQuery = `
        SELECT 
            SUM(CASE WHEN o.created_at >= ? THEN tt.capacity ELSE 0 END) AS total_gallons_today,
            SUM(CASE WHEN o.created_at >= ? AND o.order_type NOT IN ('Commercial','Commercial Offline') THEN tt.capacity ELSE 0 END) AS total_gallons_gps_today,
            SUM(CASE WHEN o.created_at >= ? AND o.order_type IN ('Commercial','Commercial Offline') THEN tt.capacity ELSE 0 END) AS total_gallons_comm_today,
            SUM(tt.capacity) AS total_gallons_month,
            SUM(CASE WHEN o.order_type NOT IN ('Commercial','Commercial Offline') THEN tt.capacity ELSE 0 END) AS total_gallons_gps_month,
            SUM(CASE WHEN o.order_type IN ('Commercial','Commercial Offline') THEN tt.capacity ELSE 0 END) AS total_gallons_comm_month
        FROM billings b
        INNER JOIN orders o ON o.id = b.order_id
        INNER JOIN truck_types tt ON tt.id = o.truck_type
        WHERE b.status IN (1,2) 
        AND b.updated_at >= ?`;

        const gallonParams = [today, today, today, startOfMonthDateTime];

        // Execute sequentially to avoid overloading DB connections
        const [otsData] = await req.db.execute(otsQuery, otsParams);
        const [orderData] = await req.db.execute(ordersQuery, orderParams);
        const [gallonData] = await req.db.execute(gallonsQuery, gallonParams);

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