import type {Cricketer} from './index';
export type BattingRole='opener'|'middle'|'finisher'|'tail';
export function battingRole(p:Cricketer):BattingRole{
 return p.battingRole??(/bowl/i.test(p.role)&&!/all/i.test(p.role)?'tail':/all/i.test(p.role)?'finisher':'middle');
}
export function orderBatters(pool:Cricketer[]){
 const pending=[...pool],ordered:Cricketer[]=[];
 for(const wanted of ['opener','opener','middle','middle','finisher','finisher','finisher','tail','tail','tail','tail'] as BattingRole[]){
  if(!pending.length)break;
  const phase=wanted==='opener'?'powerplay':wanted==='finisher'?'death':'middle';
  pending.sort((a,b)=>Number(battingRole(b)===wanted)-Number(battingRole(a)===wanted)||Number(battingRole(a)==='tail')-Number(battingRole(b)==='tail')||(b.phases?.[phase]?.batting??b.batting)-(a.phases?.[phase]?.batting??a.batting)||a.id.localeCompare(b.id));
  ordered.push(pending.shift()!);
 }
 return ordered;
}
