# Forge Desktop contributor guide

## Architecture

- `src/` is the React 19 + TypeScript interface. Pages are routed in `src/App.tsx`; focused feature modules live in `src/components/`.
- `src/db.ts` is the local repository boundary. The web preview uses Dexie/IndexedDB; the Tauri build additionally initializes the official SQL plugin and mirrors durable snapshots to SQLite.
- `src/domain/` contains pure productivity rules (XP, streaks, workload, achievements, schedules). Keep these functions deterministic and independently testable.
- `src-tauri/` is the Tauri 2 macOS shell. Rust should remain small: shell configuration, plugin registration, and native capabilities only.
- `tests/` contains unit tests for domain rules and persistence-safe transformations. `e2e/` contains Playwright smoke flows.

## Commands

- `npm run dev` — browser development preview.
- `npm run tauri:dev` — native macOS development app.
- `npm run build` — TypeScript and Vite production build.
- `npm run tauri:build` — standalone macOS bundle/DMG.
- `npm run lint` — ESLint with zero warnings.
- `npm run typecheck` — TypeScript project checks.
- `npm test` — deterministic domain unit tests.
- `npm run test:e2e` — Playwright smoke tests.
- `npm run rust:check` — validate the native shell.

## Coding standards

- TypeScript strict mode; avoid `any` and validate imported/untrusted data with Zod.
- Prefer small reusable components and pure domain functions over page-local business rules.
- Use semantic HTML, labelled controls, visible focus states, keyboard access, and reduced-motion support.
- Dates stored in records use local `yyyy-MM-dd`; timestamps use ISO 8601 UTC strings.
- Never hide destructive behavior behind an unlabeled icon. Confirm deletion and replacement imports.
- Do not add network calls, analytics, authentication, ads, or paid services.

## Data rules

- SQLite is authoritative in a packaged Tauri app; IndexedDB is a browser-development fallback.
- Data remains local unless the user explicitly exports a backup.
- Schema changes must be additive or migration-backed. Never silently discard existing fields.
- XP awards are immutable ledger entries with a unique source key, preventing duplicate rewards.
- Habit check-ins are unique per habit and local calendar day. Frozen/skipped/rest days never award XP.
- Imports are validated before replacement. Export format includes schema version and timestamp.

## Testing expectations

- Every new rule needs a unit test, especially streak, XP, recurrence, workload, and migration logic.
- Before handoff run lint, typecheck, unit tests, production build, and `cargo check`.
- Important flows require Playwright coverage: first launch, task completion, habit creation, focus session, export/import.
- Verify light/dark themes, keyboard navigation, reduced motion, narrow MacBook widths, and restart persistence.

