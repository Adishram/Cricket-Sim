# Campaign engine

Pure seeded allocation, squad and XI validation, 4/6/8/10-team round-robin scheduling, optional home/away, custom top-four semifinals/final, idempotent result recording, derived standings and player awards. Completed fixture snapshots are immutable on duplicate result submission. NRR excludes Super Overs and charges full innings quota when all out. Economy/SR award qualification is 60 legal balls bowled / 60 balls faced.

This is a custom fantasy format, not an official IPL fixture schedule. Weather/no-result and unresolved-tie outcomes are not generated in v1; T/NR columns remain zero. The UI stores local campaigns in browser storage and automatically simulates bot fixtures. Database persistence and connected match authorization are not implemented.
