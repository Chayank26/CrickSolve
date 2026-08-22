# System Workflow & Execution Order - CrickSolve 🏏

This document traces the complete execution flow, entry points, component hierarchy, and function call sequences of the CrickSolve application.

---

## Current Status: Phase 6 (Game Modes & Past Games Calendar)

### 1. Code Entry Point
- **Page Layout (`src/app/page.tsx`)**: Renders `CategorySelector` and `CalendarModal`.
- **Game State Store (`src/store/useGameStore.ts`)**: Handles `syncDailyDate` and `setCategory` state updates.

---

### 2. Execution Order & Category / Calendar Flow
1. **Category Switch (`CategorySelector.tsx`)**:
   - User clicks category pill (*IPL Stars, Legends, Women's Cricket*).
   - Calls `setCategory(cat.id)` on Zustand store.
   - Resets guess history and updates Fuse.js autocomplete pool dynamically.
2. **Past Puzzle Selection (`CalendarModal.tsx`)**:
   - User clicks `Past Games` in header.
   - Selects a past date (e.g. `2026-08-15`).
   - Calls `syncDailyDate('2026-08-15')`.
   - `useGameStore` updates `currentDate` and loads corresponding puzzle seed.

---

### 3. Component Hierarchy & Data Flow (Phase 6)
```
src/app/page.tsx
       │
       ├──> CategorySelector.tsx ──> Updates useGameStore (category)
       ├──> SilhouetteReveal.tsx
       ├──> AttributeCards.tsx
       ├──> PlayerSearch.tsx
       ├──> NumericHintsTable.tsx
       ├──> HowToModal.tsx
       └──> CalendarModal.tsx ──> Updates useGameStore (currentDate via syncDailyDate)
```
