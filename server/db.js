/* global process */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;
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
export const hmpDb = mysql.createPool({
  host: process.env.HMP_DB_HOST,
  user: process.env.HMP_DB_USER,
  password: process.env.HMP_DB_PASSWORD,
  database: process.env.HMP_DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export const authDb = new Pool({
  host: process.env.AUTH_DB_HOST,
  user: process.env.AUTH_DB_USER,
  password: process.env.AUTH_DB_PASSWORD,
  database: process.env.AUTH_DB_NAME,
  port: process.env.AUTH_DB_PORT || 5432, // Default Postgres port
  max: 5, // Equivalent to connectionLimit
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});


try {
  const hmpConn = await hmpDb.getConnection();
  console.log("✅ HMP Database connected successfully!");
  hmpConn.release();
} catch (error) {
  console.error("❌ HMP Database failed:Check your .env values. ", error.message);
}

try {
  const connection = await db.getConnection();
  console.log("✅ Complaint Database connected successfully");
  connection.release();
} catch (error) {
  console.error("❌ Complaint Database connection failed. Check your .env values.");
  console.error("Error Detail:", error.message);
}

try {
  const authConn = await authDb.connect();
  console.log("✅ Auth Database connected successfully!");
  authConn.release();
} catch (error) {
  console.error("❌ Auth Database failed: Check AUTH_DB env values.", error.message);
}

export default db;