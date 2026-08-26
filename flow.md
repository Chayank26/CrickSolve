# System Workflow & Execution Order - CrickSolve 🏏

This document traces the complete execution flow, entry points, component hierarchy, and function call sequences of the CrickSolve application.

---

## Current Status: Phase 21 (Live On-Screen mm:ss Timer & Blank Leaderboard Name Input Box)

### 1. Code Entry Point
- **Root Page (`src/app/page.tsx`)**: Renders `Header` (with live `mm:ss` timer), 2-Column Layout (`AttributeCards.tsx` & `PlayerSearch.tsx`), `ResultModal.tsx` (with blank name input), `LeaderboardModal.tsx` (with `mm:ss` solve times), and Modals.

---

### 2. Live Timer & Name Input Flow
1. **Live On-Screen Timer (`Header.tsx`)**:
   - Displays `TIME: 00:00` before the first guess.
   - Starts ticking continuously on the first submitted guess (`startTimeMs !== null`).
   - Freezes when puzzle completes (`gameStatus !== 'IN_PROGRESS'`).
   - Standardized `mm:ss` format rendered across Header, Result Modal, and Leaderboard Modal via `formatMmSs()`.
2. **Blank Leaderboard Name Input (`ResultModal.tsx`)**:
   - `inputName` state starts empty `''` by default, leaving the input box completely blank for player entry.

---

### 3. Component Architecture Graph (Phase 21)
```
First Guess Submitted ──> Starts Live Timer Ticker (Header.tsx)
                                   │
                                   ├──> Displays TIME: mm:ss Live in Header
                                   ├──> Displays SOLVE TIME: mm:ss in ResultModal
                                   └──> Displays mm:ss in Leaderboard Table
```
