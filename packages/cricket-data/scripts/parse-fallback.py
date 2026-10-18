"""Extract recent completed non-IPL T20 season totals from cached profile tables.
Only reported runs, strike rate and wickets are used. No rates inferred from
provider overs strings (some upstream season totals are inconsistent).
"""
from pathlib import Path
from html.parser import HTMLParser
from datetime import datetime
import json,re
raw=Path(__file__).resolve().parents[1]/'raw'
class Tables(HTMLParser):
 def __init__(self):super().__init__();self.tables=[];self.table=None;self.row=None;self.cell=None;self.heading=False;self.h1=''
 def handle_starttag(self,t,a):
  if t=='h1':self.heading=True
  if t=='table':self.table=[]
  if t=='tr' and self.table is not None:self.row=[]
  if t in ('td','th') and self.row is not None:self.cell=''
 def handle_data(self,d):
  if self.heading:self.h1+=d
  if self.cell is not None:self.cell+=d
 def handle_endtag(self,t):
  if t=='h1':self.heading=False
  if t in ('td','th') and self.cell is not None:self.row.append(' '.join(self.cell.split()));self.cell=None
  if t=='tr' and self.row is not None:self.table.append(self.row);self.row=None
  if t=='table' and self.table is not None:self.tables.append(self.table);self.table=None
players={p['name']:p for t in json.loads((raw/'squads.json').read_text())['teams'] for p in t['players']}
result={}
for name,slug,_ in json.loads((raw/'fallback-fetch.json').read_text()):
 p=players[name]
 if name=='Aman Rao':continue # Provider associates this name with an unrelated county player.
 path=raw/'profiles'/(p['id']+'.html')
 if not path.exists():continue
 parsed=Tables();parsed.feed(path.read_text());series={}
 # Require a real profile heading, not a soft-404 page.
 norm=lambda n:re.sub('[^a-z]','',n.lower())
 if norm(parsed.h1) not in {norm(name),norm(slug), 'msdhoni' if name=='Mahendra Singh Dhoni' else norm(name)}:continue
 for table in parsed.tables:
  if not table or table[0][:3]!=['Series','Format','Date']:continue
  header=table[0]
  for row in table[1:]:
   if len(row)!=len(header):continue
   d=dict(zip(header,row))
   if d['Format']!='T20' or any(x in d['Series'] for x in ['Indian Premier','IPL','Warm up','tour of']):continue
   try:end=datetime.strptime(d['Date'].split(' - ')[-1],'%b %d, %Y')
   except ValueError:continue
   if not datetime(2025,1,1)<=end<=datetime(2026,10,18):continue
   f=series.setdefault(d['Series'],{'end':end,'runs':None,'strikeRate':None,'wickets':None})
   try:
    if 'Runs' in d:f.update(runs=int(d['Runs']),strikeRate=float(d['SR']))
    if 'W' in d:f['wickets']=int(d['W'])
   except ValueError:pass
 series={k:v for k,v in series.items() if any(v[x] is not None for x in ['runs','strikeRate','wickets'])}
 if not series:continue
 competition,f=max(series.items(),key=lambda pair:pair[1]['end'])
 result[p['id']]={'competition':competition,'source':'https://www.ipl.com/player/'+slug,'provider':'IPL.com (independent statistics site)','runs':f['runs'],'strikeRate':f['strikeRate'],'wickets':f['wickets'],'economy':None,'battingInnings':None,'bowlingInnings':None,'recent':[],'recentKind':'innings','fallback':True}
 print(name,'|',competition,'|',f['runs'],f['strikeRate'],f['wickets'])
(raw/'fallback.json').write_text(json.dumps(result,indent=2)+'\n')
print('Fallback count',len(result))
