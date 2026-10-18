# Auction to Glory implementation

- [x] Audit: Next app + pure packages; shared memory rooms, no database/auth integration.
- [x] Replace career-derived ratings with versioned recent-season estimator, 50/30/20 weights, shrinkage, competition assumptions, conservative cap and evidence confidence.
- [x] Wire 577 official 2025 mega-auction entries, 79 sets, reserve prices and ten real franchise names; disambiguate same-name players.
- [x] Solo nine-bot auctions, pause/save/restore, seeded pending actions, fast-forward, role/budget reservation and accelerated nominations.
- [x] One-human shared-room start and optional bot fill, with server-resolved ownership in process-local demo rooms.
- [x] Deterministic cricket engine, bowling feasibility, scorecards, replay, tactical commands and Super Overs.
- [x] Premium responsive Match Centre, GT/SRH demo, pitch profiles, estimated advantage, player spotlights, SVG ground, tactics, lineup/Impact controls and post-match analysis.
- [x] Squad builder, seeded opponents, comparisons, custom league campaigns, playoffs, standings and awards.
- [x] Unit tests, typecheck, production build and browser screenshots (1440/1024/390).

## Remaining, explicitly not implemented

- Verified complete 2024/2025 recent-season inputs, international capped-status/history and non-IPL recent-season evidence. Currently only 2026 IPL evidence is imported; gaps are disclosed, career totals never fill them.
- Granular observed phase/style/head-to-head and fielding/keeping evidence. These attributes use labeled provisional estimates; historical matchups are unavailable.
- Authenticated PostgreSQL persistence, connected multiplayer match commands/deadlines, server-restart recovery and host migration. Shared auctions remain process-local demos; solo games persist on the device.
- Historical auction replay (retentions/RTM/year-specific purses); current mode is explicitly a fresh fantasy auction.
- Rain/DLS/no-results, full IPL playoff schedule and every Impact window; v1 uses the documented custom ruleset.
- Compound no-ball/run-out outcomes; detailed configurable bowling lengths; wicket-by-wicket decision pauses and full visual replay scoreboard.

No LLM calls occur in auction bidding, ratings, allocation or ball simulation. Source files are cached; ratings initialize once per module; advantage trials are debounced and only run before matches.

## Verification

33 unit tests passed, including seeded live/quick equivalence, replay, score conservation, free hits, Super Overs, bot squad completion, auction legality, rating rules and exactly-once league results. Eight Playwright tests passed across auction, solo persistence, builder/campaign flow and responsive Match Centre. `pnpm typecheck` and `pnpm build` passed. Screenshots inspected at 1440, 1024 and 390 pixels; no page-level horizontal overflow.

Campaign snapshots use IndexedDB to avoid localStorage's small capacity during long seasons. The current match and solo auction use separate device-local saves. Attempts to fetch the missing Cricsheet archive timed out; missing historical evidence remains disclosed.
