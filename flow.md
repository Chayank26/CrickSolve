# System Workflow & Execution Order - CrickSolve 🏏

This document traces the complete execution flow, entry points, component hierarchy, and function call sequences of the CrickSolve application.

---

## Current Status: Phase 12 (`T20IS` Column Restoration & Attribute Match Celebration Pop Animation)

### 1. Code Entry Point
- **Guesses Grid (`src/components/GuessesGrid.tsx`)**: Renders row layout containing all 10 attribute columns (`COUNTRY`, `ROLE`, `BATTING`, `BIRTH`, `TESTS`, `ODIS`, `T20IS`, `IPL TEAM`, `RETIRED?`).

---

### 2. Execution Order & Staggered Reveal Animation
1. **Guess Submission**:
   - Player submits cricketer -> evaluates against daily mystery target.
2. **Spring Flip Reveal (`FlipTile`)**:
   - `COUNTRY` (delay 0.08s) ──> `ROLE` (delay 0.16s) ──> `BATTING` (delay 0.24s) ──> `BIRTH` (delay 0.32s) ──> `TESTS` (delay 0.40s) ──> `ODIS` (delay 0.48s) ──> `T20IS` (delay 0.56s) ──> `IPL TEAM` (delay 0.64s) ──> `RETIRED?` (delay 0.72s).
   - Attribute Match (`isMatched === true`) triggers celebratory `scale: [0.7, 1.18, 1.0]` pop animation turning Neon Lime (`#CCFF00`).

---

### 3. Component Layout (Phase 12)
```
GuessesGrid.tsx (12-column grid layout)
       │
       ├──> Player Name Block (Black box, GUESS # label)
       ├──> FlipTile (Country - 0.08s delay)
       ├──> FlipTile (Role - 0.16s delay)
       ├──> FlipTile (Batting - 0.24s delay)
       ├──> FlipTile (Birth Year - 0.32s delay)
       ├──> FlipTile (Tests - 0.40s delay)
       ├──> FlipTile (ODIs - 0.48s delay)
       ├──> FlipTile (T20Is - 0.56s delay) [Brought Back!]
       ├──> FlipTile (IPL Team - 0.64s delay)
       └──> FlipTile (Retired? - 0.72s delay)
```
