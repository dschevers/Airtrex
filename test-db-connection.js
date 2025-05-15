// test-db.js
require('dotenv').config({ path: '.env.local' });
const sql = require('mssql');

console.log("Testing database connection with credentials:");
console.log({
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: "HIDDEN"
});

// Try different connection configurations
async function testConnection() {
  // Configuration 1: Basic config
  const config1 = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
      encrypt: true,
      trustServerCertificate: false
    }
  };

  // Configuration 2: With port
  const config2 = {
    ...config1,
    port: 1433,
    options: {
      ...config1.options,
      enableArithAbort: true
    }
  };

  // Configuration 3: Connection string
  const connectionString = `Server=${process.env.DB_SERVER};Database=${process.env.DB_NAME};User Id=${process.env.DB_USER};Password=${process.env.DB_PASSWORD};Encrypt=true;TrustServerCertificate=false;Connection Timeout=30;`;

  try {
    console.log("\nTrying connection with config 1...");
    const pool1 = await sql.connect(config1);
    console.log("✅ CONNECTION SUCCESSFUL with config 1!");
    await pool1.close();
    return;
  } catch (err1) {
    console.log("❌ Connection with config 1 failed:", err1.message);
  }

  try {
    console.log("\nTrying connection with config 2...");
    const pool2 = await sql.connect(config2);
    console.log("✅ CONNECTION SUCCESSFUL with config 2!");
    await pool2.close();
    return;
  } catch (err2) {
    console.log("❌ Connection with config 2 failed:", err2.message);
  }

  try {
    console.log("\nTrying connection with connection string...");
    const pool3 = await sql.connect(connectionString);
    console.log("✅ CONNECTION SUCCESSFUL with connection string!");
    await pool3.close();
    return;
  } catch (err3) {
    console.log("❌ Connection with connection string failed:", err3.message);
  }

  console.log("\n⚠️ All connection attempts failed.");
}

testConnection()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Unexpected error:", err);
    process.exit(1);
  });