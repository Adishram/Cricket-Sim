"""Aggregate pace/spin batting splits from cached Cricsheet IPL JSON files.
Usage: python3 packages/cricket-data/scripts/build-style-splits.py /path/to/ipl_json
No downloads, invented observations, fuzzy identity matching or career inputs.
"""
import csv, hashlib, json, re, sys
from collections import defaultdict
from pathlib import Path
root=Path(__file__).resolve().parents[1]
if len(sys.argv)!=2: raise SystemExit(__doc__)
files=sorted(Path(sys.argv[1]).glob('*.json'))
if not files: raise SystemExit('No cached match JSON files found. Existing snapshot preserved.')
identities=json.loads((root/'sources/identity-map.json').read_text())
registry={r['player']:r['cricsheet_id'] for r in csv.DictReader((root/'raw/registry-2026.csv').open())}
known={registry[name]:pid for pid,name in identities.items() if name in registry}
players=json.loads((root/'src/snapshot.json').read_text())['players']+json.loads((root/'src/auction-register.json').read_text())['extra']
styles={p['id']:p['bowl'] for p in players}
def kind(style):
 if re.search('spin|break|slow|orthodox|chinaman',style,re.I):return 'spin'
 if re.search('fast|medium|pace|seam',style,re.I):return 'pace'
 return None
stats=defaultdict(dict);manifest=[];seen=set();cutoff='2026-10-18'
for file in files:
 data=json.loads(file.read_text());info=data.get('info',{});dates=info.get('dates',[])
 if not dates or not '2024-01-01'<=str(dates[-1])<=cutoff:continue
 if info.get('match_type')!='T20' or info.get('gender')!='male' or info.get('event',{}).get('name')!='Indian Premier League':continue
 # One file per official match; byte-identical copies are also ignored.
 digest=hashlib.sha256(file.read_bytes()).hexdigest()
 key=json.dumps([dates,info.get('teams'),info.get('event')],sort_keys=True)
 if key in seen:continue
 seen.add(key);ids=info.get('registry',{}).get('people',{})
 for inn in data.get('innings',[]):
  if inn.get('super_over'):continue
  for over in inn.get('overs',[]):
   for ball in over['deliveries']:
    batter=known.get(ids.get(ball['batter']));bowler=known.get(ids.get(ball['bowler']));style=kind(styles.get(bowler,''))
    if not batter or not style or ball.get('extras',{}).get('wides'):continue
    row=stats[batter].setdefault(style,{'balls':0,'runs':0,'dismissals':0,'source':'https://cricsheet.org/','from':str(dates[0]),'to':str(dates[-1])})
    row['balls']+=1;row['runs']+=ball['runs']['batter'];row['from']=min(row['from'],str(dates[0]));row['to']=max(row['to'],str(dates[-1]))
    row['dismissals']+=sum(w['player_out']==ball['batter'] and w['kind'] not in ['retired hurt','obstructing the field'] for w in ball.get('wickets',[]))
 manifest.append({'file':file.name,'sha256':digest})
if not stats:raise SystemExit('No verified, identity-matched IPL splits found. Existing snapshot preserved.')
(root/'src/style-splits.json').write_text(json.dumps({'cutoff':cutoff,'window':[2024,2025,2026],'source':'https://cricsheet.org/','status':'Observed IPL ball-by-ball aggregates; only identity- and style-matched deliveries.','players':stats},indent=2)+'\n')
(root/'sources/style-splits-manifest.json').write_text(json.dumps({'license':'Open Data Commons Attribution 1.0','source':'https://cricsheet.org/','files':manifest},indent=2)+'\n')
print(f'Wrote split evidence for {len(stats)} players from {len(manifest)} matches.')
