// controllers/NewKpiController.js
export const TodayStats = async (req, res) => {
    try { 
        // 1. Pre-calculate dates in Node.js to make queries "SARGable"
        const now = new Date();
        
        // Default Single Day Window
        const defaultTodayStart = `${now.toISOString().split('T')[0]} 00:00:00`;
        const defaultTodayEnd = `${now.toISOString().split('T')[0]} 23:59:59`;

        // Capture custom user filters if provided, otherwise fallback to standard single day
        const { startDate, endDate } = req.query;
        const todayStart = startDate ? `${startDate} 00:00:00` : defaultTodayStart;
        const todayEnd = endDate ? `${endDate} 23:59:59` : defaultTodayEnd;
        
        const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const startOfMonthDateTime = `${startOfMonth} 00:00:00`;
        const endOfMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const endOfMonthDateTime = `${endOfMonthDate.toISOString().split('T')[0]} 23:59:59`;

        // 2. Updated OTS Query (Combined Today and Month)
        const otsQuery = `
        SELECT 
            COUNT(CASE WHEN api_created_at BETWEEN ? AND ? THEN 1 END) AS total_created_ots_today,
            SUM(CASE WHEN api_created_at BETWEEN ? AND ? AND status IN ('pending_alignment','pending') THEN 1 ELSE 0 END) AS ots_pending_today,
            SUM(CASE WHEN api_created_at BETWEEN ? AND ? AND status IN ('dispatched') THEN 1 ELSE 0 END) AS ots_dispatched_today,
            SUM(CASE WHEN api_created_at BETWEEN ? AND ? AND status IN ('completed','self_closed') THEN 1 ELSE 0 END) AS ots_completed_today,
            SUM(CASE WHEN api_created_at BETWEEN ? AND ? AND status IN ('cancelled') THEN 1 ELSE 0 END) AS ots_cancelled_consumer_today,
            SUM(CASE WHEN api_created_at BETWEEN ? AND ? AND status IN ('failed') THEN 1 ELSE 0 END) AS ots_cancelled_hmp_today,
            
            COUNT(CASE WHEN api_created_at BETWEEN ? AND ? THEN 1 END) AS total_created_ots_month,
            SUM(CASE WHEN api_created_at BETWEEN ? AND ? AND status IN ('pending_alignment','pending') THEN 1 ELSE 0 END) AS ots_pending_month,
            SUM(CASE WHEN api_created_at BETWEEN ? AND ? AND status IN ('dispatched') THEN 1 ELSE 0 END) AS ots_dispatched_month,
            SUM(CASE WHEN api_created_at BETWEEN ? AND ? AND status IN ('completed','self_closed') THEN 1 ELSE 0 END) AS ots_completed_month,
            SUM(CASE WHEN api_created_at BETWEEN ? AND ? AND status IN ('cancelled') THEN 1 ELSE 0 END) AS ots_cancelled_consumer_month,
            SUM(CASE WHEN api_created_at BETWEEN ? AND ? AND status IN ('failed') THEN 1 ELSE 0 END) AS ots_cancelled_hmp_month
        FROM ots_order
        WHERE api_created_at BETWEEN ? AND ? OR api_created_at BETWEEN ? AND ?`;

        const otsParams = [
            // Today filters (Uses custom range if filtered)
            todayStart, todayEnd, todayStart, todayEnd, todayStart, todayEnd, todayStart, todayEnd, todayStart, todayEnd, todayStart, todayEnd,
            // Month fields
            startOfMonthDateTime, endOfMonthDateTime, startOfMonthDateTime, endOfMonthDateTime, startOfMonthDateTime, endOfMonthDateTime, startOfMonthDateTime, endOfMonthDateTime, startOfMonthDateTime, endOfMonthDateTime, startOfMonthDateTime, endOfMonthDateTime,
            // Main WHERE clause bounds to accommodate both potential custom spans and month limits safely
            startOfMonthDateTime, endOfMonthDateTime, todayStart, todayEnd
        ];

        // 3. Updated Orders Query (Combined Today and Month)
        const ordersQuery = `
        SELECT 
            COUNT(CASE WHEN o.created_at BETWEEN ? AND ? THEN 1 END) AS hmp_created_today,
            SUM(CASE WHEN o.created_at BETWEEN ? AND ? AND b.status = 2 THEN 1 ELSE 0 END) AS hmp_dispatched_today,
            SUM(CASE WHEN o.created_at BETWEEN ? AND ? AND b.status = 1 THEN 1 ELSE 0 END) AS hmp_completed_today,
            SUM(CASE WHEN o.created_at BETWEEN ? AND ? AND b.status = 0 THEN 1 ELSE 0 END) AS hmp_pending_today,
            SUM(CASE WHEN o.created_at BETWEEN ? AND ? AND b.status IN (3,4) THEN 1 ELSE 0 END) AS hmp_cancelled_today,
            
            COUNT(CASE WHEN o.created_at BETWEEN ? AND ? THEN 1 END) AS hmp_created_month,
            SUM(CASE WHEN o.created_at BETWEEN ? AND ? AND b.status = 2 THEN 1 ELSE 0 END) AS hmp_dispatched_month,
            SUM(CASE WHEN o.created_at BETWEEN ? AND ? AND b.status = 1 THEN 1 ELSE 0 END) AS hmp_completed_month,
            SUM(CASE WHEN o.created_at BETWEEN ? AND ? AND b.status = 0 THEN 1 ELSE 0 END) AS hmp_pending_month,
            SUM(CASE WHEN o.created_at BETWEEN ? AND ? AND b.status IN (3,4) THEN 1 ELSE 0 END) AS hmp_cancelled_month
        FROM orders o
        INNER JOIN billings b ON o.id = b.order_id
        WHERE o.order_type != 'OTS' AND (o.created_at BETWEEN ? AND ? OR o.created_at BETWEEN ? AND ?)`;

        const orderParams = [
            // Today filters (Uses custom range if filtered)
            todayStart, todayEnd, todayStart, todayEnd, todayStart, todayEnd, todayStart, todayEnd, todayStart, todayEnd,
            // Month fields
            startOfMonthDateTime, endOfMonthDateTime, startOfMonthDateTime, endOfMonthDateTime, startOfMonthDateTime, endOfMonthDateTime, startOfMonthDateTime, endOfMonthDateTime, startOfMonthDateTime, endOfMonthDateTime,
            // Main WHERE clause bounds
            startOfMonthDateTime, endOfMonthDateTime, todayStart, todayEnd
        ];

        // 4. Gallons Query - UNTOUCHED 
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

        const gallonParams = [defaultTodayStart.split(' ')[0], defaultTodayStart.split(' ')[0], defaultTodayStart.split(' ')[0], startOfMonthDateTime];

        // Execute queries
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