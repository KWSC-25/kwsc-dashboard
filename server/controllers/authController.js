/* global process */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const login = async (req, res) => {
    const { email, password } = req.body;

    // 1. Check if email matches
    if (email !== process.env.DASHBOARD_USER) {
        return res.status(401).json({ success: false, message: "Invalid Credentials" });
    }

    // 2. Compare the plain-text password from the login screen 
    // with the hashed password in your .env
    const isMatch = await bcrypt.compare(password, process.env.DASHBOARD_PASS_HASH);

    if (isMatch) {
        const token = jwt.sign({ user: email }, process.env.JWT_SECRET);
        return res.json({ success: true, token });
    }

    res.status(401).json({ success: false, message: "Invalid Credentials" });
};