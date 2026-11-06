"""Map cached official IPL squad images to exact current player IDs, no guessed URLs."""
import json,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1];raw=Path(sys.argv[1]);out={}
players=json.loads((root/'src/snapshot.json').read_text())['players']+json.loads((root/'src/auction-register.json').read_text())['extra']
names={p['id']:p['name'] for p in players}
def walk(v,source):
 if isinstance(v,dict):
  pid=v.get('id');url=v.get('imageUrl','')
  if pid in names and url.startswith('https://www.iplt20.com/api/team-assets?') and v.get('name')==names[pid]:out[pid]={'url':url,'source':source}
  for x in v.values():walk(x,source)
 elif isinstance(v,list):
  for x in v:walk(x,source)
for f in raw.glob('squad-*.json'):
 slug=f.stem.removeprefix('squad-');walk(json.loads(f.read_text()),'https://www.iplt20.com/teams/'+slug)
(root/'src/player-portraits.json').write_text(json.dumps(out,indent=2)+'\n')
print(len(out),'matched portrait records')
