import { authDb } from "../db.js";
import xlsx from 'xlsx';

// Fetch all cases for the admin table and dashboard
export const getAllCases = async (req, res) => {
    try {
        const result = await authDb.query('SELECT * FROM lcms_cases ORDER BY next_date DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const importLcmsExcel = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        // ADD { cellDates: true } HERE to convert Excel numbers to JS Dates
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer', cellDates: true });
        const sheetName = workbook.SheetNames[0]; 
        const worksheet = workbook.Sheets[sheetName];
        const rawData = xlsx.utils.sheet_to_json(worksheet);

        for (const rawRow of rawData) {
            // Clean the keys as we did before
            const row = {};
            Object.keys(rawRow).forEach(key => {
                const cleanKey = key.trim().replace(/\t/g, ''); 
                row[cleanKey] = rawRow[key];
            });

            const query = `
                INSERT INTO lcms_cases 
                (court_name, case_title, next_date, advocate_name, matter_pertains, court_status, responsible_dept) 
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `;
            
            const values = [
                row['court_name'] || null,
                row['case_title'] || null,
                row['next_date'] || null, // Now this will be a valid Date object or string
                row['advocate_name'] || null,
                row['matter_pertains'] || null,
                row['court_status'] || null,
                row['responsible_dept'] || null
            ];

            await authDb.query(query, values);
        }

        res.json({ message: "Data appended successfully", count: rawData.length });
    } catch (err) {
        console.error("CRITICAL ERROR:", err);
        res.status(500).json({ error: err.message });
    }
};