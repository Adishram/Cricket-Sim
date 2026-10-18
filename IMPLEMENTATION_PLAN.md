# Implementation plan
1. Foundation: architecture documents, Next.js workspace, design tokens and reusable UI.
2. Showcase: homepage, demo lobby, auction centerpiece, responsive queues, squad drawer, reduced-motion states.
3. Minimal auction: isolated server session, validated idempotent bids, authoritative expiry/settlement, tests.
4. Next: Supabase migrations, Auth, membership/RLS, transactional auction commands, worker scheduling and multi-client race tests.
5. Licensed ingestion and versioned ratings.
6. Seeded T20 engine and calibration.
7. Squad tactics, fixtures, standings and playoffs.

Phase 1 intentionally excludes connected multiplayer, persistent results, real observed data and match simulation.
