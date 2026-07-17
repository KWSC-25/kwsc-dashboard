import { authDb } from '../db.js';
import bcrypt from 'bcryptjs';

export const getAllUsers = async (req, res) => {
    try {
        const result = await authDb.query(
            `SELECT id, username, email, role, max_sessions, allowed_dashboards, can_upload, can_manage_mohtasib, created_at, updated_at 
             FROM dashboard_users 
             ORDER BY created_at DESC`
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ success: false, message: "Failed to fetch users" });
    }
};

export const createUser = async (req, res) => {
    const { username, email, password, role, max_sessions, allowed_dashboards, can_upload, can_manage_mohtasib } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await authDb.query(
            `INSERT INTO dashboard_users (username, email, password, role, max_sessions, allowed_dashboards, can_upload, can_manage_mohtasib) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                username, 
                email, 
                hashedPassword, 
                role || 'viewer', 
                parseInt(max_sessions, 10) || 2, 
                allowed_dashboards || [],
                !!can_upload,
                !!can_manage_mohtasib // Added boolean mapping
            ]
        );

        res.json({ success: true, message: "User created successfully" });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ success: false, message: "Email or Username already exists" });
    }
};

export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, email, password, role, max_sessions, allowed_dashboards, can_upload, can_manage_mohtasib } = req.body;

    try {
        let query;
        let values;
        const sessionLimit = parseInt(max_sessions, 10) || 2;
        const dashboardsArray = allowed_dashboards || [];
        const uploadPermission = !!can_upload;
        const mohtasibPermission = !!can_manage_mohtasib; // Cast flag cleanly

        if (password && password.trim() !== "") {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            query = `
                UPDATE dashboard_users 
                SET username = $1, email = $2, password = $3, role = $4, max_sessions = $5, allowed_dashboards = $6, can_upload = $7, can_manage_mohtasib = $8, updated_at = NOW() 
                WHERE id = $9
            `;
            values = [username, email, hashedPassword, role, sessionLimit, dashboardsArray, uploadPermission, mohtasibPermission, id];
        } else {
            query = `
                UPDATE dashboard_users 
                SET username = $1, email = $2, role = $3, max_sessions = $4, allowed_dashboards = $5, can_upload = $6, can_manage_mohtasib = $7, updated_at = NOW() 
                WHERE id = $8
            `;
            values = [username, email, role, sessionLimit, dashboardsArray, uploadPermission, mohtasibPermission, id];
        }

        const result = await authDb.query(query, values);
        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({ success: true, message: "User updated successfully" });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ success: false, message: "Update failed." });
    }
};

export const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        await authDb.query('DELETE FROM dashboard_users WHERE id = $1', [id]);
        res.json({ success: true, message: "User deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Delete failed" });
    }
};

export const getSessionLogs = async (req, res) => {
    try {
        const result = await authDb.query(
            `SELECT id, email, ip_address, user_agent, login_at, last_activity_at, logout_at, is_revoked 
             FROM user_sessions 
             ORDER BY login_at DESC 
             LIMIT 150`
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error("Fetch Sessions Error:", error);
        res.status(500).json({ success: false, message: "Server Error loading session logs" });
    }
}; 