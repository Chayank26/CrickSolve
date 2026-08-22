# System Workflow & Execution Order - CrickSolve 🏏

This document traces the complete execution flow, entry points, component hierarchy, and function call sequences of the CrickSolve application.

---

## Current Status: Phase 7 (Supabase Leaderboard, User Analytics & Dynamic Score Share)

### 1. Code Entry Point
- **Page Layout (`src/app/page.tsx`)**: Integrates `ResultModal`, `StatsModal`, `ShareGridModal`.
- **Leaderboard API (`src/app/api/leaderboard/route.ts`)**: GET/POST endpoints interfacing with Supabase PostgreSQL `leaderboard` table.

---

### 2. Execution Order & Score Submission Flow
1. **Game Completion (`useGameStore.ts`)**:
   - When last guess is submitted, `addGuess()` checks if correct or attempts limit reached.
   - Sets `gameStatus` to `'WON'` or `'LOST'`.
   - Opens `ResultModal` (`activeModal = 'result'`).
2. **Victory Celebration & Leaderboard Push (`ResultModal.tsx`)**:
   - Triggers `canvas-confetti` particle animation on win.
   - Posts score `{ date, userId, nickname, attempts, timeMs }` to `/api/leaderboard`.
   - `/api/leaderboard` upserts entry into Supabase PostgreSQL table.
3. **Social Sharing (`ShareGridModal.tsx`)**:
   - Maps player's guess history into emoji scorecard grid (`🟩`, `🟨`, `⬛`, `⬆️`, `⬇️`).
   - Copies text block to user's system clipboard via `navigator.clipboard.writeText()`.

---

### 3. Component Hierarchy & Data Flow (Phase 7)
```
src/app/page.tsx
       │
       ├──> ResultModal.tsx ──> Posts score to /api/leaderboard -> Supabase DB
       │      └──> Fires canvas-confetti particle engine
       ├──> StatsModal.tsx (Renders win rate % and streak metrics)
       └──> ShareGridModal.tsx (Formats & copies emoji scorecard to clipboard)
```
