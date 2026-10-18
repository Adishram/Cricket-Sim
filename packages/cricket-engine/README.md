# Pure T20 engine v1

No React, clocks, network or storage. Mutable state transitions operate on explicit seeded snapshots. `step` is shared by live playback and `simulate`; ordered tactical commands can be replayed with frozen player profiles. `expectedEvent` rejects stale delivery requests in the local engine; connected production execution still needs a database transaction.

Implemented: dots, singles, twos, threes, fours, sixes, wides, no-balls, byes, leg-byes; caught/bowled/LBW/stumped/run-out; free hits; scorecards; strike rotation; overs, quotas and look-ahead rotation feasibility; targets; repeated Super Overs with batter/bowler eligibility; original-XI overseas Impact restrictions; legal pre-match substitutions; pitch/tactical probability adjustments; deterministic bot over policies; model-sampled pre-match advantage.

This is a versioned game model, not a calibrated real-world prediction. No-ball events currently model the penalty only; compound bat-runs/run-outs on an illegal delivery are not generated. Run-outs currently dismiss the striker without completed runs. Detailed phase/style and fielding profiles are provisional baselines. Weather interruption/DLS, injuries and abandonment are not modeled. Impact windows are a documented custom subset (over/innings boundary), not every permitted IPL window. Bot Impact selection uses a deterministic innings-break skill policy.

Rules references: MCC Laws (https://www.lords.org/mcc/the-laws-of-cricket), IPL 2025 playing conditions (https://documents.iplt20.com/bcci/documents/1742707993986_Match_Playing_Conditions.pdf). Copyrighted law text is not bundled.

## Mechanics update: t20-1.2

- `planning.ts`: validated 20-over schedules, four-over quota, no consecutive overs and a legal auto-assignment policy. `activeBowler` keeps the preview and actual next delivery aligned. A schedule can fall back to a legal option after an Impact change; remaining quota is always respected. Super Overs use their separate rules.
- `selection.ts`: role-balanced XIs, overseas-cap feasibility, sensible batting order and pitch/opposition-aware estimated selection. XI plus one eligible preferred Impact substitute forms the recommended XII; twelve players never take the field together.
- Per-batter aggression and anchor/rotation/power/sweep styles. Per-bowler line, length and variation. Yorkers and wide yorkers draw a seeded execution outcome; misses increase boundary/extra risk, successes increase dot/wicket probability, never certainty. These weights are gameplay assumptions, not measured player evidence.
- `field.ts`: named fielders, keeper and distinct field geometry, mirrored for handedness. Field snapshots and catching/stumping/run-out recipients are saved with each event. The delivery path ends at that receiver, and the same event updates wicket totals, dismissal text and season fielding credits.
- Fifty/century events fire once at the threshold crossing. League totals count normal innings only, including playoffs; Super Overs are excluded. Best bowling ranks wickets descending then runs conceded ascending; rate awards require 60 balls.
- Pre-match role, XI, pitch, instruction and rotation changes update the frozen replay snapshot. Live commands retain their ordered event history. Old unfinished engine saves require a fresh match; completed old scorecards remain readable.

The Match Centre requires plan confirmation before interactive play. Pure simulation can run automatically with the validated defaults, which supports bot fixtures and model trials without UI dependencies. No runtime LLM calls are used.
