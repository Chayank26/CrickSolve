# System Workflow & Execution Order - CrickSolve 🏏

This document traces the complete execution flow, entry points, component hierarchy, and function call sequences of the CrickSolve application.

---

## Current Status: Phase 18 (Removal of Format Category Mode & Header Rank Showcase Badge)

### 1. Code Entry Point
- **Root Page (`src/app/page.tsx`)**: Renders `Header`, 2-Column Neubrutalist Main Layout (`AttributeCards.tsx` on Left; `PlayerSearch.tsx` and `NumericHintsTable.tsx` on Right), and Modals.

---

### 2. Execution Order & Layout Flow
1. **Header Component (`Header.tsx`)**:
   - `CRICKSOLVE` Neon Yellow logo banner (`#CCFF00`), `DAILY #142` badge, `STREAK` counter badge, and action buttons (*DAILY MODE, UNLIMITED, PAST GAMES, YOUR STATS, LEADERBOARD*). Format category dropdown and rank showcase badge have been removed.
2. **Left Column (`AttributeCards.tsx`)**:
   - Mystery Player Card with 6 unlockable attribute cards (*Country, Batting Hand, Bowling Style, Role, IPL Team, Retired*) and `#7E22CE` photo silhouette unblur preview.
3. **Right Column (`PlayerSearch.tsx` & `NumericHintsTable.tsx`)**:
   - Deep Purple (`#7E22CE`) Search Container with search across all 424 players & Neon Yellow `GUESS (X/7)` button.
   - Neubrutalist Numeric Hints Table (`GUESS`, `BIRTH`, `TESTS`, `ODIS`, `T20IS` with stat arrows `↑`/`↓`).

---

### 3. Component Architecture Graph (Phase 18)
```
src/app/page.tsx (Neubrutalism Dot-Grid 2-Column Layout)
       │
       ├──> Header.tsx (CRICKSOLVE Neon Yellow Logo, Clean Badges & Action Buttons)
       ├──> Left Column (lg:col-span-5)
       │      └──> AttributeCards.tsx (6 Unlockable Neubrutalist Attribute Cards + Silhouette Reveal)
       └──> Right Column (lg:col-span-7)
              ├──> PlayerSearch.tsx (Purple Search Container across 424 Players & GUESS Button)
              └──> NumericHintsTable.tsx (Numeric Hints Table: Birth, Tests, ODIs, T20Is)
```
