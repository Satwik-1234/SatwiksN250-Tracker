/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Regenerates schema.sql from src/lib/dbSchema.ts.
 *
 * schema.sql is the copy you paste into the Supabase SQL editor, but it used to
 * be maintained by hand alongside the init-db route. The two drifted apart on
 * every fuel_logs and trips column, which made the Postgres read path fail with
 * 42703 and silently fall back to hardcoded seed data. Generating it from the
 * same source removes the possibility of drift.
 *
 *   node scripts/generate-schema.js
 */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const SCHEMA_TS = path.join(__dirname, '..', 'src', 'lib', 'dbSchema.ts');
const OUT = path.join(__dirname, '..', 'schema.sql');

const source = ts.createProgram([SCHEMA_TS], {
  target: ts.ScriptTarget.ES2020,
  module: ts.ModuleKind.CommonJS,
}).getSourceFile(SCHEMA_TS, ts.ScriptTarget.ES2020, true);

const exportsMap = new Map();
for (const stmt of source.statements) {
  if (!ts.isVariableStatement(stmt)) continue;
  const decl = stmt.declarationList.declarations[0];
  if (!decl || !ts.isIdentifier(decl.name) || !decl.initializer) continue;
  const value = decl.initializer.getText(source);
  exportsMap.set(decl.name.text, value);
}

function section(title, constName, note) {
  const raw = exportsMap.get(constName);
  if (!raw) throw new Error(`Missing export: ${constName}`);
  // Evaluate just the array literal, then pretty-print the statements.
  const items = new Function(`return ${raw}`)();
  const body = items.map((s) => s.trim()).join('\n\n;\n\n');
  return [
    `-- ${'-'.repeat(66)}`,
    `-- ${title}`,
    note ? `-- ${note}` : null,
    `-- ${'-'.repeat(66)}`,
    body + ';',
  ]
    .filter(Boolean)
    .join('\n');
}

const header = `-- ==========================================================
-- MASTER POSTGRESQL SCHEMA FOR SATWIK'S N250 TRACKER
--
-- GENERATED FILE - do not edit by hand.
-- Source of truth: src/lib/dbSchema.ts
-- Regenerate with:  node scripts/generate-schema.js
--
-- Column names are dictated by the API routes in src/app/api/**.
-- This file is a convenience copy for the Supabase SQL editor; the
-- /api/init-db route applies the identical statements at runtime.
--
-- Safe to re-run: every statement is idempotent, and statements are
-- applied independently so one failure cannot abort the rest.
-- ==========================================================
`;

const out = [
  header,
  section('1. TABLES', 'CORE_SCHEMA'),
  section(
    '2. MIGRATION (legacy column names -> current)',
    'MIGRATION_SCHEMA',
    'No-ops on a database that already has the current shape.'
  ),
  section('3. DATA-INTEGRITY CONSTRAINTS', 'CONSTRAINT_SCHEMA', 'Added NOT VALID: enforced on new writes, tolerant of existing rows.'),
  section('4. INDEXES', 'INDEX_SCHEMA'),
  section(
    '5. SUPABASE-ONLY (RLS, storage bucket, storage policies)',
    'SUPABASE_SCHEMA',
    'References the storage/ and auth schemas. These fail harmlessly on plain',
    'Postgres (Neon, RDS, CockroachDB) and are skipped automatically there.'
  ),
].join('\n\n');

fs.writeFileSync(OUT, out, 'utf8');
console.log('Wrote schema.sql from src/lib/dbSchema.ts');
