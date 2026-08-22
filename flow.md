# System Workflow & Execution Order - CrickSolve 🏏

This document traces the complete execution flow, entry points, component hierarchy, and function call sequences of the CrickSolve application.

---

## Current Status: Phase 5 (Silhouette Reveal, Tactical Hints & Audio FX)

### 1. Code Entry Point
- **Page Layout (`src/app/page.tsx`)**: Integrates `SilhouetteReveal` and `HowToModal`.
- **Audio Engine (`src/lib/audio.ts`)**: Initializes Howler sound buffers for flip and victory chimes.

---

### 2. Execution Order & Audio / Visual Pipeline
1. **Silhouette Image Computation (`SilhouetteReveal.tsx`)**:
   - Reads `guesses.length` from `useGameStore`.
   - Computes `blurAmount = Math.max(0, 24 - attemptCount * 4)`.
   - Passes CSS blur filter to Framer Motion animated `<img>`.
2. **Audio Playback (`src/lib/audio.ts`)**:
   - On valid guess evaluation, checks `soundEnabled`.
   - Calls `playFlipSound()` on incorrect guess; calls `playWinSound()` on correct guess.
3. **Tactical Hint Unlock (`PlayerSearch.tsx`)**:
   - When attempt >= 4, enables tactical hint button (*Jersey Number, Famous Teammate, Signature Performance*).

---

### 3. Component Hierarchy & Data Flow (Phase 5)
```
src/app/page.tsx
       │
       ├──> SilhouetteReveal.tsx (Calculates blur filter dynamically)
       ├──> AttributeCards.tsx
       ├──> PlayerSearch.tsx ──> Triggers playFlipSound() / playWinSound() (src/lib/audio.ts)
       ├──> NumericHintsTable.tsx
       └──> HowToModal.tsx (Renders when activeModal === 'howTo')
```
