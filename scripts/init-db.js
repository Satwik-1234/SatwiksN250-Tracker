/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Read .env.local if present
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const idx = trimmed.indexOf('=');
        if (idx !== -1) {
          const key = trimmed.substring(0, idx).trim();
          let val = trimmed.substring(idx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    });
  }
}

loadEnv();

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!dbUrl) {
  console.error('\x1b[31m%s\x1b[0m', '❌ ERROR: DATABASE_URL is not set in .env.local!');
  console.log('👉 Please set DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require" in .env.local');
  process.exit(1);
}

const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
const pool = new Pool({
  connectionString: dbUrl,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

async function main() {
  console.log('\x1b[36m%s\x1b[0m', '🚀 Connecting to PostgreSQL Database...');
  
  try {
    const client = await pool.connect();
    console.log('\x1b[32m%s\x1b[0m', '✅ Connected to PostgreSQL successfully!');

    // Read and run schema.sql
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📄 Applying schema.sql tables and indexes...');
    await client.query(schemaSql);
    console.log('\x1b[32m%s\x1b[0m', '✅ Tables created successfully (fuel_logs, trips, service_logs, accessories_gear, app_settings)!');

    // Check row counts
    const logsRes = await client.query('SELECT COUNT(*) FROM fuel_logs');
    const tripsRes = await client.query('SELECT COUNT(*) FROM trips');

    console.log(`📊 Current records: ${logsRes.rows[0].count} fuel logs, ${tripsRes.rows[0].count} trips.`);

    client.release();
    await pool.end();
    console.log('\x1b[32m%s\x1b[0m', '🎉 Database is ready for full-stack use!');
  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Database initialization failed:', err.message);
    process.exit(1);
  }
}

main();
