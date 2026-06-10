
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

const formatDaysToDHMs = (fractionalDays) => {
    if (!fractionalDays || fractionalDays === 0) return "0m";

    // 1440 minutes total in a full 24-hour day loop
    const totalMinutes = Math.round(fractionalDays * 1440); 
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    const output = [];
    if (days > 0) output.push(`${days}d`);
    if (hours > 0) output.push(`${hours}h`);
    if (minutes > 0) output.push(`${minutes}m`);

    return output.join(' ');
};

export const getTatLineChartData = async (req, res) => {
    try {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        // 1. Handle Dynamic Date Filters cleanly from incoming query
        const { startDate, endDate } = req.query;
        
        // Retaining your explicit validation layout
        const finalStart = startDate && startDate !== '' ? `${startDate.split(' ')[0]} 00:00:00` : '2026-02-01 00:00:00';
        const finalEnd = endDate && endDate !== '' ? `${endDate.split(' ')[0]} 23:59:59` : `${todayStr} 23:59:59`;

        // 2. Programmatically Generate Checkpoints Spaced 15 Days Apart
        const startLimit = new Date(finalStart.split(' ')[0]);
        const endLimit = new Date(finalEnd.split(' ')[0]);
        
        const intervals = [];
        let currentStart = new Date(startLimit);

        while (currentStart < endLimit) {
            const currentDayStr = currentStart.toISOString().split('T')[0];

            // Notice: queryStart now maps strictly to finalStart to achieve the cumulative client requirement
            intervals.push({
                displayDate: currentDayStr, 
                queryStart: finalStart,
                queryEnd: `${currentDayStr} 23:59:59`
            });

            // Advance cursor to the next milestone date precisely 15 days later
            currentStart.setDate(currentStart.getDate() + 15);
        }

        // Snap constraint edge case check to ensure today's current date is always included
        const lastInterval = intervals[intervals.length - 1];
        const strictMaxEndStr = endLimit.toISOString().split('T')[0];
        if (lastInterval && lastInterval.displayDate !== strictMaxEndStr) {
            intervals.push({
                displayDate: strictMaxEndStr,
                queryStart: finalStart,
                queryEnd: `${strictMaxEndStr} 23:59:59`
            });
        }

        if (intervals.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        // 3. Construct a Dynamic Union Query for each Isolated Interval Block
        const queryBlocks = intervals.map(() => `
            SELECT 
                ? AS milestone_date,
                (COALESCE(hmp.hmp_completed_count, 0) + COALESCE(ots.ots_completed_count, 0)) AS combined_total_completed,
                COALESCE(hmp.hmp_total_seconds, 0) AS hmp_total_seconds,
                COALESCE(ots.ots_total_seconds, 0) AS ots_total_seconds,
                COALESCE(hmp.hmp_completed_count, 0) AS hmp_count,
                COALESCE(ots.ots_completed_count, 0) AS ots_count
            FROM (
                -- HMP: Created AND Completed within the expanding milestone range window
                SELECT 
                    COUNT(CASE WHEN b.latest_status = 1 AND b.latest_updated BETWEEN ? AND ? THEN 1 END) AS hmp_completed_count,
                    SUM(CASE WHEN b.latest_status = 1 AND b.latest_updated BETWEEN ? AND ? THEN TIMESTAMPDIFF(SECOND, o.created_at, b.latest_updated) END) AS hmp_total_seconds
                FROM orders o
                INNER JOIN (
                    SELECT tbl_b.order_id, tbl_b.status AS latest_status, tbl_b.updated_at AS latest_updated
                    FROM billings tbl_b
                    INNER JOIN (
                        SELECT MAX(id) AS max_id FROM billings GROUP BY order_id
                    ) latest ON tbl_b.id = latest.max_id
                ) b ON o.id = b.order_id
                WHERE o.order_type != 'OTS'
                  AND o.created_at BETWEEN ? AND ?
            ) hmp,
            (
                -- OTS: Arrived AND Closed within the expanding milestone range window
                SELECT 
                    COUNT(CASE WHEN status IN ('completed', 'self_closed') AND api_updated_at BETWEEN ? AND ? THEN 1 END) AS ots_completed_count,
                    SUM(CASE WHEN status IN ('completed', 'self_closed') AND api_updated_at BETWEEN ? AND ? THEN TIMESTAMPDIFF(SECOND, api_created_at, api_updated_at) END) AS ots_total_seconds
                FROM ots_order
                WHERE api_created_at BETWEEN ? AND ?
            ) ots
        `);

        const lineChartQuery = queryBlocks.join(' UNION ALL ') + ' ORDER BY milestone_date ASC;';

        // 4. Flatten Parameters Array Matrix to align dynamically with isolated date intervals
        const queryParams = [];
        intervals.forEach(block => {
            queryParams.push(
                block.displayDate,
                // HMP subquery bindings (6 occurrences - tracking from filter start to current milestone cursor)
                block.queryStart, block.queryEnd, // b.latest_updated bounds (COUNT)
                block.queryStart, block.queryEnd, // b.latest_updated bounds (SUM)
                block.queryStart, block.queryEnd, // o.created_at bounds
                // OTS subquery bindings (6 occurrences - tracking from filter start to current milestone cursor)
                block.queryStart, block.queryEnd, // api_updated_at bounds (COUNT)
                block.queryStart, block.queryEnd, // api_updated_at bounds (SUM)
                block.queryStart, block.queryEnd  // api_created_at bounds
            );
        });

        const [rows] = await req.db.execute(lineChartQuery, queryParams);

        // 5. Convert TAT Seconds into FRACTIONAL DAYS while retaining your frontend property keys
        const formattedChartData = rows.map(row => {
            const hmpDenom = Number(row.hmp_count || 0);
            const otsDenom = Number(row.ots_count || 0);
            
            return {
                date: row.milestone_date,
                combinedTotalCompleted: Number(row.combined_total_completed || 0),
                // Scaled back to 86400 (Days) as required for the cumulative timeline view
                hmpAvgTatHours: hmpDenom > 0 ? Number((Number(row.hmp_total_seconds) / 86400 / hmpDenom).toFixed(4)) : 0,
                otsAvgTatHours: otsDenom > 0 ? Number((Number(row.ots_total_seconds) / 86400 / otsDenom).toFixed(4)) : 0
            };
        });

        res.status(200).json({
            success: true,
            meta: { 
                rangeStart: finalStart, 
                rangeEnd: finalEnd, 
                intervalsCalculated: intervals.length 
            },
            data: formattedChartData
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Failed to generate dynamic interval TAT chart performance metrics.", 
            error: error.message 
        });
    }
};