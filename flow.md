# System Workflow & Execution Order - CrickSolve 🏏

This document traces the complete execution flow, entry points, component hierarchy, and function call sequences of the CrickSolve application.

---

## Current Status: Phase 11 (`RETIRED?` Attribute Column & Staggered 3D Card Flip Animation)

### 1. Code Entry Point
- **Guesses Grid (`src/components/GuessesGrid.tsx`)**: Renders row layout containing 9 attribute columns (`COUNTRY`, `ROLE`, `BATTING`, `BIRTH`, `TESTS`, `ODIS`, `IPL TEAM`, `RETIRED?`).

---

### 2. Execution Order & Tile Flip Animation Flow
1. **Guess Submission**:
   - Player selects cricketer -> submits guess.
2. **Staggered 3D Card Flip (`FlipTile`)**:
   - Tile 1 (`COUNTRY`): Flips at `delay: 0.1s` (`rotateY: 90` -> `0`).
   - Tile 2 (`ROLE`): Flips at `delay: 0.2s`.
   - Tile 3 (`BATTING`): Flips at `delay: 0.3s`.
   - Tile 4 (`BIRTH`): Flips at `delay: 0.4s`.
   - Tile 5 (`TESTS`): Flips at `delay: 0.5s`.
   - Tile 6 (`ODIS`): Flips at `delay: 0.6s`.
   - Tile 7 (`IPL TEAM`): Flips at `delay: 0.7s`.
   - Tile 8 (`RETIRED?`): Flips at `delay: 0.8s` (displaying `YES` or `NO` with match color).

---

### 3. Final Master Architecture & Dependency Graph (Phase 11)
```
GuessesGrid.tsx (12-column grid layout)
       │
       ├──> Player Name Block (Black background box, GUESS # label)
       ├──> FlipTile (Country - 0.1s stagger delay)
       ├──> FlipTile (Role - 0.2s stagger delay)
       ├──> FlipTile (Batting - 0.3s stagger delay)
       ├──> FlipTile (Birth Year - 0.4s stagger delay)
       ├──> FlipTile (Tests - 0.5s stagger delay)
       ├──> FlipTile (ODIs - 0.6s stagger delay)
       ├──> FlipTile (IPL Team - 0.7s stagger delay)
       └──> FlipTile (Retired? YES/NO - 0.8s stagger delay)
```
