# System Workflow & Execution Order - CrickSolve 🏏

This document traces the complete execution flow, entry points, component hierarchy, and function call sequences of the CrickSolve application.

---

## Current Status: Phase 2 (Database Schema, Seeding & Client Setup)

### 1. Code Entry Point
- **Root Layout (`src/app/layout.tsx`)**: Global wrapper.
- **Main Page (`src/app/page.tsx`)**: Entry point for UI rendering.
- **Supabase Client (`src/lib/supabase.ts`)**: Singleton initialization point for database queries.
- **Player Registry (`src/data/players.ts`)**: Authoritative dataset for player records and stat lookup.

---

### 2. Execution Order
1. **Application Launch**:
   - `src/lib/supabase.ts` initializes connection pool with `NEXT_PUBLIC_SUPABASE_URL` and anon key.
2. **Type Safety Engine**:
   - `src/types/game.ts` validates data structures across database models (`Player`, `DailyPuzzle`, `LeaderboardEntry`, `UserStats`) and evaluation models (`GuessEvaluation`).
3. **Data Pre-loading**:
   - Static player data from `src/data/players.ts` is ready for instant fuzzy matching and server-side puzzle calculations.

---

### 3. Function & Module Dependency Graph (Phase 2)
```
src/types/game.ts (Core Interfaces)
       │
       ├──> Implemented by src/data/players.ts (Seed Dataset)
       ├──> Implemented by supabase/schema.sql (Database Tables)
       │
src/lib/supabase.ts (Supabase Client Singleton)
       │
       └──> Consumed by API Routes and Database Hooks
```
