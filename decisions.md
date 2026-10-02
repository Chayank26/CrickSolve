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

---

## Phase 5: Silhouette Reveal, Tactical Hints & Audio FX

### Decision 14: Progressive Image Unblur for Photo Silhouette
- **Approach Chosen:** CSS `filter: blur()` algorithm reducing blur intensity linearly from `24px` down to `0px` based on attempt count.
- **Why this approach?**
  - Provides a visual progression reward as players accumulate guesses without leaking facial features prematurely on guess 1.
- **Alternatives Considered:**
  - *Pixelation matrix*: Requires heavy HTML5 canvas image processing; CSS `blur()` is GPU-accelerated and natively smooth.

### Decision 15: Howler.js Web Audio Web Synthesizer
- **Approach Chosen:** Howler.js audio manager initialized on user interaction (`playFlipSound`, `playWinSound`).
- **Why this approach?**
  - Web Audio API buffers sounds in memory, eliminating delay when cards flip or puzzles are solved.
- **Alternatives Considered:**
  - *Native HTML5 `<audio>` tags*: High latency and autoplay blocking on Safari iOS.

---

## Phase 6: Game Modes & Past Games Calendar

### Decision 16: Category & Era Filtering Architecture
- **Approach Chosen:** Category selector bar (`CategorySelector.tsx`) allowing users to target specific subsets (*International, IPL, Legend, Womens*).
- **Why this approach?**
  - Keeps gameplay fresh for different user audiences (e.g. users who follow IPL or Women's Cricket specifically).
- **Alternatives Considered:**
  - *Single monolithic player pool*: Dilutes player density when guessing specific niche leagues.

### Decision 17: Interactive Past Games Calendar Grid
- **Approach Chosen:** Custom month-grid calendar modal (`CalendarModal.tsx`) computing days in month and disabling future dates.
- **Why this approach?**
  - Allows players to catch up on missed daily puzzles from previous calendar dates.
- **Alternatives Considered:**
  - *Simple date input text box*: High user error and bad mobile UI keyboard experience.

---

## Phase 7: Supabase Leaderboard, User Analytics & Dynamic Score Share

### Decision 18: Supabase Leaderboard Persistence (`/api/leaderboard`)
- **Approach Chosen:** Server API endpoint saving daily finishes (`date`, `user_id`, `nickname`, `attempts`, `time_ms`) into Supabase `leaderboard` PostgreSQL table with upsert logic (`id = date_user_id`).
- **Why this approach?**
  - Prevents duplicate leaderboard entries per user per calendar day while ordering top scores by least attempts and fastest solve time.
- **Alternatives Considered:**
  - *Client-side direct insert*: Exposes database table write rules to bypass score validation.

### Decision 19: Canvas Confetti & Wordle Emoji Scorecard Format
- **Approach Chosen:** `canvas-confetti` explosion on victory + Wordle emoji string builder (`🟩`, `🟨`, `⬛`, `⬆️`, `⬇️`).
- **Why this approach?**
  - Instant viral social sharing on Twitter, WhatsApp, and Telegram without spoiling the mystery player identity for friends.
- **Alternatives Considered:**
  - *Plain text score share*: Lacks visual pop and social engagement.

---

## Phase 8: PWA, Final Polish & Verification

### Decision 20: Progressive Web App Manifest & Viewport Meta Configuration
- **Approach Chosen:** Web App Manifest (`public/manifest.json`) + Next.js `Viewport` API setting theme color `#020617` and `display: standalone`.
- **Why this approach?**
  - Enables users to install CrickSolve as a native-feeling app on mobile home screens (iOS Safari and Android Chrome) without app store friction.
- **Alternatives Considered:**
  - *Browser tab-only site*: No home screen launcher, status bar color adaptation, or offline fallback shell.

### Decision 21: Full 424-Player CSV Dataset Conversion Pipeline (`scripts/convert-csv.js`)
- **Approach Chosen:** Restored original `players_with_stats.csv` from git commit history and wrote automated Node.js converter script (`scripts/convert-csv.js`) to generate typed TypeScript dataset (`src/data/players.ts`).
- **Why this approach?**
  - Expands mystery player depth from 18 to **424 international and domestic cricketers** complete with birth dates, stats, roles, bowling types, IPL team assignments, and photo URLs.
- **Alternatives Considered:**
  - *Hand-keying 400+ players*: Extremely slow and prone to human stat entry errors.

---

## Phase 9: Neubrutalism Retro Arcade UI Transformation

### Decision 22: Neubrutalism Comic Arcade Design System
- **Approach Chosen:** Re-architected entire frontend UI to match high-contrast Neubrutalism arcade layout (`border-4 border-black`, `shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`, Neon Lime `#CCFF00`, Purple `#6B21A8`, High-Vis Orange `#FF5500`, dot-grid background).
- **Why this approach?**
  - Matches exact retro comic arcade aesthetic requested by user, providing high visual impact, bold readability, and distinct identity over standard dark/light themes.
- **Alternatives Considered:**
  - *Generic dark-mode glassmorphism*: Lacks retro arcade brand identity.

---

## Phase 10: Fastest Solve-Time Leaderboard, First-Land How-To & Streak Persistence

### Decision 23: Fastest Solve-Time Leaderboard & Initial How-To Modal Flow
- **Approach Chosen:** 
  1. Record precise solve time (timestamp of guess #1 to winning guess timestamp) and sort leaderboard by `time_ms ASC, attempts ASC`.
  2. Display today's mystery player photo, name, country, and role in Neubrutalist Leaderboard Modal.
  3. Enforce streak incrementing (`lastSolvedDate` date comparison for yesterday & today).
  4. Display `HowToModal` automatically when a user lands on the website for the first time.
  5. Apply unified Neubrutalism design system across all modal cards (`LeaderboardModal`, `ResultModal`, `StatsModal`, `CalendarModal`, `ShareGridModal`).
- **Why this approach?**
  - Rewards player speed and skill on the leaderboard, onboard new users with clear rules upon landing, and keeps visual theme consistent across all modals.
- **Alternatives Considered:**
  - *Sorting by attempts only*: Produces massive ties on the leaderboard.

---

### Decision 24: Hybrid Local Storage + Remote API Leaderboard Persistence
- **Approach Chosen:** Saved submitted leaderboard scores directly to `localStorage` (`cricksolve_leaderboard_v1`) in `ResultModal.tsx` while simultaneously dispatching a `POST` request to `/api/leaderboard`. In `LeaderboardModal.tsx`, merged both local and remote entries, deduplicated by name, and sorted strictly by **`time_ms ASC`**.
- **Why this approach?**
  - Guarantees 100% reliable instant leaderboard score and solve-time display even when offline or running in standalone offline client mode.
- **Alternatives Considered:**
  - *Relying solely on remote database*: Caused blank leaderboard display when remote backend database credentials were absent or delayed.

---

## Phase 11: `RETIRED?` Attribute Column & Staggered 3D Card Flip Animation

### Decision 25: Staggered 3D Tile Flip Animation & Retired Status Column
- **Approach Chosen:**
  1. Added a 9th table column **`RETIRED?`** (`YES`/`NO`) to indicate active vs retired cricketer status, evaluated against target player.
  2. Implemented Framer Motion 3D card flip (`rotateY: 90` -> `0`) on guess submission, staggered across tiles with incremental delays (`0.1s`, `0.2s`, `0.3s`, ..., `0.8s`).
- **Why this approach?**
  - Staggered 3D tile flip provides engaging visual feedback (Wordle-style reveal) as each attribute flips to display match color and directional indicators.
- **Alternatives Considered:**
  - *Instant static appearance*: Feels flat and lacks arcade animation delight.

### Decision 29: Rich Dataset Player Roles & Distinct Bowling Style Column
- **Approach Chosen:**
  1. Preserved exact dataset role descriptions (*Batting Allrounder, Bowling Allrounder, Spinner, Medium Pacer, Top Order Batter, Middle Order Batter, Wicketkeeper*) from `players_with_stats.csv` into `src/data/players.ts`.
  2. Created distinct attribute columns in `GuessesGrid.tsx` for **`ROLE`**, **`BATTING`** (Batting Hand), and **`BOWLING`** (Bowling Style/Type like *Right-arm Fast, Right-arm Offbreak, Legbreak, Slow Left-arm Orthodox, Does Not Bowl*).
  3. Added `Bowling Style` to the interactive hint selector (`AttributeHintPickerModal.tsx`).
- **Why this approach?**
  - Gives players complete tactical depth across all 3 key cricketer skill attributes (Batting, Bowling, and Role) as stored in the authoritative dataset.
- **Alternatives Considered:**
  - *Generic 4-category role abbreviation*: Oversimplified rich player distinctions like Spinners vs Medium Pacers vs Top Order Batters.

---

## Phase 16: Restoration of Original Sleek 2-Column Glassmorphic Dark Layout

### Decision 30: Original 2-Column Dark Layout Architecture
- **Approach Chosen:**
  1. Re-architected `src/app/page.tsx` back to the original sleek 2-column layout structure:
     - **Top Header (`Header.tsx`)**: Logo `CrickSolve 🏏`, category selection dropdown (*International, IPL Stars, Legends, Women's Cricket*), Streak badge, Standing rank badge, How to Play button, Past Games calendar button, Practice mode toggle button, Your Stats button, and Leaderboard button.
     - **Left Column (`AttributeCards.tsx`)**: Mystery Player card displaying the 6 unlockable attribute cards (*Country, Batting Hand, Bowling Style, Role, IPL Team, Retired*) with lock states 🔒, plus the progressive photo silhouette unblur preview.
     - **Right Column (`PlayerSearch.tsx` & `NumericHintsTable.tsx`)**: Top card for player search input with Fuse.js autocomplete & guess button, and bottom card for the Numeric Hints Table (*Birth Year, Tests, ODIs, T20Is* with directional `↑`/`↓` indicators).
  2. Styled with original sleek dark slate/blue background (`#0b1329`), glassmorphic rounded cards (`card-dark`), green action buttons (`btn-primary-green`), and comic buttons (`comic-button`).
- **Why this approach?**
  - Restores the exact user-favored classic design aesthetic while seamlessly keeping all dynamic backend anti-cheat APIs, Supabase solve-time leaderboards, and fullstack features.
- **Alternatives Considered:**
  - *Full-width 12-column grid*: Replaced by original 2-column layout requested by user.

---

## Phase 17: Official Neubrutalism Arcade Dot-Grid Theme & 2-Column Attribute Layout Integration

### Decision 31: Official Neubrutalism Arcade Color Scheme & 2-Column Attribute Card Layout
- **Approach Chosen:**
  1. Applied the **Official Neubrutalism Dot-Grid Arcade Theme** (`bg-dot-grid`, radial dots background, Neon Lime `#CCFF00`, Deep Purple `#7E22CE`, high-contrast black outlines `border-4 border-black`, and offset drop shadows `shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`) across the entire web app.
  2. Integrated the 2-column layout for player attributes:
     - **Left Column (`AttributeCards.tsx`)**: Mystery Player Card featuring the 6 unlockable attribute cards (*Country, Batting Hand, Bowling Style, Role, IPL Team, Retired*) styled with Neubrutalist boxes (`border-3 border-black`, `#CCFF00` matched cards, `#7E22CE` silhouette unblur card).
     - **Right Column (`PlayerSearch.tsx` & `NumericHintsTable.tsx`)**: Top card featuring the Purple Search Container with white input and Neon Yellow `GUESS (X/7)` button, and bottom card featuring the Neubrutalist Numeric Hints Table (`GUESS`, `BIRTH`, `TESTS`, `ODIS`, `T20IS` with directional stat arrows).
- **Why this approach?**
  - Combines the iconic retro-comic Neubrutalist arcade color scheme requested by the user with the clean 2-column attribute structure from the original plain vanilla JS app.
- **Alternatives Considered:**
  - *Dark slate glassmorphic layout*: Replaced by official Neubrutalism dot-grid arcade theme as requested by user.

---

## Phase 18: Removal of Format Category Mode & Header Rank Showcase Badge

### Decision 32: Streamlined Single Player Pool & Header Cleanup
- **Approach Chosen:**
  1. Removed the format category mode selector (*International, Women's, IPL Stars, Legends*) so that all 424 cricketers are available in search and puzzle evaluation by default.
  2. Removed the top header rank showcase badge (`RANK: #422` / `STANDING: #X`) for a cleaner header design.
- **Why this approach?**
  - Simplifies user experience and header navigation while keeping all 424 international players accessible to every player.
- **Alternatives Considered:**
  - *Category mode tabs*: Removed as explicitly requested by user.

---

## Phase 19: Interactive In-Place Shimmer Glare & 3D Card Flip Unlock Hint Mechanics

### Decision 33: Direct In-Place Glare FX & Click-to-Unlock 3D Card Shutter Flip
- **Approach Chosen:**
  1. Built interactive in-place hint selection mechanics directly on the Left Column attribute cards (`AttributeCards.tsx`).
  2. When the user clicks **`USE HINT (AVAILABLE AFTER 4 GUESSES)`**, `isHintSelecting` mode triggers:
     - All locked attribute cards (*Country, Batting Hand, Bowling Style, Role, IPL Team, Retired*) activate an animated gradient **shimmer/glare sweep effect** with glowing ring borders and `CLICK TO UNLOCK 💡` text prompts.
  3. Clicking any shining locked card triggers a 3D shutter card flip (`rotateY: [0, 90, 0]`, `scale: [1, 1.12, 1]`) revealing the target player's exact value in Neon Lime (`#CCFF00`).
  4. The game seamlessly resumes normal play without requiring modal popups.
- **Why this approach?**
  - Delivers tactile, high-engagement wordle-style arcade delight with direct card interactions directly on the main board.
- **Alternatives Considered:**
  - *Modal picker popup*: Less tactile than directly interacting with the board tiles.

---

## Phase 20: Bonus 8th Chance Continue Modal & Mystery Player Reveal Card

### Decision 34: Bonus 8th Chance Prompt with Automatic Hint Preview & Mystery Player Reveal Card
- **Approach Chosen:**
  1. Built `ContinueModal.tsx` triggering automatically when the 7th guess is wrong:
     - Prompts **"DO YOU WANT ANOTHER GUESS?"** (Yes / No).
     - Displays an automatic bonus hint inside the modal:
       - **If any non-numeric attribute is still locked**: Displays one locked attribute's value (e.g. `Role is Batting Allrounder`).
       - **If all 6 non-numeric attributes are unlocked**: Displays the mystery cricketer's exact stat profile (*Birth Year, Tests, ODIs, T20Is*).
     - Clicking **`YES (1 MORE GUESS)`** unlocks that hint and grants 1 additional 8th guess attempt.
     - Clicking **`NO`** ends the game as Lost and opens the Mystery Player Reveal Card.
  2. Redesigned `ResultModal.tsx` for game loss / reveal:
     - Displays mystery cricketer photo (unblurred), Name, Country, and Role.
     - Features 📋 **Share** button and ✖ **Close** button in top-right corner.
- **Why this approach?**
  - Gives players a second wind opportunity with tactical hint previews while presenting a clean mystery cricketer reveal card upon game end.
- **Alternatives Considered:**
  - *Abrupt game loss popup*: Disappointing user experience compared to an optional bonus 8th attempt with hint previews.

---

## Phase 21: Live On-Screen mm:ss Timer & Blank Leaderboard Name Input Box

### Decision 35: Standardized mm:ss Live Timer & Blank Name Input Box
- **Approach Chosen:**
  1. Added a live on-screen timer badge (`TIME: mm:ss`) in `Header.tsx` that starts counting up on the first submitted guess and freezes as soon as the puzzle is solved.
  2. Standardized time formatting across the entire app (`Header.tsx`, `ResultModal.tsx`, `LeaderboardModal.tsx`) using the `formatMmSs()` utility function (`01:24` format).
  3. Removed dummy default values from the leaderboard name input box in `ResultModal.tsx`, leaving it clean and blank for player input.
- **Why this approach?**
  - Provides real-time solve feedback in a readable `mm:ss` format while ensuring players type their custom handle cleanly.
- **Alternatives Considered:**
  - *Displaying raw seconds (84s)*: Less human-readable than standardized `mm:ss`.






---

## Phase 12: `T20IS` Column Restoration & Attribute Match Celebration Pop Animation

### Decision 26: T20IS Column Restoration & Spring Scale Match Reveal Animation
- **Approach Chosen:**
  1. Restored **`T20IS`** stat column alongside `TESTS` and `ODIS` inside `GuessesGrid.tsx`, complete with numeric directional indicators (`↑`, `↓`, `✓`).
  2. Upgraded `FlipTile` animation so that when an attribute is guessed correctly (Neon Lime `#CCFF00` or High-Vis Orange `#FF5500`), it triggers a 3D rotation flip + spring scale pop (`scale: [0.7, 1.18, 1.0]`) with a black ring outline.
- **Why this approach?**
  - Restores full 3-format international stat comparison (Tests, ODIs, T20Is) while giving tactile visual reward whenever an attribute turns green/lime.
- **Alternatives Considered:**
  - *Flat color swap*: Lacks game satisfaction feedback.

---

## Phase 13: Interactive Attribute Hint Picker & Dynamic Standing Rank Display

### Decision 27: Interactive Target Attribute Hint Selector & Dynamic Standing Rank Badge
- **Approach Chosen:**
  1. Built `AttributeHintPickerModal.tsx` triggering after 4 incorrect guesses (`guesses.length >= 4`). Instead of random facts, players click on any unrevealed attribute (Country, Role, Batting Hand, Birth Year, IPL Team, Retired Status) to immediately reveal its exact value.
  2. Replaced static rank numbers in `Header.tsx` with dynamic **`YOUR STANDING: #X`** (e.g. `#1`) computed directly from today's sorted leaderboard position. Shows `UNRANKED` if today's puzzle is not yet solved.
- **Why this approach?**
  - Empowers players with tactical choices over which clue to unlock while giving real-time feedback on their exact rank standing on today's leaderboard.
- **Alternatives Considered:**
  - *Static generic rank badge*: Displayed arbitrary static rank numbers unrelated to actual leaderboard placement.

---


---

## Phase 22: Real-Time Multiplayer Architecture & Anti-Cheat WebSocket Protocol

### Decision 36: Supabase Realtime Channel & Anti-Cheat Anonymous Broadcast Protocol
- **Approach Chosen:**
  1. **Supabase Realtime WebSockets (`cricksolve_room_<CODE>`)**:
     - Leveraged Supabase Realtime broadcast and presence channels for live 1v1 and multiplayer duels without hosting and maintaining a separate Node.js / Socket.io server.
  2. **Anti-Cheat Anonymous Guess Protocol**:
     - When a player submits a guess, the client evaluates matches and broadcasts an `OPPONENT_GUESS` event containing strictly: `{ guessNumber, matchResults: { country, role, batting, ... }, solved }`.
     - The guessed cricketer's name, ID, and photo are **never transmitted over the WebSocket network wire**. This prevents opponents from opening DevTools Network / WS tabs to peek at who was guessed.
  3. **In-Memory Room Lifecycle Manager (`src/lib/multiplayer-manager.ts`)**:
     - Implemented room creation with short 6-character room codes (`3EJFST`), host privilege management, up to 8 participant slots, synchronized ready toggles, and instant rematch target rotation.
  4. **Dedicated Zustand Multiplayer Store (`useMultiplayerStore.ts`)**:
     - Built dedicated reactive store for WebSocket subscriptions, active room metadata, real-time opponent guess streams, 3-second match countdowns, and showdown modal state.
- **Why this approach?**
  - Delivers instantaneous sub-50ms live multiplayer racing with zero server maintenance, eliminates packet sniffing cheat vectors, and provides a clean foundation for lobby and showdown UI components.
---

## Phase 23: Multiplayer Lobby UI, 1-Click Invite Links & Synchronized Countdown

### Decision 37: Neubrutalism Lobby Modal, URL Room Pre-fill & 3-2-1 Synchronized Countdown Overlay
- **Approach Chosen:**
  1. **Neubrutalist Lobby Modal (`src/components/MultiplayerLobbyModal.tsx`)**:
     - Designed tabbed interface (`CREATE ROOM` / `JOIN ROOM`) with high-contrast Neubrutalist styling (`border-4 border-black`, `#CCFF00`, `#7E22CE`, `shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`).
     - Features 6-character room code showcase with instant 1-click `COPY INVITE LINK` (`?room=CODE`) with copied toast feedback.
  2. **1-Click Shareable URL Parameter Detection**:
     - Automatically scans `window.location.search` for `?room=CODE` on mount. If present, automatically opens the Multiplayer modal in `JOIN ROOM` mode with the code pre-filled.
  3. **Participant Badge Grid & Synchronized Ready Check**:
     - Renders participant cards displaying Host Crown 👑 / Challenger Swords ⚔️ badges and real-time Ready toggles (🟢 `READY` in Neon Lime vs ⏳ `WAITING`).
     - Host "START BATTLE 🚀" action button is strictly gated until $\ge 2$ players are in the room and all have marked themselves ready.
  4. **Full-Screen 3-2-1 Synchronized Countdown Overlay**:
     - Built animated overlay with Framer Motion spring popping (`3... 2... 1... START!`) and audio chimes, synchronizing all players before closing the lobby and launching the match simultaneously.
---

## Phase 24: Real-Time Duel Opponent HUD & Anonymous Mini-Wordle Guess Streaming

### Decision 38: Live Opponent HUD & Anonymous Mini-Wordle Color Grid Stream
- **Approach Chosen:**
  1. **Neubrutalist Duel Race HUD (`src/components/OpponentHUD.tsx`)**:
     - Displays real-time 1v1 battle banner atop the main game board during active multiplayer duels (`room.status === 'in_progress'`).
     - Features side-by-side player cards (YOU vs OPPONENT) showing live guess progress counters (`GUESS X/7`), host/challenger badges, and victory indicators.
  2. **Live Mini-Wordle Matrix Visualizer**:
     - Visualizes the opponent's guess history in real-time as a compact 10-tile color matrix (🟩 Neon Lime for exact match, 🟧 Orange for higher/lower numeric directional hints, ⬛ Dark for mismatches).
     - Updates with sub-50ms latency as the opponent submits each guess, creating an exhilarating spectator racing dynamic.
  3. **Seamless Game Board Hooking (`PlayerSearch.tsx`)**:
     - Automatically invokes `broadcastGuess(guessNumber, attributeMatches, numericMatches, isCorrect)` upon guess resolution and triggers `broadcastFinish(tries, solveTimeMs)` when the winning cricketer is found.
- **Why this approach?**
  - Allows players to feel the visceral tension of racing live against their opponent in real-time, watching their opponent's color grid light up without spoiling the player's identity.
- **Alternatives Considered:**
  - *Showing only a simple progress bar (e.g., 3/7)*: Lacks the excitement of seeing which exact attribute columns the opponent just turned green.

  ## Phase 25: Shared Multiplayer Room Persistence Foundation

  ### Decision 39: Upstash-Compatible Redis for Live Room State
  - **Approach Chosen:**
    1. Added `@upstash/redis` as the production-compatible Redis client.
    2. Moved room reads and writes behind `src/lib/multiplayer-room-store.ts`.
    3. Used a six-hour TTL for room records so abandoned rooms expire automatically.
    4. Kept an expiring in-memory adapter for local development when Redis environment variables are absent.
    5. Kept Supabase Realtime as the browser event transport while Redis becomes the room state source of truth.
    6. Changed rooms to the agreed strict 1v1 capacity and replaced `Math.random()` room codes with `crypto.randomInt`.
  - **Why this approach?**
    - Redis provides shared, low-latency room state across application instances, while the adapter boundary keeps local development simple. Separating state storage from event delivery lets later phases make the server authoritative without coupling that work to the UI.
  - **Alternatives Considered:**
    - *Process-local `Map`*: Fast but loses rooms on restart and cannot coordinate across instances.
    - *Supabase-only room state*: Durable, but less suited to high-frequency mutable room state and atomic live-match operations.
    - *Redis Pub/Sub as browser transport*: Would require an additional server-side WebSocket bridge; Supabase Realtime already exists in the project.

## Phase 26: Multiplayer Authority and Anonymous Membership Tokens

### Decision 40: Sign Room Membership and Validate Multiplayer Guesses Server-Side
- **Approach Chosen:**
  1. Issue an HMAC-signed six-hour membership token when a user creates or joins a room.
  2. Bind the token to the room code, anonymous user ID, and participant role.
  3. Require the token for room lookup and room mutations.
  4. Restrict room status changes to the host and rematches to room participants.
  5. Persist countdown and active-match transitions through the authorized room API.
  6. For multiplayer guesses, resolve the target and validate the next attempt number from the server-side room record instead of trusting client target data.
  7. Replace the known production HMAC fallback with a required production secret and an ephemeral development-only key.
- **Why this approach?**
  - Anonymous signed sessions preserve the no-account multiplayer experience while preventing room-code-only control of room mutations. Server-side target resolution and attempt validation establish the authority boundary needed for reliable match outcomes.
- **Deferred:**
  - The legacy client board still receives and renders `targetPlayerId`. Removing it requires replacing local target-derived attributes and silhouette data with server-produced, non-spoiling hints. That work is explicitly deferred to the next phase.

## Phase 27: Target-Secrecy Contract

### Decision 41: Public Room Projections and Server-Issued Reveals
- **Approach Chosen:**
  1. Added a `PublicMultiplayerRoom` type that omits `targetPlayerId`.
  2. Projected private room records before returning them from create, join, lookup, rematch, and status APIs.
  3. Removed target IDs from realtime match-finish and rematch payloads.
  4. Returned only matched attribute values from multiplayer guess responses.
  5. Returned the target identity and photo only after a server-accepted winning guess, then delivered the safe reveal to both clients through the match-finish event.
  6. Changed multiplayer attribute cards and result UI to use server-issued data rather than resolving a room target locally.
- **Why this approach?**
  - It preserves the existing Wordle-like clue experience while removing the most direct answer leak from room responses, client room state, and realtime events.
- **Tradeoff:**
  - Client-side player search remains intentionally public for now. Full answer secrecy would require moving search and player metadata behind a server API or shipping a carefully reduced public index.

## Phase 28: Revisioned Realtime Protocol

### Decision 42: Server-Backed Lobby State and Round-Scoped Events
- **Approach Chosen:**
  1. Moved readiness changes through the authorized room API.
  2. Added server-owned `roundId` and monotonic `revision` fields to room records.
  3. Persisted accepted guess results, participant counters, and matched tiles in the room record.
  4. Added room code, round ID, and revision envelopes to realtime events.
  5. Rejected stale, duplicate, cross-room, and cross-round events in the client store.
  6. Returned the authoritative public room snapshot with accepted multiplayer guesses.
- **Why this approach?**
  - The room API becomes the source of truth for lobby and guess state, while revisioned events keep both clients convergent across duplicate messages, reconnects, and rematches.
- **Remaining limitation:**
  - Supabase broadcast events are still client-publishable in the current configuration. Channel authorization or trusted server-origin publication remains a later security phase.

## Phase 29: Authoritative Reconciliation

### Decision 43: Treat Realtime as a Sync Trigger, Not the Source of Truth
- **Approach Chosen:**
  1. Added a signed room snapshot reconciliation loop while a client is in a room.
  2. Changed realtime handlers to trigger an authenticated room fetch rather than directly applying event payloads.
  3. Persisted `countdownEndsAt` so clients can reconstruct a countdown after reconnecting.
  4. Persisted the terminal player reveal in the private room record and exposed it through the safe public projection after the match finishes.
  5. Cleared stale reveals when a new rematch round begins.
- **Why this approach?**
  - Supabase broadcast authorization is not yet connected to the anonymous signed-session system. Server reconciliation prevents forged or stale browser events from becoming durable client state while preserving realtime responsiveness as a trigger.
- **Tradeoff:**
  - Active rooms perform a lightweight authenticated fetch every second. This can later be replaced or reduced when trusted channel authorization is available.

## Phase 30: Serialized Room Mutations

### Decision 44: Lock Read-Modify-Write Room Operations
- **Approach Chosen:**
  1. Added a five-second Redis `SET NX` lock for each room mutation.
  2. Added token-checked Lua deletion so one request cannot release another request's lock.
  3. Queued same-room mutations in the local fallback adapter.
  4. Wrapped joins, readiness, status changes, rematches, and accepted guesses with the lock.
  5. Returned HTTP `409 Conflict` when a room is temporarily busy.
  6. Removed obsolete unguarded mutation helpers.
- **Why this approach?**
  - Room state uses a read-modify-write model, so concurrent requests could otherwise overwrite participant progress or accept the same attempt number twice. A short lock preserves the current architecture while making Redis deployments safe across instances.
- **Tradeoff:**
  - Requests can briefly receive a retryable conflict during contention. A later atomic Redis script could reduce this retry surface further.
























## Multiplayer Completion — Phase 1: Stable Client Match State (2026-09-27)

### Decision 45: Reconcile Gameplay Through One Server Snapshot Path
- Room snapshots initialize the board once per round, rather than an effect resetting it on every poll.
- Active status, winner, and reveal come from authenticated room snapshots. Broadcasts only prompt reconciliation.
- Countdown expiry does not optimistically start gameplay. Only the host requests the transition; both players wait for accepted server state.
- Connection generations, room identity, round identity, and revisions protect against late responses after leaving, reconnecting, or changing rounds.
- Room mutations share response/error handling. Guess failures remain visible and preserve the selected guess for retry.
- Both players receive terminal results; multiplayer results hide the solo leaderboard submission and local-only Next Player action.
- Existing rematch actions remain available; no new disconnect or rematch policy was introduced.

### Confirmed Product Rules
- Multiplayer has exactly seven guesses per player.
- A daily-style bonus hint becomes available after the fourth guess.
- Multiplayer must never offer an eighth guess.
- These rules are recorded requirements, not fully implemented in Phase 1. Server enforcement belongs to Phase 2; hint delivery and mode separation belong to Phase 4.
- Disconnect and rematch behavior will be decided later with the user.
- After each phase: update Markdown documentation, provide a proposed Git commit message, then wait for user approval before starting the next phase.

### Validation and Remaining Scope
- TypeScript passes; 12 isolated store regression tests pass.
- Changed-file lint: no errors, one existing image warning. Full-project lint: 12 errors and 15 warnings remain outside this phase's fixes.
- Browser-to-browser integration, Redis integration, and production build verification remain outstanding.
- Server atomic guess validation, membership identity protection, seven-guess enforcement, fourth-guess hint delivery, and separation from solo stats remain subsequent work.

## Multiplayer Completion — Phase 2: Atomic Server Rules (2026-09-27)

### Decision 46: Validate and Commit Each Guess Under One Room Lock
- Replaced the split route validation / counter mutation with `submitRoomGuess`. Membership, round identity, active status, participant membership, attempt sequence, the seven-guess cap, duplicate-player checks, evaluation and winner selection happen inside the same locked operation.
- Added private per-user guessed-player IDs to reject repeated players. Public room projections omit this history as well as the target ID.
- Redis commits check lock ownership in the same Lua operation that writes the room. Expired lock holders fail with `409` instead of overwriting a later mutation. Local storage clones records on reads/writes so rejected operations cannot leak mutations through references.
- Concurrent correct guesses produce one accepted winner. Multiplayer timing uses the server countdown deadline and accepted completion time; multiplayer responses no longer issue solo leaderboard victory tokens.

### Decision 47: Enforce Round-Scoped Transitions and Seven Attempts
- Guess and room PATCH requests require `roundId`; the client supplies it automatically.
- Only a ready two-player room can enter countdown. A host can advance countdown to active after the deadline; direct waiting-to-active, arbitrary status changes and client-declared finishes are rejected.
- Repeated accepted start requests preserve the original deadline/start timestamp and revision.
- Existing rematch reset requests are guarded to finished rounds and the expected round ID. This is transition validation only; rematch consent/design and disconnect policy remain deferred.
- Seven wrong guesses exhaust one player while the opponent may continue. If both exhaust their attempts, the round finishes without a winner and reveals the target. This is the initial no-winner outcome, without a secondary scoring rule.
- The client never enters the solo eighth-attempt flow for multiplayer. Multiplayer guess application also skips solo statistics/streak updates. Full mode/progress separation remains Phase 4.
- The fourth-guess daily-style bonus hint remains a confirmed Phase 4 requirement and is not implemented by this phase.

### Validation
- 26 regression tests pass (14 new server/storage/client-rule tests plus 12 Phase 1 tests).
- TypeScript passes. Changed-file lint has no errors and one existing image warning. Full-project lint still has 12 errors and 14 warnings.
- Redis lock ownership is tested with a deterministic adapter; a live Redis service and two-browser integration have not been tested.
- Replayed guesses are rejected rather than reconstructed after a lost HTTP response. Reconnect/history restoration and retry recovery remain later work.
- Anonymous identity reuse remains the known Phase 3 security gap; this phase does not claim secure participant identity issuance.

## Multiplayer Completion — Phase 3: Anonymous Identity and Permissions (2026-09-27)

### Decision 48: Server-Issued Participant IDs and Room-Bound Credentials
- Create and fresh join APIs generate UUID participant IDs; client-supplied identity and role fields are rejected. The client adopts the returned ID instead of generating a localStorage identity.
- Existing participant slots require their valid membership credential before any nickname or connection update. A legitimate rejoin preserves the stored role, including host ownership.
- Membership tokens carry a versioned purpose, exact room instance ID, room code, participant ID, role and finite expiry. Tokens from another room instance, solo tokens, malformed claims and expired/tampered tokens are rejected.
- Read and mutation authorization checks the token against the stored participant and role. Host-only transitions require both the valid host-role credential and the stored host ID. Mutation checks remain inside the room lock.
- Credentials travel in `Authorization: Bearer ...` headers, not room lookup URLs, guess bodies or realtime messages. Authenticated responses and errors use `Cache-Control: no-store`.
- Development signing keys survive hot reload within a process. Configure a stable `CRICKSOLVE_SECRET_KEY` for multiple processes and production.

### Decision 49: Bounded Requests and Shared Throttling
- JSON requests are limited to 4 KiB while reading the stream. Nicknames, room codes, round IDs, attempts and operation fields are validated. Create/join/room mutations/multiplayer guesses reject unsupported fields.
- Redis uses an atomic counter/expiry Lua operation for fixed 60-second rate windows. Local development has an expiring in-memory equivalent. Redis limiter failures return 503 without falling back to an unrestricted local path.
- Network limits: create 10/minute, join 30/minute, reads 600/minute, mutations 120/minute, guesses 120/minute. Authenticated member limits: reads 180/minute, mutations 30/minute, guesses 30/minute. Exceeded limits return 429 plus Retry-After.
- By default, network limits use a shared bucket rather than trusting caller-controlled address headers. Enable `CRICKSOLVE_TRUST_PROXY=1` only behind infrastructure that overwrites/sanitizes `x-forwarded-for`; it then keys limits by the first forwarded address. Subjects are hashed in Redis keys. Capacity/proxy validation remains a deployment task.
- Realtime channels remain public, untrusted notification transport. Outbound notifications contain only room code, round ID and revision. Incoming events prompt a signed fetch, coalesced to one in-flight request and at most one start every 500 ms. Public-channel abuse can still consume transport resources; no private-channel authorization is claimed.

### Compatibility and Validation
- Older membership tokens are intentionally invalid; recreate existing rooms after deploying this phase. No account system or persistent reconnect policy was introduced.
- 45 tests pass, including impersonation, role mismatch, expired/malformed credentials, reused room codes, authorization-header transport, rate windows and an in-process API match lifecycle. TypeScript and changed-file lint pass.
- Full-project lint remains at 12 errors and 14 warnings. Redis rate/lease behavior uses deterministic test doubles, not a live service. Two-browser and production deployment verification remain pending.
- Next: Phase 4's dedicated multiplayer gameplay/UI, fourth-guess bonus hint and progress isolation. Disconnect and rematch product decisions remain deferred.

## Multiplayer Completion — Phase 4: Dedicated Gameplay and Fourth-Guess Bonus (2026-09-28)

### Decision 50: Separate Duel Progress From Persisted Solo Progress
- Multiplayer now owns its guesses, hint, hint selection and request state in `useMultiplayerStore`. It no longer switches the solo game to unlimited or appends multiplayer guesses to `useGameStore`.
- `useActiveGame` projects the active board as daily, unlimited or multiplayer. Solo game actions remain in the solo store; multiplayer guess responses go directly to the multiplayer store. Room changes reset only duel progress.
- Entering, playing, finishing and leaving a duel preserve the solo board, session tokens and statistics. Solo persistence also includes existing hint values, manual unlocks, bonus flag and timer timestamps.
- The board is keyed by room/round or solo puzzle so pending local selections do not carry between games. Solo mode/calendar controls are disabled during a room session, and solo-only hint/continue modals are guarded.
- The header labels multiplayer and uses server room start/finish timestamps. Rules explain seven guesses and a selectable fourth-guess bonus. Duel share cards omit solo streaks. Photos remain hidden until the server reveals the finished round.

### Decision 51: One Private, Server-Authorized Attribute Hint Per Player
- After the fourth accepted guess, a player may select one still-locked Country, Batting Hand, Bowling Style, Role, IPL Team or Retired card. This is a clue, not an extra guess; seven remains the hard limit.
- `PATCH /api/multiplayer/room` accepts `action: hint` plus `attribute`, under the existing bearer authentication, round checks and rate limits.
- Hint selection runs inside the room lock. It requires an active round and four through six accepted guesses, rejects already matched attributes, and permits one chosen attribute per participant per round.
- Repeating the same accepted hint is idempotent while still eligible; changing the chosen attribute is rejected. Concurrent distinct requests cannot obtain two bonuses. Exhausted/finished/stale rounds cannot claim hints.
- `hintsByUser` is private server state. Authenticated responses include only the requesting player's `hint` alongside the public room. Neither opponents nor public broadcasts receive the hint value. Reconciliation restores an accepted hint if its immediate response is lost.
- Multiplayer no longer emits the solo engine's separate trivia hint after guess four. If all six cards are already matched, the UI says so rather than offering an unusable selection.
- Cards are keyboard-accessible buttons with pending/error behavior. A failed request does not consume the bonus locally and allows a retry. Seven wrong guesses never trigger an eighth-attempt prompt.

### Validation and Next Checkpoint
- 60 regression tests pass, including server hint eligibility/privacy/concurrency, the client-to-route hint flow, persisted solo isolation, and rendered UI checks.
- TypeScript passes; changed files have no lint errors (the existing ResultModal image warning remains). Full-project lint is now 10 errors and 8 warnings.
- UI tests render components to HTML; they do not replace real browser interaction tests. Live Redis, two-browser play and production-build verification remain pending.
- Phase 5 requires decisions about disconnect/recovery behavior. Phase 6's rematch consent/design remains deferred. No new disconnect or rematch product policy was introduced in Phase 4.


## Multiplayer Completion Phase 5 — Recovery and presence

Implemented authenticated same-tab refresh recovery using sessionStorage credentials and server-reconstructed personal history. Opponent history and the hidden target remain private. Revision/connection guards prevent stale responses from resurrecting a left room or rewinding guesses. Finished-session restoration opens the result once.

Presence is advisory: authenticated reads refresh lastSeenAt at five-second intervals; the server marks participants disconnected after 15 seconds. No automatic forfeit, host transfer, server leave policy or new rematch policy is introduced because those product decisions remain deferred. The existing local leave clears saved credentials; a vacated server slot can remain occupied until room expiry. This limitation must be resolved before release.

Transient errors preserve credentials; invalid membership/room responses clear them. SessionStorage availability and the room/token lifetime bound refresh recovery. Browser tab duplication can copy credentials; tabs are not guaranteed independent identities. Use separate browser contexts to test two players.

Validation: 67 regression tests, TypeScript and changed-file lint pass. Lightning emojis removed throughout project source/docs. Live integration remains pending.


## Multiplayer Completion Phase 6 — Mutual rematch consent

Replaced unilateral rematch reset with request/accept/cancel/decline. The requester cannot accept their own request; only the requester can cancel, and only the opponent can accept or decline. Concurrent requests preserve the first invitation and require explicit acceptance. Requests retain the previous result until acceptance.

Each invitation has a server-generated ID bound to the finished round. All changes run under the existing room mutation lock and membership validation. Acceptance rotates the round/target once, clears private guesses/hints and public results, and restores host-ready/guest-not-ready lobby state. Tokens retain their existing expiry; rematches do not extend membership validity.

Result/HUD controls work for wins and draws. Both player score lines are displayed; solo leaderboard behavior remains separate. Disconnect forfeits, host transfer and server-side leave remain deferred. Validation: 74 tests, TypeScript, zero changed-file lint errors (existing image warning). Phase 7 not started.


## Multiplayer Completion Phase 7 — Integration and release verification

Added Playwright as a development dependency and a two-browser production-server smoke test. Browser contexts use distinct real memberships and the UI for creating/joining, readiness, guesses and mutual rematches. The test server has an isolated test-only signing key and explicitly disables Redis configuration; it never reuses an existing server or touches production. Browser artifacts are ignored by Git.

The target remains random with no test backdoor. An early correct guess is valid and may skip browser hint/recovery checks; deterministic regressions cover these paths separately. Installed macOS Chrome is used when available, an explicit E2E_CHROME_PATH can override it, and other environments can install Playwright Chromium.

Results: 74 regressions, TypeScript, one real two-browser scenario and the webpack production build pass. New test/config lint passes. Existing full-project lint failures remain unchanged. Turbopack could not bind an internal port in this environment; webpack was used without changing the default build command.

No staging configuration was available, so real Redis/Supabase and deployed multi-instance behavior remain unverified. No deployment occurred. Disconnect penalties, server leave and host transfer remain deferred product decisions. Local Phase 7 checks are complete; release approval should wait for these outstanding items and dependency audit review.


## Phase 8 — Release hardening

Prioritized verifiable local release blockers while the previously deferred disconnect/host-transfer policy question remains pending. No disconnect penalties, slot-release or host-transfer behavior changed.

Pinned Next.js and its lint config to 16.3.8, applied compatible transitive audit fixes without force-upgrading, and verified zero known npm advisories. Resolved existing lint errors while keeping application checks enabled: the two intentional CommonJS maintenance scripts get a narrowly scoped module-rule override; immutable script arrays use const; leaderboard JSX and effect ownership are corrected.

Leaderboard loads now have cancellation and stale-response protection. Tests cover close-before-load and old-date responses arriving after a new one. The existing emoji-free Battle label has a rendered regression assertion.

Validation: 76 tests, TypeScript, full lint (zero errors/six warnings), webpack production build and two-browser integration pass. No deployment occurred. Live service verification and lifecycle product decisions remain open.


## Phase 9 — Approved disconnect and host-transfer policy

The user's approval to proceed following the proposed 60-second reconnect/forfeit and lobby host-transfer policy authorizes this lifecycle phase. Server adjudication uses 60 seconds from last recorded authenticated contact, recorded at five-second intervals. Reconciliation runs inside the mutation lock before refreshing a returning actor, so late actions cannot revive a lost round. Both expired participants produce abandonment/no winner; terminal results cannot be rewritten.

Explicit leave forfeits active play immediately. Lobby/countdown leave or expiry removes the participant, cancels countdown and promotes the remaining member; an empty room is closed with a TTL-bound tombstone. Finished rooms retain departed participants for score history, revoke their access and disable rematch. Closed rooms reject joins. Remaining players can leave; playing a new opponent after a finished departure requires a new room.

Promotion exchanges the signed guest credential for a host credential during authenticated sync without extending expiry. Host-only mutations require the new role; self-leave remains permitted during the exchange race. Client leave clears credentials only after success or terminal membership rejection; transport failures retain them for retry.

No cron/background adjudicator is added: the next room interaction settles expiry. Tests validate exact boundaries, both offline, explicit leave, host transfer and stale credentials. 92 tests, TypeScript, lint and production/browser checks validate local behavior; live Redis/Supabase remains pending.


## Final phase — staging verification preparation

Do not equate another local/in-memory pass with live verification. This session has no staging origin, required Redis/Supabase settings, environment file or linked Vercel project. Live verification and release sign-off remain blocked on configuration; the phase is not complete.

Added a separate staging Playwright config that requires a dedicated HTTPS origin and all service settings, disables the local webServer fixture and includes live Redis/Supabase probes plus the existing browser scenario. No deployment signing key is required by the runner. The operator must confirm the deployment uses these services and prove different application instances through routing/log evidence.

Probe data is isolated: unique expiring Redis keys, temporary realtime channels and cleanup of the browser test's own memberships. No credentials are printed. Added three configuration/discovery checks; 95 regressions pass. No live tests or deployment were performed.
