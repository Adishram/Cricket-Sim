"""Observed IPL batting entry roles, 2022–26. Not inferred from OVR."""
import collections,json,zipfile,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
ids={x['cricsheet']:x['player'] for x in json.loads((root/'sources/recent-evidence-manifest.json').read_text())['identityMapping']}
counts=collections.defaultdict(collections.Counter)
with zipfile.ZipFile(sys.argv[1]) as z:
 for n in z.namelist():
  if not n.endswith('.json'):continue
  m=json.loads(z.read(n))
  if not '2022'<=m['info']['dates'][0][:4]<='2026':continue
  names=m['info'].get('registry',{}).get('people',{})
  for inn in m['innings']:
   if inn.get('super_over'):continue
   seen=set()
   for over in inn['overs']:
    for d in over['deliveries']:
     for name in [d['batter'],d['non_striker']]:
      if name in seen:continue
      seen.add(name);pid=ids.get(names.get(name))
      if pid:counts[pid]['opener' if len(seen)<=2 else 'middle' if len(seen)<=4 else 'finisher' if len(seen)<=7 else 'tail']+=1
result={pid:dict(c) for pid,c in counts.items()}
(root/'src/batting-roles.json').write_text(json.dumps(result,indent=2)+'\n')
