"""Build cached, attributed season evidence and IPL matchup aggregates. No fuzzy matches.
Inputs: raw IPL/T20I/BBL/PSL Cricsheet archives + people/names register CSVs.
Re-run explicitly after refreshing source archives; never runs during a match.
"""
import csv,hashlib,json,re,zipfile
from pathlib import Path
from collections import defaultdict
root=Path(__file__).resolve().parents[1];raw=root/'raw';cutoff='2026-10-18';window=[2026,2025,2024]
players=json.loads((root/'src/snapshot.json').read_text())['players']+json.loads((root/'src/auction-register.json').read_text())['extra']
by_id={p['id']:p for p in players};norm=lambda s:re.sub(r'[^a-z0-9]','',s.lower())
people=list(csv.DictReader((raw/'people.csv').open()));aliases=list(csv.DictReader((raw/'names.csv').open()));name_ids=defaultdict(set);pool_names=defaultdict(list)
for p in people:
 for n in [p['name'],p['unique_name']]:name_ids[norm(n)].add(p['identifier'])
for p in aliases:name_ids[norm(p['name'])].add(p['identifier'])
for p in players:pool_names[norm(p['name'])].append(p['id'])
registry={r['player']:r['cricsheet_id'] for r in csv.DictReader((raw/'registry-2026.csv').open())}
known={};mapping=[]
for pid,name in json.loads((root/'sources/identity-map.json').read_text()).items():
 if pid in by_id and name in registry:known[registry[name]]=pid;mapping.append({'player':pid,'cricsheet':registry[name],'method':'existing audited identity map'})
for p in players:
 ids=name_ids[norm(p['name'])]
 if p['id'] not in known.values() and len(ids)==1 and len(pool_names[norm(p['name'])])==1:
  cid=next(iter(ids))
  if cid not in known:known[cid]=p['id'];mapping.append({'player':p['id'],'cricsheet':cid,'method':'unique exact normalized register alias'})
def blank():return {'matches':0,'batting':{'innings':0,'runs':0,'balls':0,'dismissals':0},'bowling':{'innings':0,'balls':0,'runs':0,'wickets':0}}
def season(info):
 s=str(info['season']);parts=s.split('/');last=int(parts[-1]);return last+2000 if last<100 else last
stats=defaultdict(blank);capped=set();splits=defaultdict(dict);phases=defaultdict(lambda:{'batting':{},'bowling':{}});h2h=defaultdict(dict);coverage={};sources=[];seen=set();completed=set()
files=[('ipl_json.zip','IPL'),('t20s_male_json.zip','T20I'),('bbl_male_json.zip','BBL'),('psl_male_json.zip','PSL')]
credit_excluded={'run out','retired hurt','retired out','obstructing the field'}
def splitrow(target,key,date):return target.setdefault(key,{'balls':0,'runs':0,'dismissals':0,'source':'https://cricsheet.org/','from':date,'to':date})
for filename,competition in files:
 path=raw/filename;z=zipfile.ZipFile(path);sources.append({'file':filename,'url':'https://cricsheet.org/downloads/'+filename,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
 for file in sorted(z.namelist()):
  if not file.endswith('.json'):continue
  data=json.loads(z.read(file));info=data['info'];dates=[str(d) for d in info['dates']]
  if dates[-1]>cutoff or info.get('gender')!='male' or info.get('match_type')!='T20':continue
  key=(competition,file)
  if key in seen:continue
  seen.add(key);ids=info['registry']['people'];pid=lambda name:known.get(ids.get(name));year=int(dates[0][:4]) if competition=='T20I' else season(info)
  participants={pid(n) for team in info.get('players',{}).values() for n in team};participants.discard(None)
  if competition=='T20I':capped.update(participants)
  if year not in window:continue
  coverage[f'{competition} {year}']=coverage.get(f'{competition} {year}',0)+1
  if (competition=='T20I' and year<int(cutoff[:4])) or (competition!='T20I' and 'final'==str(info.get('event',{}).get('stage','')).lower()):completed.add((competition,year))
  for p in participants:stats[(p,competition,year)]['matches']+=1
  for inn in data.get('innings',[]):
   if inn.get('super_over'):continue
   batted=set();bowled=set()
   for over in inn.get('overs',[]):
    phase='powerplay' if over['over']<6 else 'middle' if over['over']<15 else 'death'
    for d in over['deliveries']:
     bat=pid(d['batter']);non=pid(d['non_striker']);bow=pid(d['bowler']);extras=d.get('extras',{});legal=not extras.get('wides') and not extras.get('noballs');faced=not extras.get('wides');dismissals=d.get('wickets',[]);conceded=d['runs']['total']-extras.get('byes',0)-extras.get('legbyes',0)
     for p in [bat,non]:
      if p:batted.add(p)
     if bat:
      b=stats[(bat,competition,year)]['batting'];b['runs']+=d['runs']['batter'];b['balls']+=int(faced)
     for w in dismissals:
      dismissed=pid(w['player_out'])
      if dismissed and w['kind']!='retired hurt':stats[(dismissed,competition,year)]['batting']['dismissals']+=1
     wickets=sum(w['kind'] not in credit_excluded for w in dismissals)
     if bow:
      bowled.add(bow);b=stats[(bow,competition,year)]['bowling'];b['runs']+=conceded;b['balls']+=int(legal);b['wickets']+=wickets
     if competition=='IPL':
      if bat and faced:
       style=by_id[bow]['bowl'] if bow else '';kind='spin' if re.search('spin|break|slow|orthodox|chinaman',style,re.I) else 'pace' if re.search('fast|medium|pace|seam',style,re.I) else None
       targets=[splitrow(phases[bat]['batting'],phase,dates[0])]
       if kind:targets.append(splitrow(splits[bat],kind,dates[0]))
       if bow:targets.append(splitrow(h2h[bat],bow,dates[0]))
       for row in targets:
        row['balls']+=1;row['runs']+=d['runs']['batter'];row['dismissals']+=sum(w['player_out']==d['batter'] and w['kind']!='retired hurt' for w in dismissals);row['from']=min(row['from'],dates[0]);row['to']=max(row['to'],dates[-1])
      if bow:
       row=splitrow(phases[bow]['bowling'],phase,dates[0]);row['balls']+=int(legal);row['runs']+=conceded;row['dismissals']+=wickets;row['from']=min(row['from'],dates[0]);row['to']=max(row['to'],dates[-1])
   for p in batted:stats[(p,competition,year)]['batting']['innings']+=1
   for p in bowled:stats[(p,competition,year)]['bowling']['innings']+=1
output=defaultdict(list)
for (p,c,y),form in sorted(stats.items()):
 if (c,y) not in completed:continue
 output[p].append({'season':y,'competition':c if c in ['IPL','T20I'] else 'domestic','competitionId':c,'source':'https://cricsheet.org/downloads/','complete':True,'form':form})
meta={'cutoff':cutoff,'window':window,'source':'https://cricsheet.org/','license':'Open Data Commons Attribution 1.0','coverage':coverage,'completed':sorted(f'{c} {y}' for c,y in completed),'identityMatches':len(known)}
(root/'src/recent-evidence.json').write_text(json.dumps({**meta,'players':output,'verifiedT20ICapped':sorted(capped)},indent=2)+'\n')
(root/'src/style-splits.json').write_text(json.dumps({**meta,'status':'Observed IPL ball-by-ball aggregates; only identity- and style-matched deliveries.','players':splits},indent=2)+'\n')
(root/'src/matchup-evidence.json').write_text(json.dumps({**meta,'phases':phases,'headToHead':h2h},separators=(',',':'))+'\n')
(root/'sources/recent-evidence-manifest.json').write_text(json.dumps({**meta,'archives':sources,'identityMapping':mapping,'excluded':'Partial competition seasons; 2026 T20I calendar year; Super Overs. Unmatched or ambiguous players are not guessed. Afghanistan matches may be withheld upstream.'},indent=2)+'\n')
print(json.dumps({'playersWithEvidence':len(output),'verifiedT20ICapped':len(capped),'mappedIdentities':len(known),'paceSpinPlayers':len(splits),'headToHeadBatters':len(h2h),'coverage':coverage,'completed':meta['completed']}))
