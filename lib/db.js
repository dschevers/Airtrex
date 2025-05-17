import dotenv from 'dotenv';
import sql from 'mssql';

// Initialize environment variables
dotenv.config({ path: '.env.local' });

// Create a more detailed configuration with correct password handling
const dbConfig = {
  user: process.env.DB_USER,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,  // For Azure SQL
    trustServerCertificate: false,
    enableArithAbort: true,
    connectionTimeout: 30000, 
    requestTimeout: 30000
  }
};


console.log("DB Configuration (excluding password):", {
  user: dbConfig.user,
  server: dbConfig.server,
  password: dbConfig.password,
  database: dbConfig.database,
  options: dbConfig.options
});

let pool;  // will hold our global pool

async function initializePool() {
  if (pool) return pool;  // reuse if already connected
  
  // Try with multiple connection approaches
  const errors = [];
  
  // Approach 1: Standard connection
  try {
    console.log('Connecting to database with standard config...');
    pool = await sql.connect(dbConfig);
    console.log('✅ Connected to database successfully with standard config');
    return pool;
  } catch (err) {
    console.error('❌ Standard connection failed:', err.message);
    errors.push(err);
  }
  
  // Approach 2: Connection string with decoded password
  try {
    console.log('Trying connection string approach...');
    const connectionString = `Server=${process.env.DB_SERVER};Database=${process.env.DB_NAME};User Id=${process.env.DB_USER};Password=${dbConfig.password};Encrypt=true;TrustServerCertificate=false;Connection Timeout=30;`;
    pool = await sql.connect(connectionString);
    console.log('✅ Connected to database successfully with connection string');
    return pool;
  } catch (err) {
    console.error('❌ Connection string approach failed:', err.message);
    errors.push(err);
  }
  
  // If all attempts failed, throw the first error
  throw errors[0];
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

export {
  initializePool,
  getPool,
  executeQuery,
  sql
};