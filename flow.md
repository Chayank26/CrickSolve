# System Workflow & Execution Order - CrickSolve 🏏

This document traces the complete execution flow, entry points, component hierarchy, and function call sequences of the CrickSolve application.

---

## Current Status: Phase 19 (Interactive In-Place Shimmer Glare & 3D Card Flip Unlock Hint Mechanics)

### 1. Code Entry Point
- **Root Page (`src/app/page.tsx`)**: Renders `Header`, `AttributeCards.tsx` (with in-place glare FX & shutter flip), `PlayerSearch.tsx` (with `USE HINT` trigger), `NumericHintsTable.tsx`, and Modals.

---

### 2. Execution Order & Hint Unlock Flow
1. **Hint Activation Trigger (`PlayerSearch.tsx`)**:
   - Available after 4 incorrect guesses (`guesses.length >= 4`).
   - Clicking **`USE HINT`** activates `isHintSelecting = true`.
2. **In-Place Shimmer Glare FX (`AttributeCards.tsx`)**:
   - All locked attribute cards (*Country, Batting Hand, Bowling Style, Role, IPL Team, Retired*) start shining with animated gradient glare sweeps and `CLICK TO UNLOCK 💡` text prompts.
3. **Click-to-Unlock 3D Shutter Flip**:
   - Player clicks desired locked attribute card -> triggers 3D shutter flip (`rotateY: [0, 90, 0]`) revealing target player value in Neon Lime (`#CCFF00`).
   - `isHintSelecting` mode completes and game resumes normal play.

---

### 3. Component Architecture Graph (Phase 19)
```
PlayerSearch.tsx (USE HINT trigger)
       │
       └──> Triggers isHintSelecting Mode
                 │
                 └──> AttributeCards.tsx (Locked cards shine with glare sweep FX)
                            │
                            └──> Player Clicks Locked Card
                                      │
                                      └──> 3D Shutter Card Flip ──> Unlocks Value in Neon Lime (#CCFF00)
```
