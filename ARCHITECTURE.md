# Architecture
Modular monolith in a pnpm workspace. Next.js App Router renders UI and hosts the Phase 1 HTTP adapter. packages/auction-engine contains pure transitions; packages/cricket-data contains fictional seeds. cricket-engine, league-engine, database, shared and worker are reserved boundaries, not completed services.

The isolated demo uses a random HttpOnly session cookie and process memory. Client submits commands, never prices or purses. A synchronous server transition validates and settles using server time. Every response includes server time. Polling recovers state. Process restarts lose state; multiple server instances are unsupported.

Production: Supabase Auth establishes membership; PostgreSQL transaction locks auction row, checks version/deadline/idempotency, appends immutable bid, and atomically settles ownership and purse. RLS scopes reads to room members; commands use authenticated server endpoints. Realtime sends committed versions, clients fetch gaps. Redis/BullMQ worker wakes auctions; database deadline remains authoritative. Never deploy the memory adapter as multiplayer infrastructure.
