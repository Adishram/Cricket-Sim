# Career data and attribution

Snapshot retrieved 17–18 October 2026. The app has **274 official IPL 2026 squad registrations**, **242 IPL career records**, **17 T20 career fallback records**, and **15 explicitly unavailable records**. Registration includes replacements and withdrawn players retained in the official season feed. Teams are 2026 registration labels, not live transfer ownership or availability.

## Sources and scope

- Squad identity, role, nationality: [official IPL squads](https://www.iplt20.com/teams). Factual metadata only; no player photography, proprietary logos or biographies are bundled.
- Primary career statistics: [IPL T20 Players career comparison](https://www.iplt20players.com/stats/compare), an independent publisher. **219** players resolve to career summary records through exact or explicitly reviewed names. The per-player source URL is retained. Source batting/bowling styles are used where present.
- Supplemental career statistics: [IPL.com player profiles](https://www.ipl.com/player/jack-edwards), also an independent publisher, not the official IPL website. **23 IPL career** and **17 T20 career** records are extracted only from the format-level career tables. Individual match and season tables are not used. Where IPL is absent, use the provider's aggregate T20 career classification; do not add IPL, T20 and T20I totals together. Provider coverage/update cutoffs are not supplied for these profiles and are disclosed in the UI.

These are provider-reported career facts, not independently audited ball-by-ball totals. Retrieval date is not a guaranteed last-match cutoff. Some source profiles have incomplete data; absent fields remain null. Aman Rao's secondary profile conflates an unrelated county identity, so it is excluded. No IPL record does not establish debut status.

## Display rules

- Batters and wicketkeeper batters: career runs, batting average, batting strike rate.
- Bowlers: career wickets, economy, bowling average, bowling strike rate.
- All-rounders: both disciplines, under one clearly labeled IPL or T20 career scope.
- Batting average is runs per dismissal; batting strike rate is runs per 100 balls. Bowling average is runs conceded per wicket; bowling strike rate is balls per wicket; economy is runs conceded per over.
- No dismissals/wickets means the corresponding average/strike rate is undefined, not zero. Missing or undefined metrics display a dash. Observed zero remains zero. No recent-five-innings strip or single-season form is shown.
- No estimated game ratings. Unsourced styles remain unavailable. All players use a simulated ₹2 Cr opening price, not an official reserve or contract amount. Franchises, purses and bids remain demo gameplay.

## Provenance and refresh

`packages/cricket-data/sources/roster.json`, `career-map.json`, `profile-careers.json` and `career-manifest.json` preserve normalized inputs, reviewed identity matches, source links and a comparison-page checksum. `scripts/build-careers.py` (also `build-snapshot.py`) generates `src/snapshot.json` offline from these inputs. Local raw profiles can refresh extracted supplemental records; review them before replacing saved inputs. Raw HTML/CSV is excluded from version control and is never served to browsers. No API key or runtime external request is needed.

Earlier season-form research used openIPL/Cricsheet and remains only in local research files; it is **not the current displayed career dataset**. Those historical derivatives retain [openIPL](https://github.com/sachin-dul/openIPL)'s [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) attribution and upstream [Cricsheet](https://cricsheet.org/) [ODC-By](https://opendatacommons.org/licenses/by/1-0/) attribution. The career sources above have not been represented as open-licensed datasets.
