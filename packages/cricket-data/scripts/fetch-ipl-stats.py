from pathlib import Path
import json,urllib.request,concurrent.futures
root=Path(__file__).resolve().parents[1];raw=root/'raw';base='https://raw.githubusercontent.com/sachin-dul/openIPL/main/data/2026/'
teams=json.loads((raw/'squads.json').read_text())['teams']
items=[('matches.csv','matches-2026.csv'),('player_registry.csv','registry-2026.csv')]
for t in teams:
 for kind in ['batting','bowling']:
  items.append(('teams/'+t['team'].replace(' ','_')+'/'+kind+'.csv',t['slug']+'-'+kind+'.csv'))
def get(pair):
 path,name=pair;data=urllib.request.urlopen(base+path,timeout=30).read();(raw/name).write_bytes(data);return name
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:print(list(ex.map(get,items)))
