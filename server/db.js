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
};

// --- 2. The Pool Manager (Lazy Loading) ---

const pools = {};

export const getDatabase = async (type) => {
    // If pool already exists, return it instantly
    if (pools[type]) return pools[type];

    console.log(`🔌 Initializing connection for: [${type.toUpperCase()}]`);
    console.time(`⏱️  ${type}_Connection_Time`);

    try {
        if (type === 'auth') {
            pools[type] = new Pool(configs.auth);
            await pools[type].query('SELECT 1'); // Fast ping to verify
        } else {
            pools[type] = mysql.createPool(configs[type]);
            const conn = await pools[type].getConnection();
            conn.release();
        }

        console.timeEnd(`⏱️  ${type}_Connection_Time`);
        return pools[type];
    } catch (error) {
        console.error(`❌ Connection failed for ${type}:`, error.message);
        throw error;
    }
};

// --- 3. Compatibility Layer ---
// We keep these exports so your existing code doesn't crash 
// We will replace these later, but for now, they act as "proxies"
// export const authDb = await getDatabase('auth'); 
// export const hmpDb = await getDatabase('hydrant');
// const db = await getDatabase('complaint');

// export default db;
// --- 3. The New Export Strategy ---

// 1. We connect to Auth immediately because 99% of visits require it
export const authDb = await getDatabase('auth');

export default getDatabase; // Export the manager as default