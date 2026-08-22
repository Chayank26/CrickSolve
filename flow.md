# System Workflow & Execution Order - CrickSolve 🏏

This document traces the complete execution flow, entry points, component hierarchy, and function call sequences of the CrickSolve application.

---

## Current Status: Phase 8 (PWA, Final Polish & Verification)

### 1. Code Entry Point
- **Root Layout (`src/app/layout.tsx`)**: Global document metadata, font injection, theme color, and PWA manifest link (`/manifest.json`).
- **Web App Manifest (`public/manifest.json`)**: Mobile standalone app configuration.
- **Root Page (`src/app/page.tsx`)**: Master layout container for all game sections and modal components.

---

### 2. Execution Order & Complete System Flow
1. **PWA Standalone Mount**:
   - Browser reads `manifest.json` and configures standalone theme `#020617`.
2. **Page & State Initialization**:
   - Next.js server mounts `src/app/layout.tsx` -> `src/app/page.tsx`.
   - Zustand store hydrates saved `streak`, `guesses`, `gameMode`, `category`, and `currentDate` from `localStorage`.
3. **Interactive Game Cycle**:
   - `CategorySelector`: Switches format filters (*International, IPL, Legends, Women's*).
   - `PlayerSearch`: Fuzzy search with Fuse.js -> submits guess to `/api/puzzle/guess`.
   - `AttributeCards`: Triggers Framer Motion 3D card flips (`rotateY`) on attribute matches.
   - `NumericHintsTable`: Displays directional stat comparisons (`↑`, `↓`, `✓`).
   - `SilhouetteReveal`: Computes dynamic CSS `blur()` unblur effect.
   - `Howler.js`: Plays Web Audio sound FX (`flipSound`, `winSound`).
4. **Game End & Leaderboard**:
   - `ResultModal`: Fires `canvas-confetti` explosion on victory -> posts finish to `/api/leaderboard` (Supabase PostgreSQL).
   - `ShareGridModal`: Formats and copies Wordle emoji scorecard to clipboard.
   - `CalendarModal`: Allows historical date selection and puzzle replay.

---

### 3. Final Master Architecture & Dependency Graph
```
[User Browser / PWA Client]
       │
       ▼
src/app/layout.tsx (Theme, Fonts, PWA Manifest)
       │
       ▼
src/app/page.tsx (Master Layout)
       │
       ├──> CategorySelector.tsx ──> Updates useGameStore (category)
       ├──> SilhouetteReveal.tsx (CSS filter: blur() unblur engine)
       ├──> AttributeCards.tsx (Framer Motion 3D Card Flips)
       ├──> PlayerSearch.tsx (Fuse.js Autocomplete)
       │      └──> POST /api/puzzle/guess (Server Anti-Cheat Engine)
       ├──> NumericHintsTable.tsx (Stat Comparison Log)
       ├──> HowToModal.tsx
       ├──> CalendarModal.tsx (Replay Past Puzzles)
       ├──> ResultModal.tsx ──> POST /api/leaderboard (Supabase DB)
       │      └──> canvas-confetti particle animation
       ├──> StatsModal.tsx (Win Rate % & Streak Metrics)
       └──> ShareGridModal.tsx (Wordle Emoji Scorecard Copy)
```
