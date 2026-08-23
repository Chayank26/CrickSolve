# System Workflow & Execution Order - CrickSolve 🏏

This document traces the complete execution flow, entry points, component hierarchy, and function call sequences of the CrickSolve application.

---

## Current Status: Phase 9 (Neubrutalism Retro Arcade UI Transformation)

### 1. Code Entry Point
- **Root Page (`src/app/page.tsx`)**: Renders `bg-dot-grid` background wrapping `Header`, `PlayerSearch`, `GuessesGrid`, `SilhouetteReveal`, and Modal overlays.

---

### 2. Execution Order & Layout Flow
1. **Header Mount (`Header.tsx`)**:
   - Renders **CRICKSOLVE** Neon Lime header banner (`bg-[#CCFF00] border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`).
   - Renders `DAILY #`, `STREAK: X`, `RANK: #422` top stat boxes.
   - Renders `DAILY MODE`, `UNLIMITED`, `PAST GAMES` tabs and `LEADERBOARD` action button.
2. **Input Block (`PlayerSearch.tsx`)**:
   - Renders Purple container (`bg-[#6B21A8]`) with white input field and Neon Lime `GUESS (x/7)` button.
3. **Guesses Grid (`GuessesGrid.tsx`)**:
   - Renders horizontal row grid with black player name blocks (`bg-black text-white`), grey/lime/orange attribute tiles, directional stat arrows (`1989 ↓`), and bottom `UNLOCK HINT` bar.
4. **Silhouette Unblur (`SilhouetteReveal.tsx`)**:
   - Renders photo silhouette container with dynamic hardware-accelerated CSS `filter: blur()`.

---

### 3. Component Architecture Graph (Phase 9)
```
src/app/page.tsx (bg-dot-grid background)
       │
       ├──> Header.tsx (CRICKSOLVE Neon Lime banner, Daily/Streak/Rank badges, Mode tabs)
       ├──> PlayerSearch.tsx (Purple bg-[#6B21A8] input block & Neon Lime GUESS button)
       ├──> GuessesGrid.tsx (Black player name blocks, Lime/Orange attribute tiles, Hint bar)
       └──> SilhouetteReveal.tsx (Hardware-accelerated CSS blur unblur engine)
```
