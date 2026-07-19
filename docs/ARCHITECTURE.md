# Architecture

Forge is a React 19/TypeScript interface inside a Tauri 2 macOS shell. `src/db.ts` is the repository boundary: Dexie provides reactive queries and browser-preview persistence; `src/native.ts` hydrates and transactionally mirrors validated snapshots to SQLite in Tauri. Pure scheduling, streak, XP, workload, and scoring rules live outside components.

The UI is routed through `src/App.tsx`, with focused feature surfaces in `src/components/`. The Rust shell only registers SQL, filesystem, dialog, and notification capabilities. No network service is required.

Known architectural debt: normalized SQL tables are migrated and indexed, but the current repository persists its authoritative application state as a single SQLite snapshot. A future migration can write normalized rows behind the same repository boundary without changing page components.
