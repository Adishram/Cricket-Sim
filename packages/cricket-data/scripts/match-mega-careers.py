from pathlib import Path
import json,re,unicodedata
root=Path(__file__).resolve().parents[1];src=root/'sources'
def norm(s):return re.sub('[^a-z]','',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower())
current=json.loads((src/'current-player-careers.json').read_text())['players'];main=json.loads((src/'career-map.json').read_text());byid={p['id']:p for p in current};lookup={norm(p['name']):p for p in current}
for pid,r in main.items():lookup[norm(r['player']['name'])]=byid[pid]
aliases={'KL Rahul':'KL Rahul','Jake Fraser-Mcgurk':'Jake Fraser-McGurk','Mohd. Siraj':'Mohammed Siraj','Mohammad Siraj':'Mohammed Siraj','Mohammad Shami':'Mohammed Shami','N. Tilak Varma':'Tilak Varma','Rasikh Dar':'Rasikh Dar','Mitchell Owen':'Mitch Owen','Vaibhav Suryavanshi':'Vaibhav Sooryavanshi','Smaran Ravichandran':'Ravichandran Smaran','R. Sai Kishore':'Sai Kishore','B. Sai Sudharsan':'Sai Sudharsan','R. Ashwin':'Ravichandran Ashwin','T Natarajan':'Thangarasu Natarajan','Yudhvir Charak':'Yudhvir Singh Charak'}
result={};missing=[]
for p in json.loads((src/'mega-auction-2025.json').read_text())['players']:
 hit=lookup.get(norm(aliases.get(p['name'],p['name'])))
 if hit and hit['career']:result[str(p['serial'])]=hit['career']
 else:missing.append(p['name'])
(src/'mega-careers.json').write_text(json.dumps(result,indent=2)+'\n');print('matched',len(result),'missing',len(missing));print(missing[:80])
