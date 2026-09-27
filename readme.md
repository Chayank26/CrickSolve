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
| 3 | Secure anonymous participant identity and permissions | Pending approval |
| 4 | Dedicated multiplayer rules/UI, bonus hint after guess four, no eighth attempt, solo-stat isolation | Planned |
| 5 | Disconnect and recovery | Product decisions deferred |
| 6 | Rematch lifecycle and result polish | Product decisions deferred |
| 7 | Integration tests and deployment verification | Planned |

Confirmed rules: **seven guesses**, a **daily-style bonus hint after the fourth guess**, and **no eighth guess**. Phase 2 enforces the seven-guess cap and removes the multiplayer eighth-attempt flow. The fourth-guess bonus hint remains Phase 4 work.

Each phase ends with updated documentation, a proposed commit message, and user approval before the next phase starts.

Checks:

```bash
node --test tests/*.test.mjs
npx tsc --noEmit --incremental false
npm run lint
```

The store tests isolate network and timer behavior; they do not replace two-browser or Redis integration testing. Existing full-project lint errors remain.


Phase 2 also makes guess validation and winner selection atomic, rejects stale rounds and repeated player guesses, validates countdown transitions, and guards Redis commits against expired locks. If both players exhaust seven guesses, the round finishes without a winner and reveals the cricketer. Multiplayer guesses no longer update solo statistics.

Current checks: 26 regression tests and TypeScript pass. Live Redis, two-browser integration and production build verification remain pending. The known anonymous identity reuse issue is scheduled for Phase 3; multiplayer is not release-ready yet.
