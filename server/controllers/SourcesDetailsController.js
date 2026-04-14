export const getSourceDetails = async (req, res) => {
    try {
        const { source } = req.query;
        if (!source) return res.status(400).json({ error: "Source is required" });

        const query = `
            SELECT
                c.source,
                ct.title AS complaint_type,
                st.title AS subtype_name,
                COUNT(c.id) AS total_reg,
                SUM(c.status = 1) AS total_res,
                SUM(c.status = 2) AS total_wip,
                SUM(c.status = 0) AS total_pen
            FROM complaint c
            INNER JOIN complaint_types ct ON c.type_id = ct.id
            LEFT JOIN sub_types st ON c.subtype_id = st.id
            WHERE c.source = ?
              AND c.created_at BETWEEN '2024-10-23' AND DATE_ADD(CURDATE(), INTERVAL 1 DAY)
            GROUP BY c.source, ct.title, st.title
            ORDER BY ct.title ASC, total_reg DESC;
        `;

        const [rows] = await req.db.execute(query, [source]);

        // 1. Calculate Grand Totals for this specific source
        let grandTotals = { reg: 0, res: 0, pen: 0, wip: 0 };

        // 2. Transform flat rows into a nested structure
        const groupedData = rows.reduce((acc, row) => {
            const typeName = row.complaint_type;
            if (!acc[typeName]) {
                acc[typeName] = {
                    typeName,
                    typeTotal: 0,
                    typeRes: 0,
                    typePen: 0,
                    typeWip: 0,
                    subtypes: []
                };
            }
            
            const reg = parseInt(row.total_reg) || 0;
            const resVal = parseInt(row.total_res) || 0;
            const pen = parseInt(row.total_pen) || 0;
            const wip = parseInt(row.total_wip) || 0;

            acc[typeName].subtypes.push(row);
            acc[typeName].typeTotal += reg;
            acc[typeName].typeRes += resVal;
            acc[typeName].typePen += pen;
            acc[typeName].typeWip += wip;

            // Add to the Source-wide Grand Totals
            grandTotals.reg += reg;
            grandTotals.res += resVal;
            grandTotals.pen += pen;
            grandTotals.wip += wip;

            return acc;
        }, {});

        res.json({
            source,
            grandTotals, // These are now locked to the clicked source
            breakdown: Object.values(groupedData)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};