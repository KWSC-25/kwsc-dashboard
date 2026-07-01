/* global process */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// --- 1. Configurations (No connections made yet) ---

const configs = {
    complaint: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'kwsb',
        waitForConnections: true,
        connectionLimit: 10
    },
    hydrant: {
        host: process.env.HMP_DB_HOST,
        user: process.env.HMP_DB_USER,
        password: process.env.HMP_DB_PASSWORD,
        database: process.env.HMP_DB_NAME,
        waitForConnections: true,
        connectionLimit: 10
    },
    auth: {
        host: process.env.AUTH_DB_HOST,
        user: process.env.AUTH_DB_USER,
        password: process.env.AUTH_DB_PASSWORD,
        database: process.env.AUTH_DB_NAME,
        port: process.env.AUTH_DB_PORT || 5432,
        max: 5
    }
    // Remapped hydrantkpi cleanly via the pool manager alias to prevent driver mismatch
};

// --- 2. The Pool Manager (Lazy Loading) ---

const pools = {};

export const getDatabase = async (type) => {
    // 🌟 ALIAS STRATEGY: If 'hydrantkpi' is requested, cleanly route it to use the 'hydrant' pool instead
    if (type === 'chlorination') {
        console.log(`ℹ️ [CHLORINATION] requested: Skipping database connection pool initialization.`);
        return null; 
    }
    let targetType = type;
    
    if (type === 'eci') {
        targetType = 'auth'; 
    }
    if (type === 'hydrantkpi') {
        targetType = 'hydrant'; 

    } else if (type === 'zonecomplaint') {
        targetType = 'complaint'; // 🎯 Redirects zonecomplaint to the existing complaint pool cleanly!
    }

    // If pool already exists, return it instantly
    if (pools[targetType]) return pools[targetType];

    console.log(`🔌 Initializing connection for: [${targetType.toUpperCase()}]`);
    console.time(`⏱️  ${targetType}_Connection_Time`);

    try {
        if (targetType === 'auth') {
            pools[targetType] = new Pool(configs.auth);
            await pools[targetType].query('SELECT 1'); // Fast ping to verify
        } else {
            pools[targetType] = mysql.createPool(configs[targetType]);
            const conn = await pools[targetType].getConnection();
            conn.release();
        }

        console.timeEnd(`⏱️  ${targetType}_Connection_Time`);
        return pools[targetType];
    } catch (error) {
        console.error(`❌ Connection failed for ${targetType}:`, error.message);
        throw error;
    }
};

// --- 3. The New Export Strategy ---

// We connect to Auth immediately because 99% of visits require it
export const authDb = await getDatabase('auth');

export default getDatabase; // Export the manager as default