# Architectural & Technical Decisions Log - CrickSolve 🏏

This document logs all key technical and architectural decisions taken during the development of CrickSolve, including justifications for approaches, libraries, and design patterns chosen over alternatives.

---

## Phase 1: Project Initialization & Architecture Setup

### Decision 1: Rebuilding with Next.js 14+ (App Router) instead of Vanilla HTML/JS
- **Approach Chosen:** Next.js 14+ with App Router (`src/app`).
- **Why this approach?** 
  - The previous vanilla JS setup exposed answer selection and date seeding directly on the client side, allowing users to easily inspect `data.js` or console logs to find the mystery player or forge high scores.
  - Next.js provides built-in Server API Routes to run an **anti-cheat server validation engine** where target player data remains hidden from the browser.
  - Next.js enables Server-Side Rendering (SSR) for dynamic OpenGraph share images (showing player scorecards when links are shared on Twitter/WhatsApp).
- **Alternatives Considered:** 
  - *Vite + React SPA*: Lacks built-in serverless API routes without a separate backend service.
  - *Keeping Vanilla JS*: Insecure for leaderboards and hard to scale for complex UI states (animations, modals, multi-category modes).

---

### Decision 2: Migrating from Firebase Cloud Firestore to Supabase
- **Approach Chosen:** Supabase (PostgreSQL + Row-Level Security + Realtime).
- **Why this approach?**
  - Supabase provides a full-featured relational PostgreSQL database with built-in Row-Level Security (RLS) policies.
  - Standard SQL querying and aggregation functions make leaderboard ranking (by attempts and time) significantly cleaner and faster than Firestore NoSQL index workarounds.
  - Realtime subscriptions allow live updating of daily leaderboards without complex Firestore listener overhead.
- **Alternatives Considered:**
  - *Firebase Cloud Firestore*: Harder to write complex analytical queries (e.g. daily percentile rank, global guess distribution).
  - *MongoDB*: Requires managing a separate cluster and auth service.

---

### Decision 3: Adopting TypeScript
- **Approach Chosen:** Strict TypeScript configuration (`tsconfig.json`).
- **Why this approach?**
  - Player data has strict multi-attribute schemas (*Country, Batting Hand, Bowling Type, Role, IPL Team, International Retirement, Birth Year, Tests, ODIs, T20Is, Hints*).
  - TypeScript prevents runtime type mismatches when comparing guessed player attributes against mystery players.
- **Alternatives Considered:**
  - *JavaScript*: Prone to silent runtime errors (`undefined` property access) during attribute comparison logic.

---

### Decision 4: Using Tailwind CSS for Styling
- **Approach Chosen:** Tailwind CSS with utility classes and CSS variables.
- **Why this approach?**
  - Rapid UI development for glassmorphism, responsive grid layouts, custom card states, and dark theme support without writing thousands of lines of boilerplate CSS.
- **Alternatives Considered:**
  - *Vanilla CSS*: Hard to maintain across multi-component Next.js apps.
  - *Styled Components / Emotion*: Higher runtime CSS-in-JS overhead.

---

### Decision 5: Using Zustand for Client State Management
- **Approach Chosen:** Zustand (`useGameStore`).
- **Why this approach?**
  - Ultra-lightweight (1kB), boilerplate-free, hook-based state management with native middleware for `localStorage` persistence.
  - Perfect for persisting active game state, streaks, sound preferences, and guess history.
- **Alternatives Considered:**
  - *Redux Toolkit*: Overly complex with reducers, actions, and boilerplate for a game client.
  - *React Context API*: Can trigger unnecessary re-renders across the entire component tree when a single guess state changes.

---

### Decision 6: Using Fuse.js for Client-Side Player Autocomplete
- **Approach Chosen:** Fuse.js fuzzy search engine.
- **Why this approach?**
  - Allows instant client-side searching over player dataset with typo tolerance (e.g. matching `"Sachin Tendulkr"` to `"Sachin Tendulkar"`).
- **Alternatives Considered:**
  - *Native String `includes()`*: Fails when users misspell player names.
  - *Server-side SQL `LIKE` queries*: Adds network latency on every single keystroke.

---

### Decision 7: Using Framer Motion for Animations & Howler.js for Audio
- **Approach Chosen:** Framer Motion for UI/card animations, Howler.js for Web Audio.
- **Why this approach?**
  - Framer Motion handles tile flip, lock shatter, and layout transitions seamlessly with declarative React props.
  - Howler.js abstracts browser audio quirks across iOS Safari and desktop Chrome for sound FX.

---

## Phase 2: Supabase Database Schema, Seeding & Client Configuration

### Decision 8: Relational Database Schema Design over NoSQL
- **Approach Chosen:** Relational schema (`players`, `daily_puzzles`, `leaderboard`, `user_stats`) with foreign keys and RLS policies.
- **Why this approach?**
  - Direct foreign key relationship (`daily_puzzles.player_id` -> `players.id`) enforces data integrity across game seeds.
  - Indexed compound queries (`date`, `time_ms ASC`) on the `leaderboard` table allow instantaneous daily ranking extraction.
- **Alternatives Considered:**
  - *NoSQL document store*: Document duplication between daily puzzles and player objects leads to data drift when stats are updated.

### Decision 9: Embedded Rich Player Seed Dataset (`src/data/players.ts`)
- **Approach Chosen:** Embedded TypeScript seed dataset with structured player statistics, high-resolution photo URLs, jersey numbers, famous teammates, and signature performances.
- **Why this approach?**
  - Serves dual-purpose: populates the Supabase database via seed script and powers instant client-side autocomplete / fuzzy search without roundtrip network delays.
- **Alternatives Considered:**
  - *Fetching player list on every keypress*: High server traffic and poor UX on slow mobile connections.

---

## Phase 3: Core Anti-Cheat Game Engine & Server API Routes

### Decision 10: Server-Side Anti-Cheat Mystery Player Hashing & Guess Evaluation
- **Approach Chosen:** Server-side deterministic date hashing algorithm in `/api/puzzle/daily` and `/api/puzzle/guess`.
- **Why this approach?**
  - Prevents players from inspecting network payloads, JavaScript bundles, or browser memory to discover today's mystery player.
  - The client only receives match flags (`country: true`, `birthYear: "higher"`) per guess, keeping the secret answer fully protected until won or lost.
- **Alternatives Considered:**
  - *Client-side calculation*: Exposed target player IDs directly in DOM inspect / DevTools.

### Decision 11: Persistent Client Zustand Store with `partialize` Storage
- **Approach Chosen:** Zustand store with `persist` middleware configured with `partialize` filter.
- **Why this approach?**
  - Persists game stats, streaks, sound preferences, and active daily guesses across browser reloads while keeping transient UI state (modal open/close flags) clean on new sessions.
- **Alternatives Considered:**
  - *Manual `localStorage.getItem/setItem`*: Verbose, error-prone synchronization code scattered across components.

---

## Phase 4: Modern Glassmorphic UI & Game Components

### Decision 12: Split Column Responsive Layout with Glassmorphism
- **Approach Chosen:** Two-column grid (`lg:grid-cols-12`) with glassmorphic cards (`bg-slate-900/60 backdrop-blur-md border border-slate-800`).
- **Why this approach?**
  - Separates attribute discovery from numeric stat hinting visually, reducing mental clutter for players on both mobile and desktop screens.
- **Alternatives Considered:**
  - *Single dense vertical list*: High scrolling friction on mobile devices.

### Decision 13: Fuse.js Instant Client Autocomplete with Keyboard Controls
- **Approach Chosen:** Fuse.js fuzzy engine combined with `useRef` event listeners for ArrowUp / ArrowDown / Enter keyboard navigation.
- **Why this approach?**
  - Enables desktop players to guess rapidly without reaching for the mouse, while fuzzy search ensures typo resilience.
- **Alternatives Considered:**
  - *Native `<datalist>` HTML element*: Cannot customize avatar photos, country badges, or custom highlight styling inside the dropdown options.



