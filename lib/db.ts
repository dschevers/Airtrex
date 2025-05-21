// lib/db.ts
import dotenv from 'dotenv';
import sql, { config as SqlConfig, ConnectionPool} from 'mssql';
import { devLog } from './logger';

// Load your local .env file (for dev)
dotenv.config({ path: '.env.local' });

const DB_USER     = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_SERVER   = process.env.DB_SERVER;
const DB_NAME     = process.env.DB_NAME ?? process.env.DB_DATABASE;

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
const dbConfig: SqlConfig = {
  user:     DB_USER!,
  password: DB_PASSWORD!,
  server:   DB_SERVER!,
  database: DB_NAME!,
  options: {
    encrypt:                true,
    trustServerCertificate: false,
    enableArithAbort:       true,
    connectTimeout:         30000,
    requestTimeout:         30000,
  },
};

let pool: ConnectionPool | undefined;

async function initializePool(): Promise<ConnectionPool> {
  if (pool) return pool;
  const errors: unknown[] = [];

  // Standard approach
  try {
    devLog('Connecting with dbConfig:', { user: dbConfig.user, server: dbConfig.server, database: dbConfig.database });
    pool = await sql.connect(dbConfig);
    devLog('✅ Connected successfully (standard config)');
    return pool;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('❌ Standard connection failed:', msg);
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
    const msg = err instanceof Error ? err.message : String(err);
    console.error('❌ Connection string approach failed:', msg);
    errors.push(err);
  }
  // All failed
  throw errors[0];
}

export async function getPool(): Promise<ConnectionPool> {
  if (!pool) {
    pool = await initializePool();
  }
  return pool!;
}

interface QueryParam {
  name: string;
  type: sql.ISqlType | (() => sql.ISqlType);
  value: unknown;
}

export async function executeQuery<T = unknown>(
  query: string,
  params: QueryParam[] = []
): Promise<sql.IResult<T>> {
  const p = await getPool();
  const req = p.request();
  for (const { name, type, value } of params) {
    const resolvedType =
      typeof type === 'function'
        ? (type as () => sql.ISqlType)()
        : type;
    req.input(name, resolvedType, value);
  }
  return req.query<T>(query);
}



export { sql };
