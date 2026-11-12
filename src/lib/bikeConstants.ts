/**
 * Single source of truth for all bike-specific constants.
 * Every component must import from here — no magic numbers.
 */

// ── Delivery ────────────────────────────────────────────────
export const DELIVERY_DATE = '2026-05-24';
export const DELIVERY_DATE_MS = new Date(`${DELIVERY_DATE}T00:00:00`).getTime();
export const DELIVERY_ODO = 20; // km on the clock at delivery

// ── Tank ────────────────────────────────────────────────────
export const TANK_LITRES = 14;

// ── Warranty ────────────────────────────────────────────────
export const WARRANTY_YEARS = 5;
export const WARRANTY_KM = 75_000;
export const WARRANTY_END_MS = new Date('2031-05-24T00:00:00').getTime();

// ── Fuel price fallback (when no logs yet) ──────────────────
export const FALLBACK_FUEL_PRICE = 112.13;
