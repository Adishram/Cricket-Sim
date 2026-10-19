# Auction to Glory implementation

- [x] Audit: Next app + pure packages; shared memory rooms, no database/auth integration.
- [x] Career context rating v4 supersedes the earlier three-year model: all covered IPL/T20I years, season/phase benchmarks, opposition adjustment, 900-ball priors, reliability-aware competition weights and bounded sustained-performance credit. BBL/PSL excluded.
- [x] Wire 577 official 2025 mega-auction entries, 79 sets, reserve prices and ten real franchise names; disambiguate same-name players.
- [x] Solo nine-bot auctions, pause/save/restore, seeded pending actions, fast-forward, role/budget reservation and accelerated nominations.
- [x] One-human shared-room start and optional bot fill, with server-resolved ownership in process-local demo rooms.
- [x] Deterministic cricket engine, bowling feasibility, scorecards, replay, tactical commands and Super Overs.
- [x] Premium responsive Match Centre, GT/SRH demo, pitch profiles, estimated advantage, player spotlights, SVG ground, tactics, lineup/Impact controls and post-match analysis.
- [x] Squad builder, seeded opponents, comparisons, custom league campaigns, playoffs, standings and awards.
- [x] Named catches, wicketkeeper catches, stumpings, matching visual receivers and scorecard/league fielding credits.
- [x] Pre-match XI/order/captain/keeper setup, pitch-aware XI + Impact recommendation, full 20-over schedule with validation.
- [x] Individual batting aggression/style and bowling line/length/variation, seeded yorker execution risk, improved Impact review/activation.
- [x] Solo auction capacity of 25 players and eight overseas; shared-room demo retains its existing 15/five limits.
- [x] Role-balanced generated squads, full bench preservation, 50/100 cards, clickable top-ten awards, best bowling and individual campaign statistics.
- [x] Unit tests, typecheck, production build and browser screenshots (1440/1024/390).

## Remaining, explicitly not implemented

- Complete source coverage remains unavailable. The cached IPL/T20I career archive provides evidence for 357 matched identities; unmatched players and withheld matches remain gaps. Other domestic leagues are excluded by the current specification.
- Granular observed phase/style/head-to-head and fielding/keeping evidence. These attributes use labeled provisional estimates; historical matchups are unavailable.
- Authenticated PostgreSQL persistence, connected multiplayer match commands/deadlines, server-restart recovery and host migration. Shared auctions remain process-local demos; solo games persist on the device.
- Historical auction replay (retentions/RTM/year-specific purses); current mode is explicitly a fresh fantasy auction.
- Rain/DLS/no-results, full IPL playoff schedule and every Impact window; v1 uses the documented custom ruleset.
- Compound no-ball/run-out outcomes; wicket-by-wicket decision pauses and full visual replay scoreboard.

No LLM calls occur in auction bidding, ratings, allocation or ball simulation. Source files are cached; ratings initialize once per module; advantage trials are debounced and only run before matches.

## Verification

47 unit tests passed, including seeded live/quick equivalence, replay, score conservation, free hits, Super Overs, bot squad completion, auction legality, rating rules and exactly-once league results. Twelve Playwright tests passed across auction, solo persistence, builder/campaign flow and responsive Match Centre. `pnpm typecheck` and `pnpm build` passed. Screenshots inspected at 1440, 1024 and 390 pixels; no page-level horizontal overflow.

Campaign snapshots use IndexedDB to avoid localStorage's small capacity during long seasons. The current match and solo auction use separate device-local saves. Attempts to fetch the missing Cricsheet archive timed out; missing historical evidence remains disclosed.

## Rating revision — 19 October 2026

- `career-context-v4` uses the same formula for every player, with no name overrides.
- The importer derives expected runs/dismissals/wickets for each competition, year and innings phase. T20I reference rates use games between the disclosed reference opponents.
- Batting impact combines 40% log scoring-rate ratio and 60% log average ratio. Bowling combines 60% log run-prevention ratio and 40% log wicket-rate ratio. Game-score sensitivities are 48 and 80 respectively, around a 76 reference score; these are design coefficients, not fitted official rankings.
- Each competition uses 900-ball smoothing. Nominal IPL/T20I weights are 75/25, scaled by sample reliability. Limited IPL evidence has a bounded four-point transfer deduction.
- Sustained credit is quality-gated and capped at nine points. Exposure thresholds differ for batting and bowling; merely accumulating poor seasons cannot earn the full credit.
- Reproduce the pool audit with `node packages/cricket-data/scripts/audit-ratings.cjs --write`. The checked-in audit records unrounded scores, components, confidence and source-ball counts. Career observations remain distinct from these estimates.
- Latest validation: 57 unit tests, typecheck and production build passed. Browser/screenshot checks were not repeated, following the user's request. The older verification paragraph above describes an earlier build.
- Frozen match snapshots retain their original abilities for replay; new matches use the revised ratings.
