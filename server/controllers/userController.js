import { authDb } from '../db.js';
import bcrypt from 'bcryptjs';

export const getAllUsers = async (req, res) => {
    try {
        const result = await authDb.query(
            'SELECT id, username, email, role, created_at, updated_at FROM dashboard_users ORDER BY created_at DESC'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ success: false, message: "Failed to fetch users" });
    }
};

export const createUser = async (req, res) => {
    const { username, email, password, role } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await authDb.query(
            'INSERT INTO dashboard_users (username, email, password, role) VALUES ($1, $2, $3, $4)',
            [username, email, hashedPassword, role || 'viewer']
        );

        res.json({ success: true, message: "User created successfully" });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ success: false, message: "Email or Username already exists" });
    }
};

export const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        await authDb.query('DELETE FROM dashboard_users WHERE id = $1', [id]);
        res.json({ success: true, message: "User deleted" });
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: "Delete failed" });
    }
};
export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, email, password, role } = req.body;

    try {
        let query;
        let values;

        if (password && password.trim() !== "") {
            // Case 1: Updating password along with other details
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            query = `
                UPDATE dashboard_users 
                SET username = $1, email = $2, password = $3, role = $4, updated_at = NOW() 
                WHERE id = $5
            `;
            values = [username, email, hashedPassword, role, id];
        } else {
            // Case 2: Keeping existing password
            query = `
                UPDATE dashboard_users 
                SET username = $1, email = $2, role = $3, updated_at = NOW() 
                WHERE id = $4
            `;
            values = [username, email, role, id];
        }

        const result = await authDb.query(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({ success: true, message: "User updated successfully" });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ success: false, message: "Update failed. Email may already be in use." });
    }
};