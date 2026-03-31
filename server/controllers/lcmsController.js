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

        // Read workbook - we keep cellDates: false to handle it as a string
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0]; 
        const worksheet = workbook.Sheets[sheetName];

        // Force the library to give us a formatted string
        const rawData = xlsx.utils.sheet_to_json(worksheet, { 
            raw: false, 
            dateNF: 'yyyy-mm-dd' 
        });

        for (const rawRow of rawData) {
            const row = {};
            Object.keys(rawRow).forEach(key => {
                const cleanKey = key.trim().replace(/\t/g, ''); 
                row[cleanKey] = rawRow[key];
            });

            // --- DATE FORMATTING LOGIC ---
            let rawDate = row['next_date']; 
            let formattedForDb = null;

            if (rawDate) {
                // If date arrives as DD.MM.YYYY or DD-MM-YYYY or DD/MM/YYYY
                // We split it and reorganize to YYYY-MM-DD (Postgres Global Standard)
                const parts = rawDate.split(/[./-]/); 
                
                if (parts.length === 3) {
                    // Check if the first part is the Day (typical for your Excel)
                    if (parts[0].length <= 2 && parts[2].length === 4) {
                        const day = parts[0].padStart(2, '0');
                        const month = parts[1].padStart(2, '0');
                        const year = parts[2];
                        formattedForDb = `${year}-${month}-${day}`;
                    } else {
                        // If it's already YYYY-MM-DD, use it as is
                        formattedForDb = rawDate;
                    }
                } else {
                    formattedForDb = rawDate;
                }
            }
            // ------------------------------

            const query = `
                INSERT INTO lcms_cases 
                (court_name, case_title, next_date, advocate_name, matter_pertains, court_status, responsible_dept) 
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `;

            const values = [
                row['court_name'] || null,
                row['case_title'] || null,
                formattedForDb, // Now safely in YYYY-MM-DD format
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