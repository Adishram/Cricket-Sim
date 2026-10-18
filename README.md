# Auction to Glory

A premium cricket auction prototype. Phase 1 includes an original responsive auction room, homepage and league lobby, plus an isolated server-authoritative demonstration auction.

## Run locally

Node.js 20.9+ and pnpm are required.

```sh
pnpm install
pnpm dev
```

Open http://localhost:3000 for the homepage, /lobby for the league lobby, or /auction for the interactive showcase. No API keys or paid services are needed. The player art uses original typographic initials, not player photography or team logos.

Place a bid as Mumbai Mavericks; simulate an opponent bid; bid again; let the server timer expire. The player is sold to the leader, the purse is debited once, and My squad shows the signing. Next player advances the queue. An unbid player becomes unsold. Restart demo begins again with ₹120 crore per franchise.

## Validation

```sh
pnpm test
pnpm typecheck
pnpm build
# With pnpm dev running in another terminal:
pnpm exec playwright install chromium
pnpm test:e2e
```

Browser tests save screenshots in artifacts/. If the Playwright browser is absent, install it with the command above.

## Scope and boundaries

- 274 real 2026 IPL squad registrations, including replacements. 242 players have IPL career statistics and 17 have T20 career fallback statistics; 15 remain explicitly unavailable. This is a dated roster snapshot, not a live transfer feed.
- Franchises, bids and ₹2 Cr opening prices are game settings. No official auction reserve or real multiplayer is implied. Ratings and unsourced styles remain unavailable. Batters show runs/average/strike rate; bowlers show wickets/economy/average/strike rate; all-rounders show both.
- HTTP commands are validated on the server; clients cannot choose prices, deadlines or purses.
- Each HttpOnly-cookie session has an isolated in-memory auction. Refresh preserves it while this process lives; server restarts erase it. Multiple instances and production persistence are not supported.
- Opponents bid only when the user clicks the simulation control. Polling retrieves server state. The countdown uses a server-time offset.
- Expiry is settled on the next server request. There is no durable worker scheduler yet.
- shadcn-style Button uses Radix Slot and class-variance-authority; Tailwind v4 provides the styling foundation, with custom original design tokens and layouts. Motion for React respects reduced motion.
- No connected multiplayer, authentication, automatic data refresh, simulation engine, playable matches or leagues are claimed complete.

See PRODUCT_SPEC.md, ARCHITECTURE.md, DATABASE_SCHEMA.md, SIMULATION_DESIGN.md, DATA_SOURCES.md and IMPLEMENTATION_PLAN.md. Next milestone: authenticated transactional PostgreSQL auctions, membership RLS, durable scheduling and multi-client race tests.

## New playable modes

Run `pnpm dev`, then open `/play` for solo auction, squad building and player comparisons; `/match` for the GT–SRH demonstration Match Centre; `/league` for a saved campaign. Solo games save in this browser. Shared `/room/[code]` auctions are process-local demos, not production persistence.

Validation: `pnpm test`, `pnpm typecheck`, `pnpm build`, and `pnpm test:e2e` with the development server running. Browser screenshots are under `artifacts/match-1440.png`, `match-1024.png` and `match-390.png`.

See `IMPLEMENTATION_CHECKLIST.md` for remaining data and connected-backend work. In particular, the recent-rating estimator supports three seasons but the imported observations currently cover 2026 only; current international eligibility is unverified and provisional ratings conservatively respect the 90 ceiling.
