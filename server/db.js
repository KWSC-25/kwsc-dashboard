/* global process */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Manually resolve the path to the root .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// 2. Create the connection pool using the 'kwsb' database from your dump
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kwsb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 3. Immediate Test to verify connection on startup
try {
  const connection = await db.getConnection();
  console.log("✅ Database 'kwsb' connected successfully from root .env!");
  connection.release();
} catch (error) {
  console.error("❌ Database connection failed. Check your .env values.");
  console.error("Error Detail:", error.message);
}

export default db;