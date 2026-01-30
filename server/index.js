/* global process */
import express from 'express';
import cors from 'cors';
import db from './db.js'; // This import triggers the DB connection test


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Route to test the actual data from your 'complaint' table
app.get('/api/verify-data', async (req, res) => {
  try {
    // Queries the 'complaint' table from your SQL dump
    const [rows] = await db.query('SELECT COUNT(*) as total FROM complaint');
    res.json({ 
      status: "Connected", 
      database: "kwsb",
      total_complaints_in_db: rows[0].total 
    });
  } catch (error) {
    res.status(500).json({ status: "Error", message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});