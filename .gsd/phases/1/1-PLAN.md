---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Fix TypeScript Mismatches

## Objective
To stabilize the codebase before the UI refactor, we must fix the TypeScript compilation errors introduced by the monolithic state refactor in `page.tsx` and its child components.

## Context
- .gsd/SPEC.md
- src/app/page.tsx
- src/components/fuel/LogsView.tsx
- src/components/dashboard/DashboardView.tsx
- src/components/layout/Header.tsx
- src/components/layout/Navigation.tsx
- src/components/modals/PreFlightModal.tsx
- src/components/modals/SetupGuideModal.tsx
- src/components/modals/QuickLogModal.tsx
- src/components/service/ServiceLogsView.tsx
- src/components/trips/TripsView.tsx

## Tasks

<task type="auto">
  <name>Align component props</name>
  <files>src/app/page.tsx</files>
  <action>
    Fix interface prop mismatches where `page.tsx` is passing props that do not exist on the child component (e.g., passing `onDelete` to `LogsView` which expects `onDeleteLog`, passing `accessories` to `ServiceLogsView` which doesn't define it in props). Also fix `onTabChange` to match `NavigationProps`. Fix QuickLogModal and PreFlightModal props to match the components.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Zero compilation errors</done>
</task>

## Success Criteria
- [ ] `npx tsc --noEmit` exits with code 0.
