export const getDashboardCases = async (req, res) => {
    try {
        // Query to get cases ordered by next_date (upcoming first)
        // Cases with dates today or in the future come first, followed by past cases
        const query = `
            SELECT * FROM lcms_cases 
            ORDER BY 
                CASE WHEN next_date >= CURRENT_DATE THEN 0 ELSE 1 END,
                next_date ASC,
                id DESC
        `;
        const result = await req.db.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("Dashboard Fetch Error:", err);
        res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
};