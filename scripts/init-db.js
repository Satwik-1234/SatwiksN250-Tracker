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

// Load the same statement arrays the runtime /api/init-db route uses, so the CLI
// and the deployed app can never apply different schemas.
const ts = require('typescript');

function loadSchema() {
  const schemaPath = path.join(__dirname, '..', 'src', 'lib', 'dbSchema.ts');
  const source = ts.createProgram([schemaPath], {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.CommonJS,
  }).getSourceFile(schemaPath, ts.ScriptTarget.ES2020, true);

  const out = {};
  for (const stmt of source.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    const decl = stmt.declarationList.declarations[0];
    if (!decl || !ts.isIdentifier(decl.name) || !decl.initializer) continue;
    out[decl.name.text] = new Function(`return ${decl.initializer.getText(source)}`)();
  }
  return out;
}

async function runStatements(client, statements, { optional = false } = {}) {
  const failed = [];
  let applied = 0;
  for (const sql of statements) {
    try {
      await client.query(sql);
      applied += 1;
    } catch (err) {
      if (!optional) {
        failed.push({ statement: sql.trim().split('\n')[0].slice(0, 100), error: err.message });
      }
    }
  }
  return { applied, failed };
}

async function main() {
  console.log('\x1b[36m%s\x1b[0m', '🚀 Connecting to PostgreSQL Database...');

  let client;
  try {
    client = await pool.connect();
    console.log('\x1b[32m%s\x1b[0m', '✅ Connected to PostgreSQL successfully!');

    const S = loadSchema();

    console.log('📄 Applying tables...');
    const core = await runStatements(client, S.CORE_SCHEMA);

    console.log('🔄 Applying migrations (legacy column renames)...');
    const migration = await runStatements(client, S.MIGRATION_SCHEMA);

    console.log('🔒 Adding constraints...');
    const constraints = await runStatements(client, S.CONSTRAINT_SCHEMA);

    console.log('⚡ Creating indexes...');
    const indexes = await runStatements(client, S.INDEX_SCHEMA);

    console.log('🔐 Applying Supabase RLS + storage (skipped on plain Postgres)...');
    await runStatements(client, S.SUPABASE_SCHEMA, { optional: true });

    const failures = [...core.failed, ...migration.failed, ...constraints.failed, ...indexes.failed];

    // Verify every column the API routes depend on now exists.
    const REQUIRED = {
      fuel_logs: ['id','date','odometer','fuel_amount','total_cost','price_per_litre','is_full_tank','trip_type','station_name','notes','distance_calculated','mileage_calculated','cost_per_km_calculated','synced'],
      trips: ['id','name','trip_type','from_location','to_location','departure_date','departure_time','arrival_date','arrival_time','start_odometer','end_odometer','distance_covered','total_fuel_cost','total_fuel_litres','avg_fuel_economy','calculated_fuel_economy','notes'],
      service_logs: ['id','date','odometer','service_type','service_center','total_cost','notes','document_url'],
      accessories_gear: ['id','date_purchased','item_name','category','brand','cost','notes','photo_url'],
    };

    const missing = {};
    for (const [table, cols] of Object.entries(REQUIRED)) {
      const res = await client.query(
        `SELECT column_name FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1`,
        [table]
      );
      const present = new Set(res.rows.map((r) => r.column_name));
      const gap = cols.filter((c) => !present.has(c));
      if (gap.length) missing[table] = gap;
    }

    const logsRes = await client.query('SELECT COUNT(*) FROM fuel_logs');
    const tripsRes = await client.query('SELECT COUNT(*) FROM trips');
    console.log(`📊 Current records: ${logsRes.rows[0].count} fuel logs, ${tripsRes.rows[0].count} trips.`);

    if (failures.length) {
      console.error('\x1b[31m%s\x1b[0m', '❌ Some statements failed:');
      failures.forEach((f) => console.error(`   - ${f.statement}\n     ${f.error}`));
    }

    if (Object.keys(missing).length) {
      console.error('\x1b[31m%s\x1b[0m', '❌ Schema is still missing columns the API needs:');
      console.error(JSON.stringify(missing, null, 2));
      client.release();
      await pool.end();
      process.exit(1);
    }

    client.release();
    await pool.end();

    if (failures.length) {
      console.error('\x1b[31m%s\x1b[0m', '❌ Database initialization completed WITH ERRORS.');
      process.exit(1);
    }

    console.log('\x1b[32m%s\x1b[0m', '🎉 Database schema verified against the API routes - ready for use!');
  } catch (err) {
    if (client) client.release();
    await pool.end();
    console.error('\x1b[31m%s\x1b[0m', '❌ Database initialization failed:', err.message);
    process.exit(1);
  }
}

main();
