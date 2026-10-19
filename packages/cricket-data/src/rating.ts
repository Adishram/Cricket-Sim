import {rankingInfluence,type IccRanking} from './icc';
/** Versioned gameplay estimates from available full-career IPL and T20I evidence. */
export type SeasonForm={matches:number;batting:{innings:number;runs:number;balls:number;dismissals:number;oppositionBalls?:number;expectedRuns?:number;expectedDismissals?:number};bowling:{innings:number;balls:number;runs:number;wickets:number;oppositionBalls?:number;expectedRuns?:number;expectedWickets?:number}};
export type Evidence={season:number;competition:'IPL'|'T20I'|'domestic';competitionId?:string;source:string;complete:boolean;form:SeasonForm};
export type Contribution={season:number;competition:string;weight:number;factor:number;battingBalls:number;bowlingBalls:number};
export type Rating={value:number;form:number|null;basis:'ipl'|'t20'|'none';note:string;version:string;cutoff:string;seasons:number[];missingSeasons:number[];confidence:number;capped:'capped'|'uncapped'|'unknown';ceilingApplied:boolean;batting:number;bowling:number;keeping:number;fielding:number;attributes:Record<string,{value:number;estimated:boolean}>;sources:string[];contributions:Contribution[];sampleCounts:{batting:number;bowling:number};weights:number[];explanation:{batting:DisciplineRating;bowling:DisciplineRating};icc:ReturnType<typeof rankingInfluence>};
export const RATING_VERSION='career-context-icc-v5';
const clamp=(v:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,v));
export type DisciplineRating={value:number;score:number;performance:number;proven:number;transferPenalty:number;iplBalls:number;internationalBalls:number;contextAdjusted:boolean};
/** Same model for every identity. Use context expectations, not nominal economy comparisons. */
function discipline(rows:Evidence[],kind:'batting'|'bowling',fallback:number):DisciplineRating{
 const summaries=(['IPL','T20I'] as const).map(competition=>{
  const group=rows.filter(e=>e.competition===competition);let runs=0,balls=0,outs=0,strength=0,expectedRuns=0,expectedOuts=0,goodSeasons=0,contextAdjusted=true;
  for(const e of group){const f=e.form[kind],isBat=kind==='batting',n=isBat?e.form.batting.dismissals:e.form.bowling.wickets,er=f.expectedRuns??f.balls*(isBat?1.3:8/6),eo=isBat?(e.form.batting.expectedDismissals??f.balls/22):(e.form.bowling.expectedWickets??f.balls/24);
   runs+=f.runs;balls+=f.balls;outs+=n;strength+=f.oppositionBalls??f.balls;expectedRuns+=er;expectedOuts+=eo;contextAdjusted&&=f.expectedRuns!=null;
   // A meaningful season must beat its scoring/wicket benchmark, not merely contain appearances.
   if(f.balls>=(isBat?180:180)){const index=isBat?(.4*Math.log((f.runs+1)/(er+1))+.6*Math.log(((f.runs+1)/(n+2))/((er+1)/(eo+2)))):(.6*Math.log((er+1)/(f.runs+1))+.4*Math.log((n+2)/(eo+2)));if(index>.04)goodSeasons++;}
  }
  if(!balls)return {competition,balls,quality:fallback,goodSeasons:0,contextAdjusted:false};
  const prior=kind==='batting'?900:900,runBaseline=expectedRuns/balls,outBaseline=expectedOuts/balls;
  const smoothedRuns=runs+prior*runBaseline,smoothedOuts=outs+prior*outBaseline,srRatio=(smoothedRuns/(balls+prior))/Math.max(.1,runBaseline),outRatio=(smoothedOuts/(balls+prior))/Math.max(.001,outBaseline);
  // Average is SR divided by dismissal rate; avoid triple-counting correlated bowling metrics.
  const impact=kind==='batting'?.4*Math.log(srRatio)+.6*Math.log(srRatio/outRatio):-.6*Math.log(srRatio)+.4*Math.log(outRatio);
  const quality=clamp(76+(kind==='batting'?48:80)*impact-(1-strength/balls)*22,35,99);
  return {competition,balls,quality,goodSeasons,contextAdjusted};
 });
 const [ipl,int]=summaries;if(!ipl.balls&&!int.balls)return {value:fallback,score:fallback,performance:fallback,proven:0,transferPenalty:0,iplBalls:0,internationalBalls:0,contextAdjusted:false};
 // Competition weights are fixed only after sufficient evidence: a token IPL appearance cannot dominate.
 const iw=.75*ipl.balls/(ipl.balls+600),tw=.25*int.balls/(int.balls+900),performance=(iw*ipl.quality+tw*int.quality)/(iw+tw);
 const successful=Math.max(0,Math.min(1,(performance-74)/8));
 const proven=successful*(6*Math.min(1,ipl.balls/(kind==='batting'?3000:1800)+int.balls/(kind==='batting'?6000:3600))+Math.min(3,(ipl.goodSeasons+int.goodSeasons*.5)*.5));
 const transferPenalty=4*(1-ipl.balls/(ipl.balls+600));
 return {value:Math.round(clamp(performance+proven-transferPenalty,35,99)),score:clamp(performance+proven-transferPenalty,35,99),performance:Math.round(performance*10)/10,proven:Math.round(proven*10)/10,transferPenalty:Math.round(transferPenalty*10)/10,iplBalls:ipl.balls,internationalBalls:int.balls,contextAdjusted:summaries.filter(x=>x.balls).every(x=>x.contextAdjusted)};
}
export function computeRating(role:string,evidence:Evidence[],capped:Rating['capped']='unknown',cutoff='2026-10-18',rankings:IccRanking[]=[]):Rating{
 const icc=rankingInfluence(rankings,cutoff);
 if(capped==='unknown'&&icc.entries.length)capped='capped';
 const seen=new Set<string>();const rows=evidence.filter(e=>{const key=`${e.season}:${e.competition}`;if(!e.complete||!['IPL','T20I'].includes(e.competition)||e.season>Number(cutoff.slice(0,4))||seen.has(key))return false;seen.add(key);return true;});
 const sampleCounts={batting:rows.reduce((n,e)=>n+e.form.batting.balls,0),bowling:rows.reduce((n,e)=>n+e.form.bowling.balls,0)};
 const contributions:Contribution[]=rows.map(e=>({season:e.season,competition:e.competition,weight:e.competition==='IPL'?.75:.25,factor:(e.form.batting.oppositionBalls??e.form.batting.balls)+(e.form.bowling.oppositionBalls??e.form.bowling.balls)>0?((e.form.batting.oppositionBalls??e.form.batting.balls)+(e.form.bowling.oppositionBalls??e.form.bowling.balls))/Math.max(1,e.form.batting.balls+e.form.bowling.balls):1,battingBalls:e.form.batting.balls,bowlingBalls:e.form.bowling.balls}));
 const explanation={batting:discipline(rows,'batting',/bowl/i.test(role)&&!/all/i.test(role)?43:60),bowling:discipline(rows,'bowling',/bowl|all/i.test(role)?60:38)};
 for(const kind of ['batting','bowling'] as const){explanation[kind].score=clamp(explanation[kind].score+icc[kind],35,99);explanation[kind].value=Math.round(explanation[kind].score);}
 const ceiling=capped==='capped'?99:90,batting=Math.min(ceiling,explanation.batting.value),bowling=Math.min(ceiling,explanation.bowling.value);
 // All-rounders retain their leading discipline with a smaller secondary-skill contribution.
 const skill=/all/i.test(role)?Math.max(batting,bowling)*.75+Math.min(batting,bowling)*.25:/bowl/i.test(role)?bowling:batting;
 const raw=Math.round(clamp(skill+(/all/i.test(role)?icc.allrounder:0),35,99)),value=Math.min(raw,capped==='capped'?99:90),seasons=[...new Set(rows.map(e=>e.season))].sort((a,b)=>b-a);
 const relevant=/all/i.test(role)?Math.min(sampleCounts.batting,sampleCounts.bowling):/bowl/i.test(role)?sampleCounts.bowling:sampleCounts.batting;
 const confidence=Math.round(Math.min(.98,relevant/(relevant+600))*100),attributes:Rating['attributes']={};
 for(const name of ['Powerplay batting','Pace handling','Spin handling','Boundary hitting','Strike rotation','Wicket preservation','Middle-over acceleration','Death hitting','Chasing'])attributes[name]={value:batting,estimated:true};
 for(const name of ['New-ball effectiveness','Swing','Seam','Pace','Spin effectiveness','Control','Wicket-taking','Economy','Powerplay bowling','Middle-over bowling','Death bowling'])attributes[name]={value:bowling,estimated:true};
 for(const name of ['Catching','Ground fielding','Throwing','Keeping catching','Stumping','Keeping reliability'])attributes[name]={value:60,estimated:true};
 return {value,form:rows.length?value:null,basis:rows.some(e=>e.competition==='IPL')?'ipl':rows.length?'t20':'none',version:RATING_VERSION,cutoff,seasons,missingSeasons:[],confidence,capped,ceilingApplied:value<raw||capped!=='capped'&&(/all/i.test(role)?Math.max(explanation.batting.value,explanation.bowling.value)>90:/bowl/i.test(role)?explanation.bowling.value>90:explanation.batting.value>90),batting,bowling,keeping:60,fielding:60,attributes,contributions,sampleCounts,weights:[.75,.25],explanation,icc,sources:[...new Set([...rows.map(e=>e.source),...icc.entries.map(e=>e.source)])],note:rows.length?`Available full-career IPL/T20I estimate (${Math.min(...seasons)}–${Math.max(...seasons)}). Context-adjusted scoring, average and wicket-taking; 900-ball priors. Reliability-adjusted 75/25 IPL/T20I blend; limited IPL evidence receives a transfer uncertainty deduction. Sustained above-benchmark performance adds at most nine points. BBL/PSL excluded.`:'Provisional role baseline; no verified IPL or T20I career evidence. BBL/PSL and other domestic records are excluded.'};
}
