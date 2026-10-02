This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Multiplayer implementation status

The default development command serves the app at **http://localhost:3002**. Use `npm run dev:3000` for port 3000.

Multiplayer is under phased development. Completion Phase 1 stabilizes round initialization, server-synchronized results, countdown activation, error display, and stale-response handling.

| Completion phase | Scope | Status |
| --- | --- | --- |
| 1 | Stable client match state and shared results | Implemented; unit checks pass, live integration pending |
| 2 | Atomic server validation, round/attempt checks, seven-guess enforcement | Implemented; regression checks pass |
| 3 | Secure anonymous participant identity and permissions | Implemented; regression checks pass |
| 4 | Dedicated multiplayer rules/UI, bonus hint after guess four, progress isolation | Implemented; regression checks pass |
| 5 | Disconnect detection and recovery | Recovery implemented; forfeit/host-transfer policies deferred |
| 6 | Rematch lifecycle and result polish | Implemented; mutual consent and regression checks pass |
| 7 | Integration tests and deployment verification | Local production/browser checks pass; live staging verification blocked by missing configuration |
| 8 | Release hardening | Dependency advisories and lint errors resolved |
| 9 | Disconnect adjudication, server leave and host transfer | Implemented; live shared-service verification remains pending |

Confirmed rules: **seven guesses**, a **daily-style bonus hint after the fourth guess**, and **no eighth guess**. Phase 2 enforces the seven-guess cap and removes the multiplayer eighth-attempt flow. The fourth-guess bonus hint is implemented in Phase 4: choose one still-locked attribute without consuming a guess.

Each phase ends with updated documentation, a proposed commit message, and user approval before the next phase starts.

Checks:

```bash
node --test tests/*.test.mjs
npx tsc --noEmit --incremental false
npm run lint
```

The store tests isolate network and timer behavior; they do not replace two-browser or Redis integration testing. Existing full-project lint errors remain.


Phase 2 also makes guess validation and winner selection atomic, rejects stale rounds and repeated player guesses, validates countdown transitions, and guards Redis commits against expired locks. If both players exhaust seven guesses, the round finishes without a winner and reveals the cricketer. Multiplayer guesses no longer update solo statistics.

Current checks: 92 regression tests and TypeScript pass; changed files have no lint errors (one existing image warning). Live Redis and deployed multi-instance verification remain pending; local two-browser integration and webpack production build pass. Phase 3 closes anonymous identity reuse and enforces stored participant roles. Multiplayer is not release-ready yet.


## Phase 3 API and configuration notes

- Create/join issue server-generated IDs and room-bound membership tokens. Clients must use the returned ID; old client-selected identities are not accepted.
- Authenticated room/guess operations use `Authorization: Bearer <membershipToken>`. Old URL/body credentials and old membership tokens are rejected. Recreate existing rooms after updating.
- JSON bodies are capped at 4 KiB; nicknames at 20 characters. Rate limits return `429` with `Retry-After`.
- Configure `CRICKSOLVE_SECRET_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for deployment. Stable signing keys are also needed across development server processes.
- Rate limits use shared Redis when configured; otherwise counters are local to the process. Network limits default to a shared bucket. Set `CRICKSOLVE_TRUST_PROXY=1` only if the deployment proxy overwrites/sanitizes `x-forwarded-for`; this enables per-address grouping.
- Per-minute network limits: create 10, join 30, room reads 600, room mutations 120, guesses 120. Additional member limits: reads 180, mutations 30, guesses 30. Production capacity and proxy configuration still need verification.
- Realtime channels remain public, carrying only sync notifications; state is fetched through authenticated APIs. Credentials are saved in per-tab sessionStorage for refresh recovery; game progress is restored from authenticated server snapshots.


## Multiplayer gameplay — Phase 4

- Each player has seven guesses. After four accepted guesses, choose one locked attribute card for a bonus hint. There is no eighth attempt.
- The server grants one private attribute hint per player per round, with safe retries and no extra trivia hint. If all attribute cards are already matched, the UI explains that none need unlocking.
- Daily/practice guesses, hints, timer state and statistics are kept separate. Leaving a duel returns to the unchanged solo board.
- The multiplayer header, timer, rules, share text and photo reveal now reflect the duel. Solo mode changes are disabled while in a room; leave the duel to return to solo play.
- Disconnect/recovery and rematch policies still require product decisions before Phases 5 and 6. Existing behavior has not been redesigned in this phase.

Validation includes server/store tests and rendered component checks. Live Redis, browser interactions and production-build verification remain outstanding. Full-project lint currently reports 10 errors and 8 warnings outside this phase's completed fixes.


## Multiplayer recovery — Completion Phase 5

- Refresh the same tab to restore your membership, accepted guesses, fourth-guess bonus hint, timer and result. Only room credentials are cached in sessionStorage; the server supplies gameplay state.
- Transient failures retain credentials and retry. Requests time out after 10 seconds; browser online/visibility events also trigger reconciliation. Expired or missing memberships clear the saved session and stop polling.
- Authenticated room reads refresh presence at most once per five seconds. After 15 seconds without a heartbeat, the opponent sees a connection-interrupted message. This indicator does not pause the clock or determine a winner.
- Explicit local Leave/Return to solo clears the saved session and cancels local polling. Server slot removal, automatic forfeits and host transfer remain deferred product decisions. Closing the tab may discard sessionStorage; recovery is not cross-device.
- Reconciliation restores guesses accepted by the server even if their response was lost. Seven guesses, one bonus after four, and no eighth guess remain unchanged.
- Removed lightning emojis from the header, room-creation button and documentation.

Validation: 67 regression tests, TypeScript and changed-file lint pass. Live two-browser/Redis and deployment verification remain for Phase 7. Phase 6 is not started.


## Multiplayer rematches — Completion Phase 6

- After a win or seven-guess draw, either player can request a rematch. The opponent must explicitly accept; requesting alone never resets the result. Requesters can cancel and opponents can decline.
- Acceptance atomically creates one new round with a different target, clears both players' guesses/hints/results and returns both clients to the lobby. The guest readies up and the host starts the normal countdown.
- Request IDs and round checks reject stale accept/cancel/decline messages. Duplicate or simultaneous requests do not count as consent. Refresh preserves the pending request through the authoritative snapshot.
- Result screens show both players' attempts and solve times, rematch controls, sharing and return-to-solo. Finished results can be reopened from the HUD, including draws.

Validation: 74 tests and TypeScript pass. Changed-file lint has no errors (one existing image warning). Phase 7 live integration/deployment checks remain pending, along with deferred disconnect adjudication and server-side leave/host-transfer decisions. No lightning emojis were reintroduced.


## Multiplayer integration verification — Completion Phase 7

Added Playwright integration testing with two isolated browser contexts against a local production server. The test covers UI create/join, readiness/countdown, guesses, seven-guess completion or an early solve, private snapshots, refresh/offline recovery, result synchronization, rematch decline/accept and fresh round state. Random early solves can skip the browser's fourth-guess recovery branch; deterministic unit tests cover those rules.

Verified locally:

- `npm test`: 74 tests pass.
- `npm run typecheck`: passes.
- `npm run build -- --webpack`: production build passes.
- `npm run test:e2e`: one two-browser integration scenario passes.
- Lint for new test/config files passes. Full-project lint remains at 10 pre-existing errors and 8 warnings.

The default Turbopack build failed on this environment's internal port-binding restriction; the supported webpack build passed. Browser testing used installed headless Chrome and an isolated in-memory room store, not live Redis/Supabase. No deployment was performed.

See [the release checklist](docs/multiplayer-release-checklist.md) for repeatable commands, staging configuration and launch blockers. Live shared-service verification, unresolved disconnect/server-leave/host-transfer policies and dependency audit review remain required before release. Phase 7's local verification is complete; deployment verification remains open.


## Phase 8 — Release hardening (2026-10-02)

- Updated pinned Next.js and eslint-config-next from 16.3.2 to 16.3.8 and applied compatible transitive dependency fixes. npm's audit reports zero known vulnerabilities at verification time.
- Resolved all 10 pre-existing lint errors. Existing CommonJS maintenance scripts are configured as CommonJS; application lint rules remain enabled. Six non-blocking warnings remain.
- Leaderboard loading now cancels pending work when closed/date changes and ignores stale responses. Two regression tests cover cancellation and stale-response protection.
- Confirmed the 1v1 Battle button has no lightning emoji and added a rendered-header regression assertion. Its current source was already clean; no deployment/cache change was performed.
- Documentation and the release checklist reflect resolved lint/audit blockers.

Checks: 76 tests, TypeScript, full-project lint (zero errors), production webpack build and two-browser multiplayer flow pass. Live Redis/Supabase staging verification and the previously deferred disconnect/server-leave/host-transfer policies remain outstanding. The lifecycle choice is pending user input; those rules are unchanged in this phase.


## Phase 9 — Multiplayer lifecycle

The approved policy is now implemented: players have 60 seconds from their last recorded authenticated heartbeat to reconnect. During active play, missing that deadline forfeits to the remaining connected player; if both deadlines expire, the duel is abandoned without a winner. Refresh does not count as leaving. Presence is recorded at most every five seconds, and pending deadlines are settled on the next room interaction, not by a background scheduler.

Explicit Leave is now a server action. Leaving an active duel forfeits immediately. In the lobby/countdown it frees the slot, cancels any countdown and transfers host to the remaining participant; a fully empty lobby closes. Lobby members also expire after 60 seconds. Existing finished results remain unchanged when someone leaves, and a departed participant cannot rematch or reuse their credential. Closed rooms reject new joins.

A promoted guest receives a host credential during authenticated sync, with the original expiry retained. Refresh restores it. Leave waits for server acknowledgement; transient failures keep credentials so it can be retried. Forfeit/abandoned results, shares and reconnect messages describe the actual outcome without claiming an unsolved puzzle was solved.

Validation: 92 regressions, TypeScript, lint (zero errors/six existing warnings), webpack production build and the expanded two-browser flow. Seven guesses, the fourth-guess bonus and no eighth attempt remain unchanged. Remaining release work is live Redis/Supabase and deployed multi-instance verification; no deployment was performed.
