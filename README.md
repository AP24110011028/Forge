# Forge

Forge is a free, private, offline-first personal productivity app made for Poojitha’s GATE preparation, Semester 5, AI Engineer roadmap, health, family time, commute study, projects, and daily discipline.

## Quick start

You need Node.js 22 or newer. Native builds also require Rust and the macOS Xcode command-line tools.

```bash
npm install
npm run dev
npm run tauri:dev
```

Open the local address shown in the terminal (usually `http://localhost:5173`).

## Useful commands

```bash
npm run dev        # start the development app
npm run typecheck  # check TypeScript
npm run lint       # check code quality
npm run build      # create the production app in dist/
npm run preview    # preview the production build
```

## Your data and backups

In the packaged Tauri app, durable snapshots are mirrored to `pujiflow.db` through the official SQL plugin; IndexedDB is the browser preview and reactive repository. Forge has no login, cloud database, paid API, analytics tracker, or subscription.

- Export: open **Settings → Export JSON backup** and save the file somewhere safe.
- Import: open **Settings → Import JSON**, select a Forge backup, and confirm replacement.
- Reset: **Reset demo data** restores the original habits and study plans.
- Clearing browser/site data also deletes Forge data, so export first.

## Native macOS build and installation

Run `npm run tauri:build`. Tauri writes the `.app` and, when supported by the host toolchain, DMG under `src-tauri/target/release/bundle/`. Local builds are unsigned; if Gatekeeper blocks one, Control-click the app, choose **Open**, verify that it is your local build, then confirm **Open**. Paid notarization is intentionally out of scope.

## Main folders

```text
src/             React interface, repository, and deterministic domain rules
src-tauri/       Tauri 2 shell, SQL migration, native capabilities
tests/           Deterministic domain tests
docs/            Architecture, data, rules, testing, and user guides
```

## Notes

Closed-app recurring reminder scheduling is not yet implemented; focus-complete notifications work in the native shell. JSON import/export is the portable backup format. The current SQLite integration stores an authoritative transactional snapshot rather than mapping every repository mutation into the normalized SQL tables. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
