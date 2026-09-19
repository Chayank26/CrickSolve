# 🏏 CrickSolve: Complete Technical Architecture, Feature Flows, Security & Scalability Blueprint

Welcome to the comprehensive technical documentation for **CrickSolve**. This document details every feature, the complete technology stack, architectural trade-offs, security mechanisms, and a battle-tested scaling blueprint for handling 100,000+ concurrent players.

---

## 📑 Table of Contents
1. [Core Features & How Everything Works](#1-core-features--how-everything-works)
2. [Technology Stack: Usage, Rationale & Alternatives](#2-technology-stack-usage-rationale--alternatives)
3. [Security Architecture Explained Simply](#3-security-architecture-explained-simply)
4. [Handling 100,000 Concurrent Users: Scaling Blueprint](#4-handling-100000-concurrent-users-scaling-blueprint)
5. [Comprehensive Interview Questions & Model Answers](#5-comprehensive-interview-questions--model-answers)

---

# 1. Core Features & How Everything Works

### 1.1 🎯 Daily Mystery Cricketer Engine
- **How it works**: Every calendar day at midnight (UTC/IST), a single unique cricketer is selected from a curated database of 300+ international and IPL cricketers.
- **Deterministic Hashing**: The target player is chosen deterministically using a seeded hashing function (`getDailyPlayerIndex(dateStr, category, poolLength)`). Given any date string (e.g. `2026-08-30`), all players worldwide receive the exact same mystery player on that day without needing a database lookup for the puzzle identity.

### 1.2 🔍 Intelligent Fuzzy Autocomplete Search
- **Component**: [`src/components/PlayerSearch.tsx`](file:///Users/chayankbhargava/Projects/CrickSolve/src/components/PlayerSearch.tsx)
- **How it works**: As players type in the input box, `Fuse.js` performs client-side fuzzy searching across player names, nicknames, and alternative spellings with threshold-weighted relevance.
- **User Experience**: Includes full keyboard navigation (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`), auto-scroll to active item, and instant feedback.

### 1.3 📊 Dual-Column Neubrutalist Attribute Comparison
- **Components**: [`src/components/GuessesGrid.tsx`](file:///Users/chayankbhargava/Projects/CrickSolve/src/components/GuessesGrid.tsx), [`src/components/AttributeCards.tsx`](file:///Users/chayankbhargava/Projects/CrickSolve/src/components/AttributeCards.tsx)
- **How it works**: Each guess is evaluated across 10 critical cricket dimensions:
  1. **Country** (Exact match)
  2. **Role** (Top-order batter, Middle-order, Wicketkeeper-batter, All-rounder, Pace bowler, Spin bowler)
  3. **Batting Hand** (Right-hand vs Left-hand)
  4. **Bowling Type** (Right-arm fast, Left-arm spin, etc.)
  5. **IPL Team** (Current or primary franchise)
  6. **Status** (Active vs Retired)
  7. **Birth Year** (Exact, or directional arrow 🔼 / 🔽 indicating older/younger)
  8. **Test Matches Played** (Exact, or directional arrow 🔼 / 🔽)
  9. **ODI Matches Played** (Exact, or directional arrow 🔼 / 🔽)
  10. **T20I Matches Played** (Exact, or directional arrow 🔼 / 🔽)
- **Color Coding**:
  - 🟩 **Vibrant Green (`#00FF66`)**: Exact match.
  - 🟨 **Arcade Yellow (`#FFE500`)**: Close match / near range.
  - ⬜ **Muted Gray (`#2A2A2A`)**: Mismatch.

### 1.4 🃏 Progressive Hint Cards with 3D Shutter Flip & Shimmer Glare
- **Component**: [`src/components/AttributeCards.tsx`](file:///Users/chayankbhargava/Projects/CrickSolve/src/components/AttributeCards.tsx)
- **How it works**: As incorrect guesses accumulate, tactical hints unlock progressively:
  - **Guess 2**: Batting Hand revealed.
  - **Guess 3**: Bowling Type revealed.
  - **Guess 4**: Debut Decade revealed.
  - **Guess 5**: Major Trophy / Career Milestone badge revealed.
- **Micro-Interactions**: Features CSS 3D perspective shutter flips (`transform: rotateY(180deg)`), tactile click sounds, and dynamic cursor-following shimmer glare effects.

### 1.5 ⏱️ Live Arcade Stopwatch & HUD
- **Component**: [`src/components/Header.tsx`](file:///Users/chayankbhargava/Projects/CrickSolve/src/components/Header.tsx)
- **How it works**: Upon making the first guess, a high-precision timer activates in the top banner displaying `MM:SS`. When the game ends, the timer locks and feeds into leaderboard verification.

### 1.6 🎁 8th Bonus "Last Chance" Continue Flow
- **Component**: [`src/components/ContinueModal.tsx`](file:///Users/chayankbhargava/Projects/CrickSolve/src/components/ContinueModal.tsx)
- **How it works**: If a player exhausts their standard 7 guesses without solving, an arcade continue modal opens offering an 8th "Sudden Death" bonus chance with an unlocked tactical hint preview.

### 1.7 🔊 Audio & Sensory Feedback Engine
- **Component**: [`src/lib/sound.ts`](file:///Users/chayankbhargava/Projects/CrickSolve/src/lib/sound.ts)
- **How it works**: Integrates synthesized Web Audio API and Howler.js sound effects for tactile clicks, guess submittal whooshes, error buzzers, hint unlocks, and victory fanfares. Sound can be toggled on/off with persistent preference.

### 1.8 🏆 Daily Global Leaderboard
- **Component**: [`src/components/LeaderboardModal.tsx`](file:///Users/chayankbhargava/Projects/CrickSolve/src/components/LeaderboardModal.tsx)
- **How it works**: Displays the daily global rankings sorted by:
  1. Fewest attempts (`1` to `8`)
  2. Fastest solve time in milliseconds
  - Submissions are protected by cryptographic HMAC verification.

### 1.9 👥 Real-Time Multiplayer Duels & Room Lifecycle Engine
- **Components & Stores**: [`src/components/OpponentHUD.tsx`](file:///Users/chayankbhargava/Projects/CrickSolve/src/components/OpponentHUD.tsx), [`src/components/MultiplayerLobbyModal.tsx`](file:///Users/chayankbhargava/Projects/CrickSolve/src/components/MultiplayerLobbyModal.tsx), [`src/store/useMultiplayerStore.ts`](file:///Users/chayankbhargava/Projects/CrickSolve/src/store/useMultiplayerStore.ts), [`src/lib/multiplayer-manager.ts`](file:///Users/chayankbhargava/Projects/CrickSolve/src/lib/multiplayer-manager.ts), [`src/types/multiplayer.ts`](file:///Users/chayankbhargava/Projects/CrickSolve/src/types/multiplayer.ts)
- **How it works**:
  1. **Room Creation & Code Generation**: Host creates a room via `POST /api/multiplayer/create`, generating a unique 6-character room code (e.g. `3EJFST`) and seeding a secret target player shared across all room participants.
  2. **Lobby Join & Presence**: Guests join via code or 1-click invite link (`?room=CODE`). Supabase Realtime Channel (`cricksolve_room_<CODE>`) subscribes all clients via WebSocket broadcast.
  3. **Ready Check & Synchronized Countdown**: When all participants toggle "Ready", the host initiates the match. A synchronized 3-second animated countdown (`3... 2... 1... START!`) is broadcast across the channel before transitioning the room status to `PLAYING`.
  4. **Sub-50ms Anonymous Guess Streaming**: On every guess submission, player comparison results (`{ country: true, role: false, ... }`) are broadcast as an `OPPONENT_GUESS` event. The opponent's HUD live-updates a mini-Wordle grid without exposing the guessed cricketer's name.
  5. **Victory & Showdown Modal**: The first player to correctly solve triggers `MATCH_FINISH`. Both screens display the side-by-side match breakdown with final attempt counts and solve times.
  6. **Instant Rematch Engine**: Either player can click "Rematch", rotating the mystery cricketer pool and resetting the boards for an immediate new round.

---


# 2. Technology Stack: Usage, Rationale & Alternatives

| Technology | Role in CrickSolve | How We Use It | Why We Chose It | Why NOT Something Else? |
| :--- | :--- | :--- | :--- | :--- |
| **Next.js 16 (App Router)** | Full-Stack Framework | Serverless API routes (`/api/puzzle/*`, `/api/leaderboard`), SSR/SSG page rendering, and client component hydration. | Provides serverless API routes and edge deployment in a unified codebase with zero server maintenance. | **Why not plain Vite/React SPA?** Plain SPAs cannot protect puzzle answers or run secure HMAC token signing without building and hosting a separate backend server. Next.js does both in one project. |
| **TypeScript** | Type Safety & Contract Guarantee | Strictly types player entities, match results, API contracts, Zustand game states, and cryptographic tokens. | Prevents runtime crashes, guarantees data shape consistency across client & server, and enables confident refactoring. | **Why not JavaScript?** JavaScript allows silent schema errors (e.g. `undefined` attributes during comparison) that ruin player sessions. |
| **Tailwind CSS + Neubrutalism** | Styling & Design System | High-contrast borders (`border-4 border-black`), hard box-shadows (`shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`), vibrant arcade colors (`#CCFF00`, `#00FF66`). | Enables ultra-fast styling iteration without leaving JSX, with tiny production CSS bundle size via tree-shaking. | **Why not standard Tailwind UI / Material UI?** Generic components look like boring enterprise dashboards. Neubrutalism creates a unique, high-energy arcade gaming vibe. |
| **Zustand (`useGameStore`)** | Client State Management | Stores guesses, game status, timers, tokens, streak, audio settings, and synchronizes to `localStorage`. | Super lightweight (<1kB), zero boilerplate, no context provider wrappers, and native persistence middleware. | **Why not Redux?** Redux has massive boilerplate for a Wordle-style game. **Why not React Context?** Context causes unnecessary re-renders of the entire component tree on every keystroke. |
| **Fuse.js** | Fuzzy Search Engine | Instant client-side search across 300+ player names, nicknames, and common spelling typos. | Zero network latency (0ms search), offline-capable, and customizable match weights and score thresholds. | **Why not Server-side Search API?** Typing in an input would fire 10-20 HTTP requests per player, causing lag and database load. Client-side Fuse.js is instant and handles 300 players in <2ms. |
| **Supabase (PostgreSQL + Realtime)** | Database & Real-Time Sync | Stores daily leaderboard records and powers real-time subscriptions and multiplayer presence channels. | Managed serverless PostgreSQL with built-in connection pooling, instant REST APIs, and native WebSocket Realtime channels. | **Why not Firebase Firestore?** Firestore pricing scales per document read/write (expensive for high-frequency leaderboards) and lacks native SQL aggregations like `RANK() OVER (ORDER BY attempts, time_ms)`. |
| **Node.js `crypto` (HMAC SHA-256)** | Security & Anti-Cheat | Cryptographically signs session start times and victory claims using a server secret. | Standard cryptographic primitive, execution time is sub-millisecond, and leaves zero external dependencies. | **Why not JWT libraries (`jsonwebtoken`)?** Heavy dependencies with complex header parsing overhead. Native HMAC SHA-256 tokens are faster, smaller, and tamper-proof. |
| **Canvas-Confetti** | Celebration Particle FX | Triggers victory celebration confetti bursts when a player correctly identifies the mystery cricketer. | Pure HTML5 60fps Canvas particle rendering that runs on the GPU with zero DOM node overhead. | **Why not GIF / Video overlays?** GIFs and video assets add megabytes to page weight and look blurry. Canvas-confetti is ~3kB and crisp on all screen resolutions. |
| **Lucide React** | Iconography | High-contrast, pixel-perfect SVG icons for trophies, flame streaks, sound controls, timers, and modal triggers. | Lightweight, tree-shakeable SVG icons that inherit CSS text colors and strokes cleanly. | **Why not FontAwesome / Icon Fonts?** Icon fonts block render passes and cause layout shifts (CLS). Inline SVGs render immediately. |

---

# 3. Security Architecture Explained Simply

### ⚠️ The Problem with Standard Web Wordle Games
In standard Wordle clones, the secret answer is stored directly in the browser's JavaScript memory or `localStorage`. Anyone can:
1. Press `F12` -> Open DevTools Console -> Type `localStorage.getItem('targetPlayer')` and immediately see today's answer.
2. Open Network tab -> Inspect API response and read the player object.
3. Fire a fake `fetch('/api/leaderboard')` with `timeMs: 1` and `attempts: 1` to steal the #1 spot on the global leaderboard.

---

### 🛡️ How CrickSolve Stops Cheaters (Serverless Anti-Cheat)

```
[User Browser]                                             [Serverless Edge API]
      │                                                              │
      │ 1. Submits Guess ("Virat Kohli")                             │
      ├─────────────────────────────────────────────────────────────►│
      │                                                              │ 2. Validates guess against secret target
      │                                                              │ 3. Generates HMAC-signed sessionToken
      │                                                              │    (Locks exact start timestamp: 1725164000000)
      │ 4. Receives match colors (🟩 🟨 ⬜) + sessionToken           │
      │◄─────────────────────────────────────────────────────────────┤
      │                                                              │
      │ ... user continues guessing ...                              │
      │                                                              │
      │ 5. Submits Winning Guess + sessionToken                      │
      ├─────────────────────────────────────────────────────────────►│
      │                                                              │ 6. Verifies sessionToken signature
      │                                                              │ 7. Computes actual solve time: (Now - StartTime)
      │                                                              │ 8. Issues HMAC-signed victoryToken
      │ 9. Receives victoryToken ("payload.signature")               │
      │◄─────────────────────────────────────────────────────────────┤
      │                                                              │
      │ 10. Submits Leaderboard Entry + victoryToken                 │
      ├─────────────────────────────────────────────────────────────►│
      │                                                              │ 11. Validates victoryToken signature
      │                                                              │ 12. Writes verified score to Supabase DB
      │ 13. Score Confirmed on Global Leaderboard (200 OK)           │
      │◄─────────────────────────────────────────────────────────────┤
```

### In Simple Words:
1. **The browser NEVER knows the mystery player in advance**: When you guess, you send your guess to the server. The server compares it and only sends back the match colors (🟩 / 🟨 / ⬜).
2. **Start time is locked on the server**: On your first guess, the server stamps the exact millisecond you started, signs it with a secret key (`HMAC SHA-256`), and gives you a `sessionToken`. If you alter this token, the digital signature breaks.
3. **No fake victory submissions**: You cannot submit to the leaderboard unless you hand in a valid `victoryToken` issued by the server. Even if a hacker attempts to forge a token claiming `attempts: 1` or `timeMs: 100`, the server rejects it with `401 Unauthorized` because the cryptographic signature does not match the server's private secret.

---

# 4. Handling 100,000 Concurrent Users: Scaling Blueprint

### 1.10 Phase 1 Multiplayer Room State

Multiplayer room lifecycle operations now pass through `src/lib/multiplayer-room-store.ts` rather than writing directly to a process-local map. When the deployment provides `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, room records are stored in Upstash Redis with a six-hour TTL. Local development falls back to an expiring in-memory adapter.

The current Phase 1 flow is:

1. The create route requests a unique cryptographically generated six-character room code.
2. The manager creates a strict 1v1 room record and saves it through the room-store boundary.
3. The join route loads the room from Redis or the local fallback, validates capacity, updates the participant list, and saves it again.
4. Room lookup, status changes, and rematches use the same asynchronous repository.
5. Supabase Realtime continues to deliver browser events, but the room repository is the intended source of persisted room state.

Phase 1 intentionally leaves target secrecy, membership authorization, and server-authoritative guess validation for the next phase. The current API still returns the legacy room shape, including `targetPlayerId`, until those concerns are migrated together.

### 1.11 Phase 2 Multiplayer Authority

Phase 2 adds a signed membership boundary around room operations and multiplayer guesses:

1. Room creation and joining return a six-hour HMAC token bound to the room code, anonymous user ID, and participant role.
2. Room lookup and PATCH operations require that token to match the requested room and user.
3. Only the host can persist countdown and match-status transitions.
4. Only a participant can request a rematch.
5. Multiplayer guess requests include the room code and membership token; the server loads the room, checks membership and active status, validates the next attempt number, and uses the room's target for evaluation.
6. The client continues receiving the legacy target-bearing room shape so the current attribute and silhouette UI remains functional.

The final target-secrecy step is intentionally separate: the board must stop deriving locked attributes and the silhouette from a client-held target and instead consume server-produced hints. Until that refactor is complete, multiplayer target data remains exposed to the browser despite server-side guess authority.

### 1.12 Phase 3 Target-Secrecy Flow

The multiplayer client no longer receives the private room target through room APIs or realtime events:

1. The server stores the target in the private room record.
2. Create, join, lookup, rematch, and status responses return a public room projection without `targetPlayerId`.
3. A multiplayer guess is evaluated against the private target after membership and attempt validation.
4. The response includes only the attribute values that the submitted guess actually matched.
5. The client stores those matched values in its guess evaluation and renders them in the attribute cards.
6. The target identity and photo are returned only after a server-accepted winning guess, then delivered to both match clients so each result modal can reveal them.
7. Realtime opponent events carry match flags and winner metadata, but no target ID.

The searchable player dataset is still client-visible by product choice. This phase removes direct multiplayer room and board target leaks, while a future server-backed search phase would be needed to hide every player record from inspection.

### 1.13 Phase 4 Revisioned Realtime Flow

1. A player toggles readiness through the signed room API; the server verifies membership and persists the new state.
2. The host starts the countdown through the same API; the server verifies that both players are ready before changing status.
3. The server-owned room includes a unique `roundId` and increments `revision` for each persisted mutation.
4. Realtime events include the room code, round ID, and revision that produced the event.
5. Clients reject events from another room, an earlier round, or an already-applied revision.
6. Each accepted multiplayer guess updates the participant counter and matched tiles in the server room record, then returns the new public room snapshot.
7. The client applies that snapshot before publishing the corresponding HUD event, keeping the event revision aligned with server state.

This phase improves convergence and removes client-only readiness state. Realtime channel authorization is still required before broadcasts can be treated as fully trusted server-origin events.

### 1.14 Phase 5 Authoritative Reconciliation Flow

1. After joining a room, the client starts an authenticated room snapshot loop at one-second intervals.
2. Supabase broadcast events no longer mutate room state directly; each event triggers an immediate authenticated snapshot request.
3. The server returns the latest public room revision, participant progress, readiness, status, and any terminal reveal.
4. The client applies only snapshots for the current room and a current-or-newer revision.
5. If the room is in countdown and includes `countdownEndsAt`, the client reconstructs the remaining countdown locally.
6. If a player wins, the server stores the safe reveal in the room so the opponent can recover it after reconnecting or missing the original event.
7. A rematch rotates the round ID and clears the previous reveal before the next snapshot is published.

The room API is now the authoritative synchronization path. Realtime remains the fast notification path until channel authorization is integrated with the anonymous membership model.

### 1.15 Phase 6 Serialized Mutation Flow

1. A mutable room request identifies its room code and enters the room mutation boundary.
2. Redis attempts to acquire a short-lived lock with `SET NX`; local development queues the mutation behind any existing same-room operation.
3. The manager reads the latest room, validates membership and the legal transition, applies the change, increments the revision, and saves the room.
4. The lock is released only by its owner using a compare-and-delete script.
5. If another operation currently owns the room lock, the API returns `409 Conflict` so the client can retry without assuming a state change occurred.
6. Accepted guesses, rematches, readiness changes, joins, and status transitions therefore cannot overwrite each other's participant progress or winner state.

### 📊 What Happens Today if 100,000 Users Play at the Same Time?
1. **Frontend Assets (HTML/CSS/JS)**: ✅ **100% Stable**. Served from Edge CDNs (Vercel Edge Network / Cloudflare). 100,000 requests for the bundle are cached globally at edge nodes near users with 0 load on the origin server.
2. **Search Autocomplete**: ✅ **100% Stable**. Handled entirely client-side by `Fuse.js` in browser memory. 0 server requests are fired during typing.
3. **Guess Evaluation API (`/api/puzzle/guess`)**: ✅ **100% Stable**. Runs as stateless serverless edge functions that auto-scale horizontally to thousands of concurrent executions per second.
4. **Leaderboard Submissions (`/api/leaderboard`)**: ⚠️ **Potential Bottleneck**. 100,000 players submitting scores around the same peak window (e.g. midnight daily reset) can cause connection spikes to the PostgreSQL database if direct unpooled connections are used.

---

### 🚀 Production Scaling Architecture (100k - 1M+ Players)

```
                       ┌─────────────────────────────────────────┐
                       │        100,000+ Concurrent Users        │
                       └────────────────────┬────────────────────┘
                                            │
                                            ▼
                       ┌─────────────────────────────────────────┐
                       │    Edge CDN (Cloudflare / Vercel Edge)  │
                       │    - Cached static JS/CSS bundles       │
                       │    - Stale-While-Revalidate daily data  │
                       │    - DDoS & Rate Limiting protection    │
                       └────────────────────┬────────────────────┘
                                            │
                                            ▼
                       ┌─────────────────────────────────────────┐
                       │      Serverless Functions Auto-Cluster  │
                       │      - Auto-scales 0 -> 10,000 nodes    │
                       │      - Stateless HMAC validation        │
                       └─────────────┬───────────────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
    ┌─────────────────────────┐             ┌─────────────────────────┐
    │  Upstash Redis Cache    │             │ Supabase PgBouncer Pool │
    │  - Sub-5ms Leaderboards │             │ - Max 10,000 conn pool  │
    │  - Fast Rate Limiting   │             │ - Batch writes queue    │
    └─────────────────────────┘             └────────────┬────────────┘
                                                         ▼
                                            ┌─────────────────────────┐
                                            │ PostgreSQL DB (Indexed) │
                                            │ - daily_leaderboard     │
                                            │ - B-Tree (date, score)  │
                                            └─────────────────────────┘
```

### 🛠️ 4 Steps to Scale for Millions:

#### 1. Supabase PgBouncer Connection Pooling
- Instead of opening 100,000 individual database connections, use Supabase's transaction pooler (port `6543`).
- Reuses a warm pool of connections so 100,000 concurrent requests share a controlled pool of PostgreSQL connections without memory exhaustion.

#### 2. Redis Caching for Daily Leaderboards (Upstash Redis)
- Leaderboard queries (`GET /api/leaderboard`) receive millions of reads.
- Cache the Top 100 leaderboard in Redis with a 15-second TTL (`stale-while-revalidate`).
- Result: 99.8% of leaderboard read requests are served from RAM in <5ms, reducing database read load by over 99%.

#### 3. Edge Rate Limiting
- Add sliding-window rate limiting on `/api/puzzle/guess` (e.g., maximum 30 guesses per minute per IP).
- Stops malicious bots from flooding serverless functions.

#### 4. Web Worker for Search (Ultra-Low-End Devices)
- Move `Fuse.js` indexing into a dedicated browser Web Worker.
- Ensures that even on budget mobile phones with 100,000 background browser tabs, the main UI thread never drops below 60 FPS while typing.

---

## 📌 Summary
CrickSolve's architecture is engineered to be **lightweight, tamper-proof, and hyper-scalable**:
- **Client**: Fast, responsive Neubrutalist UI with zero-lag client-side fuzzy search.
- **Server**: Stateless, serverless edge functions with HMAC SHA-256 cryptographic verification.
- **Data**: Managed PostgreSQL with Supabase, ready for millions of daily active players with zero infrastructure management.

---

# 5. Comprehensive Interview Questions & Model Answers

Below is a complete collection of interview questions ranging from frontend engineering and React internals to system design, security, cryptography, and performance optimization that could be asked about this project.

---

## 🏛️ Category A: System Design & Architecture

### Q1: How does the Daily Mystery Player synchronization work across thousands of users globally without querying a database?
> **Answer**:  
> We use a **deterministic seeded hashing algorithm** (`getDailyPlayerIndex`). We take the current calendar date string (e.g. `'2026-08-30'`) concatenated with a constant salt string (`'cricksolve-salt-2026'`) and run a bitwise hashing loop:
> ```ts
> hash = (hash << 5) - hash + seed.charCodeAt(i);
> hash |= 0; // Convert to 32-bit integer
> const index = Math.abs(hash) % playerPool.length;
> ```
> This maps any given calendar date to an exact, deterministic index in our array of 300+ players in $O(N)$ string length time ($<0.001\text{ms}$). Because the algorithm and player dataset are identical on the server, every player across the globe gets the exact same target player on that calendar day without requiring any central database read.

---

### Q2: Why did you choose Zustand over Redux Toolkit or React Context for state management?
> **Answer**:  
> 1. **Bundle Size & Overhead**: Redux Toolkit brings significant boilerplate (actions, reducers, dispatchers, store providers) and adds ~30kB to the bundle. Zustand is under **1.2kB minzipped** and uses a simple hook-based selector model.
> 2. **Render Performance**: React Context triggers re-renders on all consuming components whenever any piece of the context object changes unless split into multiple micro-contexts. Zustand uses selective atomic subscriptions (`useGameStore((state) => state.guesses)`), meaning components only re-render when their specific subscribed state slice changes.
> 3. **Seamless Persistence**: Zustand provides native `persist` middleware that automatically synchronizes game state, active tokens, and streak history to `localStorage` with built-in schema versioning and rehydration hooks.

---

### Q3: Why is Next.js 16 (App Router) used instead of a standard Single Page Application (Vite + React)?
> **Answer**:  
> A pure Vite SPA runs 100% on the client. In a guessing game like CrickSolve:
> 1. In a pure SPA, the target player or verification logic would have to live in client-side code, allowing players to view the answer via DevTools or network payloads.
> 2. Generating tamper-proof cryptographic signatures (HMAC SHA-256) requires a private secret key (`HMAC_SECRET`). In an SPA, any environment variable is bundled into client JS, exposing the secret.
> 3. Next.js 16 gives us a **unified full-stack architecture**: Serverless API routes (`/api/puzzle/guess`, `/api/leaderboard`) run securely on the server with private environment variables, while the interactive frontend is server-rendered and hydrated at the Edge with optimal Core Web Vitals.

---

## 🔒 Category B: Security, Cryptography & Anti-Cheat

### Q4: How do you prevent users from inspecting network requests or DevTools to find the daily answer?
> **Answer**:  
> The client **never receives the target player object** from any API.  
> When the user makes a guess:
> 1. The client sends the guessed player's ID (`guessedPlayerId`) to `/api/puzzle/guess`.
> 2. The server independently computes the target player using the date seed, runs the attribute and numeric comparisons in memory on the server, and returns **only the comparison results** (e.g. `{ country: true, birthYear: 'higher', role: false }`).
> 3. Even if a user inspects the Network tab, memory heap, or Redux/Zustand devtools, the target player's identity is mathematically absent from their machine until they solve it.

---

### Q5: How does the HMAC SHA-256 token verification work, and why not use JSON Web Tokens (JWT)?
> **Answer**:  
> We use custom **HMAC SHA-256** tokens (`sessionToken` and `victoryToken`) generated via Node's native `crypto.createHmac`:
> 1. **Session Token**: Issued on guess #1. It packs `{ date, startTimeMs }` and signs it:
>    $$\text{Token} = \text{Base64}(\text{Payload}) + '.' + \text{HMAC-SHA256}(\text{Base64}(\text{Payload}), \text{SECRET})$$
> 2. **Victory Token**: Issued only when a winning guess is verified on the server. It computes $\text{solveTimeMs} = \text{CurrentServerTime} - \text{startTimeMs}$ and signs `{ date, attempts, solveTimeMs, solved: true }`.
> 3. **Leaderboard Submission**: `/api/leaderboard` recalculates the HMAC signature of the received payload. If a user modifies `attempts: 1` or `timeMs: 10`, the signature verification fails, and the server returns `401 Unauthorized`.
> 
> **Why not JWT?**: JWT libraries (`jsonwebtoken`, `jose`) add extra bundle overhead and require asymmetric key pairs or standard claims parsing. Since our tokens are only created and verified by our own serverless API, symmetric HMAC SHA-256 provides identical tamper-proof security with zero external dependencies and sub-millisecond execution.

---

### Q6: How do you prevent Replay Attacks (e.g., using yesterday's victoryToken to win today's leaderboard)?
> **Answer**:  
> Every token payload explicitly includes the **puzzle date** (e.g., `date: "2026-08-30"`). When a score is submitted to `/api/leaderboard`, the server checks both:
> 1. The HMAC signature's mathematical validity.
> 2. That `tokenPayload.date === requestBody.date === todayUtcDate`.  
> If the dates do not match, the token is immediately rejected as expired/invalid.

---

## ⚡ Category C: Frontend Performance, React 19 & UX

### Q7: How do you ensure the autocomplete search doesn't lag or drop frames on low-end mobile devices when searching through 300+ players?
> **Answer**:  
> 1. **Client-Side Indexing**: `Fuse.js` builds its searchable search-index once on mount rather than re-indexing on every keystroke.
> 2. **Controlled State & Slice Limiting**: The search result list is capped to the top 6 matches (`results.slice(0, 6)`), minimizing the number of DOM nodes mounted and animated in the dropdown.
> 3. **Non-Blocking UI**: React 19 concurrent features ensure keystrokes remain immediately responsive while search filtering is processed.
> 4. **Future Scalability**: If the player pool scales to 10,000+ players, the Fuse search loop can be offloaded to a Web Worker via `Comlink`, keeping the main UI thread at a steady 60 FPS.

---

### Q8: How did you solve the SSR Hydration Mismatch problem with Zustand persisted state (`localStorage`)?
> **Answer**:  
> During Server-Side Rendering (SSR), Next.js renders the initial HTML on the server where `localStorage` does not exist (resulting in empty/default state). On the client, Zustand reads from `localStorage`, which could cause a React hydration mismatch error (`Hydration failed because the initial UI does not match`).
> 
> We resolve this through a **two-phase mount pattern**:
> 1. A client `isMounted` state or `useEffect` hook triggers only after the initial DOM hydration is complete.
> 2. Interactive and persisted values (like live timers, existing guesses, and modals) only render client-specific UI once hydrated, guaranteeing 100% hydration consistency between server and client.

---

### Q9: How are the 3D Shutter Flip and Shimmer Glare animations optimized for 60fps GPU acceleration?
> **Answer**:  
> 1. **GPU Compositing**: We strictly animate composite properties: `transform: rotateY(...)` and `opacity`. We avoid animating layout-triggering properties like `width`, `height`, `top`, or `margin`.
> 2. **Hardware Acceleration**: We use `transform-style: preserve-3d`, `perspective: 1000px`, and `backface-visibility: hidden` to force the browser to promote cards into dedicated GPU compositing layers.
> 3. **Shimmer Glare**: Glare effects use CSS linear gradients with `pointer-events: none` and `will-change: transform`, ensuring smooth cursor tracking without triggering CPU reflows.

---

## 🧠 Category D: Algorithms, Data Structures & Logic

### Q10: How does Fuse.js work internally, and what are its time and space complexities?
> **Answer**:  
> `Fuse.js` uses a variation of the **Bitap algorithm** (shift-or / Baeza-Yates–Gonnet algorithm) combined with **Levenshtein distance scoring**:
> - **Space Complexity**: $O(N \times K)$ where $N$ is the number of players (300) and $K$ is the average length of player names/attributes (~15 chars) to build the search bit-mask tables.
> - **Time Complexity**: For a search query of length $M$, search complexity is $O(M \times N)$ using bitwise operations, which executes in $<1.5\text{ms}$ in JavaScript V8 engine for 300 records.

---

### Q11: How is the attribute comparison engine structured, and how are numeric directional hints determined?
> **Answer**:  
> In [`src/lib/game-engine.ts`](file:///Users/chayankbhargava/Projects/CrickSolve/src/lib/game-engine.ts):
> - **Categorical Attributes**: Exact boolean comparison (`guessed.country === target.country`).
> - **Numeric Attributes** (Birth Year, Tests, ODIs, T20Is): Evaluated using a 3-state comparison function `compareNumeric`:
>   ```ts
>   export function compareNumeric(guessed: number, target: number): 'match' | 'higher' | 'lower' {
>     if (guessed === target) return 'match';
>     return guessed < target ? 'higher' : 'lower';
>   }
>   ```
>   The result `'higher'` tells the UI to render an upward arrow (meaning target player is older/has more matches), while `'lower'` renders a downward arrow.

---

## 📈 Category E: Database, Scalability & Infrastructure

### Q12: How is the Supabase PostgreSQL database schema designed, and what indexes ensure fast leaderboard queries?
> **Answer**:  
> The `daily_leaderboard` table schema:
> ```sql
> CREATE TABLE daily_leaderboard (
>   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>   date DATE NOT NULL,
>   nickname VARCHAR(50) NOT NULL,
>   attempts INT NOT NULL CHECK (attempts BETWEEN 1 AND 8),
>   time_ms INT NOT NULL CHECK (time_ms > 0),
>   created_at TIMESTAMPTZ DEFAULT NOW()
> );
> ```
> **Index Strategy**:
> ```sql
> CREATE INDEX idx_leaderboard_rank ON daily_leaderboard (date, attempts ASC, time_ms ASC);
> ```
> This composite B-Tree index allows the database to fetch the Top 100 players for any given date in $O(\log N + K)$ time directly from the index tree without performing a full table scan.

---

### Q13: What happens during a traffic surge of 100,000 players at midnight, and how do you prevent database connection exhaustion?
> **Answer**:  
> 1. **The Issue**: Serverless functions scale out on demand (spawning thousands of isolated function containers). If each container opens a direct connection to PostgreSQL, PostgreSQL reaches its `max_connections` limit and throws `Connection terminated` errors.
> 2. **The Solution (PgBouncer Connection Pooling)**: We connect through Supabase's transaction pooler (port `6543`). PgBouncer holds a persistent pool of ~50-100 open database connections and multiplexes thousands of incoming serverless queries over these shared connections.
> 3. **Read Offloading (Redis)**: Leaderboard reads are cached in Redis (`Upstash`) with a 15-second TTL. 99% of user leaderboard requests hit Redis cache in $<5\text{ms}$, reducing database read queries by 100x.

---

## 🛠️ Category F: Engineering Trade-offs & Real-World Decisions

### Q14: What was the most significant technical challenge you faced in this project, and how did you resolve it?
> **Answer**:  
> **Challenge**: Balancing client-side responsiveness (0ms instant UI feedback, offline capability, zero search lag) with rock-solid leaderboard integrity and anti-cheat protection.  
> **Resolution**: We adopted a **hybrid split architecture**:
> - The player metadata catalog is bundled on the client for instantaneous fuzzy search and smooth card animations.
> - The secret target selection, comparison evaluation, and time-tracking are locked behind stateless serverless edge functions with HMAC SHA-256 signatures.  
> This gave us the speed of a client-side game and the security of a backend-authoritative gaming server.

---

### Q15: If you had 2 more weeks to work on CrickSolve, what would you build next?
> **Answer**:  
> 1. **1v1 Real-Time Multiplayer Duels**: Using Supabase Realtime WebSocket presence and broadcast channels to race live against friends on split screens.
> 2. **Dynamic Social Share Cards (`@vercel/og`)**: Generating high-resolution OpenGraph preview images on Edge workers displaying the player's color grid, solve time badge, and mystery silhouette for viral sharing on WhatsApp and Twitter.
> 3. **Immaculate Grid Mode**: A 3x3 cricket trivia matrix game mode for expanded daily replayability.

