import { authDb } from '../db.js';

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