import type {Side,Pitch,Cricketer} from './index';
import {bowlingKind} from './matchup';
export type Variation='stock'|'inswing'|'outswing'|'wobble-seam'|'cutter'|'bouncer'|'flight'|'slider'|'topspinner'|'arm-ball'|'wrong-un'|'carrom';
export const PACE_VARIATIONS:Variation[]=['stock','inswing','outswing','wobble-seam','cutter','bouncer'];
export const SPIN_VARIATIONS:Variation[]=['stock','flight','slider','topspinner','arm-ball','wrong-un','carrom'];
export const VARIATION_LABELS:Record<Variation,string>={stock:'Stock ball',inswing:'Inswing',outswing:'Outswing','wobble-seam':'Wobble seam',cutter:'Off cutter',bouncer:'Bouncer',flight:'Flight & dip',slider:'Slider',topspinner:'Topspinner','arm-ball':'Arm ball','wrong-un':'Wrong’un',carrom:'Carrom ball'};
export function variations(style:string){return bowlingKind(style)==='spin'?SPIN_VARIATIONS:PACE_VARIATIONS;}
export type BowlingPlan={line:'stumps'|'off'|'wide';length:'good'|'full'|'short'|'yorker'|'wide-yorker';pace:'stock'|'slower'|'effort';variation?:Variation};
export const DEFAULT_BOWLING:BowlingPlan={line:'off',length:'good',pace:'stock'};
export type BattingStyle='balanced'|'anchor'|'rotate'|'power'|'sweep';
export const BATTING_STYLES:Record<BattingStyle,string>={balanced:'Balanced',anchor:'Anchor',rotate:'Rotate strike',power:'Power hitter',sweep:'Sweep & manipulate'};
const canBowl=(p:Cricketer)=>/bowl|all/i.test(p.role);
export function rotationProblems(side:Side,plan:string[]){const errors:string[]=[];if(plan.length!==20)errors.push('Assign all 20 overs.');const count=new Map<string,number>();plan.forEach((id,n)=>{if(!side.xi.some(p=>p.id===id&&canBowl(p)))errors.push(`Over ${n+1}: choose a bowler in the XI.`);if(n&&plan[n-1]===id)errors.push(`Overs ${n} and ${n+1}: a bowler cannot bowl consecutive overs.`);count.set(id,(count.get(id)??0)+1);});for(const [id,n] of count)if(n>4)errors.push(`${side.xi.find(p=>p.id===id)?.name??id}: maximum four overs.`);return errors;}
const rotationCache=new Map<string,string[]>();
/** Search the entire innings, reserving phase specialists rather than spending their quotas early. */
export function autoRotation(side:Side,pitch:Pitch){
 const pool=side.xi.filter(canBowl),key=JSON.stringify([pool.map(p=>[p.id,p.bowling,p.style,p.phases]),pitch]);const cached=rotationCache.get(key);if(cached)return [...cached];
 type Candidate={plan:string[];used:number[];score:number};let beam:Candidate[]=[{plan:[],used:pool.map(()=>0),score:0}];
 for(let over=0;over<20;over++){const next=new Map<string,Candidate>(),phase=over<6?'powerplay':over>=15?'death':'middle',remain=19-over;
 for(const state of beam)for(let n=0;n<pool.length;n++){const p=pool[n];if(p.id===state.plan.at(-1)||state.used[n]>=4)continue;const used=[...state.used];used[n]++;
 if(pool.reduce((sum,_,q)=>sum+Math.min(4-used[q],q===n?Math.floor(remain/2):Math.ceil(remain/2)),0)<remain)continue;
 const spin=bowlingKind(p.style)==='spin',fit=spin?(phase==='middle'?28:-12):(phase==='middle'?0:28),skill=p.phases?.[phase]?.bowling??p.bowling;
 const candidate={plan:[...state.plan,p.id],used,score:state.score+skill+fit+(spin?pitch.spin:pitch.pace)*.08};const stateKey=used.join(',')+':'+n;if(!next.has(stateKey)||next.get(stateKey)!.score<candidate.score)next.set(stateKey,candidate);}
 beam=[...next.values()].sort((a,b)=>b.score-a.score||a.plan.join().localeCompare(b.plan.join())).slice(0,64);if(!beam.length)throw Error('Unable to create a legal bowling rotation.');}
 const plan=beam[0].plan;if(rotationCache.size>=128)rotationCache.delete(rotationCache.keys().next().value!);rotationCache.set(key,plan);return [...plan];
}
export function executionChance(control:number,plan:BowlingPlan){return Math.max(.35,Math.min(.88,.48+(control-50)*.006-(plan.length==='wide-yorker'?.05:0)-(plan.pace==='effort'?.06:0)));}
