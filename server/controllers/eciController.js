import { authDb } from '../db.js';
import fs from 'fs';
export const checkUploadPermission = async (req, res) => {
    try {
        // Extract the unique email identifier from the verified JWT payload
        const userEmail = req.user?.email; 

        if (!userEmail) {
            return res.status(400).json({ 
                success: false, 
                message: "User context verification failed: email identifier missing from session token." 
            });
        }

        // Querying the dashboard_users database using the verified email address
        const query = `
            SELECT can_upload 
            FROM dashboard_users 
            WHERE email = $1
        `;
        const result = await authDb.query(query, [userEmail]);

        if (result.rows.length === 0) {
            return res.status(444).json({ 
                success: false, 
                message: "No user account record matches the current session context." 
            });
        }

        // Return a clean true/false permission state to the client interface
        return res.json({ success: true, canUpload: !!result.rows[0].can_upload });
        
    } catch (err) {
        console.error("ECI Permission Verification Error:", err);
        return res.status(500).json({ 
            success: false, 
            message: "Internal processing loop crash while checking dashboard permissions." 
        });
    }
};

// Helper to get user ID from email context
const getUserIdByEmail = async (email) => {
    const result = await authDb.query('SELECT id FROM dashboard_users WHERE email = $1', [email]);
    return result.rows[0]?.id || null;
};

// 1. Existing checkUploadPermission stays here...

// 2. Upload Material
export const uploadMaterial = async (req, res) => {
    try {
        const userEmail = req.user?.email;
        const { subject, event_date } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: "PDF file is required." });
        }

        const userId = await getUserIdByEmail(userEmail);
        if (!userId) return res.status(404).json({ success: false, message: "User context not found." });

        const query = `
            INSERT INTO eci_materials (user_id, subject, pdf_path, event_date)
            VALUES ($1, $2, $3, $4) RETURNING *
        `;
        const result = await authDb.query(query, [userId, subject, req.file.path, event_date]);

        return res.json({ success: true, message: "Material uploaded successfully!", data: result.rows[0] });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server error during file upload allocation." });
    }
};

// 3. Get Logged-in User's Materials
export const getUserMaterials = async (req, res) => {
    try {
        const userEmail = req.user?.email;
        const userId = await getUserIdByEmail(userEmail);
        if (!userId) return res.status(404).json({ success: false, message: "User context not found." });

        const query = `
            SELECT id, subject, pdf_path, event_date, created_at 
            FROM eci_materials 
            WHERE user_id = $1 
            ORDER BY created_at DESC
        `;
        const result = await authDb.query(query, [userId]);
        return res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Failed to load materials profile index." });
    }
};

// 4. Update Material
export const updateMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const { subject, event_date } = req.body;
        const userEmail = req.user?.email;

        const userId = await getUserIdByEmail(userEmail);

        // Fetch old entry to delete old file if a new file is uploaded
        const oldEntry = await authDb.query('SELECT pdf_path FROM eci_materials WHERE id = $1 AND user_id = $2', [id, userId]);
        if (oldEntry.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Record not found or unauthorized access." });
        }

        let newPath = oldEntry.rows[0].pdf_path;
        if (req.file) {
            newPath = req.file.path;
            // Clear old file physically
            if (fs.existsSync(oldEntry.rows[0].pdf_path)) {
                fs.unlinkSync(oldEntry.rows[0].pdf_path);
            }
        }

        const updateQuery = `
            UPDATE eci_materials 
            SET subject = $1, event_date = $2, pdf_path = $3, updated_at = NOW()
            WHERE id = $4 AND user_id = $5 RETURNING *
        `;
        const result = await authDb.query(updateQuery, [subject, event_date, newPath, id, userId]);

        return res.json({ success: true, message: "Record optimized and updated!", data: result.rows[0] });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Update cycle faulted." });
    }
};

// 5. Delete Material
export const deleteMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const userEmail = req.user?.email;
        const userId = await getUserIdByEmail(userEmail);

        const target = await authDb.query('SELECT pdf_path FROM eci_materials WHERE id = $1 AND user_id = $2', [id, userId]);
        if (target.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Record not found or unauthorized access." });
        }

        // Drop physical file
        if (fs.existsSync(target.rows[0].pdf_path)) {
            fs.unlinkSync(target.rows[0].pdf_path);
        }

        await authDb.query('DELETE FROM eci_materials WHERE id = $1', [id]);
        return res.json({ success: true, message: "Material purged successfully." });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Purge process faulted." });
    }
};

// Fetch All Materials for Global/CEO Dashboard Monitoring
export const getAllMaterialsForDashboard = async (req, res) => {
    try {
        const query = `
            SELECT 
                em.id, 
                em.subject, 
                em.pdf_path, 
                em.event_date, 
                em.created_at,
                du.username AS uploader_name
            FROM eci_materials em
            INNER JOIN dashboard_users du ON em.user_id = du.id
            ORDER BY em.created_at DESC
        `;
        const result = await authDb.query(query);
        return res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error("Global ECI Dashboard retrieval loop failure:", err);
        return res.status(500).json({ 
            success: false, 
            message: "Failed to load global monitoring dashboard index parameters." 
        });
    }
};