export const getHydrantPerformance = async (req, res) => {
    try {
        // 1. Extract dates from query parameters
        const { startDate, endDate } = req.query;

        const now = new Date();
        const fallbackStart = `${now.toISOString().split('T')[0]} 00:00:00`;
        const fallbackEnd = `${now.toISOString().split('T')[0]} 23:59:59`;

        // If dates exist and aren't blank, use them; otherwise, default to today
        const finalStart = startDate && startDate.trim() !== '' ? `${startDate} 00:00:00` : fallbackStart;
        const finalEnd = endDate && endDate.trim() !== '' ? `${endDate} 23:59:59` : fallbackEnd;

        // 2. Refactored Single-Source Query using dynamic date bounds
        const query = `
        SELECT 
            h.name AS hydrant_name, 
            COUNT(CASE WHEN ots.api_created_at BETWEEN ? AND ? THEN 1 END) AS created,
            SUM(CASE WHEN ots.api_created_at BETWEEN ? AND ? AND ots.status IN ('dispatched') THEN 1 ELSE 0 END) AS dispatched,
            SUM(CASE WHEN ots.api_created_at BETWEEN ? AND ? AND ots.status IN ('completed', 'self_closed') THEN 1 ELSE 0 END) AS completed,
            SUM(CASE WHEN ots.api_created_at BETWEEN ? AND ? AND ots.status IN ('cancelled', 'failed') THEN 1 ELSE 0 END) AS cancelled,
            SUM(CASE WHEN ots.api_created_at BETWEEN ? AND ? AND ots.status IN ('pending', 'pending_alignment') THEN 1 ELSE 0 END) AS pending
            
        FROM hydrants h
        LEFT JOIN ots_order ots ON ots.hydrant_id = h.ots_hydrant 
            AND ots.api_created_at BETWEEN ? AND ?
        WHERE h.id IN (1, 2, 3, 4, 5, 6, 7)
        GROUP BY h.id, h.name`;

        // Parameters map 1-to-1 to each pair of timeline bounds
        const queryParams = [
            finalStart, finalEnd, 
            finalStart, finalEnd, 
            finalStart, finalEnd, 
            finalStart, finalEnd, 
            finalStart, finalEnd,
            finalStart, finalEnd
        ];

        const [rows] = await req.db.execute(query, queryParams);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};