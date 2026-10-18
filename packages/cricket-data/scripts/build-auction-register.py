import json,re,unicodedata
from pathlib import Path
r=Path(__file__).resolve().parents[1];snap=json.loads((r/'src/snapshot.json').read_text());reg=json.loads((r/'sources/mega-auction-2025.json').read_text());careers=json.loads((r/'sources/mega-careers.json').read_text());forms=json.loads((r/'src/form-2026.json').read_text())['players']
def norm(s):return re.sub('[^a-z]','',s.lower())
lookup={norm(p['name']):p for p in snap['players']}
for pid,c in json.loads((r/'sources/career-map.json').read_text()).items():
 p=next((x for x in snap['players'] if x['id']==pid),None)
 if p:lookup[norm(c['player']['name'])]=p
aliases={'Mohammad Siraj':'Mohammed Siraj','Mohammad Shami':'Mohammed Shami','N. Tilak Varma':'Tilak Varma','Mitchell Owen':'Mitch Owen','Vaibhav Suryavanshi':'Vaibhav Sooryavanshi','Smaran Ravichandran':'Ravichandran Smaran','R. Sai Kishore':'Sai Kishore','B. Sai Sudharsan':'Sai Sudharsan','T Natarajan':'Thangarasu Natarajan','Yudhvir Charak':'Yudhvir Singh Charak'}
# Preserve previously audited eligibility if the original PDF text is not cached.
existing=json.loads((r/'src/auction-register.json').read_text()) if (r/'src/auction-register.json').exists() else {'meta':{}}
statuses={}
if Path('/tmp/mega2025.txt').exists():
 for line in Path('/tmp/mega2025.txt').read_text().splitlines():
  m=re.match(r'^\s+(\d+)\s+\d+\s+[A-Z]+\d+',line)
  if m:statuses[int(m[1])]='uncapped' if 'Uncapped' in line else 'capped' if 'Capped' in line else 'unknown'
order=[];extra=[];meta={}
for p in reg['players']:
 hit=None if p['serial']==341 else lookup.get(norm(aliases.get(p['name'],p['name'])));pid=hit['id'] if hit else 'auction-'+str(p['serial']);order.append(pid)
 meta[pid]={'year':2025,'setNumber':p['setNumber'],'setCode':p['setCode'],'base':p['base'],'source':p['source'],'eligibility':statuses.get(p['serial'],existing['meta'].get(pid,{}).get('eligibility','unknown'))}
 if not hit:extra.append({'id':pid,'name':p['name'],'country':p['country'],'role':{'BATTER':'Batter','BOWLER':'Bowler','ALL-ROUNDER':'All-rounder','WICKETKEEPER':'Wicketkeeper'}[p['role']],'bat':p['bat'] or 'Unknown batting style','bowl':p['bowl'] or 'Unknown bowling style','base':p['base'],'overseas':p['country']!='India','initials':''.join(x[0] for x in p['name'].split())[:2],'color':'#fbbf24','seasonTeam':'2025 auction register','squadSource':p['source'],'career':None if p['serial']==341 else careers.get(str(p['serial']))})
assert len(order)==len(set(order))==577
(r/'src/auction-register.json').write_text(json.dumps({'year':2025,'source':reg['source'],'order':order,'meta':meta,'extra':extra},separators=(',',':')))
