import type {Player} from '../../cricket-data/src/players';
import {phaseRatings} from '../../cricket-data/src/profiles';
import {bowlingKind} from '../../cricket-engine/src/matchup';
import {roleGroup} from '../../cricket-engine/src/selection';

// Eleven distinct jobs: four batting positions, a keeper, two all-rounders and
// a four-bowler attack. All-rounders can also compete for specialist bowling jobs.
const jobs=['keeper','allround','allround','opener','opener','middle','finisher','new-ball','death','spin','attack'] as const;
type Job=typeof jobs[number];
const skillCache=new WeakMap<Player,number[]>();
function jobSkills(p:Player){
 const cached=skillCache.get(p);if(cached)return cached;
 const role=roleGroup(p),style=bowlingKind(p.bowl),bat=p.rating.batting,bowl=p.rating.bowling;
 const phases=phaseRatings(p.id,bat,bowl);
 const score=(job:Job)=>{
  switch(job){
   case 'keeper':return role==='WK'?bat*.85+p.rating.keeping*.15:0;
   case 'allround':return role==='AR'?.6*Math.min(bat,bowl)+.4*Math.max(bat,bowl):0;
   case 'opener':return role==='BAT'?phases.powerplay.batting:0;
   case 'middle':return role==='BAT'?phases.middle.batting:0;
   // The flexible batting place can go to a keeper-batter or batting all-rounder.
   case 'finisher':return role!=='BOWL'?phases.death.batting:0;
   default:if(role!=='BOWL'&&role!=='AR')return 0;
    if(job==='spin')return style==='spin'?phases.middle.bowling:0;
    if(job==='new-ball'||job==='death')return style==='pace'?phases[job==='death'?'death':'powerplay'].bowling:0;
    return bowl;
  }
 };
 const result=jobs.map(score);skillCache.set(p,result);return result;
}

type Edge={to:number;capacity:number;gain:number;reverse:number};
// Maximum-value assignment: a player fills at most one XI job, and at most
// four overseas players start. Residual edges let a new signing reshuffle the XI.
function xiValue(pool:Player[]){
 const playersAt=3,jobsAt=playersAt+pool.length,sink=jobsAt+jobs.length;
 const graph:Edge[][]=Array.from({length:sink+1},()=>[]);
 function edge(a:number,b:number,capacity:number,gain:number){
  graph[a].push({to:b,capacity,gain,reverse:graph[b].length});
  graph[b].push({to:a,capacity:0,gain:-gain,reverse:graph[a].length-1});
 }
 edge(0,1,11,0);edge(0,2,4,0);
 pool.forEach((p,n)=>{
  edge(p.overseas?2:1,playersAt+n,1,0);
  jobSkills(p).forEach((v,j)=>{if(v)edge(playersAt+n,jobsAt+j,1,Math.round(40+Math.max(0,v-45)**2/25));});
 });
 jobs.forEach((_,j)=>edge(jobsAt+j,sink,1,0));
 let total=0;
 for(let slot=0;slot<jobs.length;slot++){
  const best=Array(graph.length).fill(-Infinity),prev=Array(graph.length).fill(-1),via=Array(graph.length).fill(-1);
  best[0]=0;const queue=[0],queued=new Set(queue);
  for(let head=0;head<queue.length;head++){
   const a=queue[head];queued.delete(a);
   graph[a].forEach((e,k)=>{if(!e.capacity||best[a]+e.gain<=best[e.to])return;
    best[e.to]=best[a]+e.gain;prev[e.to]=a;via[e.to]=k;
    if(!queued.has(e.to)){queued.add(e.to);queue.push(e.to);}
   });
  }
  if(best[sink]<=0)break;
  total+=best[sink];
  for(let b=sink;b!==0;b=prev[b]){const e=graph[prev[b]][via[b]];e.capacity--;graph[b][e.reverse].capacity++;}
 }
 return total;
}

function depthGroup(p:Player){const role=roleGroup(p);return role==='BOWL'?bowlingKind(p.bowl):role;}
const depthTargets:Record<string,number>={WK:2,AR:4,BAT:7,pace:6,spin:4,unknown:1};
export function rosterValue(pool:Player[]){return xiValue(pool);}
export function signingValue(pool:Player[],p:Player,before:number){
 const starterGain=Math.max(0,xiValue([...pool,p])-before);
 const group=depthGroup(p),depth=pool.filter(x=>depthGroup(x)===group).length,target=depthTargets[group];
 // Bench cover pays most for the first useful reserve. Already-stocked positions
 // receive a small depth bid rather than another starter's premium.
 const cover=Math.max(0,(target-depth)/target);
 const bestSkill=Math.max(...jobSkills(p));
 return 7*starterGain+cover*(85+Math.max(0,bestSkill-50)*4)+20;
}
