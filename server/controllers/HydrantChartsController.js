
export const getPendingAgingDonutData = async (req, res) => {
    try {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        // 1. Handle Dynamic Date Formatting & Filters securely from query strings
        const { startDate, endDate } = req.query;
        
        // FIX: If mode is "TODAY" (blank values), default strictly to today's date boundaries instead of Feb 1st
        const finalStart = startDate && startDate !== '' 
            ? (startDate.includes(':') ? startDate : `${startDate} 00:00:00`) 
            : `${todayStr} 00:00:00`;

        const finalEnd = endDate && endDate !== '' 
            ? (endDate.includes(':') ? endDate : `${endDate} 23:59:59`) 
            : `${todayStr} 23:59:59`;

        // 2. Main Analytics Query
        // FIX: Replaced NOW() with the query bind parameter ? so aging is evaluated relative to the filtered snapshot point
        const agingQuery = `
        SELECT
            (hmp.hmp_total_open + ots.ots_total_open) AS total_pending,
            
            -- Keep exact count matrices for presentation metrics
            (hmp.hmp_under_24h + ots.ots_under_24h) AS pending_under_24h_count,
            (hmp.hmp_24h_48h + ots.ots_24h_48h) AS pending_24h_48h_count,
            (hmp.hmp_48h_72h + ots.ots_48h_72h) AS pending_48h_72h_count,
            (hmp.hmp_above_72h + ots.ots_above_72h) AS pending_above_72h_count,

            -- Percentage Matrix calculations via clean validation blocks
            IF((hmp.hmp_total_open + ots.ots_total_open) > 0, 
                ROUND(((hmp.hmp_under_24h + ots.ots_under_24h) / (hmp.hmp_total_open + ots.ots_total_open)) * 100, 2), 0.00
            ) AS pending_under_24h_percentage,
            IF((hmp.hmp_total_open + ots.ots_total_open) > 0, 
                ROUND(((hmp.hmp_24h_48h + ots.ots_24h_48h) / (hmp.hmp_total_open + ots.ots_total_open)) * 100, 2), 0.00
            ) AS pending_24h_48h_percentage,
            IF((hmp.hmp_total_open + ots.ots_total_open) > 0, 
                ROUND(((hmp.hmp_48h_72h + ots.ots_48h_72h) / (hmp.hmp_total_open + ots.ots_total_open)) * 100, 2), 0.00
            ) AS pending_48h_72h_percentage,
            IF((hmp.hmp_total_open + ots.ots_total_open) > 0, 
                ROUND(((hmp.hmp_above_72h + ots.ots_above_72h) / (hmp.hmp_total_open + ots.ots_total_open)) * 100, 2), 0.00
            ) AS pending_above_72h_percentage
        FROM (
            SELECT 
                COUNT(CASE WHEN b.latest_status IN (0, 2) AND TIMESTAMPDIFF(HOUR, o.created_at, ?) < 24 THEN 1 END) AS hmp_under_24h,
                COUNT(CASE WHEN b.latest_status IN (0, 2) AND TIMESTAMPDIFF(HOUR, o.created_at, ?) >= 24 AND TIMESTAMPDIFF(HOUR, o.created_at, ?) < 48 THEN 1 END) AS hmp_24h_48h,
                COUNT(CASE WHEN b.latest_status IN (0, 2) AND TIMESTAMPDIFF(HOUR, o.created_at, ?) >= 48 AND TIMESTAMPDIFF(HOUR, o.created_at, ?) < 72 THEN 1 END) AS hmp_48h_72h,
                COUNT(CASE WHEN b.latest_status IN (0, 2) AND TIMESTAMPDIFF(HOUR, o.created_at, ?) >= 72 THEN 1 END) AS hmp_above_72h,
                COUNT(CASE WHEN b.latest_status IN (0, 2) THEN 1 END) AS hmp_total_open
            FROM orders o
            LEFT JOIN (
                SELECT 
                    tbl_b.order_id, 
                    tbl_b.status AS latest_status
                FROM billings tbl_b
                INNER JOIN (
                    SELECT MAX(id) AS max_id 
                    FROM billings 
                    GROUP BY order_id
                ) latest ON tbl_b.id = latest.max_id
            ) b ON o.id = b.order_id
            WHERE o.order_type != 'OTS' 
              AND o.created_at BETWEEN ? AND ?
        ) hmp,
        (
            SELECT 
                COUNT(CASE WHEN status IN ('pending', 'pending_alignment', 'dispatched') AND TIMESTAMPDIFF(HOUR, api_created_at, ?) < 24 THEN 1 END) AS ots_under_24h,
                COUNT(CASE WHEN status IN ('pending', 'pending_alignment', 'dispatched') AND TIMESTAMPDIFF(HOUR, api_created_at, ?) >= 24 AND TIMESTAMPDIFF(HOUR, api_created_at, ?) < 48 THEN 1 END) AS ots_24h_48h,
                COUNT(CASE WHEN status IN ('pending', 'pending_alignment', 'dispatched') AND TIMESTAMPDIFF(HOUR, api_created_at, ?) >= 48 AND TIMESTAMPDIFF(HOUR, api_created_at, ?) < 72 THEN 1 END) AS ots_48h_72h,
                COUNT(CASE WHEN status IN ('pending', 'pending_alignment', 'dispatched') AND TIMESTAMPDIFF(HOUR, api_created_at, ?) >= 72 THEN 1 END) AS ots_above_72h,
                COUNT(CASE WHEN status IN ('pending', 'pending_alignment', 'dispatched') THEN 1 END) AS ots_total_open
            FROM ots_order
            WHERE api_created_at BETWEEN ? AND ?
        ) ots;`;

        // Map parameter arguments exactly to the sequence order of the placeholders (?) above
        const queryParams = [
            // Subquery A (HMP) Aging References
            finalEnd, 
            finalEnd, finalEnd, 
            finalEnd, finalEnd, 
            finalEnd,
            // Subquery A Base Constraints
            finalStart, finalEnd,

            // Subquery B (OTS) Aging References
            finalEnd, 
            finalEnd, finalEnd, 
            finalEnd, finalEnd, 
            finalEnd,
            // Subquery B Base Constraints
            finalStart, finalEnd
        ];

        const [rows] = await req.db.execute(agingQuery, queryParams);
        const resultData = rows[0] || {};

        res.status(200).json({
            success: true,
            meta: { rangeStart: finalStart, rangeEnd: finalEnd },
            data: {
                totalPending: Number(resultData.total_pending || 0),
                breakdown: [
                    {
                        range: "< 24 Hours",
                        total_pending_count: Number(resultData.pending_under_24h_count || 0),
                        percentage: Number(resultData.pending_under_24h_percentage || 0)
                    },
                    {
                        range: "24 Hours - 48 Hours",
                        total_pending_count: Number(resultData.pending_24h_48h_count || 0),
                        percentage: Number(resultData.pending_24h_48h_percentage || 0)
                    },
                    {
                        range: "48 Hours - 72 Hours",
                        total_pending_count: Number(resultData.pending_48h_72h_count || 0),
                        percentage: Number(resultData.pending_48h_72h_percentage || 0)
                    },
                    {
                        range: "> 72 Hours",
                        total_pending_count: Number(resultData.pending_above_72h_count || 0),
                        percentage: Number(resultData.pending_above_72h_percentage || 0)
                    }
                ]
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to generate donut chart metrics tracking.", error: error.message });
    }
};

export const getTatLineChartData = async (req, res) => {
    try {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        // 1. Handle Dynamic Date Filters cleanly from incoming query
        const { startDate, endDate } = req.query;
        
        // FIX: Fixed fallback constraints identical to the logic above to isolate TODAY metrics correctly
        const finalStart = startDate && startDate !== '' ? `${startDate.split(' ')[0]} 00:00:00` : '2026-02-01 00:00:00';
        const finalEnd = endDate && endDate !== '' ? `${endDate.split(' ')[0]} 23:59:59` : `${todayStr} 23:59:59`;

        // 2. Programmatically Generate 15-Day Milestone Intervals in Node.js
        const start = new Date(finalStart.split(' ')[0]);
        const end = new Date(finalEnd.split(' ')[0]);
        const milestones = [];
        
        let current = new Date(start);
        while (current < end) {
            milestones.push(current.toISOString().split('T')[0]);
            current.setDate(current.getDate() + 15);
        }
        
        const lastDateStr = end.toISOString().split('T')[0];
        if (!milestones.includes(lastDateStr)) {
            milestones.push(lastDateStr);
        }

        if (milestones.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        // 3. Construct a Dynamic Union Query for each Milestone Block
        const queryBlocks = milestones.map(() => `
            SELECT 
                ? AS milestone_date,
                (COALESCE(hmp.hmp_completed_count, 0) + COALESCE(ots.ots_completed_count, 0)) AS combined_total_completed,
                COALESCE(hmp.hmp_total_seconds, 0) AS hmp_total_seconds,
                COALESCE(ots.ots_total_seconds, 0) AS ots_total_seconds
            FROM (
                SELECT 
                    COUNT(CASE WHEN b.latest_status = 1 THEN 1 END) AS hmp_completed_count,
                    SUM(CASE WHEN b.latest_status = 1 THEN TIMESTAMPDIFF(SECOND, o.created_at, b.latest_updated) END) AS hmp_total_seconds
                FROM orders o
                INNER JOIN (
                    SELECT tbl_b.order_id, tbl_b.status AS latest_status, tbl_b.updated_at AS latest_updated
                    FROM billings tbl_b
                    INNER JOIN (
                        SELECT MAX(id) AS max_id FROM billings GROUP BY order_id
                    ) latest ON tbl_b.id = latest.max_id
                ) b ON o.id = b.order_id
                WHERE o.order_type != 'OTS'
                  AND o.created_at BETWEEN ? AND CONCAT(?, ' 23:59:59')
            ) hmp,
            (
                SELECT 
                    COUNT(CASE WHEN status IN ('completed', 'self_closed') THEN 1 END) AS ots_completed_count,
                    SUM(CASE WHEN status IN ('completed', 'self_closed') THEN TIMESTAMPDIFF(SECOND, api_created_at, api_updated_at) END) AS ots_total_seconds
                FROM ots_order
                WHERE api_created_at BETWEEN ? AND CONCAT(?, ' 23:59:59')
            ) ots
        `);

        const lineChartQuery = queryBlocks.join(' UNION ALL ') + ' ORDER BY milestone_date ASC;';

        // 4. Flatten Parameters Array Matrix to align dynamically with query architecture
        const queryParams = [];
        milestones.forEach(dateStr => {
            queryParams.push(
                dateStr,
                finalStart, dateStr,
                finalStart, dateStr
            );
        });

        const [rows] = await req.db.execute(lineChartQuery, queryParams);

        // 5. Convert TAT Seconds into Hours for Frontend Chart Readability
        const formattedChartData = rows.map(row => {
            const denom = Number(row.combined_total_completed || 0);
            return {
                date: row.milestone_date,
                combinedTotalCompleted: denom,
                hmpAvgTatHours: denom > 0 ? Number((Number(row.hmp_total_seconds) / 3600 / denom).toFixed(2)) : 0,
                otsAvgTatHours: denom > 0 ? Number((Number(row.ots_total_seconds) / 3600 / denom).toFixed(2)) : 0
            };
        });

        res.status(200).json({
            success: true,
            meta: { rangeStart: finalStart, rangeEnd: finalEnd, intervalsCalculated: milestones.length },
            data: formattedChartData
        });

    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to generate dynamic interval TAT chart performance metrics.", error: error.message });
    }
};