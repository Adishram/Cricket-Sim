import {battingRole} from './batting-order';
import type {Match,Cricketer,Tactics} from './index';
import {bowlingKind} from './matchup';
import {DEFAULT_BOWLING,type BowlingPlan} from './planning';
import {activeBowler,step} from './index';
import {random,seedFrom} from '../../shared/src/random';
export const CAPTAIN_STYLES=['Aggressive','Conservative','Analytical','Flexible'] as const;
export function captainStyle(id:string){return CAPTAIN_STYLES[[...id].reduce((n,s)=>n+s.charCodeAt(0),0)%4];}
/** Uses public current conditions and its own XI, never an opponent's future commands. */
export function botTactics(m:Match,team:number):Tactics{const i=m.innings.at(-1)!,side=m.teams[team],t=m.tactics[team],personality=captainStyle(side.id),required=i.target?(i.target-i.score)/Math.max(1,i.maxBalls-i.balls)*6:8;const raw=i.wickets>=7?1:i.balls>=90||required>10?3:2;const aggression=Math.max(0,Math.min(4,raw+(personality==='Aggressive'?1:personality==='Conservative'?-1:0))) as Tactics['aggression'];const tactics:Tactics={...t,aggression:team===i.team?aggression:2,intent:i.wickets<5?'attack':'defend',field:i.balls>=90?'defensive':i.wickets>=6?'attacking':'balanced'};
 // Preserve the captain decisions used by existing saves and their replays.
 if(!m.initial.trialCaptain){const plans=Object.fromEntries(side.xi.filter(p=>/bowl|all/i.test(p.role)).map(p=>{const spin=bowlingKind(p.style)==='spin',death=i.balls>=90,early=i.balls<36;return [p.id,{...DEFAULT_BOWLING,line:spin?'stumps' as const:death?'wide' as const:'off' as const,length:spin&&personality==='Aggressive'?'full' as const:death&&p.control>=65&&!spin?'wide-yorker' as const:'good' as const,pace:death&&!spin?'effort' as const:'stock' as const,variation:spin?(personality==='Conservative'?'slider' as const:'flight' as const):early?'outswing' as const:death?'cutter' as const:'wobble-seam' as const}];}));return {...t,aggression:team===i.team?aggression:2,intent:i.wickets<5?'attack':'defend',field:i.balls>=90?'defensive':i.wickets>=6?'attacking':'balanced',bowlingPlans:plans};}
 if(team===i.team)return tactics;
 const bowler=activeBowler(m);if(!bowler)return tactics;
 const spin=bowlingKind(bowler.style)==='spin';
 const plans:BowlingPlan[]=spin?[
  {...DEFAULT_BOWLING,line:'stumps',variation:'slider'},
  {...DEFAULT_BOWLING,length:'full',variation:'flight'},
  {...DEFAULT_BOWLING,variation:'topspinner'},
 ]:[
  {...DEFAULT_BOWLING,variation:'outswing'},
  {...DEFAULT_BOWLING,variation:'wobble-seam'},
  {...DEFAULT_BOWLING,pace:'slower',variation:'cutter'},
  {...DEFAULT_BOWLING,line:'wide',length:'wide-yorker',pace:'effort'},
 ];
 // Common trial seeds make comparisons fair. None consume the live delivery RNG.
 const seed=seedFrom([m.initialSeed,team,m.innings.length,i.balls,i.score,i.wickets,bowler.id].join(':'));
 const ranked=plans.map(plan=>{
  const candidate={...tactics,bowlingPlans:{...tactics.bowlingPlans,[bowler.id]:plan}};
  let cost=0;
  for(let trial=0;trial<6;trial++){
   // step writes innings and events. Stop before the innings break or another over;
   // disable bot callbacks so a trial can never recursively plan or make substitutions.
   const probe:Match={...m,seed:seedFrom(seed+':'+trial),innings:structuredClone(m.innings),events:[],commands:[],botTeams:[],tactics:[...m.tactics]};
   probe.tactics[team]=candidate;
   const inn=probe.innings.at(-1)!;
   for(let ball=0;ball<3&&!inn.complete;ball++)step(probe);
   cost+=inn.score-i.score-(inn.wickets-i.wickets)*(i.balls>=90?4:7);
   if(i.target!=null&&inn.score>=i.target)cost+=12;
  }
  return {candidate,cost};
 }).sort((a,b)=>a.cost-b.cost);
 return ranked[random({seed})<.18?1:0].candidate;
}
export function botBatterOrder(pool:Cricketer[],balls:number,wickets:number){return [...pool].sort((a,b)=>{const score=(p:Cricketer)=>(battingRole(p)===(balls<36?'opener':balls>=90?'finisher':'middle')?35:0)+p.batting+(balls>=90&&/all/i.test(p.role)?5:0)-(wickets<4&&/bowl/i.test(p.role)&&!/all/i.test(p.role)?8:0);return score(b)-score(a)||a.id.localeCompare(b.id);});}
