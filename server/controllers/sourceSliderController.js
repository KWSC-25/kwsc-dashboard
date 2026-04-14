export const getSourceSliderData = async (req, res) => {
  try {
    const [rows] = await req.db.query(`
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
      WHERE c.source = 'COK'
        AND c.created_at BETWEEN '2024-10-23' AND DATE_ADD(CURDATE(), INTERVAL 1 DAY)
      GROUP BY c.source, c.type_id, c.subtype_id, ct.title, st.title
      ORDER BY total_reg DESC, subtype_name ASC;
    `);

    // Grouping logic: Source -> Type -> Subtypes
    const formattedData = rows.reduce((acc, row) => {
      let source = acc.find(s => s.sourceName === row.source);
      if (!source) {
        source = { sourceName: row.source, types: [] };
        acc.push(source);
      }

      let type = source.types.find(t => t.typeName === row.complaint_type);
      if (!type) {
        type = { 
          typeName: row.complaint_type, 
          reg: 0, res: 0, wip: 0, pen: 0, 
          subtypes: [] 
        };
        source.types.push(type);
      }

      type.reg += parseInt(row.total_reg);
      type.res += parseInt(row.total_res);
      type.wip += parseInt(row.total_wip);
      type.pen += parseInt(row.total_pen);

      if (row.subtype_name) {
        type.subtypes.push({
          name: row.subtype_name,
          reg: row.total_reg,
          res: row.total_res,
          pen: row.total_pen,
          wip: row.total_wip
        });
      }
      return acc;
    }, []);

    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};