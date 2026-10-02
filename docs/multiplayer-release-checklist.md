# Multiplayer release verification

## Local checks

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build -- --webpack
npx playwright install chromium
npm run test:e2e
```

The browser suite runs the production build on localhost:3107 with two isolated browser contexts and an ephemeral in-memory room store. It uses a test-only signing key and disables Redis credentials for that server. Never deploy with this test key. Port 3107 must be free. Tests do not reuse an existing server or target production.

To use an installed Chrome instead of downloading Chromium:

```sh
E2E_CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:e2e
```

The default `npm run build` uses Turbopack. Webpack is a supported fallback for environments that prohibit Turbopack's internal port binding. Google Fonts network access is required during the build.

Browser coverage: UI create/join, distinct membership, readiness/countdown, real guess submissions, private snapshot checks, seven-guess completion or early solve, same-tab refresh, offline/online recovery, result synchronization, rematch decline/accept and fresh lobby state. Recovery/hint checks run if the random target has not been solved before guess four; deterministic unit tests cover those rules regardless of target selection.

## Staging requirements

Configure a stable `CRICKSOLVE_SECRET_KEY`, shared `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`, and `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`. Public Supabase values must be available at build time. No actual service credentials are committed. Production must use shared Redis; the local fallback cannot reliably coordinate different server processes or survive restarts.

Only set `CRICKSOLVE_TRUST_PROXY=1` behind a proxy that overwrites forwarding headers. Verify rate limits with the deployment's real proxy and expected concurrent traffic. Room tokens expire after six hours; a rematch does not renew them.

On an isolated staging deployment, verify:

- Two independent browsers can create/join and play on different server instances; no hidden target, private guess IDs, hint or bearer token appears in public realtime messages.
- Realtime messages prompt authenticated reconciliation; stopping realtime delivery still permits HTTP polling to finish the duel correctly.
- Simultaneous winning guesses produce one winner. Concurrent rematch accepts create one round. Expired Redis leases cannot overwrite a newer state.
- Disconnect/reconnect, refresh after an accepted guess with a lost response, fourth-guess hint restoration and expiry cleanup work against real Redis.
- Unauthorized/expired tokens fail; malformed requests and rate limits return expected errors without leaking service credentials.
- Mobile keyboard, card selection, countdown and result/rematch controls work on narrow screens.

## Release blockers still requiring decisions or external verification

- Automatic disconnect forfeits, server-side leave/slot removal and host transfer remain deferred. Current Leave clears only the local session; a server slot may remain occupied until expiry. Multiplayer is not ready for public release with these lifecycle questions unresolved.
- Live Redis/Supabase and deployed multi-instance checks require a configured staging environment.
- Phase 8 resolved all lint errors. Full-project lint passes with six non-blocking warnings.
- Phase 8 updated Next.js/eslint-config-next to pinned 16.3.8 and compatible transitive dependencies; npm audit reports zero known vulnerabilities at verification time. Recheck advisories before deployment.

No deployment is performed by these checks.

## Recorded local result (2026-10-02)

74 unit/regression tests passed; TypeScript passed; production webpack build passed; the two-context browser scenario passed in 12.7 seconds total using installed headless Chrome. New test/config files pass lint. Real Redis/Supabase and deployed multi-instance checks remain unexecuted. Default Turbopack failed on the environment restriction noted above. These results do not constitute deployment approval or completion of the staging checklist.


## Phase 8 follow-up

The 2026-10-02 dependency update and lint cleanup pass 76 regression tests, TypeScript, full-project lint (six warnings), a webpack production build and the two-browser integration scenario. Two new tests prevent stale leaderboard updates after closure/date changes. The 1v1 Battle header is verified without a lightning emoji. Previously deferred lifecycle policies and live staging verification remain open; this does not authorize a deployment.
