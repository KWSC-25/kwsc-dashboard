/* global process */
import jwt from 'jsonwebtoken';
import { authDb } from '../db.js'; // Ensure this path points correctly to your db configuration file

export const protect = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "Not authorized, no token" });

    try {
        // 1. Decode and verify signature status
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 2. Query database to verify if this specific session was evicted / revoked
        const sessionCheck = await authDb.query(
            `SELECT is_revoked, logout_at 
             FROM user_sessions 
             WHERE id = $1::uuid`,
            [decoded.sessionId]
        );

        // If the session record row disappeared or doesn't exist
        if (sessionCheck.rows.length === 0) {
            return res.status(401).json({ message: "Session expired or invalid" });
        }

        const session = sessionCheck.rows[0];

        // CRITICAL CHECK: If another device evicted this session, block them out right here
        if (session.is_revoked === true || session.logout_at !== null) {
            return res.status(401).json({ 
                message: "Logged out because your account was logged in from a new device." 
            });
        }

        // Attach decoded fields to request context
        req.user = decoded;
        next();
    } catch (error) {
        console.error("JWT Verification Error:", error);
        res.status(401).json({ message: "Token failed" });
    }
};

export const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: "Access Denied: Admin privileges required" });
    }
};