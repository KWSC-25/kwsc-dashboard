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
            SUM(total_amount) AS ots_created_amount_today,
            SUM(CASE WHEN status IN ('pending_alignment','pending') THEN total_amount ELSE 0 END) AS ots_pending_amount_today,
            SUM(CASE WHEN status IN ('dispatched') THEN total_amount ELSE 0 END) AS ots_dispatched_amount_today,
            SUM(CASE WHEN status IN ('completed','self_closed') THEN total_amount ELSE 0 END) AS ots_completed_amount_today,
            SUM(CASE WHEN status IN ('cancelled', 'failed') THEN total_amount ELSE 0 END) AS ots_cancelled_amount_today,

            -- Turnaround Time Average
            AVG(CASE WHEN status IN ('completed','self_closed') THEN TIMESTAMPDIFF(SECOND, api_created_at, api_updated_at) END) AS ots_avg_tat_seconds_today,
            
            -- Max Open Order Aging Metrics (Seconds from creation until NOW)
            MAX(CASE WHEN status IN ('pending_alignment','pending') THEN TIMESTAMPDIFF(SECOND, api_created_at, NOW()) END) AS ots_max_pending_aging_seconds,
            MAX(CASE WHEN status IN ('dispatched') THEN TIMESTAMPDIFF(SECOND, api_created_at, NOW()) END) AS ots_max_assigned_aging_seconds
        FROM ots_order
        WHERE api_created_at BETWEEN ? AND ?`;

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
            AVG(CASE WHEN status = 1 THEN seconds_duration END) AS hmp_avg_tat_seconds_today,
            
            -- Max Open Order Aging Metrics (Seconds from creation until NOW)
            MAX(CASE WHEN status = 0 THEN seconds_aging_now END) AS hmp_max_pending_aging_seconds,
            MAX(CASE WHEN status = 2 THEN seconds_aging_now END) AS hmp_max_assigned_aging_seconds
        FROM (
            SELECT 
                b.status,
                tt.capacity,
                TIMESTAMPDIFF(SECOND, o.created_at, b.updated_at) AS seconds_duration,
                TIMESTAMPDIFF(SECOND, o.created_at, NOW()) AS seconds_aging_now
            FROM orders o
            INNER JOIN billings b ON o.id = b.order_id
            LEFT JOIN truck_types tt ON o.truck_type = tt.id
            WHERE o.order_type != 'OTS' AND o.created_at BETWEEN ? AND ?
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

        // Format Turnaround Times
        formattedOts.ots_avg_tat_readable = formatDurationText(formattedOts.ots_avg_tat_seconds_today);
        formattedOrders.hmp_avg_tat_readable = formatDurationText(formattedOrders.hmp_avg_tat_seconds_today);

        // Format New Max Aging Values for OTS
        formattedOts.ots_max_pending_aging_readable = formatDurationText(formattedOts.ots_max_pending_aging_seconds);
        formattedOts.ots_max_assigned_aging_readable = formatDurationText(formattedOts.ots_max_assigned_aging_seconds);

        // Format New Max Aging Values for HMP
        formattedOrders.hmp_max_pending_aging_readable = formatDurationText(formattedOrders.hmp_max_pending_aging_seconds);
        formattedOrders.hmp_max_assigned_aging_readable = formatDurationText(formattedOrders.hmp_max_assigned_aging_seconds);

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
            CASE 
                WHEN raw_summary.hydrant_id IN (5, 15) THEN 'NIPA'
                WHEN raw_summary.hydrant_id IN (2, 13) THEN 'SAFOORA'
                ELSE raw_summary.original_name 
            END AS hydrant_name,
            SUM(commercial_created) AS commercial_created,
            SUM(commercial_driver_assigned) AS commercial_driver_assigned,
            SUM(commercial_completed) AS commercial_completed,
            SUM(commercial_cancelled) AS commercial_cancelled,
            SUM(commercial_pending) AS commercial_pending,
            
            SUM(gps_ots_created) AS gps_ots_created,
            SUM(gps_ots_driver_assigned) AS gps_ots_driver_assigned,
            SUM(gps_ots_completed) AS gps_ots_completed,
            SUM(gps_ots_cancelled) AS gps_ots_cancelled,
            SUM(gps_ots_pending) AS gps_ots_pending,
            
            SUM(gps_online_created) AS gps_online_created,
            SUM(gps_online_driver_assigned) AS gps_online_driver_assigned,
            SUM(gps_online_completed) AS gps_online_completed,
            SUM(gps_online_cancelled) AS gps_online_cancelled,
            SUM(gps_online_pending) AS gps_online_pending,
            
            SUM(dc_quota_created) AS dc_quota_created,
            SUM(dc_quota_driver_assigned) AS dc_quota_driver_assigned,
            SUM(dc_quota_completed) AS dc_quota_completed,
            SUM(dc_quota_cancelled) AS dc_quota_cancelled,
            SUM(dc_quota_pending) AS dc_quota_pending,
            
            SUM(gps_billing_created) AS gps_billing_created,
            SUM(gps_billing_driver_assigned) AS gps_billing_driver_assigned,
            SUM(gps_billing_completed) AS gps_billing_completed,
            SUM(gps_billing_cancelled) AS gps_billing_cancelled,
            SUM(gps_billing_pending) AS gps_billing_pending,
            
            SUM(gps_careoff_created) AS gps_careoff_created,
            SUM(gps_careoff_driver_assigned) AS gps_careoff_driver_assigned,
            SUM(gps_careoff_completed) AS gps_careoff_completed,
            SUM(gps_careoff_cancelled) AS gps_careoff_cancelled,
            SUM(gps_careoff_pending) AS gps_careoff_pending,
            
            SUM(govt_vehicle_created) AS govt_vehicle_created,
            SUM(govt_vehicle_driver_assigned) AS govt_vehicle_driver_assigned,
            SUM(govt_vehicle_completed) AS govt_vehicle_completed,
            SUM(govt_vehicle_cancelled) AS govt_vehicle_cancelled,
            SUM(govt_vehicle_pending) AS govt_vehicle_pending,
            
            SUM(paf_created) AS paf_created,
            SUM(paf_driver_assigned) AS paf_driver_assigned,
            SUM(paf_completed) AS paf_completed,
            SUM(paf_cancelled) AS paf_cancelled,
            SUM(paf_pending) AS paf_pending,
            
            SUM(pak_ranger_created) AS pak_ranger_created,
            SUM(pak_ranger_driver_assigned) AS pak_ranger_driver_assigned,
            SUM(pak_ranger_completed) AS pak_ranger_completed,
            SUM(pak_ranger_cancelled) AS pak_ranger_cancelled,
            SUM(pak_ranger_pending) AS pak_ranger_pending,
            SUM(total) AS total
        FROM (
            SELECT 
                h.id AS hydrant_id,
                h.name AS original_name,
                COUNT(DISTINCT CASE WHEN o.order_type IN ('Commercial', 'Commercial Offline') THEN o.id END) AS commercial_created,
                COUNT(DISTINCT CASE WHEN o.order_type IN ('Commercial', 'Commercial Offline') AND b.status = 2 THEN o.id END) AS commercial_driver_assigned,
                COUNT(DISTINCT CASE WHEN o.order_type IN ('Commercial', 'Commercial Offline') AND b.status = 1 THEN o.id END) AS commercial_completed,
                COUNT(DISTINCT CASE WHEN o.order_type IN ('Commercial', 'Commercial Offline') AND b.status IN (3, 4) THEN o.id END) AS commercial_cancelled,
                COUNT(DISTINCT CASE WHEN o.order_type IN ('Commercial', 'Commercial Offline') AND b.status = 0 THEN o.id END) AS commercial_pending,
                
                COALESCE(ots.ots_created, 0) AS gps_ots_created,
                COALESCE(ots.ots_driver_assigned, 0) AS gps_ots_driver_assigned,
                COALESCE(ots.ots_completed, 0) AS gps_ots_completed,
                COALESCE(ots.ots_cancelled, 0) AS gps_ots_cancelled,
                COALESCE(ots.ots_pending, 0) AS gps_ots_pending,
                
                COUNT(DISTINCT CASE WHEN o.order_type = 'Online (GPS)' THEN o.id END) AS gps_online_created,
                COUNT(DISTINCT CASE WHEN o.order_type = 'Online (GPS)' AND b.status = 2 THEN o.id END) AS gps_online_driver_assigned,
                COUNT(DISTINCT CASE WHEN o.order_type = 'Online (GPS)' AND b.status = 1 THEN o.id END) AS gps_online_completed,
                COUNT(DISTINCT CASE WHEN o.order_type = 'Online (GPS)' AND b.status IN (3, 4) THEN o.id END) AS gps_online_cancelled,
                COUNT(DISTINCT CASE WHEN o.order_type = 'Online (GPS)' AND b.status = 0 THEN o.id END) AS gps_online_pending,
                
                COUNT(DISTINCT CASE WHEN o.order_type = 'Dc quota' THEN o.id END) AS dc_quota_created,
                COUNT(DISTINCT CASE WHEN o.order_type = 'Dc quota' AND b.status = 2 THEN o.id END) AS dc_quota_driver_assigned,
                COUNT(DISTINCT CASE WHEN o.order_type = 'Dc quota' AND b.status = 1 THEN o.id END) AS dc_quota_completed,
                COUNT(DISTINCT CASE WHEN o.order_type = 'Dc quota' AND b.status IN (3, 4) THEN o.id END) AS dc_quota_cancelled,
                COUNT(DISTINCT CASE WHEN o.order_type = 'Dc quota' AND b.status = 0 THEN o.id END) AS dc_quota_pending,
                
                COUNT(DISTINCT CASE WHEN o.order_type = 'Gps(billing)' THEN o.id END) AS gps_billing_created,
                COUNT(DISTINCT CASE WHEN o.order_type = 'Gps(billing)' AND b.status = 2 THEN o.id END) AS gps_billing_driver_assigned,
                COUNT(DISTINCT CASE WHEN o.order_type = 'Gps(billing)' AND b.status = 1 THEN o.id END) AS gps_billing_completed,
                COUNT(DISTINCT CASE WHEN o.order_type = 'Gps(billing)' AND b.status IN (3, 4) THEN o.id END) AS gps_billing_cancelled,
                COUNT(DISTINCT CASE WHEN o.order_type = 'Gps(billing)' AND b.status = 0 THEN o.id END) AS gps_billing_pending,
                
                COUNT(DISTINCT CASE WHEN o.order_type = 'Gps(careoff)' THEN o.id END) AS gps_careoff_created,
                COUNT(DISTINCT CASE WHEN o.order_type = 'Gps(careoff)' AND b.status = 2 THEN o.id END) AS gps_careoff_driver_assigned,
                COUNT(DISTINCT CASE WHEN o.order_type = 'Gps(careoff)' AND b.status = 1 THEN o.id END) AS gps_careoff_completed,
                COUNT(DISTINCT CASE WHEN o.order_type = 'Gps(careoff)' AND b.status IN (3, 4) THEN o.id END) AS gps_careoff_cancelled,
                COUNT(DISTINCT CASE WHEN o.order_type = 'Gps(careoff)' AND b.status = 0 THEN o.id END) AS gps_careoff_pending,
                
                COUNT(DISTINCT CASE WHEN o.order_type = 'Govt. vehicle' THEN o.id END) AS govt_vehicle_created,
                COUNT(DISTINCT CASE WHEN o.order_type = 'Govt. vehicle' AND b.status = 2 THEN o.id END) AS govt_vehicle_driver_assigned,
                COUNT(DISTINCT CASE WHEN o.order_type = 'Govt. vehicle' AND b.status = 1 THEN o.id END) AS govt_vehicle_completed,
                COUNT(DISTINCT CASE WHEN o.order_type = 'Govt. vehicle' AND b.status IN (3, 4) THEN o.id END) AS govt_vehicle_cancelled,
                COUNT(DISTINCT CASE WHEN o.order_type = 'Govt. vehicle' AND b.status = 0 THEN o.id END) AS govt_vehicle_pending,
                
                COUNT(DISTINCT CASE WHEN o.order_type = 'P.A.F korangi creek' THEN o.id END) AS paf_created,
                COUNT(DISTINCT CASE WHEN o.order_type = 'P.A.F korangi creek' AND b.status = 2 THEN o.id END) AS paf_driver_assigned,
                COUNT(DISTINCT CASE WHEN o.order_type = 'P.A.F korangi creek' AND b.status = 1 THEN o.id END) AS paf_completed,
                COUNT(DISTINCT CASE WHEN o.order_type = 'P.A.F korangi creek' AND b.status IN (3, 4) THEN o.id END) AS paf_cancelled,
                COUNT(DISTINCT CASE WHEN o.order_type = 'P.A.F korangi creek' AND b.status = 0 THEN o.id END) AS paf_pending,
                
                COUNT(DISTINCT CASE WHEN o.order_type = 'Pak rangers' THEN o.id END) AS pak_ranger_created,
                COUNT(DISTINCT CASE WHEN o.order_type = 'Pak rangers' AND b.status = 2 THEN o.id END) AS pak_ranger_driver_assigned,
                COUNT(DISTINCT CASE WHEN o.order_type = 'Pak rangers' AND b.status = 1 THEN o.id END) AS pak_ranger_completed,
                COUNT(DISTINCT CASE WHEN o.order_type = 'Pak rangers' AND b.status IN (3, 4) THEN o.id END) AS pak_ranger_cancelled,
                COUNT(DISTINCT CASE WHEN o.order_type = 'Pak rangers' AND b.status = 0 THEN o.id END) AS pak_ranger_pending,
                
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
        ) AS raw_summary
        WHERE total > 0
        GROUP BY 
            CASE 
                WHEN raw_summary.hydrant_id IN (5, 15) THEN 'NIPA'
                WHEN raw_summary.hydrant_id IN (2, 13) THEN 'SAFOORA'
                ELSE raw_summary.original_name 
            END
        ORDER BY hydrant_name ASC;`;

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
const formatSecondsToDHm = (totalSeconds, completedCount) => {
    if (!completedCount || completedCount <= 0 || !totalSeconds || totalSeconds <= 0) {
        return "0m";
    }

    const avgSeconds = Math.floor(totalSeconds / completedCount);
    
    const days = Math.floor(avgSeconds / 86400);
    const hours = Math.floor((avgSeconds % 86400) / 3600);
    const minutes = Math.floor((avgSeconds % 3600) / 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`); 
    parts.push(`${minutes}m`);

    return parts.join(' ');
};

// Formats absolute running decimal hours as a decimal string suffixed with 'h' (e.g., 7.5h)
const formatRunningHoursToDecimalStr = (runningHoursDecimal) => {
    if (!runningHoursDecimal || runningHoursDecimal <= 0) {
        return "0h";
    }
    // Using parseFloat to drop trailing zeros if it's a whole integer (e.g., 7h instead of 7.0h)
    // If you explicitly always want 1 decimal place (like 7.0h), use .toFixed(1) instead.
    return `${parseFloat(runningHoursDecimal.toFixed(2))}h`;
};

// Calculates running decimal hours for a single day based on its timeline context
const calculateSingleDayRunningHours = (slots, isToday) => {
    const now = new Date();
    const currentHrs = now.getHours();
    const currentMins = now.getMinutes();
    const currentTimeSlot24 = `${String(currentHrs).padStart(2, '0')}:${currentMins < 30 ? '00' : '30'}`;

    const dynamicTimeSlots = [];
    // If it's today, cap loops at the current hour. If it's a historical day, scan the full 24 hours (up to hour 23).
    const maxHour = isToday ? currentHrs : 23;

    for (let h = 0; h <= maxHour; h++) {
        for (let m of ['00', '30']) {
            const ts = `${String(h).padStart(2, '0')}:${m}`;
            dynamicTimeSlots.push(ts);
            if (isToday && ts === currentTimeSlot24) break;
        }
        if (isToday && dynamicTimeSlots[dynamicTimeSlots.length - 1] === currentTimeSlot24) break;
    }

    let runningHoursDecimal = 0;
    let lastKnownStatus = null; 

    dynamicTimeSlots.forEach(ts => {
        const entry = slots[ts];

        if (entry && entry.s !== undefined) {
            lastKnownStatus = entry.s;

            if (lastKnownStatus !== 'CCTV_OFF' && lastKnownStatus !== 'FILLING_STOP') {
                runningHoursDecimal += 0.5;
            }
        } else {
            if (lastKnownStatus === 'FILLING_START' || lastKnownStatus === 'ACTIVE' || lastKnownStatus === 'OPERATIONAL') {
                runningHoursDecimal += 0.5;
            }
        }
    });

    return runningHoursDecimal;
};

// Iterates over all logged days in the range selection, matching contexts to return formatted aggregate running hours
const aggregateHydrantRunningHours = (logsArray) => {
    if (!logsArray || logsArray.length === 0) return "0h";

    // Establish clean date comparisons using localized local execution timezone components
    const todayStr = new Date().toLocaleDateString('en-CA'); // 'YYYY-MM-DD'
    let cumulativeHoursDecimal = 0;

    logsArray.forEach(log => {
        if (!log.slots) return;
        const slots = typeof log.slots === 'string' ? JSON.parse(log.slots) : log.slots;
        
        // Handle database Date objects or string dates cleanly
        const logDateObj = new Date(log.entry_date);
        const logDateStr = logDateObj.toLocaleDateString('en-CA'); 
        
        const isToday = (logDateStr === todayStr);

        cumulativeHoursDecimal += calculateSingleDayRunningHours(slots, isToday);
    });

    return formatRunningHoursToDecimalStr(cumulativeHoursDecimal);
};

export const HydrantPerformanceGridToday = async (req, res) => {
    try {
        const now = new Date();
        
        const defaultTodayStart = `${now.toISOString().split('T')[0]} 00:00:00`;
        const defaultTodayEnd = `${now.toISOString().split('T')[0]} 23:59:59`;

        const { startDate, endDate } = req.query;
        const todayStart = startDate ? `${startDate} 00:00:00` : defaultTodayStart;
        const todayEnd = endDate ? `${endDate} 23:59:59` : defaultTodayEnd;
        
        // Extract plain dates (YYYY-MM-DD) for status log range processing
        const logStartDate = todayStart.split(' ')[0];
        const logEndDate = todayEnd.split(' ')[0];

        const gridQuery = `
        SELECT 
            MAX(h.id) AS hydrant_id,
            CASE 
                WHEN h.id IN (5, 15) THEN 'NIPA'
                WHEN h.id IN (2, 13) THEN 'SAFOORA'
                ELSE h.name 
            END AS combined_hydrant_name,
            SUM(COALESCE(ord.created_count, 0)) AS hmp_total_created,
            SUM(COALESCE(ots.ots_created, 0)) AS ots_total_created,
            SUM(COALESCE(ord.completed_count, 0)) AS hmp_completed_count,
            SUM(COALESCE(ots.ots_completed, 0)) AS ots_completed_count,
            SUM(COALESCE(ord.pending_count, 0)) AS hmp_pending_count,
            SUM(COALESCE(ots.ots_pending, 0)) AS ots_pending_count,
            SUM(COALESCE(ord.cancelled_count, 0)) AS hmp_cancelled_count,
            SUM(COALESCE(ots.ots_cancelled, 0)) AS ots_cancelled_count,
            SUM(COALESCE(ord.assigned_count, 0)) AS hmp_assigned_count, 
            SUM(COALESCE(ots.ots_driver_assigned, 0)) AS ots_assigned_count,
            SUM(COALESCE(ord.total_completed_seconds, 0)) AS hmp_total_seconds,
            SUM(COALESCE(ots.total_completed_seconds, 0)) AS ots_total_seconds,

            -- HMP Open Aging Buckets (Pending + Dispatched combined)
            SUM(COALESCE(ord.hmp_open_under_24h, 0)) AS hmp_open_under_24h,
            SUM(COALESCE(ord.hmp_open_24h_48h, 0)) AS hmp_open_24h_48h,
            SUM(COALESCE(ord.hmp_open_48h_72h, 0)) AS hmp_open_48h_72h,
            SUM(COALESCE(ord.hmp_open_above_72h, 0)) AS hmp_open_above_72h,

            -- OTS Open Aging Buckets (Pending Alignment + Pending + Dispatched combined)
            SUM(COALESCE(ots.ots_open_under_24h, 0)) AS ots_open_under_24h,
            SUM(COALESCE(ots.ots_open_24h_48h, 0)) AS ots_open_24h_48h,
            SUM(COALESCE(ots.ots_open_48h_72h, 0)) AS ots_open_48h_72h,
            SUM(COALESCE(ots.ots_open_above_72h, 0)) AS ots_open_above_72h
        FROM hydrants h
        LEFT JOIN (
            SELECT 
                o.hydrant_id,
                COUNT(o.id) AS created_count,
                SUM(CASE WHEN b.latest_status = 1 THEN 1 ELSE 0 END) AS completed_count,
                SUM(CASE WHEN b.latest_status = 0 THEN 1 ELSE 0 END) AS pending_count,
                SUM(CASE WHEN b.latest_status = 2 THEN 1 ELSE 0 END) AS assigned_count,
                SUM(CASE WHEN b.latest_status IN (3,4) THEN 1 ELSE 0 END) AS cancelled_count,
                SUM(CASE WHEN b.latest_status = 1 THEN TIMESTAMPDIFF(SECOND, o.created_at, b.latest_updated) END) AS total_completed_seconds,
                
                -- Dynamic Hourly Conditions for Open HMP Orders
                SUM(CASE WHEN b.latest_status IN (0, 2) AND TIMESTAMPDIFF(HOUR, o.created_at, NOW()) < 24 THEN 1 ELSE 0 END) AS hmp_open_under_24h,
                SUM(CASE WHEN b.latest_status IN (0, 2) AND TIMESTAMPDIFF(HOUR, o.created_at, NOW()) >= 24 AND TIMESTAMPDIFF(HOUR, o.created_at, NOW()) < 48 THEN 1 ELSE 0 END) AS hmp_open_24h_48h,
                SUM(CASE WHEN b.latest_status IN (0, 2) AND TIMESTAMPDIFF(HOUR, o.created_at, NOW()) >= 48 AND TIMESTAMPDIFF(HOUR, o.created_at, NOW()) < 72 THEN 1 ELSE 0 END) AS hmp_open_48h_72h,
                SUM(CASE WHEN b.latest_status IN (0, 2) AND TIMESTAMPDIFF(HOUR, o.created_at, NOW()) >= 72 THEN 1 ELSE 0 END) AS hmp_open_above_72h
            FROM orders o
            LEFT JOIN (
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
        LEFT JOIN (
            SELECT 
                hydrant_id, 
                COUNT(*) AS ots_created,
                SUM(CASE WHEN status IN ('dispatched') THEN 1 ELSE 0 END) AS ots_driver_assigned,
                SUM(CASE WHEN status IN ('completed', 'self_closed') THEN 1 ELSE 0 END) AS ots_completed,
                SUM(CASE WHEN status IN ('pending', 'pending_alignment') THEN 1 ELSE 0 END) AS ots_pending,
                SUM(CASE WHEN status IN ('failed', 'cancelled') THEN 1 ELSE 0 END) AS ots_cancelled,
                SUM(CASE WHEN status IN ('completed', 'self_closed') THEN TIMESTAMPDIFF(SECOND, api_created_at, api_updated_at) END) AS total_completed_seconds,

                -- Dynamic Hourly Conditions for Open OTS Orders
                SUM(CASE WHEN status IN ('pending_alignment', 'pending', 'dispatched') AND TIMESTAMPDIFF(HOUR, api_created_at, NOW()) < 24 THEN 1 ELSE 0 END) AS ots_open_under_24h,
                SUM(CASE WHEN status IN ('pending_alignment', 'pending', 'dispatched') AND TIMESTAMPDIFF(HOUR, api_created_at, NOW()) >= 24 AND TIMESTAMPDIFF(HOUR, api_created_at, NOW()) < 48 THEN 1 ELSE 0 END) AS ots_open_24h_48h,
                SUM(CASE WHEN status IN ('pending_alignment', 'pending', 'dispatched') AND TIMESTAMPDIFF(HOUR, api_created_at, NOW()) >= 48 AND TIMESTAMPDIFF(HOUR, api_created_at, NOW()) < 72 THEN 1 ELSE 0 END) AS ots_open_48h_72h,
                SUM(CASE WHEN status IN ('pending_alignment', 'pending', 'dispatched') AND TIMESTAMPDIFF(HOUR, api_created_at, NOW()) >= 72 THEN 1 ELSE 0 END) AS ots_open_above_72h
            FROM ots_order
            WHERE api_created_at BETWEEN ? AND ?
            GROUP BY hydrant_id
        ) ots ON h.ots_hydrant = ots.hydrant_id
        GROUP BY 
            CASE 
                WHEN h.id IN (5, 15) THEN 'NIPA'
                WHEN h.id IN (2, 13) THEN 'SAFOORA'
                ELSE h.name 
            END
        HAVING SUM(COALESCE(ord.created_count, 0)) > 0 OR SUM(COALESCE(ots.ots_created, 0)) > 0
        ORDER BY combined_hydrant_name DESC;`;

        const gridParams = [
            todayStart, todayEnd,
            todayStart, todayEnd
        ];

        const [rows] = await req.db.execute(gridQuery, gridParams);

        let globalTotalHmpCreated = 0;
        let globalTotalOtsCreated = 0;
        let globalTotalCompleted = 0;
        let globalTotalPending = 0;
        let globalTotalAssigned = 0;
        let globalTotalCancelled = 0;

        rows.forEach(row => {
            globalTotalHmpCreated += Number(row.hmp_total_created);
            globalTotalOtsCreated += Number(row.ots_total_created);
            globalTotalCompleted += (Number(row.hmp_completed_count) + Number(row.ots_completed_count));
            globalTotalPending += (Number(row.hmp_pending_count) + Number(row.ots_pending_count));
            globalTotalAssigned += (Number(row.hmp_assigned_count) + Number(row.ots_assigned_count));
            globalTotalCancelled += (Number(row.hmp_cancelled_count) + Number(row.ots_cancelled_count));
        });

        // Pre-calculate your global dynamic baseline denominator for the aging metrics
        const globalOpenDenominator = globalTotalPending + globalTotalAssigned;

        // ========================================================
        // RANGE-BASED LOG EVALUATION ACROSS FILTERS
        // ========================================================
        let logsMap = {};
        if (rows.length > 0) {
            const hydrantIds = rows.map(r => r.hydrant_id);
            const logsQuery = `
                SELECT hydrant_id, entry_date, slots 
                FROM hydrant_status_logs 
                WHERE entry_date BETWEEN ? AND ? AND hydrant_id IN (${hydrantIds.map(() => '?').join(',')})`;
            
            const [logRows] = await req.db.execute(logsQuery, [logStartDate, logEndDate, ...hydrantIds]);
            
            // Group status records inside arrays grouped by unique hydrant_id
            logsMap = logRows.reduce((acc, currentLog) => {
                if (!acc[currentLog.hydrant_id]) {
                    acc[currentLog.hydrant_id] = [];
                }
                acc[currentLog.hydrant_id].push({
                    entry_date: currentLog.entry_date,
                    slots: currentLog.slots
                });
                return acc;
            }, {});
        }

        // ========================================================
        // DYNAMIC ROW RESPONSE SYNCHRONIZATION
        // ========================================================
        const processedRows = rows.map(row => {
            const hmpTotalCreated = Number(row.hmp_total_created);
            const otsTotalCreated = Number(row.ots_total_created);
            const totalCreated = hmpTotalCreated + otsTotalCreated;
            
            const hmpCompletedCount = Number(row.hmp_completed_count);
            const otsCompletedCount = Number(row.ots_completed_count);
            const totalCompletedCount = hmpCompletedCount + otsCompletedCount;

            const totalPendingCount = Number(row.hmp_pending_count) + Number(row.ots_pending_count);
            const totalCancelledCount = Number(row.hmp_cancelled_count) + Number(row.ots_cancelled_count);
            const totalAssignedCount = Number(row.hmp_assigned_count) + Number(row.ots_assigned_count);

            const hmpCompletedPct = hmpTotalCreated > 0 ? ((hmpCompletedCount * 100) / hmpTotalCreated).toFixed(2) : "0.00";
            const otsCompletedPct = otsTotalCreated > 0 ? ((otsCompletedCount * 100) / otsTotalCreated).toFixed(2) : "0.00";

            const hmpPendingPct = hmpTotalCreated > 0 ? ((Number(row.hmp_pending_count) * 100) / hmpTotalCreated).toFixed(2) : "0.00";
            const otsPendingPct = otsTotalCreated > 0 ? ((Number(row.ots_pending_count) * 100) / otsTotalCreated).toFixed(2) : "0.00";

            const hmpCancelledPct = hmpTotalCreated > 0 ? ((Number(row.hmp_cancelled_count) * 100) / hmpTotalCreated).toFixed(2) : "0.00";
            const otsCancelledPct = otsTotalCreated > 0 ? ((Number(row.ots_cancelled_count) * 100) / otsTotalCreated).toFixed(2) : "0.00";

            const hmpAssignedPct = hmpTotalCreated > 0 ? ((Number(row.hmp_assigned_count) * 100) / hmpTotalCreated).toFixed(2) : "0.00";
            const otsAssignedPct = otsTotalCreated > 0 ? ((Number(row.ots_assigned_count) * 100) / otsTotalCreated).toFixed(2) : "0.00";

            const hmpAvgTat = formatSecondsToDHm(Number(row.hmp_total_seconds), hmpCompletedCount);
            const otsAvgTat = formatSecondsToDHm(Number(row.ots_total_seconds), otsCompletedCount);
            
            const totalSecondsCombined = Number(row.hmp_total_seconds) + Number(row.ots_total_seconds);
            const totalAvgTat = formatSecondsToDHm(totalSecondsCombined, totalCompletedCount);
            const overallAvgTat = formatSecondsToDHm(totalSecondsCombined, globalTotalCompleted);

            const hydrantHmpPercentage = totalCreated > 0 ? ((hmpTotalCreated / totalCreated) * 100).toFixed(2) : "0.00";
            const hydrantOtsPercentage = totalCreated > 0 ? ((otsTotalCreated / totalCreated) * 100).toFixed(2) : "0.00";

            const completedOverallPct = globalTotalCompleted > 0 ? ((totalCompletedCount / globalTotalCompleted) * 100).toFixed(2) : "0.00";
            const pendingOverallPct = globalTotalPending > 0 ? ((totalPendingCount / globalTotalPending) * 100).toFixed(2) : "0.00";
            const assignedOverallPct = globalTotalAssigned > 0 ? ((totalAssignedCount / globalTotalAssigned) * 100).toFixed(2) : "0.00";
            const cancelledOverallPct = globalTotalCancelled > 0 ? ((totalCancelledCount / globalTotalCancelled) * 100).toFixed(2) : "0.00";

            // Aggregate counts of running open orders per time range for this specific hydrant
            const hydrantOpenUnder24h = Number(row.hmp_open_under_24h) + Number(row.ots_open_under_24h);
            const hydrantOpen24h48h = Number(row.hmp_open_24h_48h) + Number(row.ots_open_24h_48h);
            const hydrantOpen48h72h = Number(row.hmp_open_48h_72h) + Number(row.ots_open_48h_72h);
            const hydrantOpenAbove72h = Number(row.hmp_open_above_72h) + Number(row.ots_open_above_72h);

            // Compute percentage representations against the unified global pool mapping target constraints
            const pendingUnder24hPct = globalOpenDenominator > 0 ? ((hydrantOpenUnder24h * 100) / globalOpenDenominator).toFixed(2) : "0.00";
            const pending24h48hPct = globalOpenDenominator > 0 ? ((hydrantOpen24h48h * 100) / globalOpenDenominator).toFixed(2) : "0.00";
            const pending48h72hPct = globalOpenDenominator > 0 ? ((hydrantOpen48h72h * 100) / globalOpenDenominator).toFixed(2) : "0.00";
            const pendingAbove72hPct = globalOpenDenominator > 0 ? ((hydrantOpenAbove72h * 100) / globalOpenDenominator).toFixed(2) : "0.00";

            // Process collected array logs across the chosen filter boundaries
            const hydrantLogEntriesArray = logsMap[row.hydrant_id] || [];
            const formattedRunningHours = aggregateHydrantRunningHours(hydrantLogEntriesArray);

            return {
                hydrant_name: row.combined_hydrant_name,
                hmp: {
                    total_created: hmpTotalCreated,
                    completed_percentage: `${hmpCompletedPct}%`,
                    pending_percentage: `${hmpPendingPct}%`,
                    driver_assigned_percentage: `${hmpAssignedPct}%`,
                    avg_tat: hmpAvgTat,
                    cancelled_percentage: `${hmpCancelledPct}%`
                },
                ots: {
                    total_created: otsTotalCreated,
                    completed_percentage: `${otsCompletedPct}%`,
                    pending_percentage: `${otsPendingPct}%`,
                    driver_assigned_percentage: `${otsAssignedPct}%`,
                    avg_tat: otsAvgTat,
                    cancelled_percentage: `${otsCancelledPct}%`
                },
                total: {
                    total_created: totalCreated,
                    completed_percentage: totalCreated > 0 ? `${((totalCompletedCount / totalCreated) * 100).toFixed(2)}%` : '0.00%',
                    pending_percentage: totalCreated > 0 ? `${((totalPendingCount / totalCreated) * 100).toFixed(2)}%` : '0.00%',
                    driver_assigned_percentage: totalCreated > 0 ? `${((totalAssignedCount / totalCreated) * 100).toFixed(2)}%` : '0.00%',
                    cancelled_percentage: totalCreated > 0 ? `${((totalCancelledCount / totalCreated) * 100).toFixed(2)}%` : '0.00%',
                    
                    avg_tat: totalAvgTat,
                    avg_tat_total: overallAvgTat,
                    
                    created_hmp_percentage_total: globalTotalHmpCreated > 0 ? `${((hmpTotalCreated / globalTotalHmpCreated) * 100).toFixed(2)}%` : '0.00%',
                    created_ots_percentage_total: globalTotalOtsCreated > 0 ? `${((otsTotalCreated / globalTotalOtsCreated) * 100).toFixed(2)}%` : '0.00%',
                    
                    created_hmp_percentage: `${hydrantHmpPercentage}%`,
                    created_ots_percentage: `${hydrantOtsPercentage}%`,

                    completed_percentage_total: `${completedOverallPct}%`,
                    pending_percentage_total: `${pendingOverallPct}%`,
                    driver_assigned_percentage_total: `${assignedOverallPct}%`,
                    cancelled_percentage_total: `${cancelledOverallPct}%`,
                    running_hours: formattedRunningHours,

                    // New Global-Weighted Breakdown Aging Metric Percentages
                    pending_under_24h_percentage: `${pendingUnder24hPct}%`,
                    pending_24h_48h_percentage: `${pending24h48hPct}%`,
                    pending_48h_72h_percentage: `${pending48h72hPct}%`,
                    pending_above_72h_percentage: `${pendingAbove72hPct}%`
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

