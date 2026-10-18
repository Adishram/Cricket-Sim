"""Import official 15 Nov 2024 PDF layout text plus sourced final-list additions."""
from pathlib import Path
import re,json,hashlib
root=Path(__file__).resolve().parents[1]
source='https://documents.iplt20.com/bcci/documents/1731674068078_TATA%20IPL%202025-%20Auction%20List%20-15.11.24.pdf'
final='https://documents.iplt20.com/bcci/documents/1732248356511_TATA%20IPL%202025-%20Auction%20List%20with%20RTM%20-19.11.24.pdf'
rows=[]
for line in Path('/tmp/mega2025.txt').read_text().splitlines():
 if not re.match(r'^\s+\d+\s+\d+\s+[A-Z]+\d+',line):continue
 parts=re.split(r'\s{2,}',line.strip());serial,setno,code=parts[:3];countryidx=next(i for i,x in enumerate(parts) if x in ['India','England','South Africa','Australia','New Zealand','West Indies','Sri Lanka','Bangladesh','Afghanistan','Ireland','Zimbabwe','USA','Scotland','Canada','Netherlands','UAE'])
 name=' '.join(parts[3:countryidx]);country=parts[countryidx]
 role=next(x for x in parts if x in ['BATTER','BOWLER','ALL-ROUNDER','WICKETKEEPER']);ri=parts.index(role)
 bat=next((x for x in parts[ri+1:] if x in ['RHB','LHB']),None)
 bowl=next((x for x in parts[ri+1:] if x.startswith(('RIGHT ARM','LEFT ARM'))),None)
 rows.append({'serial':int(serial),'setNumber':int(setno),'setCode':code,'name':name,'country':country,'role':role,'bat':bat,'bowl':bowl,'base':int(parts[-1]),'source':source,'order':int(serial)})
assert len(rows)==574
rows.extend([
 {'serial':575,'setNumber':6,'setCode':'FA1','name':'Jofra Archer','country':'England','role':'BOWLER','bat':'RHB','bowl':'RIGHT ARM Fast','base':200,'source':final,'order':33.5},
 {'serial':576,'setNumber':79,'setCode':'UAL15','name':'Saurabh Netravalkar','country':'USA','role':'BOWLER','bat':None,'bowl':'LEFT ARM Fast Medium','base':30,'source':final,'order':576},
 {'serial':577,'setNumber':54,'setCode':'UWK6','name':'Hardik Tamore','country':'India','role':'WICKETKEEPER','bat':'RHB','bowl':'RIGHT ARM Off Spin','base':30,'source':final,'order':577}])
rows.sort(key=lambda p:(p['setNumber'],p['order']))
(root/'sources'/'mega-auction-2025.json').write_text(json.dumps({'season':2025,'source':source,'finalSource':final,'initialPDFSHA256':hashlib.sha256(Path('/tmp/mega-auction-2025.pdf').read_bytes()).hexdigest(),'players':rows},indent=2)+'\n')
print(len(rows),'players',len({r['setCode'] for r in rows}),'sets');print(rows[:2])
