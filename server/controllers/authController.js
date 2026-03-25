/* global process */
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { authDb } from '../db.js'; // Your Postgres pool

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Fetch user from PostgreSQL
        const result = await authDb.query('SELECT * FROM dashboard_users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: "Invalid Credentials" });
        }

        const user = result.rows[0];

        // 2. Compare hashed password from DB with plain text from login
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            // 3. Include role in the token payload
            const token = jwt.sign(
                { 
                    email: user.email, 
                    role: user.role 
                }, 
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            return res.json({ success: true, token, role: user.role });
        }

        res.status(401).json({ success: false, message: "Invalid Credentials" });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};