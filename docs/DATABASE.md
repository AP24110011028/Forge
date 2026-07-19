# Database and safety

Migration `src-tauri/migrations/0001_initial.sql` creates normalized tables for habits, actions, results, freezes, XP, focus sessions, achievements, challenges, academics, projects, learning, planning, reviews, settings, and snapshots. Foreign keys and uniqueness constraints protect dependent records and XP source keys.

Browser preview data uses IndexedDB database `ForgeDB`. Native startup loads `sqlite:pujiflow.db`, validates the stored JSON snapshot with Zod, and hydrates IndexedDB. Mutations schedule a debounced SQLite upsert. JSON imports are validated before a confirmed replacement transaction; exports include a schema version and UTC timestamp.
