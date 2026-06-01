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

        // 2. Updated OTS Query (Combined Today, Month, and Average TAT in Seconds)
        const otsQuery = `
        SELECT 
            COUNT(CASE WHEN api_created_at BETWEEN ? AND ? THEN 1 END) AS total_created_ots_today,
            SUM(CASE WHEN api_created_at BETWEEN ? AND ? AND status IN ('pending_alignment','pending') THEN 1 ELSE 0 END) AS ots_pending_today,
            SUM(CASE WHEN api_created_at BETWEEN ? AND ? AND status IN ('dispatched') THEN 1 ELSE 0 END) AS ots_dispatched_today,
            SUM(CASE WHEN api_created_at BETWEEN ? AND ? AND status IN ('completed','self_closed') THEN 1 ELSE 0 END) AS ots_completed_today,
            SUM(CASE WHEN api_created_at BETWEEN ? AND ? AND status IN ('cancelled') THEN 1 ELSE 0 END) AS ots_cancelled_consumer_today,
            SUM(CASE WHEN api_created_at BETWEEN ? AND ? AND status IN ('failed') THEN 1 ELSE 0 END) AS ots_cancelled_hmp_today,
            
            AVG(CASE WHEN api_created_at BETWEEN ? AND ? AND status IN ('completed','self_closed') THEN TIMESTAMPDIFF(SECOND, api_created_at, api_updated_at) END) AS ots_avg_tat_seconds_today,
            
            COUNT(CASE WHEN api_created_at BETWEEN ? AND ? THEN 1 END) AS total_created_ots_month,
            SUM(CASE WHEN api_created_at BETWEEN ? AND ? AND status IN ('pending_alignment','pending') THEN 1 ELSE 0 END) AS ots_pending_month,
            SUM(CASE WHEN api_created_at BETWEEN ? AND ? AND status IN ('dispatched') THEN 1 ELSE 0 END) AS ots_dispatched_month,
            SUM(CASE WHEN api_created_at BETWEEN ? AND ? AND status IN ('completed','self_closed') THEN 1 ELSE 0 END) AS ots_completed_month,
            SUM(CASE WHEN api_created_at BETWEEN ? AND ? AND status IN ('cancelled') THEN 1 ELSE 0 END) AS ots_cancelled_consumer_month,
            SUM(CASE WHEN api_created_at BETWEEN ? AND ? AND status IN ('failed') THEN 1 ELSE 0 END) AS ots_cancelled_hmp_month
        FROM ots_order
        WHERE api_created_at BETWEEN ? AND ? OR api_created_at BETWEEN ? AND ?`;

        const otsParams = [
            // Today filters
            todayStart, todayEnd, todayStart, todayEnd, todayStart, todayEnd, todayStart, todayEnd, todayStart, todayEnd, todayStart, todayEnd,
            // Added Today filter for TAT calculation
            todayStart, todayEnd,
            // Month fields
            startOfMonthDateTime, endOfMonthDateTime, startOfMonthDateTime, endOfMonthDateTime, startOfMonthDateTime, endOfMonthDateTime, startOfMonthDateTime, endOfMonthDateTime, startOfMonthDateTime, endOfMonthDateTime, startOfMonthDateTime, endOfMonthDateTime,
            // Main WHERE clause bounds
            startOfMonthDateTime, endOfMonthDateTime, todayStart, todayEnd
        ];

        // 3. Updated Orders Query (Combined Today, Month, and Average TAT in Seconds)
        const ordersQuery = `
        SELECT 
            COUNT(CASE WHEN o.created_at BETWEEN ? AND ? THEN 1 END) AS hmp_created_today,
            SUM(CASE WHEN o.created_at BETWEEN ? AND ? AND b.status = 2 THEN 1 ELSE 0 END) AS hmp_dispatched_today,
            SUM(CASE WHEN o.created_at BETWEEN ? AND ? AND b.status = 1 THEN 1 ELSE 0 END) AS hmp_completed_today,
            SUM(CASE WHEN o.created_at BETWEEN ? AND ? AND b.status = 0 THEN 1 ELSE 0 END) AS hmp_pending_today,
            SUM(CASE WHEN o.created_at BETWEEN ? AND ? AND b.status IN (3,4) THEN 1 ELSE 0 END) AS hmp_cancelled_today,
            
            AVG(CASE WHEN o.created_at BETWEEN ? AND ? AND b.status = 1 THEN TIMESTAMPDIFF(SECOND, o.created_at, b.updated_at) END) AS hmp_avg_tat_seconds_today,
            
            COUNT(CASE WHEN o.created_at BETWEEN ? AND ? THEN 1 END) AS hmp_created_month,
            SUM(CASE WHEN o.created_at BETWEEN ? AND ? AND b.status = 2 THEN 1 ELSE 0 END) AS hmp_dispatched_month,
            SUM(CASE WHEN o.created_at BETWEEN ? AND ? AND b.status = 1 THEN 1 ELSE 0 END) AS hmp_completed_month,
            SUM(CASE WHEN o.created_at BETWEEN ? AND ? AND b.status = 0 THEN 1 ELSE 0 END) AS hmp_pending_month,
            SUM(CASE WHEN o.created_at BETWEEN ? AND ? AND b.status IN (3,4) THEN 1 ELSE 0 END) AS hmp_cancelled_month
        FROM orders o
        INNER JOIN billings b ON o.id = b.order_id
        WHERE o.order_type != 'OTS' AND (o.created_at BETWEEN ? AND ? OR o.created_at BETWEEN ? AND ?)`;

        const orderParams = [
            // Today filters
            todayStart, todayEnd, todayStart, todayEnd, todayStart, todayEnd, todayStart, todayEnd, todayStart, todayEnd,
            // Added Today filter for TAT calculation
            todayStart, todayEnd,
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

        // Helper Utility function to format total seconds to human-readable format
        const formatDurationText = (totalSeconds) => {
            if (totalSeconds === null || totalSeconds === undefined || isNaN(totalSeconds)) return "N/A";
            
            let seconds = Math.floor(Number(totalSeconds));
            if (seconds <= 0) return "0 mins";

            const months = Math.floor(seconds / (30 * 24 * 3600));
            seconds %= (30 * 24 * 3600);

            const days = Math.floor(seconds / (24 * 3600));
            seconds %= (24 * 3600);

            const hours = Math.floor(seconds / 3600);
            seconds %= 3600;

            const minutes = Math.floor(seconds / 60);

            let parts = [];
            if (months > 0) parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
            if (days > 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
            if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hr' : 'hrs'}`);
            
            // Show minutes only if it's less than a month, or if hours/days are low to avoid massive string length
            if (months === 0 && (minutes > 0 || parts.length === 0)) {
                parts.push(`${minutes} ${minutes === 1 ? 'min' : 'mins'}`);
            }

            return parts.join(' ').trim();
        };

        // Attach human readable format back onto the database output objects
        otsData[0].ots_avg_tat_readable = formatDurationText(otsData[0].ots_avg_tat_seconds_today);
        orderData[0].hmp_avg_tat_readable = formatDurationText(orderData[0].hmp_avg_tat_seconds_today);

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


// ==========================================================
// NEW CONTROLLER: ORDER SUMMARY FOR TODAY (BY HYDRANT & STATUS)
// ==========================================================
export const OrderSummaryToday = async (req, res) => {
    try {
        const now = new Date();
        
        // Setup dynamic parameters compatible with dashboard date pickers
        const defaultTodayStart = `${now.toISOString().split('T')[0]} 00:00:00`;
        const defaultTodayEnd = `${now.toISOString().split('T')[0]} 23:59:59`;

        const { startDate, endDate } = req.query;
        const todayStart = startDate ? `${startDate} 00:00:00` : defaultTodayStart;
        const todayEnd = endDate ? `${endDate} 23:59:59` : defaultTodayEnd;

        const summaryQuery = `
        SELECT 
            h.name AS hydrant_name,
            -- ========================================================
            -- 1. COMMERCIAL ('Commercial', 'Commercial Offline')
            -- ========================================================
            COUNT(DISTINCT CASE WHEN o.order_type IN ('Commercial', 'Commercial Offline') THEN o.id END) AS commercial_created,
            COUNT(DISTINCT CASE WHEN o.order_type IN ('Commercial', 'Commercial Offline') AND b.status = 2 THEN o.id END) AS commercial_driver_assigned,
            COUNT(DISTINCT CASE WHEN o.order_type IN ('Commercial', 'Commercial Offline') AND b.status = 1 THEN o.id END) AS commercial_completed,
            COUNT(DISTINCT CASE WHEN o.order_type IN ('Commercial', 'Commercial Offline') AND b.status IN (3, 4) THEN o.id END) AS commercial_cancelled,
            COUNT(DISTINCT CASE WHEN o.order_type IN ('Commercial', 'Commercial Offline') AND b.status = 0 THEN o.id END) AS commercial_pending,
            -- ========================================================
            -- 2. OTS (From separate ots_order source subquery)
            -- ========================================================
            COALESCE(ots.ots_created, 0) AS gps_ots_created,
            COALESCE(ots.ots_driver_assigned, 0) AS gps_ots_driver_assigned,
            COALESCE(ots.ots_completed, 0) AS gps_ots_completed,
            COALESCE(ots.ots_cancelled, 0) AS gps_ots_cancelled,
            COALESCE(ots.ots_pending, 0) AS gps_ots_pending,
            -- ========================================================
            -- 3. GPS ONLINE ('Online (GPS)')
            -- ========================================================
            COUNT(DISTINCT CASE WHEN o.order_type = 'Online (GPS)' THEN o.id END) AS gps_online_created,
            COUNT(DISTINCT CASE WHEN o.order_type = 'Online (GPS)' AND b.status = 2 THEN o.id END) AS gps_online_driver_assigned,
            COUNT(DISTINCT CASE WHEN o.order_type = 'Online (GPS)' AND b.status = 1 THEN o.id END) AS gps_online_completed,
            COUNT(DISTINCT CASE WHEN o.order_type = 'Online (GPS)' AND b.status IN (3, 4) THEN o.id END) AS gps_online_cancelled,
            COUNT(DISTINCT CASE WHEN o.order_type = 'Online (GPS)' AND b.status = 0 THEN o.id END) AS gps_online_pending,
            -- ========================================================
            -- 4. DC QUOTA ('Dc quota')
            -- ========================================================
            COUNT(DISTINCT CASE WHEN o.order_type = 'Dc quota' THEN o.id END) AS dc_quota_created,
            COUNT(DISTINCT CASE WHEN o.order_type = 'Dc quota' AND b.status = 2 THEN o.id END) AS dc_quota_driver_assigned,
            COUNT(DISTINCT CASE WHEN o.order_type = 'Dc quota' AND b.status = 1 THEN o.id END) AS dc_quota_completed,
            COUNT(DISTINCT CASE WHEN o.order_type = 'Dc quota' AND b.status IN (3, 4) THEN o.id END) AS dc_quota_cancelled,
            COUNT(DISTINCT CASE WHEN o.order_type = 'Dc quota' AND b.status = 0 THEN o.id END) AS dc_quota_pending,
            -- ========================================================
            -- 5. GPS BILLING ('Gps(billing)')
            -- ========================================================
            COUNT(DISTINCT CASE WHEN o.order_type = 'Gps(billing)' THEN o.id END) AS gps_billing_created,
            COUNT(DISTINCT CASE WHEN o.order_type = 'Gps(billing)' AND b.status = 2 THEN o.id END) AS gps_billing_driver_assigned,
            COUNT(DISTINCT CASE WHEN o.order_type = 'Gps(billing)' AND b.status = 1 THEN o.id END) AS gps_billing_completed,
            COUNT(DISTINCT CASE WHEN o.order_type = 'Gps(billing)' AND b.status IN (3, 4) THEN o.id END) AS gps_billing_cancelled,
            COUNT(DISTINCT CASE WHEN o.order_type = 'Gps(billing)' AND b.status = 0 THEN o.id END) AS gps_billing_pending,
            -- ========================================================
            -- 6. GPS CARE OFF ('Gps(careoff)')
            -- ========================================================
            COUNT(DISTINCT CASE WHEN o.order_type = 'Gps(careoff)' THEN o.id END) AS gps_careoff_created,
            COUNT(DISTINCT CASE WHEN o.order_type = 'Gps(careoff)' AND b.status = 2 THEN o.id END) AS gps_careoff_driver_assigned,
            COUNT(DISTINCT CASE WHEN o.order_type = 'Gps(careoff)' AND b.status = 1 THEN o.id END) AS gps_careoff_completed,
            COUNT(DISTINCT CASE WHEN o.order_type = 'Gps(careoff)' AND b.status IN (3, 4) THEN o.id END) AS gps_careoff_cancelled,
            COUNT(DISTINCT CASE WHEN o.order_type = 'Gps(careoff)' AND b.status = 0 THEN o.id END) AS gps_careoff_pending,
            -- ========================================================
            -- 7. GOVT VEHICLE ('Govt. vehicle')
            -- ========================================================
            COUNT(DISTINCT CASE WHEN o.order_type = 'Govt. vehicle' THEN o.id END) AS govt_vehicle_created,
            COUNT(DISTINCT CASE WHEN o.order_type = 'Govt. vehicle' AND b.status = 2 THEN o.id END) AS govt_vehicle_driver_assigned,
            COUNT(DISTINCT CASE WHEN o.order_type = 'Govt. vehicle' AND b.status = 1 THEN o.id END) AS govt_vehicle_completed,
            COUNT(DISTINCT CASE WHEN o.order_type = 'Govt. vehicle' AND b.status IN (3, 4) THEN o.id END) AS govt_vehicle_cancelled,
            COUNT(DISTINCT CASE WHEN o.order_type = 'Govt. vehicle' AND b.status = 0 THEN o.id END) AS govt_vehicle_pending,
            -- ========================================================
            -- 8. P.A.F ('P.A.F korangi creek')
            -- ========================================================
            COUNT(DISTINCT CASE WHEN o.order_type = 'P.A.F korangi creek' THEN o.id END) AS paf_created,
            COUNT(DISTINCT CASE WHEN o.order_type = 'P.A.F korangi creek' AND b.status = 2 THEN o.id END) AS paf_driver_assigned,
            COUNT(DISTINCT CASE WHEN o.order_type = 'P.A.F korangi creek' AND b.status = 1 THEN o.id END) AS paf_completed,
            COUNT(DISTINCT CASE WHEN o.order_type = 'P.A.F korangi creek' AND b.status IN (3, 4) THEN o.id END) AS paf_cancelled,
            COUNT(DISTINCT CASE WHEN o.order_type = 'P.A.F korangi creek' AND b.status = 0 THEN o.id END) AS paf_pending,
            -- ========================================================
            -- 9. PAK RANGER ('Pak rangers')
            -- ========================================================
            COUNT(DISTINCT CASE WHEN o.order_type = 'Pak rangers' THEN o.id END) AS pak_ranger_created,
            COUNT(DISTINCT CASE WHEN o.order_type = 'Pak rangers' AND b.status = 2 THEN o.id END) AS pak_ranger_driver_assigned,
            COUNT(DISTINCT CASE WHEN o.order_type = 'Pak rangers' AND b.status = 1 THEN o.id END) AS pak_ranger_completed,
            COUNT(DISTINCT CASE WHEN o.order_type = 'Pak rangers' AND b.status IN (3, 4) THEN o.id END) AS pak_ranger_cancelled,
            COUNT(DISTINCT CASE WHEN o.order_type = 'Pak rangers' AND b.status = 0 THEN o.id END) AS pak_ranger_pending,
            -- ========================================================
            -- OVERALL RAW VOLUME TRACKER (Used by HAVING to skip all-zero lines)
            -- ========================================================
            (COUNT(DISTINCT CASE WHEN o.created_at BETWEEN ? AND ? THEN o.id END) + COALESCE(ots.ots_created, 0)) AS total
        FROM hydrants h
        LEFT JOIN orders o ON h.id = o.hydrant_id AND o.created_at BETWEEN ? AND ?
        LEFT JOIN billings b ON o.id = b.order_id
        LEFT JOIN (
            SELECT 
                hydrant_id, 
                COUNT(*) AS ots_created,
                SUM(CASE WHEN status IN ('dispatched') THEN 1 ELSE 0 END) AS ots_driver_assigned,
                SUM(CASE WHEN status IN ('completed', 'self_closed') THEN 1 ELSE 0 END) AS ots_completed,
                SUM(CASE WHEN status IN ('cancelled', 'failed') THEN 1 ELSE 0 END) AS ots_cancelled,
                SUM(CASE WHEN status IN ('pending', 'pending_alignment') THEN 1 ELSE 0 END) AS ots_pending
            FROM ots_order
            WHERE api_created_at BETWEEN ? AND ?
            GROUP BY hydrant_id
        ) ots ON h.ots_hydrant = ots.hydrant_id
        GROUP BY h.id, h.name
        HAVING total > 0
        ORDER BY h.name ASC;`;

        // Bind dynamic dates into query parameters mapping placeholder positions
        const summaryParams = [
            todayStart, todayEnd, // For total calculation check
            todayStart, todayEnd, // For master orders LEFT JOIN line
            todayStart, todayEnd  // For internal OTS subquery filter
        ];

        const [rows] = await req.db.execute(summaryQuery, summaryParams);

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};












