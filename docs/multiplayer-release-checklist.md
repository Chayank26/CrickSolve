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

- Phase 9 implements the approved 60-second reconnect/forfeit policy, server leave and lobby host transfer. Verify these on staging, including both-player expiry, countdown cancellation and credential exchange. Deadline settlement is request-driven, with no background scheduler.
- Live Redis/Supabase and deployed multi-instance checks require a configured staging environment.
- Phase 8 resolved all lint errors. Full-project lint passes with six non-blocking warnings.
- Phase 8 updated Next.js/eslint-config-next to pinned 16.3.8 and compatible transitive dependencies; npm audit reports zero known vulnerabilities at verification time. Recheck advisories before deployment.

No deployment is performed by these checks.

## Recorded local result (2026-10-02)

74 unit/regression tests passed; TypeScript passed; production webpack build passed; the two-context browser scenario passed in 12.7 seconds total using installed headless Chrome. New test/config files pass lint. Real Redis/Supabase and deployed multi-instance checks remain unexecuted. Default Turbopack failed on the environment restriction noted above. These results do not constitute deployment approval or completion of the staging checklist.


## Phase 8 follow-up

The 2026-10-02 dependency update and lint cleanup pass 76 regression tests, TypeScript, full-project lint (six warnings), a webpack production build and the two-browser integration scenario. Two new tests prevent stale leaderboard updates after closure/date changes. The 1v1 Battle header is verified without a lightning emoji. Previously deferred lifecycle policies and live staging verification remain open; this does not authorize a deployment.


## Phase 9 lifecycle follow-up

92 regressions cover timeout boundaries, both-player expiry, immutable results, leave authorization, host credential exchange, stale-round requests and failed/lost leave acknowledgements. The two-browser flow now additionally leaves the host lobby, refreshes the promoted guest, joins a replacement and verifies an immediate forfeit through the UI. TypeScript, lint and the production webpack build pass. Real shared-service verification remains open; no deployment has occurred.

Policy: 60 seconds from the last recorded heartbeat (recorded at five-second intervals). A late request settles deadlines before refreshing its own presence. During active play one expired participant forfeits; both expired means abandoned/no winner. Lobby/countdown expiry removes missing members, transfers host if needed and closes empty rooms. Explicit active leave forfeits immediately. Finished results are immutable. A finished participant who explicitly left cannot rejoin/rematch; create a new room instead.


## Final staging phase — prepared, blocked on configuration

No staging origin, Redis credentials, Supabase configuration, environment file or linked Vercel project is available in this checkout/session. The final live phase has **not** passed or completed. No deployment or live-service test was performed.

The new `npm run test:staging` command runs against an already deployed dedicated staging environment and requires:

- `STAGING_BASE_URL`: HTTPS staging origin, without a path, query or embedded credentials.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`: dedicated staging Redis credentials.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`: the staging project's public configuration.

The deployment must itself use those services and a stable private `CRICKSOLVE_SECRET_KEY`. The test runner does not need the deployment signing key and does not start a server or apply local test credentials. Supply configuration through environment variables or an ignored `.env.staging.local` file:

```sh
# When configuration is already exported:
npm run test:staging

# Alternatively, using an ignored local configuration file (Node with --env-file support):
node --env-file=.env.staging.local node_modules/@playwright/test/cli.js test --config=playwright.staging.config.ts
```

The staging suite includes the existing two-browser lifecycle scenario plus real Redis cross-client visibility/atomic-owner checks and a Supabase broadcast round trip between two independent clients. Redis probes use unique verification keys with a 30-second TTL and delete only those keys. Realtime probes use a unique temporary channel. Browser cleanup attempts server-side leave for its own memberships.

These checks do not prove that deployed requests reached different application instances or that the configured test services are the deployment's actual services. Confirm deployment configuration and use deployment logs/routing controls to perform the multi-instance and proxy/rate-limit checks above. Real lease-expiry races, realtime-failure fallback and narrow-screen staging behavior also require completion of the checklist before release sign-off.

Local evidence: 95 regressions pass, including fail-closed staging configuration/discovery tests; TypeScript and new-tooling lint pass. Live checks remain blocked by missing environment access. Provide the staging URL and configuration location without pasting secrets into chat.


## Latest result — services configured and verified

The user supplied the four required service fields in ignored `.env.local`. The services-only runner passed both live Redis and Supabase tests (2 tests, 3.7 seconds). TypeScript, tooling lint and the webpack production build using this environment pass. Earlier missing-service-configuration notes above are historical; the remaining access gap is the hosted staging deployment.

Run the service checks without a staging URL:

```sh
node --env-file=.env.local node_modules/@playwright/test/cli.js test --config=playwright.services.config.ts
```

First deployment setup:

1. In Vercel, import `Chayank26/CrickSolve` as a dedicated project named `cricksolve-staging` (or another unused staging name).
2. Select Next.js and repository root `./`. Use the verified build command `npm run build -- --webpack`.
3. Copy these five application variables from `.env.local` into Vercel's environment-variable fields: CRICKSOLVE_SECRET_KEY, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY. Keep values out of chat/Git. A separate staging project's first deployment uses its Production environment; it still uses dedicated staging services. Do not mix it with a future public production project.
4. Deploy and record its HTTPS origin as STAGING_BASE_URL locally. This variable is for the test runner and is not required by the app.
5. Run the full staging suite. If deployment protection requires authentication, arrange approved automation access rather than removing protection blindly. Complete deployed multi-instance/proxy checks before release sign-off.

No Vercel project has been linked or deployed during the service verification. Successful independent service probes are not yet proof that a hosted application is configured correctly.
