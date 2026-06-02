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

        // ========================================================
        // 2. OPTIMIZED OTS QUERY (Upfront filtering via subquery aggregation)
        // ========================================================
        const otsQuery = `
        SELECT 
            COUNT(*) AS total_created_ots_today,
            SUM(CASE WHEN status IN ('pending_alignment','pending') THEN 1 ELSE 0 END) AS ots_pending_today,
            SUM(CASE WHEN status IN ('dispatched') THEN 1 ELSE 0 END) AS ots_dispatched_today,
            SUM(CASE WHEN status IN ('completed','self_closed') THEN 1 ELSE 0 END) AS ots_completed_today,
            SUM(CASE WHEN status IN ('cancelled') THEN 1 ELSE 0 END) AS ots_cancelled_consumer_today,
            SUM(CASE WHEN status IN ('failed') THEN 1 ELSE 0 END) AS ots_cancelled_hmp_today,
            
            -- Today Gallons Matrix
            SUM(gallon) AS ots_created_gallons_today,
            SUM(CASE WHEN status IN ('pending_alignment','pending') THEN gallon ELSE 0 END) AS ots_pending_gallons_today,
            SUM(CASE WHEN status IN ('dispatched') THEN gallon ELSE 0 END) AS ots_dispatched_gallons_today,
            SUM(CASE WHEN status IN ('completed','self_closed') THEN gallon ELSE 0 END) AS ots_completed_gallons_today,
            SUM(CASE WHEN status IN ('cancelled', 'failed') THEN gallon ELSE 0 END) AS ots_cancelled_gallons_today,

            -- Today Financial Amounts Matrix
            SUM(tanker_amount) AS ots_created_amount_today,
            SUM(CASE WHEN status IN ('pending_alignment','pending') THEN tanker_amount ELSE 0 END) AS ots_pending_amount_today,
            SUM(CASE WHEN status IN ('dispatched') THEN tanker_amount ELSE 0 END) AS ots_dispatched_amount_today,
            SUM(CASE WHEN status IN ('completed','self_closed') THEN tanker_amount ELSE 0 END) AS ots_completed_amount_today,
            SUM(CASE WHEN status IN ('cancelled', 'failed') THEN tanker_amount ELSE 0 END) AS ots_cancelled_amount_today,

            -- Turnaround Time Average
            AVG(CASE WHEN status IN ('completed','self_closed') THEN TIMESTAMPDIFF(SECOND, api_created_at, api_updated_at) END) AS ots_avg_tat_seconds_today
        FROM ots_order
        WHERE api_created_at BETWEEN ? AND ?`; // <-- Filters the index ONCE here first

        const otsParams = [todayStart, todayEnd];

        // ========================================================
        // 3. OPTIMIZED HMP ORDERS QUERY (Upfront filtering via inner select)
        // ========================================================
        const ordersQuery = `
        SELECT 
            COUNT(*) AS hmp_created_today,
            SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) AS hmp_pending_today,
            SUM(CASE WHEN status = 2 THEN 1 ELSE 0 END) AS hmp_dispatched_today,
            SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) AS hmp_completed_today,
            SUM(CASE WHEN status IN (3,4) THEN 1 ELSE 0 END) AS hmp_cancelled_today,
            
            -- Today Truck Type Capacity Gallons
            SUM(capacity) AS hmp_created_gallons_today,
            SUM(CASE WHEN status = 0 THEN capacity ELSE 0 END) AS hmp_pending_gallons_today,
            SUM(CASE WHEN status = 2 THEN capacity ELSE 0 END) AS hmp_dispatched_gallons_today,
            SUM(CASE WHEN status = 1 THEN capacity ELSE 0 END) AS hmp_completed_gallons_today,
            SUM(CASE WHEN status IN (3,4) THEN capacity ELSE 0 END) AS hmp_cancelled_gallons_today,

            -- Turnaround Time Average
            AVG(CASE WHEN status = 1 THEN seconds_duration END) AS hmp_avg_tat_seconds_today
        FROM (
            SELECT 
                b.status,
                tt.capacity,
                TIMESTAMPDIFF(SECOND, o.created_at, b.updated_at) AS seconds_duration
            FROM orders o
            INNER JOIN billings b ON o.id = b.order_id
            LEFT JOIN truck_types tt ON o.truck_type = tt.id
            WHERE o.order_type != 'OTS' AND o.created_at BETWEEN ? AND ? -- <-- Isolates target rows instantly
        ) active_today`;

        const orderParams = [todayStart, todayEnd];

        // Execute both optimized queries in parallel
        const [otsData] = await req.db.execute(otsQuery, otsParams);
        const [orderData] = await req.db.execute(ordersQuery, orderParams);

        // Helper Utility function to format total seconds to human-readable format
        const formatDurationText = (totalSeconds) => {
            if (totalSeconds === null || totalSeconds === undefined || isNaN(totalSeconds)) return "0";
            
            let seconds = Math.floor(Number(totalSeconds));
            if (seconds <= 0) return "0";

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
            
            if (months === 0 && (minutes > 0 || parts.length === 0)) {
                parts.push(`${minutes} ${minutes === 1 ? 'min' : 'mins'}`);
            }

            return parts.join(' ').trim();
        };

        // Fallback checks to prevent crash if tables are empty today
        const formattedOts = otsData[0] || {};
        const formattedOrders = orderData[0] || {};

        formattedOts.ots_avg_tat_readable = formatDurationText(formattedOts.ots_avg_tat_seconds_today);
        formattedOrders.hmp_avg_tat_readable = formatDurationText(formattedOrders.hmp_avg_tat_seconds_today);

        res.json({
            success: true,
            data: { 
                ots: formattedOts, 
                orders: formattedOrders
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



// ==========================================================
// NEW CONTROLLER: HYDRANT METRIC GRID WITH SUB-COLUMN METRICS
// ==========================================================
export const HydrantPerformanceGridToday = async (req, res) => {
    try {
        const now = new Date();
        
        // Setup dynamic parameters compatible with dashboard date pickers
        const defaultTodayStart = `${now.toISOString().split('T')[0]} 00:00:00`;
        const defaultTodayEnd = `${now.toISOString().split('T')[0]} 23:59:59`;

        const { startDate, endDate } = req.query;
        const todayStart = startDate ? `${startDate} 00:00:00` : defaultTodayStart;
        const todayEnd = endDate ? `${endDate} 23:59:59` : defaultTodayEnd;

        const gridQuery = `
        SELECT 
            h.name AS hydrant_name,
            -- ========================================================
            -- TOTAL CREATED BY SOURCE
            -- ========================================================
            COALESCE(ord.created_count, 0) AS hmp_total_created,
            COALESCE(ots.ots_created, 0) AS ots_total_created,
            -- ========================================================
            -- RAW COUNTS FOR TOTAL/COMBINED EXACT PERCENTAGE MATH
            -- ========================================================
            COALESCE(ord.completed_count, 0) AS hmp_completed_count,
            COALESCE(ots.ots_completed, 0) AS ots_completed_count,
            COALESCE(ord.pending_count, 0) AS hmp_pending_count,
            COALESCE(ots.ots_pending, 0) AS ots_pending_count,
            COALESCE(ord.cancelled_count, 0) AS hmp_cancelled_count,
            COALESCE(ots.ots_cancelled, 0) AS ots_cancelled_count,
            COALESCE(ord.assigned_count, 0) AS hmp_assigned_count, 
            COALESCE(ots.ots_driver_assigned, 0) AS ots_assigned_count,
            COALESCE(ord.total_completed_seconds, 0) AS hmp_total_seconds,
            COALESCE(ots.total_completed_seconds, 0) AS ots_total_seconds,
            -- ========================================================
            -- COMPLETED PERCENTAGE
            -- ========================================================
            ROUND(COALESCE(ord.completed_count, 0) * 100.0 / NULLIF(ord.created_count, 0), 2) AS hmp_completed_percentage,
            ROUND(COALESCE(ots.ots_completed, 0) * 100.0 / NULLIF(ots.ots_created, 0), 2) AS ots_completed_percentage,
            -- ========================================================
            -- PENDING PERCENTAGE
            -- ========================================================
            ROUND(COALESCE(ord.pending_count, 0) * 100.0 / NULLIF(ord.created_count, 0), 2) AS hmp_pending_percentage,
            ROUND(COALESCE(ots.ots_pending, 0) * 100.0 / NULLIF(ots.ots_created, 0), 2) AS ots_pending_percentage,
            -- ========================================================
            -- CANCELLED PERCENTAGE
            -- ========================================================
            ROUND(COALESCE(ord.cancelled_count, 0) * 100.0 / NULLIF(ord.created_count, 0), 2) AS hmp_cancelled_percentage,
            ROUND(COALESCE(ots.ots_cancelled, 0) * 100.0 / NULLIF(ots.ots_created, 0), 2) AS ots_cancelled_percentage,
            -- ========================================================
            -- DRIVER ASSIGNED PERCENTAGE
            -- ========================================================
            ROUND(COALESCE(ord.assigned_count, 0) * 100.0 / NULLIF(ord.created_count, 0), 2) AS hmp_driver_assigned_percentage,
            ROUND(COALESCE(ots.ots_driver_assigned, 0) * 100.0 / NULLIF(ots.ots_created, 0), 2) AS ots_driver_assigned_percentage,
            -- ========================================================
            -- UNIFIED HMP AVERAGE TAT (HHH:mm Format String)
            -- ========================================================
            CONCAT(
                LPAD(COALESCE(FLOOR((ord.total_completed_seconds / NULLIF(ord.completed_count, 0)) / 3600), 0), 2, '0'),
                ':',
                LPAD(COALESCE(FLOOR(((ord.total_completed_seconds / NULLIF(ord.completed_count, 0)) % 3600) / 60), 0), 2, '0')
            ) AS hmp_avg_tat,
            -- ========================================================
            -- UNIFIED OTS AVERAGE TAT (HHH:mm Format String)
            -- ========================================================
            CONCAT(
                LPAD(COALESCE(FLOOR((ots.total_completed_seconds / NULLIF(ots.ots_completed, 0)) / 3600), 0), 2, '0'),
                ':',
                LPAD(COALESCE(FLOOR(((ots.total_completed_seconds / NULLIF(ots.ots_completed, 0)) % 3600) / 60), 0), 2, '0')
            ) AS ots_avg_tat
        FROM hydrants h
        -- 1. Standard HMP Orders safely pre-aggregated avoiding duplication artifacts
        LEFT JOIN (
            SELECT 
                o.hydrant_id,
                COUNT(o.id) AS created_count,
                SUM(CASE WHEN b.latest_status = 1 THEN 1 ELSE 0 END) AS completed_count,
                SUM(CASE WHEN b.latest_status = 0 THEN 1 ELSE 0 END) AS pending_count,
                SUM(CASE WHEN b.latest_status = 2 THEN 1 ELSE 0 END) AS assigned_count,
                SUM(CASE WHEN b.latest_status IN (3,4) THEN 1 ELSE 0 END) AS cancelled_count,
                SUM(CASE WHEN b.latest_status = 1 THEN TIMESTAMPDIFF(SECOND, o.created_at, b.latest_updated) END) AS total_completed_seconds
            FROM orders o
            LEFT JOIN (
                -- Target only the single latest update change inside billings table per order
                SELECT 
                    tbl_b.order_id, 
                    tbl_b.status AS latest_status,
                    tbl_b.updated_at AS latest_updated
                FROM billings tbl_b
                INNER JOIN (
                    SELECT MAX(id) AS max_id 
                    FROM billings 
                    GROUP BY order_id
                ) latest ON tbl_b.id = latest.max_id
            ) b ON o.id = b.order_id
            WHERE o.order_type != 'OTS' AND o.created_at BETWEEN ? AND ?
            GROUP BY o.hydrant_id
        ) ord ON h.id = ord.hydrant_id
        -- 2. OTS Orders Pre-Aggregated
        LEFT JOIN (
            SELECT 
                hydrant_id, 
                COUNT(*) AS ots_created,
                SUM(CASE WHEN status IN ('dispatched') THEN 1 ELSE 0 END) AS ots_driver_assigned,
                SUM(CASE WHEN status IN ('completed', 'self_closed') THEN 1 ELSE 0 END) AS ots_completed,
                SUM(CASE WHEN status IN ('pending', 'pending_alignment') THEN 1 ELSE 0 END) AS ots_pending,
                SUM(CASE WHEN status IN ('failed', 'cancelled') THEN 1 ELSE 0 END) AS ots_cancelled,
                SUM(CASE WHEN status IN ('completed', 'self_closed') THEN TIMESTAMPDIFF(SECOND, api_created_at, api_updated_at) END) AS total_completed_seconds
            FROM ots_order
            WHERE api_created_at BETWEEN ? AND ?
            GROUP BY hydrant_id
        ) ots ON h.ots_hydrant = ots.hydrant_id
        WHERE COALESCE(ord.created_count, 0) > 0 OR COALESCE(ots.ots_created, 0) > 0
        ORDER BY h.name ASC;`;

        const gridParams = [
            todayStart, todayEnd,
            todayStart, todayEnd
        ];

        const [rows] = await req.db.execute(gridQuery, gridParams);

        const processedRows = rows.map(row => {
            // Explicitly cast to Number to avoid String Concatenation bugs ("1" + "2" = "12")
            const totalCreated = Number(row.hmp_total_created) + Number(row.ots_total_created);
            const totalCompletedCount = Number(row.hmp_completed_count) + Number(row.ots_completed_count);
            const totalPendingCount = Number(row.hmp_pending_count) + Number(row.ots_pending_count);
            const totalCancelledCount = Number(row.hmp_cancelled_count) + Number(row.ots_cancelled_count);
            const totalAssignedCount = Number(row.hmp_assigned_count) + Number(row.ots_assigned_count);

            // Total Turnaround Time Calculations
            const totalSeconds = Number(row.hmp_total_seconds) + Number(row.ots_total_seconds);
            let totalAvgTat = "00:00";
            if (totalCompletedCount > 0) {
                const avgSeconds = totalSeconds / totalCompletedCount;
                const hours = String(Math.floor(avgSeconds / 3600)).padStart(2, '0');
                const minutes = String(Math.floor((avgSeconds % 3600) / 60)).padStart(2, '0');
                totalAvgTat = `${hours}:${minutes}`;
            }

            return {
                hydrant_name: row.hydrant_name,
                hmp: {
                    total_created: row.hmp_total_created,
                    completed_percentage: row.hmp_completed_percentage !== null ? `${row.hmp_completed_percentage}%` : '0%',
                    pending_percentage: row.hmp_pending_percentage !== null ? `${row.hmp_pending_percentage}%` : '0%',
                    driver_assigned_percentage: row.hmp_driver_assigned_percentage !== null ? `${row.hmp_driver_assigned_percentage}%` : '0%',
                    avg_tat: row.hmp_avg_tat,
                    cancelled_percentage: row.hmp_cancelled_percentage !== null ? `${row.hmp_cancelled_percentage}%` : '0%',
                },
                ots: {
                    total_created: row.ots_total_created,
                    completed_percentage: row.ots_completed_percentage !== null ? `${row.ots_completed_percentage}%` : '0%',
                    pending_percentage: row.ots_pending_percentage !== null ? `${row.ots_pending_percentage}%` : '0%',
                    driver_assigned_percentage: row.ots_driver_assigned_percentage !== null ? `${row.ots_driver_assigned_percentage}%` : '0%',
                    avg_tat: row.ots_avg_tat,
                    cancelled_percentage: row.ots_cancelled_percentage !== null ? `${row.ots_cancelled_percentage}%` : '0%',
                },
                total: {
                    total_created: totalCreated,
                    completed_percentage: totalCreated > 0 ? `${((totalCompletedCount / totalCreated) * 100).toFixed(2)}%` : '0.00%',
                    pending_percentage: totalCreated > 0 ? `${((totalPendingCount / totalCreated) * 100).toFixed(2)}%` : '0.00%',
                    driver_assigned_percentage: totalCreated > 0 ? `${((totalAssignedCount / totalCreated) * 100).toFixed(2)}%` : '0.00%',
                    cancelled_percentage: totalCreated > 0 ? `${((totalCancelledCount / totalCreated) * 100).toFixed(2)}%` : '0.00%',
                    avg_tat: totalAvgTat,
                    
                    // Added requested parameters calculation based on total created metrics
                    total_created_hmp_percentage: totalCreated > 0 ? `${((Number(row.hmp_total_created) / totalCreated) * 100).toFixed(2)}%` : '0.00%',
                    total_created_ots_percentage: totalCreated > 0 ? `${((Number(row.ots_total_created) / totalCreated) * 100).toFixed(2)}%` : '0.00%'
                }
            };
        });

        res.json({
            success: true,
            data: processedRows
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};