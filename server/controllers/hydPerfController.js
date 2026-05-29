export const getHydrantPerformance = async (req, res) => {
    try {
        // 1. Pre-calculate dates in Node.js to keep queries SARGable
        const now = new Date();
        const todayStart = `${now.toISOString().split('T')[0]} 00:00:00`;
        const todayEnd = `${now.toISOString().split('T')[0]} 23:59:59`;
        
        const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const startOfMonthDateTime = `${startOfMonth} 00:00:00`;
        const endOfMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const endOfMonthDateTime = `${endOfMonthDate.toISOString().split('T')[0]} 23:59:59`;

        // 2. Refactored Single-Source Query from ots_order Table
        const query = `
        SELECT 
            h.name AS hydrant_name,
            
            -- TODAY'S STATS (OTS ONLY)
            COUNT(CASE WHEN ots.api_created_at BETWEEN ? AND ? THEN 1 END) AS created_today,
            SUM(CASE WHEN ots.api_created_at BETWEEN ? AND ? AND ots.status IN ('dispatched') THEN 1 ELSE 0 END) AS dispatched_today,
            SUM(CASE WHEN ots.api_created_at BETWEEN ? AND ? AND ots.status IN ('completed', 'self_closed') THEN 1 ELSE 0 END) AS completed_today,
            SUM(CASE WHEN ots.api_created_at BETWEEN ? AND ? AND ots.status IN ('cancelled', 'failed') THEN 1 ELSE 0 END) AS cancelled_today,
            SUM(CASE WHEN ots.api_created_at BETWEEN ? AND ? AND ots.status IN ('pending', 'pending_alignment') THEN 1 ELSE 0 END) AS pending_today,
            
            -- MONTH'S STATS (OTS ONLY)
            COUNT(CASE WHEN ots.api_created_at BETWEEN ? AND ? THEN 1 END) AS created_month,
            SUM(CASE WHEN ots.api_created_at BETWEEN ? AND ? AND ots.status IN ('dispatched') THEN 1 ELSE 0 END) AS dispatched_month,
            SUM(CASE WHEN ots.api_created_at BETWEEN ? AND ? AND ots.status IN ('completed', 'self_closed') THEN 1 ELSE 0 END) AS completed_month,
            SUM(CASE WHEN ots.api_created_at BETWEEN ? AND ? AND ots.status IN ('cancelled', 'failed') THEN 1 ELSE 0 END) AS cancelled_month,
            SUM(CASE WHEN ots.api_created_at BETWEEN ? AND ? AND ots.status IN ('pending', 'pending_alignment') THEN 1 ELSE 0 END) AS pending_month
            
        FROM hydrants h
        LEFT JOIN ots_order ots ON ots.hydrant_id = h.ots_hydrant 
            AND ots.api_created_at BETWEEN ? AND ?
        WHERE h.id IN (1, 2, 3, 4, 5, 6, 7)
        GROUP BY h.id, h.name`;

        // Parameters map cleanly 1-to-1 to each pair of timeline bounds
        const queryParams = [
            // Today metrics
            todayStart, todayEnd, todayStart, todayEnd, todayStart, todayEnd, todayStart, todayEnd, todayStart, todayEnd,
            // Month metrics
            startOfMonthDateTime, endOfMonthDateTime, startOfMonthDateTime, endOfMonthDateTime, startOfMonthDateTime, endOfMonthDateTime, startOfMonthDateTime, endOfMonthDateTime, startOfMonthDateTime, endOfMonthDateTime,
            // Left Join bounding restriction (indexes month data block)
            startOfMonthDateTime, endOfMonthDateTime
        ];

        const [rows] = await req.db.execute(query, queryParams);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};