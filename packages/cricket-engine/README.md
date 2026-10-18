# Pure T20 engine v1

No React, clocks, network or storage. Mutable state transitions operate on explicit seeded snapshots. `step` is shared by live playback and `simulate`; ordered tactical commands can be replayed with frozen player profiles. `expectedEvent` rejects stale delivery requests in the local engine; connected production execution still needs a database transaction.

Implemented: dots, singles, twos, threes, fours, sixes, wides, no-balls, byes, leg-byes; caught/bowled/LBW/stumped/run-out; free hits; scorecards; strike rotation; overs, quotas and look-ahead rotation feasibility; targets; repeated Super Overs with batter/bowler eligibility; original-XI overseas Impact restrictions; legal pre-match substitutions; pitch/tactical probability adjustments; deterministic bot over policies; model-sampled pre-match advantage.

This is a versioned game model, not a calibrated real-world prediction. No-ball events currently model the penalty only; compound bat-runs/run-outs on an illegal delivery are not generated. Run-outs currently dismiss the striker without completed runs. Detailed phase/style and fielding profiles are provisional baselines. Weather interruption/DLS, injuries and abandonment are not modeled. Impact windows are a documented custom subset (over/innings boundary), not every permitted IPL window. Bot Impact selection uses a deterministic innings-break skill policy.

Rules references: MCC Laws (https://www.lords.org/mcc/the-laws-of-cricket), IPL 2025 playing conditions (https://documents.iplt20.com/bcci/documents/1742707993986_Match_Playing_Conditions.pdf). Copyrighted law text is not bundled.
