"""Generate career-only stats. Never relabel season totals as career records."""
from pathlib import Path
import json,re,unicodedata
from html_tables import Tables
root=Path(__file__).resolve().parents[1];raw=root/'raw';sources=root/'sources'
roster=json.loads((sources/'roster.json').read_text());main=json.loads((sources/'career-map.json').read_text());profiles={n:slug for n,slug,_ in json.loads((raw/'career-profile-fetch.json').read_text())} if (raw/'career-profile-fetch.json').exists() else {}
saved_profiles=json.loads((sources/'profile-careers.json').read_text()) if (sources/'profile-careers.json').exists() else {}
def num(v):
 try:return float(str(v).replace(',',''))
 except (ValueError,TypeError):return None
def norm(s):return re.sub('[^a-z]','',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower())
def profile(p):
 path=raw/'profiles'/(p['id']+'.html');slug=profiles.get(p['name'])
 if not path.exists() or not slug or p['name']=='Aman Rao':return None
 parser=Tables();parser.feed(path.read_text())
 if norm(parser.h1) not in {norm(p['name']),norm(slug)}:return None
 formats={}
 for table in parser.tables:
  if not table or table[0][:3]!=['Format','Matches','Innings']:continue
  for row in table[1:]:
   if len(row)!=len(table[0]):continue
   d=dict(zip(table[0],row));fmt=d['Format'].upper()
   if fmt not in ['IPL','T20'] or not num(d['Matches']):continue
   f=formats.setdefault(fmt,{'matches':int(num(d['Matches'])),'batting':None,'bowling':None})
   innings=int(num(d['Innings']) or 0)
   if 'BF' in d and innings:
    runs=num(d['Runs']);outs=innings-(num(d.get('Not Out')) or 0)
    f['batting']={'innings':innings,'runs':runs,'average':num(d['Avg']) if outs>0 else None,'strikeRate':num(d['SR']) if num(d['BF']) else None}
   if 'Wkts' in d and innings:
    wickets=num(d['Wkts']);f['bowling']={'innings':innings,'wickets':wickets,'economy':num(d['Econ']) if num(d['Balls']) else None,'average':num(d['Avg']) if wickets else None,'strikeRate':num(d['SR']) if wickets else None}
 fmt='IPL' if 'IPL' in formats else 'T20' if 'T20' in formats else None
 if not fmt:return None
 return {**formats[fmt],'competition':fmt+' career','fallback':fmt=='T20','provider':'IPL.com (independent statistics site)','source':'https://www.ipl.com/player/'+slug,'asOf':'2026-10-18','coverage':'Provider-reported career totals; update cutoff not supplied.'}
def career(p):
 r=main.get(p['id'])
 if not r:return profile(p) or saved_profiles.get(p['id'])
 batting=None;bowling=None
 if r['battingInnings']:
  batting={'innings':r['battingInnings'],'runs':r['battingRuns'],'average':r['battingAverage'] if r['battingInnings']>r['battingNotOuts'] else None,'strikeRate':r['battingStrikeRate'] if r['battingStrikeRate'] or not r['battingRuns'] else None}
 if r['bowlingInnings']:
  bowling={'innings':r['bowlingInnings'],'wickets':r['bowlingWickets'],'economy':r['bowlingEconomyRate'] if r['bowlingOvers'] else None,'average':r['bowlingAverage'] if r['bowlingWickets'] else None,'strikeRate':r['bowlingStrikeRate'] if r['bowlingWickets'] else None}
 return {'competition':'IPL career','matches':max(r['battingMatches'],r['bowlingMatches']),'batting':batting,'bowling':bowling,'fallback':False,'provider':'IPL T20 Players','source':'https://www.iplt20players.com/players/'+r['player']['slug'],'asOf':'2026-10-18','coverage':'Career totals from the IPL T20 Players career comparison snapshot.'}
players=[]
for t in roster['teams']:
 for p in t['players']:
  players.append({'id':p['id'],'name':p['name'],'country':p['country'],'role':p['role'].replace('batsman','Batter').replace('wicketkeeper','Wicketkeeper batter').replace('allrounder','All-rounder').replace('bowler','Bowler'),'bat':({'RHB':'Right-hand bat','LHB':'Left-hand bat'}.get(main.get(p['id'],{}).get('player',{}).get('battingHand'),'Batting style not sourced')),'bowl':(' '.join(str(main[p['id']]['player'].get(k) or '') for k in ['bowlingArm','bowlingStyle']).strip() or 'Bowling style not sourced') if p['id'] in main else 'Bowling style not sourced','rating':'—','base':200,'overseas':p['country']!='India','initials':''.join(s[0] for s in p['name'].split()[:2]),'color':'#fbbf24','seasonTeam':t['team'],'squadSource':'https://www.iplt20.com/teams/'+t['slug']+'/squad','career':career(p)})
order=['Virat Kohli','Pat Cummins','Jasprit Bumrah','Vaibhav Sooryavanshi','Jack Edwards'];players.sort(key=lambda p:(order.index(p['name']) if p['name'] in order else len(order),p['name']))
(root/'src'/'snapshot.json').write_text(json.dumps({'retrievedAt':roster['retrievedAt'],'season':2026,'players':players},indent=2)+'\n')
print('IPL',sum(bool(p['career']) and not p['career']['fallback'] for p in players),'T20',sum(bool(p['career']) and p['career']['fallback'] for p in players))
print('Unavailable',[p['name'] for p in players if not p['career']])
