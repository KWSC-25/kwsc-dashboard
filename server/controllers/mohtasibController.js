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
            case_no,
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
            status,
            ceo_dak_receipt_no,
            previous_letter_no,
            department_assigned,
            cc_to
        } = req.body;

        const userId = await getUserIdByEmail(userEmail);
        if (!userId) {
            return res.status(404).json({ success: false, message: "User context not found." });
        }

        try {
            // Optional explicit validation check before insert
            const existingCheck = await authDb.query(
                'SELECT id FROM mohtasib_info WHERE case_no = $1 AND reference_no = $2',
                [case_no || null, reference_no]
            );

            if (existingCheck.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `A record with Reference No "${reference_no}" already exists under Case No "${case_no}".`
                });
            }

            const query = `
            INSERT INTO mohtasib_info (
                user_id, case_no, letter_directed_to, letter_from, reference_no, 
                event_date, appearance_date, appearance_time, secretariat, subject, action_required, 
                assigned_to, letter_stage, status, ceo_dak_receipt_no, previous_letter_no, 
                department_assigned, cc_to
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) 
            RETURNING *
        `;
            const result = await authDb.query(query, [
                userId, case_no || null, letter_directed_to, letter_from, reference_no,
                event_date, appearance_date || null, appearance_time || null, secretariat, subject, action_required,
                assigned_to, letter_stage, status, ceo_dak_receipt_no || null, previous_letter_no || null,
                department_assigned || null, cc_to || null
            ]);

            return res.json({ success: true, message: "Mohtasib record saved successfully!", data: result.rows[0] });
        } catch (err) {
            console.error("Mohtasib Insertion Failure:", err);
            return res.status(500).json({ success: false, message: "Server error during Mohtasib record initialization." });
        }
    } catch (err) {
        if (err.code === '23505') { // Postgres unique constraint violation
            return res.status(400).json({
                success: false,
                message: `A record with Reference No "${reference_no}" already exists under Case No "${case_no}".`
            });
        }
    }


};

// 3. Get Logged-in User's added Mohtasib records
export const getUserMohtasibRecords = async (req, res) => {
    try {
        const userEmail = req.user?.email;
        const userId = await getUserIdByEmail(userEmail);
        if (!userId) return res.status(404).json({ success: false, message: "User context not found." });

        const query = `
            SELECT id, case_no, letter_directed_to, letter_from, reference_no, 
                   event_date, appearance_date, appearance_time, secretariat, subject, action_required, 
                   assigned_to, letter_stage, status, ceo_dak_receipt_no, previous_letter_no, 
                   department_assigned, cc_to, created_at 
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
            case_no,
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
            status,
            ceo_dak_receipt_no,
            previous_letter_no,
            department_assigned,
            cc_to
        } = req.body;

        const updateQuery = `
            UPDATE mohtasib_info 
            SET case_no = $1, letter_directed_to = $2, letter_from = $3, reference_no = $4, 
                event_date = $5, appearance_date = $6, appearance_time = $7, secretariat = $8, subject = $9, 
                action_required = $10, assigned_to = $11, letter_stage = $12, 
                status = $13, ceo_dak_receipt_no = $14, previous_letter_no = $15, 
                department_assigned = $16, cc_to = $17, updated_at = NOW()
            WHERE id = $18 AND user_id = $19 RETURNING *
        `;
        const result = await authDb.query(updateQuery, [
            case_no || null, letter_directed_to, letter_from, reference_no,
            event_date, appearance_date || null, appearance_time || null, secretariat, subject,
            action_required, assigned_to, letter_stage, status,
            ceo_dak_receipt_no || null, previous_letter_no || null,
            department_assigned || null, cc_to || null, id, userId
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
                m.case_no,
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
                m.ceo_dak_receipt_no,
                m.previous_letter_no,
                m.department_assigned,
                m.cc_to,
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