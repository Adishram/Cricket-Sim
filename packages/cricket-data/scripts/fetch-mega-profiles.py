from pathlib import Path
import json,re,subprocess,concurrent.futures
root=Path(__file__).resolve().parents[1];raw=root/'raw';out=raw/'mega-profiles';out.mkdir(exist_ok=True)
players=json.loads((root/'sources'/'mega-auction-2025.json').read_text())['players'];known=json.loads((root/'sources'/'mega-careers.json').read_text())
aliases={'ravichandaran-ashwin':'ravichandran-ashwin','mayank-agarawal':'mayank-agarwal','k-s-bharat':'ks-bharat','b-r-sharath':'br-sharath','jeffery-vandersay':'jeffrey-vandersay','kumar-kartikeya-singh':'kumar-kartikeya','naveen-ul-haq':'naveen-ul-haq','prithvi-shaw':'prithvi-shaw'}
def fetch(p):
 slug=aliases.get(re.sub('[^a-z0-9]+','-',p['name'].lower()).strip('-'),re.sub('[^a-z0-9]+','-',p['name'].lower()).strip('-'));path=out/(str(p['serial'])+'.html')
 try:
  if not path.exists():subprocess.run(['curl','-fsSL','--max-time','20','-o',str(path),'https://www.ipl.com/player/'+slug],check=True,capture_output=True)
  return [p['serial'],p['name'],slug,path.stat().st_size]
 except Exception:return [p['serial'],p['name'],slug,0]
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:
 result=[]
 for i,r in enumerate(ex.map(fetch,[p for p in players if str(p['serial']) not in known])):
  result.append(r)
  if i%50==0:print('Fetched',i+1,flush=True)
(raw/'mega-profile-fetch.json').write_text(json.dumps(result,indent=2)+'\n')
print('Finished',len(result))
