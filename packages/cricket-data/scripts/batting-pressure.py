"""Cricsheet IPL first-innings scoring pace and next-ball dismissals by batter dot streak."""
import collections,json,sys,zipfile
phases=[[0,0] for _ in range(3)];dots=[[0,0] for _ in range(4)]
with zipfile.ZipFile(sys.argv[1]) as z:
 for n in z.namelist():
  if not n.endswith('.json'):continue
  m=json.loads(z.read(n))
  if not '2022'<=m['info']['dates'][0][:4]<='2025':continue
  for ix,i in enumerate(m['innings']):
   if i.get('super_over'):continue
   streak=collections.Counter()
   for o in i['overs']:
    ph=phases[0 if o['over']<6 else 1 if o['over']<15 else 2]
    for d in o['deliveries']:
     if ix==0:ph[0]+=d['runs']['total']
     if {'wides','noballs'} & d.get('extras',{}).keys():continue
     if ix==0:ph[1]+=1
     b=d['batter'];bucket=dots[min(3,streak[b])];bucket[0]+=1
     bucket[1]+=any(w['player_out']==b and w['kind'] not in ('retired hurt','retired not out') for w in d.get('wickets',[]))
     streak[b]=streak[b]+1 if not d['runs']['total'] else 0
print(json.dumps(dict(firstInningsRunsAndBalls=phases,dotStreakBallsAndDismissals=dots),indent=2))
