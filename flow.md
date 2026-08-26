# System Workflow & Execution Order - CrickSolve 🏏

This document traces the complete execution flow, entry points, component hierarchy, and function call sequences of the CrickSolve application.

---

## Current Status: Phase 20 (Bonus 8th Chance Continue Modal & Mystery Player Reveal Card)

### 1. Code Entry Point
- **Root Page (`src/app/page.tsx`)**: Renders `Header`, 2-Column Main Layout (`AttributeCards.tsx` & `PlayerSearch.tsx`), `ContinueModal.tsx`, `ResultModal.tsx`, and Modals.

---

### 2. Execution Order & 7th Guess Wrong Decision Flow
1. **7th Wrong Guess Trigger (`useGameStore.ts`)**:
   - Submitting 7th incorrect guess opens **`ContinueModal.tsx`**.
2. **Bonus 8th Chance Prompt (`ContinueModal.tsx`)**:
   - Prompts **"DO YOU WANT ANOTHER GUESS?"** (Yes / No).
   - Displays bonus hint:
     - *If locked attribute exists*: Shows 1 locked attribute value (e.g. `Role: Batting Allrounder`).
     - *If all 6 attributes unlocked*: Shows numeric stat profile (*Birth Year, Tests, ODIs, T20Is*).
3. **User Action**:
   - **`YES (1 MORE GUESS)`**: Grants 8th guess attempt and resumes game.
   - **`NO`**: Sets game status to `LOST` and opens Mystery Player Reveal Card (`ResultModal.tsx`).
4. **Mystery Player Reveal Card (`ResultModal.tsx`)**:
   - Displays unblurred cricketer photo, Name, Country, and Role.
   - Top right features 📋 Share score button and ✖ Close button.

---

### 3. Component Architecture Graph (Phase 20)
```
7th Wrong Guess Submitted
       │
       └──> Opens ContinueModal.tsx
                 │
                 ├──> YES (1 MORE GUESS) ──> Unlocks Hint & Grants 8th Attempt
                 │
                 └──> NO ──> Opens ResultModal.tsx (Mystery Player Card: Name, Photo, Country, Role, Share & Close Buttons)
```
