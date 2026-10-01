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
| 6 | Rematch lifecycle and result polish | Product decisions deferred |
| 7 | Integration tests and deployment verification | Planned |

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

Current checks: 67 regression tests and TypeScript pass; changed files have no lint errors (one existing image warning). Live Redis, two-browser integration and production build verification remain pending. Phase 3 closes anonymous identity reuse and enforces stored participant roles. Multiplayer is not release-ready yet.


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
