"""Summarize named IPL bowlers' regulation deliveries (Cricsheet JSON ZIP)."""
import collections, json, sys, zipfile
groups = {'new ball':(['B Kumar','JJ Bumrah'],0,6), 'death':(['B Kumar','JJ Bumrah'],15,20), 'middle':(['RA Jadeja','CV Varun'],6,15)}
counts = collections.defaultdict(lambda:[0,0,0,0])
league=collections.defaultdict(collections.Counter)
with zipfile.ZipFile(sys.argv[1]) as archive:
 for name in archive.namelist():
  if not name.endswith('.json'): continue
  m=json.loads(archive.read(name))
  if not '2022' <= m['info']['dates'][0][:4] <= '2025': continue
  for inn in m['innings']:
   if inn.get('super_over'): continue
   for over in inn['overs']:
    for d in over['deliveries']:
     phase='new' if over['over']<6 else 'middle' if over['over']<15 else 'death'
     extras=d.get('extras',{});b=d['runs']['batter']
     event=('wide' if 'wides' in extras else 'noBall' if 'noballs' in extras else 'wicket' if any(w['kind'] not in ('retired hurt','retired not out') for w in d.get('wickets',[])) else 'bye' if 'byes' in extras else 'legBye' if 'legbyes' in extras else {0:'dot',1:'one',2:'two',3:'three',4:'four',6:'six'}.get(b,'three'))
     league[phase][event]+=1
     for key,(names,lo,hi) in groups.items():
      if d['bowler'] not in names or not lo<=over['over']<hi:continue
      if {'wides','noballs'} & d.get('extras',{}).keys():continue
      r=counts[key];r[0]+=1;r[1]+=d['runs']['total']==0;r[2]+=d['runs']['batter'] in (4,6) and not d.get('non_boundary');r[3]+=sum(w['kind'] in ('bowled','caught','lbw','stumped','caught and bowled','hit wicket') for w in d.get('wickets',[]))
print(dict(counts),file=sys.stderr)
print(json.dumps(league,indent=2))
