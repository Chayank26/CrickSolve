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

## Phase 14: Streak Clean-up, Header Standing Badge Simplification & Dedicated `YOUR STATS` Button

### Decision 28: Dedicated `YOUR STATS` Button & Cleaned Top Header Badges
- **Approach Chosen:**
  1. Removed 🔥 fire emoji from all streak counter elements for a cleaner text aesthetic (`STREAK: 12`).
  2. Cleaned up top header badges: standing is displayed cleanly in the top right badge (`STANDING: #1` or `STANDING: --` when unranked), avoiding cluttered duplicate unranked buttons.
  3. Added a dedicated **`YOUR STATS`** button in the top action bar opening `StatsModal.tsx`, which displays Games Played, Games Solved, Win Rate %, Current Streak, and Max Streak.
- **Why this approach?**
  - Separates general user performance metrics (Win %, Games Played) from today's competitive solve-time leaderboard while keeping the header uncluttered.
- **Alternatives Considered:**
  - *Merging stats into leaderboard modal*: Creates visual clutter and confuses personal stats with daily competitive rankings.















