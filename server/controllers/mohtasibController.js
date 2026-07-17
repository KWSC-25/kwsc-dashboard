import { authDb } from '../db.js';

// Helper to get user ID from email context
const getUserIdByEmail = async (email) => {
    const result = await authDb.query('SELECT id FROM dashboard_users WHERE email = $1', [email]);
    return result.rows[0]?.id || null;
};

// 1. Verify if user can edit/input Mohtasib form records
export const checkMohtasibPermission = async (req, res) => {
    try {
        const userEmail = req.user?.email; 

        if (!userEmail) {
            return res.status(400).json({ 
                success: false, 
                message: "User context verification failed: email missing from session token." 
            });
        }

        const query = `
            SELECT can_manage_mohtasib 
            FROM dashboard_users 
            WHERE email = $1
        `;
        const result = await authDb.query(query, [userEmail]);

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "No user account record matches the current session context." 
            });
        }

        return res.json({ success: true, canManage: !!result.rows[0].can_manage_mohtasib });
        
    } catch (err) {
        console.error("Mohtasib Permission Verification Error:", err);
        return res.status(500).json({ 
            success: false, 
            message: "Internal processing crash while checking Mohtasib permissions." 
        });
    }
};

// 2. Insert new Mohtasib Record
export const createMohtasibRecord = async (req, res) => { 
    try {
        const userEmail = req.user?.email;
        const { 
            letter_directed_to, 
            letter_from, 
            reference_no, 
            event_date, 
            appearance_date,
            appearance_time,
            secretariat,
            subject, 
            action_required, 
            assigned_to, 
            letter_stage, 
            status 
        } = req.body;

        const userId = await getUserIdByEmail(userEmail);
        if (!userId) {
            return res.status(404).json({ success: false, message: "User context not found." });
        }

        const query = `
            INSERT INTO mohtasib_info (
                user_id, letter_directed_to, letter_from, reference_no, 
                event_date, appearance_date, appearance_time, secretariat, subject, action_required, 
                assigned_to, letter_stage, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
            RETURNING *
        `;
        const result = await authDb.query(query, [
            userId, letter_directed_to, letter_from, reference_no, 
            event_date, appearance_date || null, appearance_time || null, secretariat, subject, action_required, 
            assigned_to, letter_stage, status
        ]);

        return res.json({ success: true, message: "Mohtasib record saved successfully!", data: result.rows[0] });
    } catch (err) {
        console.error("Mohtasib Insertion Failure:", err);
        return res.status(500).json({ success: false, message: "Server error during Mohtasib record initialization." });
    }
};

// 3. Get Logged-in User's added Mohtasib records
export const getUserMohtasibRecords = async (req, res) => {
    try {
        const userEmail = req.user?.email;
        const userId = await getUserIdByEmail(userEmail);
        if (!userId) return res.status(404).json({ success: false, message: "User context not found." });

        const query = `
            SELECT id, letter_directed_to, letter_from, reference_no, 
                   event_date, appearance_date, appearance_time, secretariat, subject, action_required, 
                   assigned_to, letter_stage, status, created_at 
            FROM mohtasib_info 
            WHERE user_id = $1 
            ORDER BY created_at DESC
        `;
        const result = await authDb.query(query, [userId]);
        return res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Failed to load individual Mohtasib registry feed." });
    }
};

// 4. Update Mohtasib record
export const updateMohtasibRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const userEmail = req.user?.email;
        const userId = await getUserIdByEmail(userEmail);

        const { 
            letter_directed_to, 
            letter_from, 
            reference_no, 
            event_date, 
            appearance_date,
            appearance_time,
            secretariat,
            subject, 
            action_required, 
            assigned_to, 
            letter_stage, 
            status 
        } = req.body;

        const updateQuery = `
            UPDATE mohtasib_info 
            SET letter_directed_to = $1, letter_from = $2, reference_no = $3, 
                event_date = $4, appearance_date = $5, appearance_time = $6, secretariat = $7, subject = $8, 
                action_required = $9, assigned_to = $10, letter_stage = $11, 
                status = $12, updated_at = NOW()
            WHERE id = $13 AND user_id = $14 RETURNING *
        `;
        const result = await authDb.query(updateQuery, [
            letter_directed_to, letter_from, reference_no, 
            event_date, appearance_date || null, appearance_time || null, secretariat, subject, 
            action_required, assigned_to, letter_stage, status, id, userId
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Record not found or unauthorized access." });
        }

        return res.json({ success: true, message: "Mohtasib record modified and saved!", data: result.rows[0] });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Record compilation and update cycle faulted." });
    }
};

// 5. Delete Mohtasib record
export const deleteMohtasibRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const userEmail = req.user?.email;
        const userId = await getUserIdByEmail(userEmail);

        const result = await authDb.query(
            'DELETE FROM mohtasib_info WHERE id = $1 AND user_id = $2 RETURNING *', 
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Record not found or unauthorized access." });
        }

        return res.json({ success: true, message: "Mohtasib record purged successfully." });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Purge execution pipeline defaulted." });
    }
};

// 6. Fetch All Mohtasib Records for central Executive/CEO oversight
export const getAllMohtasibRecordsForDashboard = async (req, res) => {
    try {
        const query = `
            SELECT 
                m.id, 
                m.letter_directed_to, 
                m.letter_from, 
                m.reference_no, 
                m.event_date, 
                m.appearance_date,
                m.appearance_time,
                m.secretariat,
                m.subject, 
                m.action_required, 
                m.assigned_to, 
                m.letter_stage, 
                m.status, 
                m.created_at,
                du.username AS uploader_name
            FROM mohtasib_info m
            INNER JOIN dashboard_users du ON m.user_id = du.id
            ORDER BY m.created_at DESC
        `;
        const result = await authDb.query(query);
        return res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error("Global Mohtasib Dashboard retrieval loop failure:", err);
        return res.status(500).json({ 
            success: false, 
            message: "Failed to load dynamic Mohtasib dashboard parameters." 
        });
    }
};