# Technology Stack & Tooling Justifications - CrickSolve 🏏

This document lists every technology, library, database, and tool used in the CrickSolve codebase, alongside a detailed technical justification for why it was chosen over alternative technologies that perform similar functions.

---

## Complete Technology Stack| Technology | Category | Role in Project | Alternative Considered | Justification for Selection |
| :--- | :--- | :--- | :--- | :--- |
| **Real-Time Opponent Race HUD (`OpponentHUD.tsx`)** | Real-Time UI Engine | Displays live 1v1 duel scoreboard, attempt counters, and 10-tile mini-Wordle color matrix reflecting opponent guesses in real-time. | **Simple static text counter** | Live visual color matrix creates intense, arcade-like competitive race tension. |
| **Multiplayer Lobby UI Modal (`MultiplayerLobbyModal.tsx`)** | Multiplayer UI Engine | Provides room creation, 6-letter code entry, 1-click invite link copying (`?room=CODE`), player badge slots, and synchronized 3-2-1 countdown screen. | **Manual page reloads & standalone lobby route** | Seamless in-place modal maintains application context and preserves zero-friction instant play. |
| **Supabase Realtime WebSockets (`cricksolve_room_<CODE>`)** | Real-Time Networking | Powers live 1v1 multiplayer duels, room subscriptions, presence tracking, and synchronized match countdowns. | **Custom Node.js / Socket.io server on external VPS** | Supabase Realtime is serverless, auto-scaling, and requires zero standalone server infrastructure or maintenance. |
| **Anti-Cheat Anonymous Broadcast Protocol (`src/types/multiplayer.ts`)** | Security & Networking | Broadcasts guess outcome flags (`country: true`, `role: false`) over WebSocket without transmitting player names or IDs. | **Broadcasting full guessed player object** | Prevents opponents from inspecting DevTools Network tabs to peek at guessed players, preserving game integrity. |
| **Multiplayer Room Lifecycle Manager (`src/lib/multiplayer-manager.ts`)** | Backend Room Engine | Handles 6-character room codes (`3EJFST`), player join/leave, ready synchronization, and instant rematch target rotation. | **Stateless database polling** | Provides sub-50ms in-memory responsiveness for room state transitions and multi-round rematches. |
| **Zustand Multiplayer Store (`useMultiplayerStore.ts`)** | Real-Time State Management | Reactive store managing room connection states, live opponent guess grids, countdown animations, and showdown results. | **React Context** | Eliminates unnecessary re-renders across the component tree during high-frequency live WebSocket message bursts. |
| **Live `mm:ss` On-Screen Timer Ticker (`Header.tsx` & `utils.ts`)** | UI Timer Engine | Ticks live solve duration in `mm:ss` format from the first submitted guess until puzzle win, standardized across Header, Result Modal, and Leaderboard. | **Displaying raw seconds (84s)** | Provides clear human-readable time tracking with zero lag. |
| **Blank Leaderboard Name Input (`ResultModal.tsx`)** | User Profile Input | Leaves name text field blank by default, allowing players to type their own handle cleanly. | **Defaulting to dummy name 'Cricketer'** | Prevents accidental submission of default placeholder handles. |
| **Bonus 8th Chance Continue Engine (`ContinueModal.tsx`)** | Game Mechanics | Triggers on 7th incorrect guess, prompting **"DO YOU WANT ANOTHER GUESS?"** (Yes/No) with automatic locked attribute hint or stat profile preview. | **Abrupt game loss** | Gives players an optional second wind attempt with tactical hint preview. |
| **Mystery Cricketer Reveal Card (`ResultModal.tsx`)** | UI Reveal Modal | Renders target player photo (unblurred), Name, Country, and Role with 📋 Share and ✖ Close action buttons in top-right corner. | **Generic game over text** | Provides clear mystery cricketer reveal card as requested by user. |
| **Interactive In-Place Shimmer Glare & 3D Shutter Flip Unlock Engine** | Game Mechanics & FX | Triggers animated gradient glare sweeps across locked attribute cards when hint mode activates, enabling direct click-to-unlock 3D shutter card flips (`rotateY: [0, 90, 0]`). | **Modal picker popup** | Provides tactile, high-delight wordle-style arcade board interactions without leaving the game flow. |
| **Streamlined Universal Player Search Engine** | Data Search | Allows fuzzy search and puzzle target selection across all 424 international cricketers without format filtering. | **Format category mode filtering** | Provides an unconstrained player search experience as requested by user. |
| **Clean Neubrutalism Header Badges** | UI Navigation | Displays `DAILY #142` and `STREAK` counter badges without rank showcase badge. | **Displaying static or dynamic rank text** | Keeps header clean and uncluttered. |
| **Official Neubrutalism Dot-Grid Theme & 2-Column Attribute Layout** | UI Layout & Design Engine | Renders 2-column layout with Left Neubrutalist AttributeCards (6 unlockable tiles + Silhouette) and Right Purple Search Container & Neubrutalist Numeric Hints Table on a dot-grid backdrop. | **Dark glassmorphism layout** | Combines the official Neubrutalism arcade aesthetic requested by user with the original 2-column attribute structure. |
| **Original 2-Column Dark Layout Architecture** | UI Layout Engine | Renders 2-column layout with Left AttributeCards (6 unlockable tiles + Silhouette) and Right Search Box & Numeric Hints Table. | **Single-column grid** | Matches the original classic HTML/CSS design structure with superior readability and compact desktop organization. |
| **Sleek Dark Glassmorphism Styling (`globals.css`)** | Design System | Dark slate/blue backdrop (`#0b1329`), glassmorphic rounded cards (`card-dark`), green action buttons (`btn-primary-green`), and comic buttons (`comic-button`). | **Neubrutalism high-contrast outline styling** | Restores the sleek dark-mode glass aesthetic requested by user. |
| **Rich Dataset Roles & Bowling Style Evaluator** | Data Pipeline | Preserves and evaluates exact player roles (*Batting Allrounder, Bowling Allrounder, Spinner, Medium Pacer, Top Order Batter, Middle Order Batter, Wicketkeeper*) and bowling styles (*Right-arm Fast, Offbreak, Legbreak, Orthodox, Does Not Bowl*). | **Simplified 4-role classification** | Delivers authentic cricket player attributes matching the user's authoritative dataset. |
| **Dedicated Personal Stats Dashboard (`StatsModal.tsx`)** | Analytics UI | Renders Games Played, Games Solved, Win Rate %, Current Streak, and Max Streak in a Neubrutalist modal. | **Mixing stats into leaderboard** | Keeps personal progress metrics distinct from daily solve-time competitive rankings. |
| **Clean Header Badge System (`Header.tsx`)** | Header Navigation | Cleanly displays `STREAK: X` without emojis and `STANDING: #X` (or `--` when unranked). | **Cluttered badge bar with unranked buttons** | Maintains clean Neubrutalism design aesthetics and clear visual hierarchy. |
| **Interactive Attribute Hint Picker (`AttributeHintPickerModal.tsx`)** | Game Play Mechanic | Allows players to select and reveal any specific target attribute (Country, Role, Batting Hand, Birth Year, IPL Team, Retired Status) after 4 guesses. | **Random trivia facts** | Provides direct tactical utility that aids players in solving the puzzle intelligently. |
| **Dynamic Standing Rank Calculation (`Header.tsx`)** | Leaderboard UI Engine | Computes exact position (`#1`, `#2`, etc.) in today's sorted leaderboard array and displays standing in the top header bar. | **Static dummy rank text (`#422`)** | Displays real, live standing based on the player's actual solve time and attempt count performance. |
| **Spring Scale Match Reveal (`FlipTile`)** | Animation FX | Triggers a 3D flip + spring scale pop (`scale: [0.7, 1.18, 1.0]`) with black outline ring whenever an attribute turns Neon Lime (`#CCFF00`). | **Flat color swap** | Gives high-tactile visual reward and arcade delight on correct attribute unlocks. |
| **T20IS Stat Comparison Engine (`GuessesGrid.tsx`)** | Numeric Comparison | Evaluates T20 international appearance count comparison (`higher`, `lower`, `match`) alongside Tests and ODIs. | **Omitting T20Is** | Completes all 3 formats of international cricket statistics for comprehensive player matching. |
| **Staggered 3D Tile Flip Engine (`FlipTile`)** | Animation Pipeline | Animates 3D card flips (`rotateY: 90` -> `0`) with incremental delays (`0.1s` to `0.8s`) across all attribute tiles. | **Instant text rendering** | Creates Wordle-style reveal satisfaction with smooth 60fps GPU acceleration. |
| **Retired Status Matching Engine (`GuessesGrid.tsx`)** | Attribute Evaluator | Evaluates cricketer retirement status (`YES`/`NO`) against target player. | **Omitting retirement status** | Adds crucial tactical clue for distinguishing active stars from retired legends. |
| **Fastest Solve-Time Ranking Engine** | Leaderboard Algorithm | Computes exact duration (`endTimeMs - startTimeMs`) in seconds and sorts Supabase queries by `time_ms ASC, attempts ASC`. | **Sorting by attempt count only** | Differentiates top players and eliminates leaderboard ties by prioritizing faster solve speeds. |
| **Neubrutalism Modal Design System** | Visual UI Paradigm | Applies unified Neubrutalism design (`border-4 border-black`, `shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`, `#CCFF00`, `#7E22CE`) across all modals (`LeaderboardModal`, `HowToModal`, `ResultModal`, `StatsModal`, `CalendarModal`, `ShareGridModal`). | **Inconsistent modal styling** | Ensures 100% visual cohesion across all popups, cards, and pages. |
| **Neubrutalism Design System** | Visual UI Paradigm | High-contrast black outlines (`border-4 border-black`), offset drop shadows (`shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`), neon palette (`#CCFF00`, `#6B21A8`, `#FF5500`), and dot-grid background (`bg-dot-grid`). | **Material / Glassmorphism** | Delivers iconic retro comic arcade aesthetic requested by user with distinct visual identity and bold readability. |
| **Next.js 14+ (App Router)** | Web Framework | Fullstack framework providing React UI components and Server API Routes for anti-cheat validation. | **Vite + React SPA** | Vite SPA compiles into static JS bundle, exposing all mystery player data to client-side inspection. Next.js provides serverless API routes to hide answers on the server and support dynamic OG share cards via SSR. |
| **Web App Manifest (`public/manifest.json`)** | PWA Engine | Enables "Add to Home Screen" mobile app installation and standalone window display. | **Standard border bookmarking** | Gives native app feel, status bar theme adaptation, and home screen icon shortcut without app store distribution overhead. |
| **Canvas Confetti Particle Engine** | Celebration FX | Particle explosion on game win (`ResultModal.tsx`). | **Heavy GIF/Video assets** | Canvas rendering is lightweight, GPU-accelerated, and scales smoothly across screen resolutions. |
| **Clipboard Web API (`navigator.clipboard`)** | Social Share Engine | Instant copying of emoji scorecards directly to system clipboard. | **`execCommand('copy')` (Deprecated)** | Modern Web API supported across all contemporary mobile and desktop browsers. |
| **Category State Filter Engine (`CategorySelector.tsx`)** | Game Mode Manager | Filters active player search pool and daily mystery target across International, IPL, Legends, and Women's Cricket formats. | **Separate hardcoded page routes** | Single reactive component state reduces code duplication while supporting multi-format play. |
| **JS Date Calculation Matrix (`CalendarModal.tsx`)** | Calendar Picker | Calculates month offset, weekday alignment, and days in month without external date libraries. | **`date-fns` / `moment.js`** | Built-in JavaScript `Date` API handles calendar calculations with zero extra bundle weight. |
| **Howler.js Web Audio Engine** | Sound Manager | Handles `playFlipSound()`, `playWinSound()`, and `playUnlockSound()`. | **HTML5 Audio API** | Buffers MP3 audio files in memory for zero-latency playback across mobile Safari and desktop browsers. |
| **CSS `filter: blur()` & Framer Motion** | Visual Unblur Engine | Dynamically computes blur radius for mystery player photo silhouette inside `SilhouetteReveal.tsx`. | **Canvas pixel manipulation** | CSS `filter: blur()` is hardware-accelerated by GPU, rendering 60fps transitions without CPU overhead. |
| **Framer Motion (`rotateY` / `AnimatePresence`)** | Animation Engine | 3D card flip effects on attribute unlocks and smooth layout transitions. | **CSS `@keyframes` animations** | Framer Motion handles dynamic state transitions cleanly without manual CSS class toggling or animation end listeners. |
| **Fuse.js Autocomplete Engine** | Fuzzy Search | Fuzzy search matching for cricketer names, countries, and IPL teams inside `PlayerSearch.tsx`. | **Native string `startsWith`** | String search fails on player last name lookups or minor typos (e.g. searching `"Tendulkar"` without `"Sachin"`). |
| **Lucide React UI Vector Icons** | UI Graphics | Vector icons for `Flame` (streak), `Lock`, `CheckCircle2`, `ArrowUp`, `ArrowDown`, `Lightbulb`, `Volume2`. | **Raw SVG inline code** | Clean, typed React components with minimal bundle footprint. |. |. |
| **Next.js Route Handlers (`src/app/api/puzzle/*`)** | Serverless API Engine | Secure HTTP endpoints for daily puzzle resolution, guess evaluation, and practice mode target generation. | **Standalone Express server** | Standardized Next.js route handlers run serverlessly alongside the frontend without needing separate backend infrastructure or CORS configuration. |
| **TypeScript** | Language | Strict type definitions for player statistics, guess results, API contracts, and Supabase database schemas. | **JavaScript** | Prevents runtime `TypeError` issues when evaluating player stats and attribute matches across complex data structures. |
| **Tailwind CSS** | CSS Framework | Utility-first styling engine for glassmorphic cards, responsive grid layouts, animations, and dark mode. | **Plain CSS / CSS Modules** | Eliminates CSS file bloat and class-name duplication. Enables dynamic HSL color tailoring and dark-mode toggling natively. |
| **Supabase** | Database & Auth | Relational PostgreSQL database for storing players, daily puzzle seeds, real-time leaderboards, and user stats. | **Firebase Cloud Firestore** | Supabase uses standard SQL with Row-Level Security (RLS) and PostgreSQL functions, making real-time leaderboard ranking queries simpler, faster, and more secure than NoSQL index workarounds in Firestore. |
| **Supabase RLS Policies** | Security Engine | Row-Level Security declarative policies in SQL. | **Application-level middleware filtering** | RLS runs directly inside the PostgreSQL kernel, guaranteeing that read/write permissions cannot be bypassed even if API credentials are leak-tested. |
| **Zustand (`useGameStore`)** | State Management | Client-side reactive store for active gameplay, guess log, streaks, unlocked hints, and sound preferences. | **Redux Toolkit / React Context** | Redux requires extensive boilerplate; React Context causes app-wide re-renders on single state updates. Zustand is 1kB, hook-native, and auto-persists to `localStorage`. |
| **Zustand `persist` Middleware** | Persistence Layer | Automatic browser `localStorage` syncing for game streaks, active daily guess state, and settings. | **Manual window.localStorage calls** | Prevents race conditions and state sync bugs across reloads. |
| **Framer Motion** | Motion & Animation | Declarative animations for tile flipping, lock shattering, modal overlays, and directional stat arrows. | **CSS Keyframes / GSAP** | Declarative React animation syntax integrated directly into component state; lighter footprint than full GSAP library. |
| **Fuse.js** | Search Engine | Lightweight client-side fuzzy searching for player autocomplete dropdown. | **Server-side SQL `LIKE`** | Instant keystroke search with zero network latency, with built-in fuzzy matching for misspelled player names. |
| **Howler.js** | Audio Engine | Cross-browser Web Audio wrapper for UI sound effects (lock shatter, card flip, victory chime). | **HTML5 `<audio>` Tag** | HTML5 `<audio>` suffers from latency and mobile browser audio unlock restrictions (especially Safari iOS). Howler.js buffers audio Web Audio nodes smoothly. |
| **Lucide React** | UI Icons | Modern vector icons for locks, hints, trophies, streaks, play controls, and navigation. | **FontAwesome / Heroicons** | Tree-shakeable SVG components designed specifically for React with customizable stroke width and color. |

## Multiplayer Implementation Phases

### Phase 1: Shared Room State Boundary

| Technology | Role in Phase 1 | Current Behavior |
| :--- | :--- | :--- |
| **Upstash Redis REST (`@upstash/redis`)** | Shared live room persistence | Stores room records under `cricksolve:multiplayer:room:<CODE>` with a six-hour TTL when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are configured. |
| **In-memory room adapter** | Local development fallback | Preserves local development without Redis and applies the same six-hour expiration policy. It is not suitable for multi-instance deployment. |
| **Supabase Realtime** | Browser event transport | Remains the client-facing broadcast channel for lobby and match events; Redis is the room state source of truth. |
| **Node `crypto.randomInt`** | Room-code generation | Generates six-character room codes with cryptographic randomness instead of `Math.random()`. |

Phase 1 changes the room manager to asynchronous storage operations and enforces the agreed strict 1v1 capacity. It does not yet remove `targetPlayerId` from API responses or authorize room mutations; those are Phase 2 concerns.

### Phase 2: Multiplayer Authority and Membership

| Technology | Role in Phase 2 | Current Behavior |
| :--- | :--- | :--- |
| **Signed HMAC membership tokens** | Anonymous room authorization | Create and join responses issue six-hour tokens bound to room code, user ID, and role. Protected room operations verify the token server-side. |
| **Server-derived multiplayer guesses** | Match authority | Multiplayer guess requests resolve the room target on the server, require an active match, require room membership, and validate the next attempt number. |
| **Authorized room transitions** | Lifecycle authority | Only the host can change room status; only a room participant can request a rematch. Countdown and active-match transitions are persisted through the room API. |
| **Production secret enforcement** | Token integrity | Production requires `CRICKSOLVE_SECRET_KEY`; development uses an ephemeral process key when no secret is configured. |

Required production environment variables now include `CRICKSOLVE_SECRET_KEY`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN`.

Phase 2 does not yet remove `targetPlayerId` from the legacy room payload because the current client-rendered board uses it to display multiplayer attributes and the silhouette. Target secrecy requires a board contract based on server-produced hints and is the next phase.

### Phase 3: Target-Secrecy Contract

| Technology | Role in Phase 3 | Current Behavior |
| :--- | :--- | :--- |
| **Public room projection** | Sanitize room responses | Multiplayer create, join, lookup, rematch, and status responses omit the private `targetPlayerId`. |
| **Server-issued matched attributes** | Preserve gameplay clues without target access | Multiplayer guess responses include only attribute values confirmed by that guess, never the full target profile. |
| **Terminal multiplayer reveal** | Reveal the result safely | The server returns the target identity, country, role, and photo only after a server-accepted winning guess, then the match-finish event delivers it to both clients. |
| **Private room record** | Preserve server authority | The target remains available only inside server-side room storage and evaluation code. |

The general client player search dataset remains public by the current product decision, so a determined user can still inspect player records. Phase 3 closes the room-response and client-target-state leaks but does not yet move search behind a server API.

### Phase 4: Revisioned Realtime Protocol

| Technology | Role in Phase 4 | Current Behavior |
| :--- | :--- | :--- |
| **Server-backed readiness mutation** | Authoritative lobby state | Ready toggles are persisted through the authorized room API instead of being accepted from local client state. |
| **Server-owned `roundId`** | Match identity | Every room starts with a unique round ID, and every rematch rotates it. Events from an earlier round are rejected by clients. |
| **Monotonic room `revision`** | Event ordering | Room mutations and accepted guesses advance a revision. Clients ignore stale or duplicate events. |
| **Realtime event envelopes** | Transport consistency | Countdown, room update, guess, finish, and rematch events carry room code, round ID, and revision metadata. |

Supabase Realtime remains an event transport and is not yet an authenticated server-origin channel. Later hardening should configure channel authorization or route authoritative event publication through a trusted server process.

### Phase 5: Authoritative Reconciliation

| Technology | Role in Phase 5 | Current Behavior |
| :--- | :--- | :--- |
| **Authenticated room polling** | Reconnect and consistency layer | Each active client reconciles its room through the signed room API every second. |
| **Realtime event triggers** | Low-latency wake-up | Broadcast events trigger an immediate room fetch but are not applied directly to client state. |
| **Persisted terminal reveal** | Reconnect-safe result state | The server stores the safe reveal in the room after the first accepted win; both clients receive it from the next room snapshot. |
| **Server countdown timestamp** | Reconstructable countdown | The room stores `countdownEndsAt`, allowing a client to recover the countdown after a refresh or delayed event. |

This phase makes Redis-backed room state authoritative even though Supabase Realtime remains client-publishable. Polling adds controlled latency and requests, but avoids treating unauthenticated browser broadcasts as facts.

### Phase 6: Serialized Room Mutations

| Technology | Role in Phase 6 | Current Behavior |
| :--- | :--- | :--- |
| **Redis `SET NX` lock** | Cross-instance mutation serialization | Redis deployments acquire a five-second per-room lock before reading and writing mutable room state. |
| **Lua compare-and-delete** | Lock ownership safety | A lock is released only by the request that owns its token. |
| **Queued in-memory fallback** | Local development serialization | Without Redis, mutations for the same room are queued in process to preserve local correctness. |
| **HTTP 409 conflict responses** | Client-visible contention handling | Concurrent room actions receive a retryable conflict response instead of being reported as an internal server error. |

Joins, readiness changes, status transitions, rematches, and accepted guesses now share the same per-room mutation boundary. This prevents duplicate attempt numbers and conflicting winner/rematch writes.

## Multiplayer Completion Phase 1 — Client Reconciliation (2026-09-27)

- `useMultiplayerStore.setRoomSnapshot` is the common room-state entry point, deriving active state, winner and reveal from server responses.
- `initializedRoundId` prevents repeated board initialization. `connectionVersion` invalidates asynchronous work after leaving/reconnecting, including returning to the same room.
- Room revisions reject older snapshots across rounds; room mutation and guess responses also check their originating round.
- Countdown intervals are retained and cancelled explicitly. Countdown expiry triggers a host-only API mutation rather than a local state transition.
- Supabase broadcasts remain untrusted reconciliation triggers; the server is authoritative for displayed match outcomes.
- Store regression tests use Node's built-in test runner and the installed TypeScript transpiler, with deterministic transport/timer and solo-store boundaries. They exercise the actual multiplayer store without external services.

Run: `node --test tests/multiplayer-state.test.mjs`.

Validation: 12 tests pass; TypeScript passes; changed-file lint has zero errors and one existing image warning. Full-project lint still reports 12 errors and 15 warnings. Live two-browser, shared Redis and production-build checks have not been performed in this phase.

## Multiplayer Completion Phase 2 — Atomic Validation and Lease-Safe Writes

- `submitRoomGuess` owns membership/round/attempt checks, private target evaluation, progress updates and finish selection under `withRoomMutation`.
- `withRoomMutation` passes a commit callback. In Redis mode, Lua compares the lock token and writes the room with its six-hour TTL atomically. Lock expiry rejects the commit. Memory mode queues mutations and returns detached record copies.
- `MULTIPLAYER_MAX_GUESSES` is seven. Private `guessedPlayerIdsByUser` prevents repeated player guesses and is excluded from `PublicMultiplayerRoom`.
- `finishReason` distinguishes `solved` from `exhausted`. Exhausted means both players used seven guesses without a solution; it has no winner.
- Multiplayer requests require `roundId`; mutation handlers reject stale rounds. Host countdown transitions enforce readiness, ordering and the persisted deadline. Timing uses that deadline, not client session tokens.
- `useGameStore.addGuess` has a multiplayer branch that cannot open the eighth-attempt dialog or increment solo stats. A dedicated multiplayer mode, persistence separation and fourth-guess selectable bonus hint remain later work.

Run all regressions: `node --test tests/*.test.mjs`.

Validation: 26 tests pass; TypeScript passes; changed-file lint has no errors and one existing image warning. Full lint has 12 errors and 14 warnings. The Redis test uses a deterministic fake and does not replace live service verification. Production build and two-browser testing remain outstanding.

## Multiplayer Completion Phase 3 — Membership Security and Request Limits

| Boundary | Implementation |
| --- | --- |
| Participant identity | UUIDs generated in create/join route handlers; request identity/role fields rejected |
| Token contract | HMAC signature plus purpose/version, room instance, room code, participant ID, role, finite six-hour expiry |
| Room authorization | Token role and user checked against stored participant; host transitions also check room host ownership |
| Credential transport | Bearer authorization headers; no credentials in URLs or public broadcasts; no-store responses |
| Validation | Bounded 4 KiB stream reader; allowed fields; nickname ≤20 characters; valid six-character code; UUID round ID; integer attempts |
| Rate limits | Atomic Redis counter/expiry script, or expiring local development buckets; 429/Retry-After and 503 on limiter outages |
| Realtime | Public notifications carry room/round/revision only; one reconciliation in flight and 500 ms minimum between starts |

`src/lib/multiplayer-http.ts` centralizes parsing, validation, bearer extraction and safe error responses. `src/lib/multiplayer-rate-limit.ts` implements rate windows. `src/lib/multiplayer-errors.ts` shares typed HTTP errors without coupling helpers to the room manager.

Limits per 60 seconds: network create 10, join 30, read 600, mutate 120, guess 120; member read 180, mutate 30, guess 30. Default network grouping is a shared bucket. `CRICKSOLVE_TRUST_PROXY=1` opts into the first `x-forwarded-for` address only where a trusted proxy sanitizes that header. Redis keys hash the subject. Production traffic sizing and proxy trust must be verified during deployment work.

Current verification: 45 tests pass; TypeScript and changed-file lint pass. Full lint still reports 12 errors and 14 warnings. Shared Redis behavior is simulated in tests; live Redis, browser integration and production build checks remain outstanding. Public Realtime channels are not privately authorized in this phase.

## Multiplayer Completion Phase 4 — Gameplay Projection and Private Hints

| Component | Responsibility |
| --- | --- |
| `useGameStore` | Persisted solo gameplay and shared UI/preferences; never receives multiplayer guesses |
| `useMultiplayerStore` | Ephemeral duel guesses, private hint, selection/pending state, room lifecycle |
| `useActiveGame` | Shared component projection with an explicit multiplayer mode, room timing and outcome |
| `claimRoomHint` | Locked authorization, fourth-guess eligibility, one-hint enforcement and private value selection |
| `toMemberRoomResponse` | Public room plus the caller's own private hint; excludes the per-user hint map |
| Attribute cards | Accessible selectable buttons; server-issued hint values and retry-safe pending state |

`MULTIPLAYER_HINT_AFTER` is four. Hint keys are restricted to the six categorical cards. `hintsByUser` is excluded from `PublicMultiplayerRoom`. Guess counters and attempt limits are unaffected by hints. Hint actions reuse the existing authenticated room mutation rate budget.

Solo persistence now includes timer and hint/bonus fields previously omitted by `partialize`. Multiplayer remains unpersisted; there is no room-to-solo save/restore copy that can overwrite solo state. The active-game projection reads the correct store for grids, results, timer, search, cards and shares.

Validation: 60 tests pass, TypeScript passes, changed-file lint has zero errors and one pre-existing image warning. Full lint reports 10 errors and 8 warnings. Tests cover authenticated hint delivery, independent per-player bonuses, concurrency, stale/terminal rejection, solo persistence isolation, full client-store-to-route hint selection, and rendered UI behavior. Rendered HTML tests are not browser E2E tests; real Redis and browser verification remain pending.


## Multiplayer Completion Phase 5 — Session recovery

- `multiplayer-manager.ts`: reconstructs only the requesting member's evaluations from private guessed IDs using the same evaluation projection as submissions. Public snapshots include server-computed connection indicators, never hidden targets or opponent guessed IDs.
- Authenticated GET serializes heartbeats with other room writes using the existing memory/Redis lock. Writes are throttled to five seconds per participant; a 15-second gap marks interrupted presence. Room TTL and membership token expiry still apply.
- `useMultiplayerStore.ts`: per-tab sessionStorage credentials, bounded fetches, authoritative guess reconciliation, retry state, expired-session cleanup and connection-version guards.
- `MultiplayerSession.tsx`: mount recovery, online/visibility reconciliation and recovery controls. PlayerSearch blocks guesses while reconnecting; HUD shows interrupted opponent presence.
- No new disconnect adjudication or rematch policy. Local leave does not release the server slot; these lifecycle decisions remain a release prerequisite.

Validation: 67 tests pass, TypeScript passes, changed-file lint passes. Tests use deterministic transport/storage and do not substitute for live Redis or two-browser integration.


## Multiplayer Completion Phase 6 — Rematch protocol

PATCH room accepts `action: rematch` and `rematchAction: request | accept | cancel | decline`. Non-request actions require `rematchRequestId` (UUID). All actions require existing bearer membership and `roundId`. Unexpected rematch fields on other actions are rejected.

`rematchRequest` is public metadata containing a server UUID and requesting member ID. Manager mutations authenticate and serialize consent/reset. The private target changes only on acceptance. Cancellation/decline preserve the final result and guesses. A stale round or invitation cannot change a later round or request.

The shared RematchControls component provides pending/disabled, request, waiting, cancel, accept and decline states in the result modal and HUD. New-round reconciliation opens the lobby without repeatedly reopening it on polls. ResultModal includes the two-player scorecard and local leave action.

Validation: 74 regression tests and TypeScript pass. Changed-file lint has no errors and one pre-existing image warning. Redis/two-browser/deployment verification and unresolved disconnect policies remain pending.


## Multiplayer Completion Phase 7 — Test tooling and evidence

- Added `@playwright/test`, `playwright.config.ts` and `tests/e2e/multiplayer.spec.ts`. `npm run test:e2e` starts the built Next server on 127.0.0.1:3107 with a test-only key and isolated memory storage. It refuses to reuse an existing server.
- Added `npm test` and `npm run typecheck`; ignored Playwright output/report directories.
- Browser execution uses installed macOS Chrome when available or E2E_CHROME_PATH; otherwise install the standard Playwright Chromium browser.
- Verified 74 deterministic regressions, TypeScript, one two-context integration scenario, and a production webpack build. New tooling lint passes; full-project lint still reports 10 pre-existing errors and 8 warnings.
- Turbopack failed on an internal port-binding environment restriction. `npm run build -- --webpack` succeeded; the default build script remains unchanged.
- Live Redis/Supabase, deployment proxy limits and multi-instance behavior are unverified without staging configuration. The in-memory browser test is not evidence of shared-service correctness.
- Dependency installation reported three high and one critical advisory; review and resolve applicable findings before release rather than applying unchecked force-upgrades.

See `docs/multiplayer-release-checklist.md` for configuration, commands and remaining blockers. Phase 7 local verification is complete; deployed verification and deferred disconnect/leave/host-transfer policies remain open.


## Phase 8 — Dependencies and release hygiene

Next.js and eslint-config-next are pinned to 16.3.8; package-lock includes compatible fixes for sharp, brace-expansion and js-yaml. npm audit reports zero known vulnerabilities at verification time. Recheck the registry before release.

ESLint recognizes the two existing CommonJS maintenance scripts via a file-scoped override and ignores generated browser reports. Application rules remain intact. All lint errors are resolved; six existing warnings remain. Script edits do not execute data conversion or seeding.

LeaderboardModal owns its loader inside the effect, cancels scheduled work, aborts fetch on cleanup and ignores late results. Two deterministic effect-lifecycle tests cover cancellation and stale-response handling. The header render check asserts a plain 1v1 BATTLE label with no lightning emoji.

Validation: 76 tests, TypeScript, lint, production webpack build and two-browser multiplayer integration pass. Staging Redis/Supabase checks and deferred lifecycle decisions remain outstanding; no deployment.


## Phase 9 — Server lifecycle and credential transitions

`reconcilePresence` runs under the existing Redis/memory mutation lock before heartbeat refresh. A 60,000ms deadline uses `lastSeenAt ?? connectedAt`; GET synchronization, join and round mutations settle expiry. Active outcomes add `forfeit` and `abandoned`. A closed room retains a TTL-bound tombstone rather than an unsafe unlocked deletion. No scheduled worker is introduced.

PATCH `action: leave` is authenticated and round-bound. Lobby members are removed; active/finished departures retain score records with `leftAt`, revoke authorization and clear pending rematches. Host transfer metadata is private. Only an actually promoted member may exchange its old guest token during GET synchronization; the replacement preserves the original expiration. Host mutation role checks remain strict. Self-leave can use a promoted guest's original token to avoid a token-exchange race.

Public presence includes a server-computed reconnect countdown. Client leave separates server acknowledgement from local teardown, retains credentials on transient failures, and persists replacement host tokens. Forfeit/abandonment result/share text avoids fabricated solve times or solved status. Invite handling consumes each invite once per mount so leave returns to solo.

Validation: 92 deterministic tests, TypeScript, lint (six existing warnings), webpack production build and expanded browser integration. Timeout policy, slot release and host transfer are now implemented; live Redis/Supabase and deployed multi-instance verification remain open.


## Final phase — staging runner

`playwright.staging.config.ts` reuses browser settings but explicitly removes webServer, selects both the browser and service suites, and requires STAGING_BASE_URL plus Redis/Supabase credentials. `tests/staging/services.spec.ts` checks actual cross-client Redis reads/NX locks/token-checked commits and Supabase broadcast delivery on an isolated temporary channel. Redis keys have TTLs and scoped cleanup; the browser flow attempts authenticated leave for its own sessions.

`tests/staging-configuration.test.mjs` validates fail-closed configuration, suite discovery without contacting placeholder hosts, and rejection of credential-bearing URLs. The full 95-test local regression suite passes, alongside TypeScript and new-tooling lint. These are preparation results, not live service validation.

The session lacks staging URL/configuration and a deployment link. Live checks and multi-instance evidence remain blocked. Shared service probes alone do not demonstrate that deployed app instances share those services; deployment configuration/log/routing verification remains required. No deployment was performed.
