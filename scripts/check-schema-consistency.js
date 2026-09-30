/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Guards against the exact bug this repo shipped for months: the API routes
 * querying columns that do not exist in the schema, which made every Postgres
 * read fail with 42703 and silently fall back to hardcoded seed data.
 *
 * Parses the SQL in src/app/api/**, extracts the column identifiers each route
 * references, and verifies them against the DDL in src/lib/dbSchema.ts.
 *
 *   node scripts/check-schema-consistency.js
 */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');
const SCHEMA_TS = path.join(ROOT, 'src', 'lib', 'dbSchema.ts');
const API_DIR = path.join(ROOT, 'src', 'app', 'api');

// --- load the authoritative DDL -------------------------------------------
const source = ts.createProgram([SCHEMA_TS], {
  target: ts.ScriptTarget.ES2020,
  module: ts.ModuleKind.CommonJS,
}).getSourceFile(SCHEMA_TS, ts.ScriptTarget.ES2020, true);

const tables = {};
for (const stmt of source.statements) {
  if (!ts.isVariableStatement(stmt)) continue;
  const decl = stmt.declarationList.declarations[0];
  if (!decl || !ts.isIdentifier(decl.name) || !decl.initializer) continue;

  const arrayItems = new Function(`return ${decl.initializer.getText(source)}`)();
  if (!Array.isArray(arrayItems)) continue;

  for (const sql of arrayItems) {
    // Matches the closing paren at the start of a line; the trailing semicolon
    // is added by the generator, not present in the template literal.
    const m = sql.match(/CREATE TABLE IF NOT EXISTS\s+(\w+)\s*\(([\s\S]*?)\n\s*\)\s*;?\s*$/i);
    if (!m) continue;
    const [, tableName, body] = m;
    const cols = new Set();
    for (const line of body.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      // A column definition is `<name> <type> ...`; skip table-level constraints.
      const c = trimmed.match(/^(\w+)\s+(VARCHAR|TEXT|NUMERIC|BOOLEAN|TIMESTAMPTZ|DATE|TIME|JSONB|INT|INTEGER)/i);
      if (c) cols.add(c[1]);
    }
    tables[tableName] = cols;
  }
}

// --- collect SQL used by each route ---------------------------------------
const routeFiles = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === 'route.ts') routeFiles.push(p);
  }
})(API_DIR);

const SQL_KEYWORDS = new Set([
  'SELECT','FROM','WHERE','INSERT','INTO','VALUES','UPDATE','SET','DELETE','ORDER','BY',
  'GROUP','HAVING','LIMIT','OFFSET','JOIN','LEFT','RIGHT','INNER','OUTER','ON','AS','AND',
  'OR','NOT','NULL','COUNT','COALESCE','MAX','MIN','SUM','AVG','CAST','EXISTS','IN',
  'BETWEEN','LIKE','ILIKE','DISTINCT','ASC','DESC','TRUE','FALSE','CASE','WHEN','THEN',
  'ELSE','END','CREATE','TABLE','IF','PRIMARY','KEY','DEFAULT','CURRENT_TIMESTAMP',
  'INFORMATION_SCHEMA','COLUMNS','TABLE_NAME','COLUMN_NAME','TABLE_SCHEMA','ADD','CONSTRAINT',
  'ALTER','DROP','POLICY','GRANT','TO','USING','CHECK','EXCEPTION','OTHERS','DECLARE',
  'BEGIN','INDEX','UNIQUE','EXISTS','VARCHAR','NUMERIC','TEXT','BOOLEAN','TIMESTAMPTZ',
  'DATE','TIME','JSONB','INT','INTEGER','REFERENCES','COLLATE','GENERATED','STORED',
]);

const problems = [];

for (const file of routeFiles) {
  const rel = path.relative(ROOT, file);
  const text = fs.readFileSync(file, 'utf8');

  // Only inspect the template literals passed to query()
  const sqlBlocks = [...text.matchAll(/query\(\s*`([\s\S]*?)`/g)].map((m) => m[1]);
  if (!sqlBlocks.length) continue;

  for (const sql of sqlBlocks) {
    // Match "FROM <table>" / "JOIN <table>" and "INTO <table>"
    const targets = new Set();
    for (const m of sql.matchAll(/(?:FROM|JOIN|INTO|UPDATE)\s+(\w+)/gi)) {
      const t = m[1].toLowerCase();
      if (tables[t]) targets.add(t);
    }
    if (!targets.size) continue;

    // Collect the SELECT/INSERT column list (between the first keyword and FROM/VALUES)
    const selectListMatch = sql.match(/SELECT\s+([\s\S]*?)\s+FROM\s/i);
    const insertListMatch = sql.match(/INSERT\s+INTO\s+\w+\s*\(([\s\S]*?)\)\s*VALUES/i);
    const referenced = new Set();

    const addCandidate = (raw) => {
      if (!raw) return;
      // "foo" AS "bar"  -> foo       (also `foo::text AS "bar"`)
      let c = raw.trim().split(/\s+AS\s+/i)[0].trim();
      // COALESCE(a, b, 0) -> keep every argument, not just the first
      const coalesce = c.match(/^COALESCE\s*\((.*)\)$/i);
      if (coalesce) {
        // Split on top-level commas only (ignore commas nested in parens).
        let depth = 0, buf = '', parts = [];
        for (const ch of coalesce[1]) {
          if (ch === '(') depth++;
          if (ch === ')') depth--;
          if (ch === ',' && depth === 0) { parts.push(buf); buf = ''; }
          else buf += ch;
        }
        parts.push(buf);
        parts.forEach(addCandidate);
        return;
      }
      // Strip ::type casts and surrounding parens
      c = c.replace(/::\w+(\[\])?/g, '').replace(/^\(|\)$/g, '').trim();
      // Strip string/array literals
      if (/^'/.test(c) || /^\d/.test(c) || /^"/.test(c)) return;
      if (/^\w+$/.test(c) && !SQL_KEYWORDS.has(c.toUpperCase())) referenced.add(c);
    };

    if (selectListMatch) selectListMatch[1].split(',').forEach(addCandidate);
    if (insertListMatch) insertListMatch[1].split(',').forEach(addCandidate);
    // UPDATE ... SET col = ...
    for (const m of sql.matchAll(/SET\s+(\w+)\s*=/gi)) referenced.add(m[1]);

    for (const table of targets) {
      for (const col of referenced) {
        if (!tables[table].has(col)) {
          problems.push({ file: rel, table, column: col });
        }
      }
    }
  }
}

if (problems.length) {
  console.error('\x1b[31m❌ Schema / API route column mismatch:\x1b[0m\n');
  for (const p of problems) {
    console.error(`   ${p.file}\n     ${p.table}.${p.column} does not exist in src/lib/dbSchema.ts`);
  }
  console.error(`\n\x1b[31m${problems.length} mismatch(es). These would cause 42703 at runtime.\x1b[0m`);
  process.exit(1);
}

console.log('\x1b[32m✅ Schema consistency OK\x1b[0m');
console.log(`   Checked ${routeFiles.length} route files against ${Object.keys(tables).length} tables.`);
