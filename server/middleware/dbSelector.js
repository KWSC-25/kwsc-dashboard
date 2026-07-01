import { getDatabase } from '../db.js';

export const dbSelector = async (req, res, next) => {
    const context = req.headers['x-dashboard-context'];

    // 1. EXIT EARLY: If no header is provided, just move to the next step.
    // This stops the unnecessary default to 'complaint'.
    if (!context) {
        return next();
    }

    let dbType = context;
    if (dbType === 'lcms' ) {
        dbType = 'auth';
    }

    try {
        const startTime = Date.now();
        const pool = await getDatabase(dbType);

        if (!pool) {
            return res.status(400).json({ 
                error: "Invalid Dashboard Context", 
                message: `The context '${context}' does not match any configured database.` 
            });
        }
        // 2. Attach the pool only if we actually found one
        req.db = pool;

        const duration = Date.now() - startTime;
        console.log(`🎯 Context: [${context.toUpperCase()}] -> Using Pool: [${dbType.toUpperCase()}] | ${duration}ms`);

        next();
    } catch (error) {
        res.status(500).json({ message: "Database Selection Error", error: error.message });
    }
};