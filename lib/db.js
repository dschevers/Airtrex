// lib/db.js
import dotenv from 'dotenv';
import sql from 'mssql';
import { devLog } from './logger';

// Load your local .env file (for dev)
dotenv.config({ path: '.env.local' });

// Support either DB_NAME or DB_DATABASE
const DB_USER     = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_SERVER   = process.env.DB_SERVER;
const DB_NAME     = process.env.DB_NAME     || process.env.DB_DATABASE;

if (!DB_USER || !DB_PASSWORD || !DB_SERVER || !DB_NAME) {
  console.error('❗️ Missing required DB env vars:', { 
    DB_USER:     Boolean(DB_USER),
    DB_PASSWORD: Boolean(DB_PASSWORD),
    DB_SERVER:   Boolean(DB_SERVER),
    DB_NAME:     Boolean(process.env.DB_NAME),
    DB_DATABASE: Boolean(process.env.DB_DATABASE),
  });
}

// Build the config object
const dbConfig = {
  user:     DB_USER,
  password: DB_PASSWORD,
  server:   DB_SERVER,
  database: DB_NAME,
  options: {
    encrypt:              true,  
    trustServerCertificate: false,
    enableArithAbort:     true,
    connectionTimeout:    30000,
    requestTimeout:       30000
  }
};

let pool;

// Try to initialize the pool once
async function initializePool() {
  if (pool) return pool;

  const errors = [];

  // Standard approach
  try {
    devLog('Connecting with dbConfig:', { user: dbConfig.user, server: dbConfig.server, database: dbConfig.database });
    pool = await sql.connect(dbConfig);
    devLog('✅ Connected successfully (standard config)');
    return pool;
  } catch (err) {
    console.error('❌ Standard connection failed:', err.message);
    errors.push(err);
  }

  // Fallback: connection string
  try {
    const connStr =
      `Server=${DB_SERVER};Database=${DB_NAME};User Id=${DB_USER};Password=${DB_PASSWORD};` +
      `Encrypt=true;TrustServerCertificate=false;Connection Timeout=30;`;
    devLog('Trying connection string approach');
    pool = await sql.connect(connStr);
    devLog('✅ Connected successfully (connection string)');
    return pool;
  } catch (err) {
    console.error('❌ Connection string approach failed:', err.message);
    errors.push(err);
  }

  // All failed
  throw errors[0];
}

export async function getPool() {
  if (!pool) await initializePool();
  return pool;
}

export async function executeQuery(query, params = []) {
  const p = await getPool();
  const req = p.request();
  for (const { name, type, value } of params) {
    req.input(name, type, value);
  }
  return req.query(query);
}

export { sql };
