# System Workflow & Execution Order - CrickSolve 🏏

This document traces the complete execution flow, entry points, component hierarchy, and function call sequences of the CrickSolve application.

---

## Current Status: Phase 14 (Header Standing Badge Simplification & Dedicated `YOUR STATS` Button)

### 1. Code Entry Point
- **Root Page (`src/app/page.tsx`)**: Renders `Header`, `PlayerSearch`, `GuessesGrid`, `SilhouetteReveal`, `LeaderboardModal`, and `StatsModal`.

---

### 2. Execution Order & Top Bar Navigation Flow
1. **Header Navigation Bar (`Header.tsx`)**:
   - Displays `DAILY #142`, clean `STREAK: X` (no emojis), and `STANDING: #X` (or `--` if unranked).
   - **`YOUR STATS`** button opens `StatsModal.tsx` showing Games Played, Games Solved, Win Rate %, Current Streak, and Max Streak.
   - **`LEADERBOARD`** button opens `LeaderboardModal.tsx` showing today's sorted solve-time rankings.

---

### 3. Component Architecture Graph (Phase 14)
```
Header.tsx (Cleaned top badges & action buttons)
       │
       ├──> YOUR STATS Button ──> Opens StatsModal.tsx (Played, Solved, Win %, Streaks)
       ├──> LEADERBOARD Button ──> Opens LeaderboardModal.tsx (Today's player & rankings)
       └──> HOW TO PLAY Button ──> Opens HowToModal.tsx
```
