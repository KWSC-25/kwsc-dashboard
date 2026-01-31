import db from '../db.js';

export const getIntelData = async (req, res) => {
  try {
    // 1. Trending Query (Last 7 Days)
    const [trending] = await db.query(`
      SELECT 
        st.title AS subtype_name,
        COUNT(c.id) AS total_count
      FROM complaint c
      JOIN sub_types st ON c.subtype_id = st.id
      WHERE c.created_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
      GROUP BY c.subtype_id, st.title
      ORDER BY total_count DESC
      LIMIT 3;
    `);

    // 2. Real-Time Logs Query
    const [logs] = await db.query(`
      (
        SELECT 'WATER' AS category, 'REGISTERED' AS action, t.town, c.created_at AS ts
        FROM complaint c 
        JOIN towns t ON c.town_id = t.id
        WHERE c.type_id = 2 
        ORDER BY c.created_at DESC LIMIT 1
      )
      UNION ALL
      (
        SELECT 'WATER' AS category, 'RESOLVED' AS action, t.town, c.updated_at AS ts
        FROM complaint c 
        JOIN towns t ON c.town_id = t.id
        WHERE c.type_id = 2 AND c.status = 1
        ORDER BY c.updated_at DESC LIMIT 1
      )
      UNION ALL
      (
        SELECT 'SEWERAGE' AS category, 'REGISTERED' AS action, t.town, c.created_at AS ts
        FROM complaint c 
        JOIN towns t ON c.town_id = t.id
        WHERE c.type_id = 1 
        ORDER BY c.created_at DESC LIMIT 1
      )
      UNION ALL
      (
        SELECT 'SEWERAGE' AS category, 'RESOLVED' AS action, t.town, c.updated_at AS ts
        FROM complaint c 
        JOIN towns t ON c.town_id = t.id
        WHERE c.type_id = 1 AND c.status = 1
        ORDER BY c.updated_at DESC LIMIT 1
      );
    `);

    // Organize logs by category
    const waterLogs = logs.filter(l => l.category === 'WATER');
    const sewerLogs = logs.filter(l => l.category === 'SEWERAGE');

    res.json({
      waterLogs, 
      sewerLogs,
      trending
    });
  } catch (error) {
    console.error("Intel Controller Error:", error);
    res.status(500).json({ error: error.message });
  }
};