from pathlib import Path
import json,urllib.request,concurrent.futures,hashlib,datetime
root=Path(__file__).resolve().parents[1];raw=root/'raw'
seed=json.loads((raw/'csk-full.json').read_text())['data']
def fetch(t):
 slug=t['slug'];url=f'https://www.iplt20.com/api/bff/cms/teams/{slug}?tab=squad'
 data=urllib.request.urlopen(url,timeout=40).read();obj=json.loads(data)['data'];squad=obj['squad'];season=squad['filters']['defaultSeasonYear'];
 (raw/f'squad-{slug}.json').write_bytes(data)
 return {'team':obj['title'],'slug':slug,'season':season,'url':url,'sha256':hashlib.sha256(data).hexdigest(),'players':[{k:p.get(k) for k in ['id','externalId','name','role','country','countryCode','isInternational','isCaptain','isWicketKeeper']} for p in squad['players']]}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:teams=list(ex.map(fetch,seed['teams']))
(raw/'squads.json').write_text(json.dumps({'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'teams':teams},indent=2))
print([(t['team'],len(t['players'])) for t in teams])
