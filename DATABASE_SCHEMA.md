# Database schema proposal
Not a deployed migration. Amounts are integer lakh; all dates timestamptz.

- profiles(id auth.users PK, display_name)
- leagues(id UUID PK, owner_id FK, rules JSONB, status)
- rooms(id UUID PK, league_id FK, join_code UNIQUE, version, status)
- franchises(id UUID PK, room_id FK, manager_id FK, purse_lakh CHECK >=0)
- players(id UUID PK, canonical_source_id UNIQUE, name, nationality, styles)
- auctions(id UUID PK, room_id FK, player_id FK, deadline, bid_lakh, leader_id FK, status, version)
- bids(id UUID PK, auction_id FK, franchise_id FK, amount_lakh, created_at, command_id UNIQUE)
- squad_players(franchise_id FK, player_id FK, auction_id UNIQUE, price_lakh); unique room/player ownership via room_id + player_id
- commands(room_id, actor_id, key, request_hash, result JSONB), composite UNIQUE
- source_versions(id, source_url, license, checksum, imported_at)
- observations(player_id, source_version, phase, sample_size, aggregates JSONB)
- ratings(player_id, model_version, source_version, attributes JSONB, sample_size)
- matches(id, league_id, seed, engine_version, rules_version, status)
- match_events(match_id, sequence, payload JSONB), composite PK

Settlement locks auction and franchise rows; deadline/status check, debit, ownership insert and terminal status commit together. Immutable bid/event writes only through commands. RLS membership policies deny anonymous writes. Join codes are not authentication. Never expose service role keys to browsers.
