// Builds src/form-2026.json: observed IPL 2026 season aggregates per player id.
// Source: OpenIPL per-team scorecard CSVs (Cricsheet, CC BY 4.0) in ../raw.
// Run: node packages/cricket-data/scripts/build-form.mjs
import {readFileSync,writeFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const teams=['chennai-super-kings','delhi-capitals','gujarat-titans','kolkata-knight-riders','lucknow-super-giants','mumbai-indians','punjab-kings','rajasthan-royals','royal-challengers-bengaluru','sunrisers-hyderabad'];
const rows=file=>{const [head,...lines]=readFileSync(join(root,'raw',file),'utf8').replace(/\r/g,'').trim().split('\n');const keys=head.split(',');return lines.filter(Boolean).map(l=>Object.fromEntries(l.split(',').map((v,i)=>[keys[i],v])));};
const identity=JSON.parse(readFileSync(join(root,'sources','identity-map.json'),'utf8'));
const byName=new Map(Object.entries(identity).map(([id,name])=>[name,id]));
const form={};
const entry=id=>form[id]??={matches:new Set(),batting:{innings:0,runs:0,balls:0,dismissals:0},bowling:{innings:0,balls:0,runs:0,wickets:0}};
for(const team of teams){
 for(const r of rows(`${team}-batting.csv`)){const id=byName.get(r.batter);if(!id)continue;const e=entry(id);e.matches.add(`${team}-${r.match_number}`);e.batting.innings++;e.batting.runs+=+r.runs;e.batting.balls+=+r.balls;if(r.dismissal&&r.dismissal!=='not out'&&r.dismissal!=='retired hurt')e.batting.dismissals++;}
 for(const r of rows(`${team}-bowling.csv`)){const id=byName.get(r.bowler);if(!id)continue;const e=entry(id);e.matches.add(`${team}-${r.match_number}`);const [o,b='0']=r.overs.split('.');e.bowling.innings++;e.bowling.balls+=+o*6+ +b;e.bowling.runs+=+r.runs;e.bowling.wickets+=+r.wickets;}
}
const out=Object.fromEntries(Object.entries(form).sort().map(([id,e])=>[id,{matches:e.matches.size,batting:e.batting,bowling:e.bowling}]));
writeFileSync(join(root,'src','form-2026.json'),JSON.stringify({season:2026,source:'OpenIPL scorecards (Cricsheet, CC BY 4.0)',players:out},null,1)+'\n');
console.log(`Wrote season form for ${Object.keys(out).length} players.`);
