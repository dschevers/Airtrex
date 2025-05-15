// lib/db.js
require('dotenv').config({ path: '.env.local' });
const sql = require('mssql');

// Use the working configuration from our test
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

let pool;  // will hold our global pool

async function initializePool() {
  if (pool) return pool;  // reuse if already connected
  try {
    console.log('Connecting to database...');
    pool = await sql.connect(dbConfig);
    console.log('✅ Connected to database successfully');
    return pool;
  } catch (err) {
    console.error('❌ Database connection error:', err);
    throw err;
  }
}

async function getPool() {
  if (!pool) {
    await initializePool();
  }
  return pool;
}

async function executeQuery(query, params = []) {
  try {
    const p = await getPool();
    const req = p.request();
    for (const { name, type, value } of params) {
      req.input(name, type, value);
    }
    const result = await req.query(query);
    return result;
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  }
}

module.exports = {
  initializePool,
  getPool,
  executeQuery,
  sql
};