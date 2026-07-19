# Streak rules

- Done increases current and longest streak.
- Frozen preserves a run but adds no day; one freeze per habit/month is enforced by a unique key.
- Skipped is intentional rest: it preserves but does not increase a run.
- A missing scheduled day breaks the current run.
- Non-scheduled days never increase or reset a run.
- Longest streak is recalculated from preserved history and remains after a reset.

All comparisons use local `yyyy-MM-dd` dates.
