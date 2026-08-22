# System Workflow & Execution Order - CrickSolve 🏏

This document traces the complete execution flow, entry points, component hierarchy, and function call sequences of the CrickSolve application.

---

## Current Status: Phase 3 (Core Anti-Cheat Game Engine & Server API Routes)

### 1. Code Entry Point
- **Root Layout & Page (`src/app/layout.tsx`, `src/app/page.tsx`)**: Entry point for UI shell.
- **Server API Routes**:
  - `GET /api/puzzle/daily`: Daily puzzle metadata endpoint.
  - `POST /api/puzzle/guess`: Server-side guess evaluation endpoint.
  - `GET /api/puzzle/unlimited`: Random practice player endpoint.
- **Client State Store (`src/store/useGameStore.ts`)**: Zustand store managing state, streaks, and guess history.
- **Game Engine (`src/lib/game-engine.ts`)**: Pure logic engine for date hashing, stat comparison, and tactical hints.

---

### 2. Execution Order
1. **User Selects Player Guess**:
   - User searches player via autocomplete dropdown and submits guess.
2. **API Call (`POST /api/puzzle/guess`)**:
   - Client sends `{ guessedPlayerId, date, category, mode }` to server.
3. **Server Evaluation (`src/lib/game-engine.ts`)**:
   - Server resolves daily mystery player target via `getDailyTargetPlayer(date, category)`.
   - Runs `evaluatePlayerGuess()` to compare attributes (`country`, `battingHand`, `bowlingType`, `role`, `iplTeam`, `retired`) and numeric stats (`birthYear`, `tests`, `odis`, `t20is`).
4. **State Dispatch & Persistence (`src/store/useGameStore.ts`)**:
   - API returns `GuessEvaluation` payload.
   - Client calls `addGuess(evaluation)` on Zustand store.
   - Zustand recalculates streak, win/loss status, and syncs to `localStorage`.

---

### 3. Function & Module Call Graph (Phase 3)
```
[User Action: Submit Guess]
       │
       ▼
Client Store: addGuess() (src/store/useGameStore.ts)
       │
       ▼
Fetch HTTP: POST /api/puzzle/guess (src/app/api/puzzle/guess/route.ts)
       │
       ├──> Calls getDailyTargetPlayer() (src/lib/game-engine.ts)
       │      └──> Runs deterministic date hash algorithm
       │
       ├──> Calls evaluatePlayerGuess() (src/lib/game-engine.ts)
       │      ├──> Runs compareNumeric() for Birth Year, Tests, ODIs, T20Is
       │      └──> Checks attempt number >= 4 for tactical hint unlock
       │
       ▼
Returns GuessEvaluation JSON
       │
       ▼
Updates Zustand Store State + localstorage
```
