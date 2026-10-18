/** Pure, versioned estimates. Career totals are deliberately never used. */
export type SeasonForm={matches:number;batting:{innings:number;runs:number;balls:number;dismissals:number};bowling:{innings:number;balls:number;runs:number;wickets:number}};
export type Evidence={season:number;competition:'IPL'|'T20I'|'domestic';source:string;complete:boolean;form:SeasonForm};
export type Rating={value:number;form:number|null;basis:'ipl'|'t20'|'none';note:string;version:string;cutoff:string;seasons:number[];missingSeasons:number[];confidence:number;capped:'capped'|'uncapped'|'unknown';ceilingApplied:boolean;batting:number;bowling:number;keeping:number;fielding:number;attributes:Record<string,{value:number;estimated:boolean}>;sources:string[]};
export const RATING_VERSION='recent-3y-v1';
export const RECENCY_WEIGHTS=[.5,.3,.2] as const;
const clamp=(v:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,v));
export function computeRating(role:string,evidence:Evidence[],capped:Rating['capped']='unknown',cutoff='2026-10-18'):Rating{
 const endYear=Number(cutoff.slice(0,4));const years=[endYear,endYear-1,endYear-2],rows=evidence.filter(e=>e.complete&&years.includes(e.season));
 // Constants are gameplay assumptions, not measured league-strength coefficients.
 const factors={IPL:1,T20I:1,domestic:.78};let bat=0,bowl=0,bw=0,ww=0,sample=0;
 const used=new Set<string>();
 for(const e of rows){const key=`${e.season}:${e.competition}`;if(used.has(key))continue;used.add(key);const weight=RECENCY_WEIGHTS[years.indexOf(e.season)],f=e.form,b=f.batting,w=f.bowling,k=factors[e.competition];
 if(b.balls>0){const reliability=b.balls/(b.balls+180),sr=b.runs/b.balls*100,avg=b.dismissals?b.runs/b.dismissals:35;const quality=clamp(65+(sr-130)*.32+(avg-25)*.35,35,99);bat+=weight*(60+(quality-60)*reliability*k);bw+=weight;sample+=b.balls;}
 if(w.balls>0){const reliability=w.balls/(w.balls+180),econ=w.runs/w.balls*6,wicketRate=w.wickets/w.balls;const quality=clamp(65+(8.5-econ)*5+(wicketRate-.04)*300,35,99);bowl+=weight*(60+(quality-60)*reliability*k);ww+=weight;sample+=w.balls;}}
 const batting=bw?Math.round(bat/bw):/bowl/i.test(role)&&!/all/i.test(role)?43:60,bowling=ww?Math.round(bowl/ww):/bowl|all/i.test(role)?60:38;
 const skill=/all/i.test(role)?batting*.5+bowling*.5:/bowl/i.test(role)?bowling:batting;
 const raw=Math.round(clamp(skill,35,99));const value=Math.min(raw,capped==='capped'?99:90);
 const seasons=years.filter(y=>rows.some(e=>e.season===y)),missingSeasons=years.filter(y=>!seasons.includes(y));
 const confidence=Math.round(Math.min(.95,sample/(sample+500))*(seasons.length/3)*100);
 const attributes:Rating['attributes']={};
 for(const name of ['Powerplay batting','Pace handling','Spin handling','Boundary hitting','Strike rotation','Wicket preservation','Middle-over acceleration','Death hitting','Chasing'])attributes[name]={value:batting,estimated:true};
 for(const name of ['New-ball effectiveness','Swing','Seam','Pace','Spin effectiveness','Control','Wicket-taking','Economy','Powerplay bowling','Middle-over bowling','Death bowling'])attributes[name]={value:bowling,estimated:true};
 for(const name of ['Catching','Ground fielding','Throwing','Keeping catching','Stumping','Keeping reliability'])attributes[name]={value:60,estimated:true};
 return {value,form:rows.length?value:null,basis:rows.some(e=>e.competition==='IPL')?'ipl':rows.length?'t20':'none',version:RATING_VERSION,cutoff,seasons,missingSeasons,confidence,capped,ceilingApplied:value<raw,batting,bowling,keeping:60,fielding:60,attributes,sources:[...new Set(rows.map(e=>e.source))],note:rows.length?`Recent-performance estimate; ${seasons.join(', ')} covered. ${missingSeasons.length?`Missing ${missingSeasons.join(', ')}; low confidence.`:'50/30/20 season weights.'}`:'Provisional role baseline; no verified recent data. Career totals are not used.'};
}
