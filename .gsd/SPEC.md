# SPEC.md
STATUS: FINALIZED

## Objective
Implement a "Hub and Spoke" modern architectural UI/UX for the N250 Motorcycle Tracker, transforming it from a simple tabbed form app into a Google-tier vehicle telemetry dashboard.

## Requirements
1. **Dashboard (Hub):** Bento-box style layout. Top metrics, smart alerts (maintenance due), and unified chronological activity feed (trips + fuel + service). Global Floating Action Button for all new entries.
2. **Navigation:** Condense the bottom nav into exactly 4 pillars: Dashboard (Hub), Telemetry (Fuel/Charts), Garage (Services/Gear), and Profile (Trips/Settings/Vault).
3. **UX Improvements:** Glassmorphism, smooth micro-animations, electric red/neon cyan accents.
4. **Prerequisite:** Resolve existing TypeScript compilation errors in `page.tsx` before executing new layouts.
