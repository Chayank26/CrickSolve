# System Workflow & Execution Order - CrickSolve 🏏

This document traces the complete execution flow, entry points, component hierarchy, and function call sequences of the CrickSolve application.

---

## Current Status: Phase 16 (Restoration of Original Sleek 2-Column Glassmorphic Dark Layout)

### 1. Code Entry Point
- **Root Page (`src/app/page.tsx`)**: Renders `Header`, 2-Column Main Layout (`AttributeCards.tsx` on Left; `PlayerSearch.tsx` and `NumericHintsTable.tsx` on Right), and Modals.

---

### 2. Execution Order & Layout Flow
1. **Header Component (`Header.tsx`)**:
   - Logo `CrickSolve 🏏`, category selection dropdown, streak badge, standing rank badge, and action triggers (*How to Play, Past Games, Practice Mode, Your Stats, Leaderboard*).
2. **Left Column (`AttributeCards.tsx`)**:
   - Mystery Player Card with 6 unlockable attribute tiles (*Country, Batting Hand, Bowling Style, Role, IPL Team, Retired*) and photo silhouette unblur preview.
3. **Right Column (`PlayerSearch.tsx` & `NumericHintsTable.tsx`)**:
   - Player Search Box with Fuse.js autocomplete & `Guess` / `Use Hint` buttons.
   - Numeric Hints Table displaying player attempts with stat values and directional arrows (`↑`, `↓`, `✓`).

---

### 3. Component Architecture Graph (Phase 16)
```
src/app/page.tsx (Original 2-Column Dark Layout)
       │
       ├──> Header.tsx (CrickSolve 🏏 title, Category Dropdown, Navigation Badges & Buttons)
       ├──> Left Column (lg:col-span-5)
       │      └──> AttributeCards.tsx (6 Unlockable Attribute Cards + Silhouette Reveal)
       └──> Right Column (lg:col-span-7)
              ├──> PlayerSearch.tsx (Autocomplete Search Input & Guess/Hint Buttons)
              └──> NumericHintsTable.tsx (Numeric Hints Table: Birth, Tests, ODIs, T20Is)
```
