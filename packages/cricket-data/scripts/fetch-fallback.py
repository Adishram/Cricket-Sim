"""Cache public profiles for players without IPL 2026 scorecard records."""
from pathlib import Path
import json,urllib.request,concurrent.futures,re,subprocess
raw=Path(__file__).resolve().parents[1]/'raw';out=raw/'profiles';out.mkdir(exist_ok=True)
mapping=json.loads((raw/'identity-map.json').read_text())
players=[p for t in json.loads((raw/'squads.json').read_text())['teams'] for p in t['players'] if p['id'] not in mapping or p['name'] in ['Jordan Cox','Praveen Dubey']]
def fetch(p):
 slug=re.sub('[^a-z0-9]+','-',p['name'].lower()).strip('-')
 slug={'mahendra-singh-dhoni':'ms-dhoni','mitch-owen':'mitchell-owen','aman-khan':'w1-aman-khan','ben-duckett':'ben-matthew-duckett','zak-foulkes':'zakary-foulkes'}.get(slug,slug)
 path=out/(p['id']+'.html')
 try:
  if not path.exists() or path.stat().st_size<40000:subprocess.run(['curl','-fsSL','--max-time','25','-o',str(path),'https://www.ipl.com/player/'+slug],check=True,capture_output=True)
  return p['name'],slug,path.stat().st_size
 except Exception as e:return p['name'],slug,str(e)
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:
 results=list(ex.map(fetch,players))
(raw/'fallback-fetch.json').write_text(json.dumps(results,indent=2));print(json.dumps(results))
