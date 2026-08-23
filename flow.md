# System Workflow & Execution Order - CrickSolve 🏏

This document traces the complete execution flow, entry points, component hierarchy, and function call sequences of the CrickSolve application.

---

## Current Status: Phase 13 (Interactive Attribute Hint Picker & Dynamic Standing Rank Display)

### 1. Code Entry Point
- **Root Page (`src/app/page.tsx`)**: Renders `Header`, `PlayerSearch`, `GuessesGrid`, `SilhouetteReveal`, and `AttributeHintPickerModal`.

---

### 2. Execution Order & Updated Mechanics
1. **Interactive Attribute Hint Picker (`AttributeHintPickerModal.tsx`)**:
   - Unlocks after 4 incorrect guesses (`guesses.length >= 4`).
   - Clicking **UNLOCK HINT** opens modal listing all target player attributes (*Country, Role, Batting Hand, Birth Year, IPL Team, Retired Status*).
   - Player clicks desired attribute -> reveals exact value (e.g. `Country: India`) in Neon Lime banner.
2. **Dynamic Standing Rank Calculation (`Header.tsx`)**:
   - `LeaderboardModal.tsx` evaluates user's solve time & attempts position in sorted leaderboard array.
   - Updates `userRank` in store (`setUserRank(index + 1)`).
   - Top Header displays **`STANDING: #1`** (or `UNRANKED` if not yet solved today).

---

### 3. Component Architecture Graph (Phase 13)
```
src/app/page.tsx
       │
       ├──> Header.tsx (Displays dynamic YOUR STANDING: #X rank badge & Leaderboard trigger)
       ├──> PlayerSearch.tsx (Fuzzy autocomplete cricketer search input)
       ├──> GuessesGrid.tsx (12-column grid layout, triggers AttributeHintPickerModal)
       ├──> AttributeHintPickerModal.tsx (Interactive target attribute selection picker)
       └──> LeaderboardModal.tsx (Calculates userRank position in sorted solve-time array)
```
