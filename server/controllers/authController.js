/* global process */
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { authDb } from '../db.js';

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Fetch user including max_sessions tracking column
        const result = await authDb.query('SELECT * FROM dashboard_users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: "Invalid Credentials" });
        }

        const user = result.rows[0];

        // 2. Validate password hashes
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid Credentials" });
        }

        // 3. Dynamic Session Cap Handling Layer (FIFO Eviction Strategy)
        const allowedSessions = user.max_sessions || 2;

        // Fetch all active sessions ordered oldest first
        const activeSessionsRes = await authDb.query(
            `SELECT id FROM user_sessions
             WHERE email = $1 AND logout_at IS NULL
             ORDER BY login_at ASC`,
            [user.email]
        );

        const currentActiveCount = activeSessionsRes.rows.length;

        // If we are at or above the limit, we need to make space for the incoming session
        if (currentActiveCount >= allowedSessions) {
            // Determine exactly how many slots we need to free up to stay under the max cap
            const sessionsToKickCount = (currentActiveCount - allowedSessions) + 1;
            const sessionsToKick = activeSessionsRes.rows.slice(0, sessionsToKickCount);
            
            const kickIds = sessionsToKick.map(s => s.id);
            if (kickIds.length > 0) {
                // FIX: Cast type matching to text[] or uuid[] instead of int[]
                await authDb.query(
                    `UPDATE user_sessions
                     SET logout_at = NOW(), is_revoked = true
                     WHERE id = ANY($1::text[])`, 
                    [kickIds]
                );
            }
        }

        // 4. Register current connection session signature
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '0.0.0.0';
        const userAgent = req.headers['user-agent'] || 'Unknown Browser';

        const sessionResult = await authDb.query(
            `INSERT INTO user_sessions (email, ip_address, user_agent)
             VALUES ($1, $2, $3)
             RETURNING id`,
            [user.email, ipAddress, userAgent]
        );
        
        const sessionId = sessionResult.rows[0].id;

        // 5. Generate State Verification Payload Signature Token
        const token = jwt.sign(
            {
                sessionId: sessionId,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        return res.json({ success: true, token, role: user.role });
    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const logout = async (req, res) => {
    try {
        const sessionId = req.user?.sessionId;
        if (!sessionId) {
            return res.status(400).json({ success: false, message: "No active session trace verified." });
        }
        
        await authDb.query(
            `UPDATE user_sessions
             SET logout_at = NOW()
             WHERE id = $1`,
            [sessionId]
        );

        return res.json({ success: true, message: "Logged out cleanly." });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: "Database update failed." });
    }
};