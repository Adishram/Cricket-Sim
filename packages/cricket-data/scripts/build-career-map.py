from pathlib import Path
import json,re,unicodedata
root=Path(__file__).resolve().parents[1];raw=root/'raw'
d=json.loads((raw/'career-comparison.json').read_text());rows={x['playerId']:x for k in ['battingCareer','bowlingCareer'] for x in d[k]}
# Explicitly reviewed name variants, not fuzzy matches.
aliases={'Khaleel Ahmed':'Syed Khaleel Ahmed','Mahendra Singh Dhoni':'MS Dhoni','Mitch Marsh':'Mitchell Marsh','Mitch Santner':'Mitchell Santner','Matt Short':'Matthew William Short','Arshad Khan':'Mohd. Arshad Khan','Raj Bawa':'Raj Angad Bawa','Mohammed Siraj':'Mohammad Siraj','Praveen Dubey':'Pravin Dubey','Gurnoor Brar':'Gurnoor Singh Brar','AM Ghazanfar':'Allah Ghazanfar','Mohammed Shami':'Mohammad Shami','Digvesh Singh Rathi':'Digvesh Singh','Lungi Ngidi':'Lungisani Ngidi','Thangarasu Natarajan':'T. Natarajan','Vijaykumar Vyshak':'Vyshak Vijaykumar','Manimaran Siddharth':'M. Siddharth','Yash Punja':'Yash Raj Punja','Yudhvir Singh Charak':'Yudhvir Charak','Shahbaz Ahmed':'Shahbaz Ahamad'}
def norm(s):return re.sub('[^a-z]','',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower())
result={}
for t in json.loads((raw/'squads.json').read_text())['teams']:
 for p in t['players']:
  hits=[x for x in rows.values() if norm(aliases.get(p['name'],p['name']))==norm(x['player']['name'])]
  if len(hits)==1:result[p['id']]=hits[0]
(root/'sources'/'career-map.json').write_text(json.dumps(result,indent=2)+'\n');print('Matched IPL careers',len(result))
