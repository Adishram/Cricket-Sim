from pathlib import Path
import json,csv,unicodedata
raw=Path(__file__).resolve().parents[1]/'raw'
def norm(s):return ''.join(c.lower() for c in unicodedata.normalize('NFKD',s) if c.isalnum())
players=list(csv.DictReader((raw/'players-2026.csv').open()))
roster=json.loads((raw/'squads.json').read_text())['teams'];mapping={};unmatched=[]
for t in roster:
 candidates=[p['player'] for p in players if p['team']==t['team']]
 for p in t['players']:
  name=p['name'];parts=name.split();n=norm(name)
  exact=[a for a in candidates if norm(a)==n]
  initials=[a for a in candidates if norm(a.split()[-1])==norm(parts[-1]) and a[0].lower()==name[0].lower()]
  hits=exact or initials
  if len(hits)==1:mapping[p['id']]=hits[0]
  else:unmatched.append((name,t['team'],hits))
(raw/'identity-map.json').write_text(json.dumps(mapping,indent=2));print('Mapped',len(mapping));print('Unmatched:');print('\n'.join(str(a) for a in unmatched));used=set(mapping.values());print('UNUSED STATS:',[p['player'] for p in players if p['player'] not in used])
