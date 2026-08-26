# System Workflow & Execution Order - CrickSolve 🏏

This document traces the complete execution flow, entry points, component hierarchy, and function call sequences of the CrickSolve application.

---

## Current Status: Phase 15 (Rich Dataset Roles, Bowling Style & Batting Hand Attribute Columns)

### 1. Code Entry Point
- **Guesses Grid (`src/components/GuessesGrid.tsx`)**: Renders 10 attribute columns (`PLAYER`, `COUNTRY`, `ROLE`, `BATTING`, `BOWLING`, `BIRTH`, `TESTS`, `ODIS`, `T20IS`, `IPL TEAM`, `RETIRED?`).

---

### 2. Execution Order & Attribute Evaluation Flow
1. **CSV Dataset Parsing (`scripts/convert-csv.js`)**:
   - Imports all 424 players preserving exact dataset roles (*Batting Allrounder, Bowling Allrounder, Spinner, Medium Pacer, Top Order Batter, Middle Order Batter, Wicketkeeper*) and bowling styles (*Right-arm Fast, Right-arm Offbreak, Legbreak, Slow Left-arm Orthodox, Does Not Bowl*).
2. **Guess Submission & Reveal (`GuessesGrid.tsx`)**:
   - Evaluates `guessedPlayer.role === targetPlayer.role`, `guessedPlayer.battingHand === targetPlayer.battingHand`, and `guessedPlayer.bowlingType === targetPlayer.bowlingType`.
   - Staggered 3D card flip reveals match colors (Neon Lime `#CCFF00` on match).

---

### 3. Component Architecture Graph (Phase 15)
```
GuessesGrid.tsx (12-column grid layout)
       │
       ├──> Player Name Block (Black box, GUESS # label)
       ├──> FlipTile (Country)
       ├──> FlipTile (Role - Batting Allrounder / Spinner / etc.)
       ├──> FlipTile (Batting - Right-hand / Left-hand)
       ├──> FlipTile (Bowling - Right-arm Fast / Offbreak / etc.)
       ├──> FlipTile (Birth Year)
       ├──> FlipTile (Tests)
       ├──> FlipTile (ODIs)
       ├──> FlipTile (T20Is)
       ├──> FlipTile (IPL Team)
       └──> FlipTile (Retired? YES/NO)
```
