# System Workflow & Execution Order - CrickSolve 🏏

This document traces the complete execution flow, entry points, component hierarchy, and function call sequences of the CrickSolve application.

---

## Current Status: Phase 4 (Modern Glassmorphic UI & Game Components)

### 1. Code Entry Point
- **Root Page (`src/app/page.tsx`)**: Assembles header and core interactive grid layout.
- **Component Sub-tree**:
  - `Header.tsx`: Responsive navigation bar, streak counter, sound control, modal triggers.
  - `AttributeCards.tsx`: Render engine for Country, Batting Hand, Bowling Type, Role, IPL Team, and Retired cards.
  - `PlayerSearch.tsx`: Fuzzy search input box with dropdown autocomplete and keyboard event handlers.
  - `NumericHintsTable.tsx`: Tabular output for Birth Year, Tests, ODIs, T20Is numeric stat comparisons.

---

### 2. Execution Order & Component Lifecycle
1. **Root Page Hydration (`src/app/page.tsx`)**:
   - Page mounts and connects to `useGameStore`.
2. **`AttributeCards` Render**:
   - Reads `guesses` array from `useGameStore`.
   - Maps over 6 attribute keys, checking for correct attribute matches.
   - Triggers Framer Motion 3D card flips (`rotateY`) on newly discovered attributes.
3. **`PlayerSearch` Autocomplete**:
   - Initializes Fuse.js index over `PLAYERS` dataset (filtered by active category).
   - On user input, computes fuzzy matches, excluding previously guessed player IDs.
   - On item click or Enter key, sends POST to `/api/puzzle/guess`.
4. **`NumericHintsTable` Render**:
   - Maps over `guesses` log in chronological order.
   - Evaluates `birthYear`, `tests`, `odis`, `t20is` comparisons and renders directional indicators (`↑`, `↓`, `✓`).

---

### 3. Component Hierarchy & Data Flow (Phase 4)
```
src/app/page.tsx (Main Layout Container)
       │
       ├──> Header.tsx (Navbar, Streak Badge, Mode Controls)
       │      └──> Reads & Updates useGameStore (gameMode, soundEnabled, activeModal)
       │
       ├──> AttributeCards.tsx (6 Attribute Unlock Tiles)
       │      └──> Reads useGameStore (guesses) -> Triggers Framer Motion flip
       │
       ├──> PlayerSearch.tsx (Fuzzy Autocomplete Input)
       │      ├──> Uses Fuse.js fuzzy index
       │      ├──> Posts guess to /api/puzzle/guess
       │      └──> Calls addGuess() on useGameStore
       │
       └──> NumericHintsTable.tsx (Numeric Stat Comparison Log)
              └──> Renders stat direction indicators (Higher/Lower/Match)
```
