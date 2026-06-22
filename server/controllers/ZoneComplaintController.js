export const getZoneKpiStats = async (req, res) => {
  try {
    const { typeId, startDate, endDate } = req.query;

    // Base query filters for range checking
    let queryParams = [];
    let baseWhereClause = ` WHERE 1=1 `;

    if (startDate && endDate) {
      baseWhereClause += ` AND created_at BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY) `;
      queryParams.push(startDate, endDate);
    } else {
      baseWhereClause += ` AND created_at BETWEEN '2024-10-23' AND DATE_ADD(CURDATE(), INTERVAL 1 DAY) `;
    }

    // Dynamic filtering extension condition
    let typeFilterCondition = "";
    if (typeId && typeId !== 'ALL') {
      typeFilterCondition = ` AND type_id = ? `;
      // Duplicate entry insertion sequence for dual subquery executions below
    }

    // 1. CORE PERFORMANCE CARD METRICS
    const mainKpisQuery = `
      SELECT
        COUNT(*) AS total_registered,
        SUM(status = 1) AS total_resolved,
        SUM(status = 2) AS total_wip,
        SUM(status = 0) AS total_pending,
        SUM(status = 1 AND DATE(updated_at) <= DATE_SUB(CURDATE(), INTERVAL 1 DAY)) AS total_resolved_yesterday,
        SUM(status = 0 AND DATE(created_at) <= DATE_SUB(CURDATE(), INTERVAL 1 DAY)) AS total_pending_yesterday
      FROM complaint
      ${baseWhereClause}
      ${typeFilterCondition}
    `;

    // 2. BACKLOG AGENT DISPATCH AND ASSIGNMENT TELEMETRY
    const assignmentStatsQuery = `
      SELECT
        SUM(is_assigned = 1) AS total_assigned,
        SUM(is_assigned = 0) AS total_unassigned,
        SUM(is_assigned = 1 AND status = 0) AS pending_assigned,
        SUM(is_assigned = 0 AND status = 0) AS pending_unassigned
      FROM (
        SELECT c.id, c.status,
          (all_assignments.complaint_id IS NOT NULL) AS is_assigned
        FROM complaint c
        LEFT JOIN (
          SELECT complaint_id FROM complaint_assign_agent
          UNION
          SELECT complaint_id FROM complaint_assign_department
        ) AS all_assignments ON c.id = all_assignments.complaint_id
        ${baseWhereClause}
        ${typeFilterCondition}
      ) AS assignment_status
    `;

    // 3. TODAY ROLLING VELOCITY METRICS
    const todayStatsQuery = `
      SELECT 
        SUM(DATE(created_at) = CURDATE()) AS total_registered_today,
        SUM(status = 1 AND DATE(updated_at) = CURDATE()) AS total_resolved_today
      FROM complaint
      WHERE 1=1
      ${typeId && typeId !== 'ALL' ? ` AND type_id = ? ` : ''}
    `;

    // Handle parameter grouping for execution safely
    let mainParams = [...queryParams];
    if (typeId && typeId !== 'ALL') mainParams.push(typeId);

    let assignParams = [...queryParams];
    if (typeId && typeId !== 'ALL') assignParams.push(typeId);

    let todayParams = [];
    if (typeId && typeId !== 'ALL') todayParams.push(typeId);

    // Concurrent multi-node query executions
    const [[mainRows]] = await req.db.query(mainKpisQuery, mainParams);
    const [[assignRows]] = await req.db.query(assignmentStatsQuery, assignParams);
    const [[todayRows]] = await req.db.query(todayStatsQuery, todayParams);

    res.json({
      mainKpis: mainRows,
      assignmentStats: assignRows,
      todaystats: todayRows
    });

  } catch (error) {
    console.error("Zone KPI Controller Exception:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getActiveComplaintTypes = async (req, res) => {
  try {
    // Queries unique types actively utilized or defined in the underlying registry tables
    const [rows] = await req.db.query(`
      SELECT DISTINCT id, title 
      FROM complaint_types 
      ORDER BY title ASC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getZoneWisePendingMatrix = async (req, res) => {
  try {
    const { typeId, startDate, endDate, zoneId } = req.query;

    // A check to handle initial placeholder loading states gracefully
    const targetTypeId = (typeId && typeId !== 'ALL') ? Number(typeId) : 1; 

    // 1. Build cleaner date boundary clauses without embedding the 'WHERE' keyword directly
    let dateFilterSql = "";
    let queryParams = [];

    if (startDate && endDate) {
      dateFilterSql = " AND c.created_at BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY) ";
      queryParams.push(startDate, endDate);
    } else {
      dateFilterSql = " AND c.created_at BETWEEN '2024-10-23' AND DATE_ADD(CURDATE(), INTERVAL 1 DAY) ";
    }

    // Step 1: Query database for subtypes belonging to our target type identifier
    const subtypeQuery = `
      SELECT id, title 
      FROM sub_types 
      WHERE type_id = ?
      ORDER BY title ASC
    `;
    const [subtypes] = await req.db.query(subtypeQuery, [targetTypeId]);

    if (subtypes.length === 0) {
      return res.status(200).json({
        success: true,
        columns: [],
        data: []
      });
    }

    // Step 2: Build out the pivot sum matrices programmatically
    let pivotColumnsSql = '';
    subtypes.forEach(sub => {
      const dynamicKey = `subtype_${sub.id}`;
      // status = 0 is Pending
      pivotColumnsSql += `SUM(CASE WHEN c.subtype_id = ${sub.id} AND c.status = 0 THEN 1 ELSE 0 END) AS \`${dynamicKey}\`,\n`;
    });

    let mainMatrixQuery = "";
    let executionParams = [];

    // Step 3: Conditional matrix generation depending on whether a drill-down Zone ID is active
    if (zoneId) {
      // DRILL DOWN VIEW: Fetch individual Towns for a specific Selected Zone
      mainMatrixQuery = `
        SELECT 
          t.id AS zone_id, -- Mapped to zone_id placeholder to preserve frontend layout structure
          t.town AS zone_name, -- Mapped to zone_name placeholder to preserve frontend layout structure
          ${pivotColumnsSql}
          SUM(CASE WHEN c.status = 0 THEN 1 ELSE 0 END) AS total_zone_pending,
          -- Calculates the overall average aging in hours for all pending complaints in this town
          IFNULL(ROUND(AVG(CASE WHEN c.status = 0 THEN TIMESTAMPDIFF(HOUR, c.created_at, NOW()) END), 1), 0) AS avg_pending_aging
        FROM towns t
        INNER JOIN zone_towns zt ON t.id = zt.town_id
        LEFT JOIN complaint c ON t.id = c.town_id 
          AND c.type_id = ? 
          ${dateFilterSql}
        WHERE zt.zone_id = ?
        GROUP BY t.id, t.town
        ORDER BY t.town ASC;
      `;
      executionParams = [targetTypeId, ...queryParams, Number(zoneId)];
    } else {
      // GLOBAL VIEW: Fetch aggregated data grouped by Zones
      mainMatrixQuery = `
        SELECT 
          z.id AS zone_id,
          z.title AS zone_name,
          ${pivotColumnsSql}
          SUM(CASE WHEN c.status = 0 THEN 1 ELSE 0 END) AS total_zone_pending,
          -- Calculates the overall average aging in hours for all pending complaints in this zone
          IFNULL(ROUND(AVG(CASE WHEN c.status = 0 THEN TIMESTAMPDIFF(HOUR, c.created_at, NOW()) END), 1), 0) AS avg_pending_aging
        FROM zones z
        LEFT JOIN zone_towns zt ON z.id = zt.zone_id
        LEFT JOIN complaint c ON zt.town_id = c.town_id 
          AND c.type_id = ? 
          ${dateFilterSql}
        WHERE z.status = 1
        GROUP BY z.id, z.title
        ORDER BY z.title ASC;
      `;
      executionParams = [targetTypeId, ...queryParams];
    }

    const [matrixRows] = await req.db.query(mainMatrixQuery, executionParams);

    res.status(200).json({
      success: true,
      columns: subtypes.map(sub => ({
        key: `subtype_${sub.id}`,
        label: sub.title.toUpperCase()
      })),
      data: matrixRows
    });

  } catch (error) {
    console.error("Zone-Wise Analytics Dynamic Pivot Matrix Failure:", error);
    res.status(500).json({ error: error.message });
  }
};


export const getZoneWiseResolvedMatrix = async (req, res) => {
  try {
    const { typeId, startDate, endDate, zoneId } = req.query;

    // A check to handle initial placeholder loading states gracefully
    const targetTypeId = (typeId && typeId !== 'ALL') ? Number(typeId) : 1; 

    // 1. Build cleaner date boundary clauses without embedding the 'WHERE' keyword directly
    let dateFilterSql = "";
    let queryParams = [];

    if (startDate && endDate) {
      dateFilterSql = " AND c.created_at BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY) ";
      queryParams.push(startDate, endDate);
    } else {
      dateFilterSql = " AND c.created_at BETWEEN '2024-10-23' AND DATE_ADD(CURDATE(), INTERVAL 1 DAY) ";
    }

    // Step 1: Query database for subtypes belonging to our target type identifier
    const subtypeQuery = `
      SELECT id, title 
      FROM sub_types 
      WHERE type_id = ?
      ORDER BY title ASC
    `;
    const [subtypes] = await req.db.query(subtypeQuery, [targetTypeId]);

    if (subtypes.length === 0) {
      return res.status(200).json({
        success: true,
        columns: [],
        data: []
      });
    }

    // Step 2: Build out the pivot sum matrices programmatically for Resolved cases (status = 1)
    let pivotColumnsSql = '';
    subtypes.forEach(sub => {
      const dynamicKey = `subtype_${sub.id}`;
      pivotColumnsSql += `SUM(CASE WHEN c.subtype_id = ${sub.id} AND c.status = 1 THEN 1 ELSE 0 END) AS \`${dynamicKey}\`,\n`;
    });

    let mainMatrixQuery = "";
    let executionParams = [];

    // Step 3: Conditional matrix generation depending on whether a drill-down Zone ID is active
    if (zoneId) {
      // DRILL DOWN VIEW: Fetch individual Towns for a specific Selected Zone
      mainMatrixQuery = `
        SELECT 
          t.id AS zone_id, 
          t.town AS zone_name, 
          ${pivotColumnsSql}
          SUM(CASE WHEN c.status = 1 THEN 1 ELSE 0 END) AS total_zone_resolved,
          -- Calculates the overall average resolution TAT in hours for all resolved complaints in this town
          IFNULL(ROUND(AVG(CASE WHEN c.status = 1 THEN TIMESTAMPDIFF(HOUR, c.created_at, c.updated_at) END), 1), 0) AS avg_resolution_tat
        FROM towns t
        INNER JOIN zone_towns zt ON t.id = zt.town_id
        LEFT JOIN complaint c ON t.id = c.town_id 
          AND c.type_id = ? 
          ${dateFilterSql}
        WHERE zt.zone_id = ?
        GROUP BY t.id, t.town
        ORDER BY t.town ASC;
      `;
      executionParams = [targetTypeId, ...queryParams, Number(zoneId)];
    } else {
      // GLOBAL VIEW: Fetch aggregated data grouped by Zones
      mainMatrixQuery = `
        SELECT 
          z.id AS zone_id,
          z.title AS zone_name,
          ${pivotColumnsSql}
          SUM(CASE WHEN c.status = 1 THEN 1 ELSE 0 END) AS total_zone_resolved,
          -- Calculates the overall average resolution TAT in hours for all resolved complaints in this zone
          IFNULL(ROUND(AVG(CASE WHEN c.status = 1 THEN TIMESTAMPDIFF(HOUR, c.created_at, c.updated_at) END), 1), 0) AS avg_resolution_tat
        FROM zones z
        LEFT JOIN zone_towns zt ON z.id = zt.zone_id
        LEFT JOIN complaint c ON zt.town_id = c.town_id 
          AND c.type_id = ? 
          ${dateFilterSql}
        WHERE z.status = 1
        GROUP BY z.id, z.title
        ORDER BY z.title ASC;
      `;
      executionParams = [targetTypeId, ...queryParams];
    }

    const [matrixRows] = await req.db.query(mainMatrixQuery, executionParams);

    res.status(200).json({
      success: true,
      columns: subtypes.map(sub => ({
        key: `subtype_${sub.id}`,
        label: sub.title.toUpperCase()
      })),
      data: matrixRows
    });

  } catch (error) {
    console.error("Zone-Wise Resolved Analytics Dynamic Pivot Matrix Failure:", error);
    res.status(500).json({ error: error.message });
  }
};

// Controller function to fetch complaint map distribution data & dynamic subtypes
export const getMapComplaintDistribution = async (req, res) => {
  try {
    const { typeId, startDate, endDate, subtypeId } = req.query;

    // 1. Fetch available Subtypes based on Global Category Type Filter
    let subtypesQuery = `SELECT id, title FROM sub_types ORDER BY title ASC`;
    let subtypesParams = [];

    if (typeId && typeId !== 'ALL') {
      subtypesQuery = `SELECT id, title FROM sub_types WHERE type_id = ? ORDER BY title ASC`;
      subtypesParams.push(Number(typeId));
    }
    const [subtypes] = await req.db.query(subtypesQuery, subtypesParams);

    // 2. Build Dynamic Conditions for Left Join Aggregate
    let queryParams = [];
    let joinConditions = ` ON st.id = c.sub_town_id AND c.status IN (0, 1, 2) `; 

    if (typeId && typeId !== 'ALL') {
      joinConditions += ` AND c.type_id = ? `;
      queryParams.push(Number(typeId));
    }
    if (subtypeId && subtypeId !== 'ALL') {
      joinConditions += ` AND c.subtype_id = ? `;
      queryParams.push(Number(subtypeId));
    }
    if (startDate && endDate) {
      joinConditions += ` AND c.created_at BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY) `;
      queryParams.push(startDate, endDate);
    } else {
      joinConditions += ` AND c.created_at BETWEEN '2024-10-23 00:00:00' AND DATE_ADD(CURDATE(), INTERVAL 1 DAY) `;
    }

    // 3. Fetch ALL UCs mapping them alongside their parent town cleanly
    const globalUcQuery = `
      SELECT 
        t.town AS town_name,
        st.title AS name,
        COUNT(c.id) AS total_complaints
      FROM subtown st
      INNER JOIN towns t ON st.town_id = t.id
      LEFT JOIN complaint c ${joinConditions}
      GROUP BY t.town, st.title
      ORDER BY t.town ASC, st.title ASC
    `;

    const [mapDataRows] = await req.db.query(globalUcQuery, queryParams);

    res.status(200).json({
      success: true,
      subtypes: subtypes,
      mapData: mapDataRows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};