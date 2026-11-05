/** Offline rating audit. Executes the actual TypeScript model, never duplicates its formula. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),src=path.join(root,'src'),read=name=>JSON.parse(fs.readFileSync(path.join(src,name),'utf8'));
const iccScope={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(src,'icc.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,iccScope);
const scope={exports:{},require:name=>{if(name==='./icc')return iccScope.exports;throw Error('Unexpected dependency '+name);}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(src,'rating.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,scope);
const data=read('recent-evidence.json'),capped=new Set(data.verifiedT20ICapped),players=[...read('snapshot.json').players,...read('auction-register.json').extra];
const rankings=read('icc-rankings.json').players;
const retired=new Set(['auction-20','auction-72','auction-77','auction-202','auction-433','player-12685']);
const rated=players.filter(p=>!retired.has(p.id)).map(p=>({...p,rating:scope.exports.computeRating(p.role,data.players[p.id]??[],capped.has(p.id)?'capped':'unknown',data.cutoff,rankings[p.id]??[])}));
const score=(p,skill)=>Math.min(p.rating.capped==='capped'?99:90,p.rating.explanation[skill].score);
const row=(p,skill)=>({id:p.id,name:p.name,role:p.role,rating:p.rating[skill],confidence:p.rating.confidence,iccAdjustment:p.rating.icc[skill],iccRankings:p.rating.icc.entries,...p.rating.explanation[skill]});
const top=skill=>rated.filter(p=>skill==='batting'?!/bowl/i.test(p.role)||/all/i.test(p.role):/bowl|all/i.test(p.role)).sort((a,b)=>score(b,skill)-score(a,skill)||a.id.localeCompare(b.id)).slice(0,20).map(p=>row(p,skill));
const audit={model:scope.exports.RATING_VERSION,cutoff:data.cutoff,total:players.length,withEvidence:rated.filter(p=>p.rating.basis!=='none').length,notes:['Game estimates, not official rankings.','Same coefficients for every player; no name overrides.','All covered career seasons. BBL/PSL excluded.','Ties ordered by unrounded discipline score, then stable identity.','Existing match snapshots remain frozen for deterministic replay.'],batting:top('batting'),bowling:top('bowling')};
if(process.argv.includes('--write'))fs.writeFileSync(path.join(root,'sources/rating-audit.json'),JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify(audit,null,2));
