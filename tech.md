# Technology Stack & Tooling Justifications - CrickSolve 🏏

This document lists every technology, library, database, and tool used in the CrickSolve codebase, alongside a detailed technical justification for why it was chosen over alternative technologies that perform similar functions.

---

## Complete Technology Stack Log

| Technology | Category | Role in Project | Alternative Considered | Justification for Selection |
| :--- | :--- | :--- | :--- | :--- |
| **Next.js 14+ (App Router)** | Web Framework | Fullstack framework providing React UI components and Server API Routes for anti-cheat validation. | **Vite + React SPA** | Vite SPA compiles into static JS bundle, exposing all mystery player data to client-side inspection. Next.js provides serverless API routes to hide answers on the server and support dynamic OG share cards via SSR. |
| **TypeScript** | Language | Strict type definitions for player statistics, guess results, API contracts, and Supabase database schemas. | **JavaScript** | Prevents runtime `TypeError` issues when evaluating player stats and attribute matches across complex data structures. |
| **Tailwind CSS** | CSS Framework | Utility-first styling engine for glassmorphic cards, responsive grid layouts, animations, and dark mode. | **Plain CSS / CSS Modules** | Eliminates CSS file bloat and class-name duplication. Enables dynamic HSL color tailoring and dark-mode toggling natively. |
| **Supabase** | Database & Auth | Relational PostgreSQL database for storing players, daily puzzle seeds, real-time leaderboards, and user stats. | **Firebase Cloud Firestore** | Supabase uses standard SQL with Row-Level Security (RLS) and PostgreSQL functions, making real-time leaderboard ranking queries simpler, faster, and more secure than NoSQL index workarounds in Firestore. |
| **Supabase RLS Policies** | Security Engine | Row-Level Security declarative policies in SQL. | **Application-level middleware filtering** | RLS runs directly inside the PostgreSQL kernel, guaranteeing that read/write permissions cannot be bypassed even if API credentials are leak-tested. |
| **TypeScript Data Schemas (`src/types/game.ts`)** | Type Definitions | Unified contract between database models, client Zustand store, and API endpoints. | **Loose JSON schemas / No types** | Enforces strict compile-time checks across attributes (`BattingHand`, `BowlingType`, `PlayerRole`) and prevents stat comparison bugs. |
| **Zustand** | State Management | Client-side reactive store for active gameplay, guess log, streaks, unlocked hints, and sound preferences. | **Redux Toolkit / React Context** | Redux requires extensive boilerplate; React Context causes app-wide re-renders on single state updates. Zustand is 1kB, hook-native, and auto-persists to `localStorage`. |
| **Framer Motion** | Motion & Animation | Declarative animations for tile flipping, lock shattering, modal overlays, and directional stat arrows. | **CSS Keyframes / GSAP** | Declarative React animation syntax integrated directly into component state; lighter footprint than full GSAP library. |
| **Fuse.js** | Search Engine | Lightweight client-side fuzzy searching for player autocomplete dropdown. | **Server-side SQL `LIKE`** | Instant keystroke search with zero network latency, with built-in fuzzy matching for misspelled player names. |
| **Howler.js** | Audio Engine | Cross-browser Web Audio wrapper for UI sound effects (lock shatter, card flip, victory chime). | **HTML5 `<audio>` Tag** | HTML5 `<audio>` suffers from latency and mobile browser audio unlock restrictions (especially Safari iOS). Howler.js buffers audio Web Audio nodes smoothly. |
| **Lucide React** | UI Icons | Modern vector icons for locks, hints, trophies, streaks, play controls, and navigation. | **FontAwesome / Heroicons** | Tree-shakeable SVG components designed specifically for React with customizable stroke width and color. |
