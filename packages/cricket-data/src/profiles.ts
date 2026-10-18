import data from './matchup-evidence.json';
import type {ObservedSplit} from '../../cricket-engine/src/matchup';
export type Phase='powerplay'|'middle'|'death';
export const observedProfiles=data.phases as Record<string,{batting:Partial<Record<Phase,ObservedSplit>>;bowling:Partial<Record<Phase,ObservedSplit>>}>;
export const observedHeadToHead=data.headToHead as Record<string,Record<string,ObservedSplit>>;
export function phaseRatings(id:string,batting:number,bowling:number){const p=observedProfiles[id];return Object.fromEntries((['powerplay','middle','death'] as const).map(phase=>{const b=p?.batting[phase],w=p?.bowling[phase];const bat=b?.balls?batting+Math.max(-12,Math.min(12,((b.runs/b.balls*100)-135)*.12))*b.balls/(b.balls+180):batting;const bowl=w?.balls?bowling+Math.max(-12,Math.min(12,(8.5-w.runs/w.balls*6)*3+(w.dismissals/w.balls-.04)*100))*w.balls/(w.balls+180):bowling;return [phase,{batting:Math.round(Math.max(30,Math.min(99,bat))),bowling:Math.round(Math.max(30,Math.min(99,bowl)))}];})) as Record<Phase,{batting:number;bowling:number}>;}
