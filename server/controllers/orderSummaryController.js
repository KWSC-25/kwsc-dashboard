import { hmpDb } from "../db.js";

export const getOrderSummary = async (req, res) => {
    try {
        const query = `
            SELECT 
                h.name AS hydrant_name,
                SUM(CASE WHEN o.order_type IN ('Commercial', 'Commercial Offline') THEN 1 ELSE 0 END) AS commercial,
                SUM(CASE WHEN o.order_type = 'OTS' THEN 1 ELSE 0 END) AS gps_ots,
                SUM(CASE WHEN o.order_type = 'Online (GPS)' THEN 1 ELSE 0 END) AS gps_online,
                SUM(CASE WHEN o.order_type = 'Dc quota' THEN 1 ELSE 0 END) AS dc_quota,
                SUM(CASE WHEN o.order_type = 'Gps(billing)' THEN 1 ELSE 0 END) AS gps_billing,
                SUM(CASE WHEN o.order_type = 'Gps(careoff)' THEN 1 ELSE 0 END) AS gps_careoff,
                SUM(CASE WHEN o.order_type = 'Govt. vehicle' THEN 1 ELSE 0 END) AS govt_vehicle,
                SUM(CASE WHEN o.order_type = 'P.A.F korangi creek' THEN 1 ELSE 0 END) AS paf,
                SUM(CASE WHEN o.order_type = 'Pak rangers' THEN 1 ELSE 0 END) AS pak_ranger,
                COUNT(o.id) AS total
            FROM hydrants h
            LEFT JOIN orders o ON h.id = o.hydrant_id
            INNER JOIN billings b ON o.id = b.order_id
            WHERE o.created_at >= CURDATE()
            GROUP BY h.id, h.name
            ORDER BY h.name ASC
        `;
        const [rows] = await hmpDb.execute(query);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Order Summary Fetch Failed" });
    }
};

export const getGallonSummaryReport = async (req, res) => {
    try {
        const query = `
            SELECT 
                h.name AS hydrant_name,
                SUM(CASE WHEN o.order_type IN ('Commercial', 'Commercial Offline') THEN tt.capacity ELSE 0 END) AS commercial_gallons,
                SUM(CASE WHEN o.order_type = 'OTS' THEN tt.capacity ELSE 0 END) AS gps_ots_gallons,
                SUM(CASE WHEN o.order_type = 'Online (GPS)' THEN tt.capacity ELSE 0 END) AS gps_online_gallons,
                SUM(CASE WHEN o.order_type = 'Dc quota' THEN tt.capacity ELSE 0 END) AS dc_quota_gallons,
                SUM(CASE WHEN o.order_type = 'Gps(billing)' THEN tt.capacity ELSE 0 END) AS gps_billing_gallons,
                SUM(CASE WHEN o.order_type = 'Gps(careoff)' THEN tt.capacity ELSE 0 END) AS gps_careoff_gallons,
                SUM(CASE WHEN o.order_type = 'Govt. vehicle' THEN tt.capacity ELSE 0 END) AS govt_vehicle_gallons,
                SUM(CASE WHEN o.order_type = 'P.A.F korangi creek' THEN tt.capacity ELSE 0 END) AS paf_gallons,
                SUM(CASE WHEN o.order_type = 'Pak rangers' THEN tt.capacity ELSE 0 END) AS pak_ranger_gallons
            FROM hydrants h
            LEFT JOIN orders o ON h.id = o.hydrant_id
            INNER JOIN billings b ON o.id = b.order_id
            INNER JOIN truck_types tt ON o.truck_type = tt.id
            WHERE o.created_at >= CURDATE() and b.status in (1,2)
            GROUP BY h.id, h.name
            ORDER BY h.name ASC;
        `;
        const [rows] = await hmpDb.execute(query);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};