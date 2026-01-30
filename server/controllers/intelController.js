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

    // 2. Placeholders for Water/Sewerage logs (as requested)
    res.json({
      waterLogs: [], 
      sewerLogs: [],
      trending: trending
    });
  } catch (error) {
    console.error("Intel Controller Error:", error);
    res.status(500).json({ error: error.message });
  }
};