# System Workflow & Execution Order - CrickSolve 🏏

This document traces the complete execution flow, entry points, component hierarchy, and function call sequences of the CrickSolve application.

---

## Current Status: Phase 10 (Fastest Solve-Time Leaderboard, First-Land How-To & Streak Persistence)

### 1. Code Entry Point
- **Root Page (`src/app/page.tsx`)**: Renders `bg-dot-grid` background wrapping game components and unified Neubrutalist modals (`LeaderboardModal`, `HowToModal`, `ResultModal`, `StatsModal`, `CalendarModal`, `ShareGridModal`).

---

### 2. Execution Order & Updated Game Flow
1. **Initial Landing (`HowToModal.tsx`)**:
   - First-time visitors are presented with the **How to Play** modal (`activeModal: 'howTo'`).
   - Clicking **"GOT IT, LET'S PLAY!"** sets `hasSeenHowTo: true` and closes modal to start playing.
2. **Timer Initialization**:
   - `startTimeMs` is recorded on **Guess #1**.
3. **Winning & Solve Time Computation**:
   - On winning guess, `endTimeMs` is recorded.
   - `solveTimeSecs` is calculated (`Math.round((endTimeMs - startTimeMs) / 1000)`).
   - `ResultModal` prompts player for their **Name/Nickname**.
4. **Leaderboard Push & Ranking (`LeaderboardModal.tsx`)**:
   - Submits `{ date, nickname, attempts, timeMs }` to `/api/leaderboard`.
   - `/api/leaderboard` upserts entry in Supabase and orders by `time_ms ASC, attempts ASC`.
   - Renders today's mystery player banner (Photo, Name, Country, Role), user's current streak, and sorted leaderboard rankings.

---

### 3. Final Master Architecture & Dependency Graph (Phase 10)
```
src/app/page.tsx (bg-dot-grid background)
       │
       ├──> HowToModal.tsx (First-land modal with "GOT IT, LET'S PLAY!" button)
       ├──> Header.tsx (CRICKSOLVE Neon Lime banner, Daily/Streak/Rank badges, Mode tabs)
       ├──> PlayerSearch.tsx (Purple input block, records startTimeMs on guess #1)
       ├──> GuessesGrid.tsx (Black player name blocks, Lime/Orange attribute tiles, Hint bar)
       ├──> SilhouetteReveal.tsx (Hardware-accelerated CSS blur unblur engine)
       ├──> ResultModal.tsx (Prompts name input, calculates solve time, submits to Supabase)
       └──> LeaderboardModal.tsx (Sorted by time_ms ASC, today's player photo, current streak)
```
