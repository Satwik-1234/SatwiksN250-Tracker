#!/usr/bin/env node
/**
 * Mileage math regression check.
 *
 * The bug this exists to prevent: summing `distanceCalculated` (which is the
 * distance since the previous fill of ANY size) against only the closing
 * fill's `fuelAmount`. That drops the fuel burned in partial top-ups and can
 * read a bike as ~34 km/L when it is really ~37.
 *
 * Runs against the real src/utils/mileage.ts via the TypeScript compiler, so
 * this can never drift from the code the app actually ships.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const Module = require('module');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'src', 'utils', 'mileage.ts');

let ts;
try {
  ts = require('typescript');
} catch {
  console.error('FAIL  typescript is not installed; run npm install first.');
  process.exit(1);
}

if (!fs.existsSync(SOURCE)) {
  console.error(`FAIL  missing ${SOURCE}`);
  process.exit(1);
}

// Compile the module in-memory and evaluate it. The @/types/fuel import is
// type-only, so the emitted JavaScript has no runtime dependency on it.
function loadMileageModule() {
  const source = fs.readFileSync(SOURCE, 'utf8');
  const out = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: SOURCE,
  });

  const m = new Module(SOURCE, null);
  m.filename = SOURCE;
  m.paths = Module._nodeModulePaths(path.dirname(SOURCE));
  m._compile(out.outputText, SOURCE);
  return m.exports;
}

let failures = 0;
function check(label, actual, expected, tolerance = 0.011) {
  const ok =
    typeof expected === 'number' && typeof actual === 'number'
      ? Math.abs(actual - expected) <= tolerance
      : actual === expected;
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}: got ${actual}, expected ${expected}`);
}

// ---------------------------------------------------------------------------
// Hand-worked scenario (chronological):
//   A) full   @1000, 12 L  - opens a segment
//   B) partial@1080,  3 L  - 80 km on 12+3 = 15 L
//   C) full   @1160, 12 L  - closes segment 1: 160 km / 15 L
//   D) partial@1210,  2 L  - 50 km
//   E) full   @1260, 10 L  - closes segment 2: 100 km / 12 L
// Totals: 260 km / 27 L
// ---------------------------------------------------------------------------
const logs = [
  { id: '1', date: '2024-01-01T09:00:00Z', odometer: 1000, fuelAmount: 12, totalCost: 1200, pricePerLitre: 100, isFullTank: true, tripType: 'City', stationName: 'Jio-BP', synced: false },
  { id: '2', date: '2024-01-02T09:00:00Z', odometer: 1080, fuelAmount: 3, totalCost: 315, pricePerLitre: 105, isFullTank: false, tripType: 'Highway', stationName: 'IOCL', synced: false },
  { id: '3', date: '2024-01-03T09:00:00Z', odometer: 1160, fuelAmount: 12, totalCost: 1140, pricePerLitre: 95, isFullTank: true, tripType: 'Highway', stationName: 'Jio-BP', synced: false },
  { id: '4', date: '2024-01-04T09:00:00Z', odometer: 1210, fuelAmount: 2, totalCost: 206, pricePerLitre: 103, isFullTank: false, tripType: 'City', stationName: 'IOCL', synced: false },
  { id: '5', date: '2024-01-05T09:00:00Z', odometer: 1260, fuelAmount: 10, totalCost: 1010, pricePerLitre: 101, isFullTank: true, tripType: 'City', stationName: 'Shell', synced: false },
];

const api = loadMileageModule();
for (const fn of ['computeMileageTotals', 'costPerKm', 'groupTotals']) {
  if (typeof api[fn] !== 'function') {
    console.error(`FAIL  mileage.ts does not export ${fn}()`);
    failures += 1;
  }
}
if (failures > 0) process.exit(1);

console.log('Mileage math check\n');
console.log('-- full-tank-to-full-tank economy --');
const t = api.computeMileageTotals(logs);
check('distance', t.distance, 260);
check('litres', t.litres, 27);
check('kmPerLitre', t.kmPerLitre, 9.63);
check('segments', t.segments, 2);

console.log('\n-- the old formula must produce a different (wrong) number --');
let oldDist = 0;
let oldFuel = 0;
let prev = null;
for (const l of logs) {
  const d = prev === null ? 0 : l.odometer - prev;
  if (l.isFullTank && d > 0) {
    oldDist += d;
    oldFuel += l.fuelAmount;
  }
  prev = l.odometer;
}
const oldRatio = Number((oldDist / oldFuel).toFixed(2));
check('old ratio reproduced', oldRatio, 5.91);
console.log(`      old reads ${oldRatio} km/L vs correct ${t.kmPerLitre} km/L`);
if (oldRatio === t.kmPerLitre) {
  console.error('FAIL  regression scenario no longer distinguishes the two formulas');
  failures += 1;
}

console.log('\n-- insufficient data must be null, never 0 --');
check('single log', api.computeMileageTotals([logs[0]]).kmPerLitre, null);
check('no full tanks', api.computeMileageTotals(logs.filter((l) => !l.isFullTank)).kmPerLitre, null);
check('empty set', api.computeMileageTotals([]).kmPerLitre, null);

console.log('\n-- order independence --');
check(
  'shuffled input matches sorted',
  api.computeMileageTotals([logs[3], logs[0], logs[4], logs[2], logs[1]]).kmPerLitre,
  t.kmPerLitre
);

console.log('\n-- costPerKm --');
check('costPerKm', api.costPerKm(logs), Number((3871 / 260).toFixed(2)));
check('single log', api.costPerKm([logs[0]]), null);
check('zero distance', api.costPerKm([
  { ...logs[0], odometer: 500 },
  { ...logs[1], odometer: 500 },
]), null);

console.log('\n-- groupTotals --');
const g = api.groupTotals(logs, (l) => l.stationName);
check('litres sum to total', [...g.values()].reduce((s, v) => s + v.litres, 0), 39);
check('shares sum to ~100', [...g.values()].reduce((s, v) => s + v.litresShare, 0), 99.9);
const hasEconomyField = [...g.values()].some((v) => 'kmPerLitre' in v || 'avgMileage' in v);
if (hasEconomyField) {
  console.error('FAIL  groupTotals exposes a per-group km/L, which is not attributable');
  failures += 1;
} else {
  console.log('PASS  groupTotals exposes no per-group km/L');
}

if (failures > 0) {
  console.log(`\n${failures} CHECK(S) FAILED`);
  process.exit(1);
}
console.log('\nMileage math OK.');
