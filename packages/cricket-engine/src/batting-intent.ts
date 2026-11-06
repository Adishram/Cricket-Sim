import {battingRole} from './batting-order';
import type {Cricketer,Match} from './index';
import evidence from './pressure-evidence.json';
export function attackingOpener(openers:Cricketer[]){
 const power=(p:Cricketer)=>(p.phases?.powerplay.batting??p.batting)+.14*((p.matchups?.pace.strikeRate??130)-130);
 return [...openers.slice(0,2)].sort((a,b)=>power(b)-power(a))[0]?.id;
}
export function battingIntent(m:Match,bat:Cricketer){
 const i=m.innings.at(-1)!,t=m.tactics[i.team],manual=t.batterAggression[bat.id],base=manual??t.aggression;
 if(!m.initial.pressureV1)return {finisher:false,level:base,power:false,dots:0,reason:''};
 const finishingRole=!!m.initial.roleIntentV2&&battingRole(bat)==='finisher',finisher=finishingRole&&i.balls>=96;
 const opener=i.balls<36&&attackingOpener(m.teams[i.team].xi)===bat.id;
 const dots=i.batting.find(x=>x.id===bat.id)?.dotStreak??0;
 const lengths=[Math.min(36,i.balls),Math.max(0,Math.min(54,i.balls-36)),Math.max(0,i.balls-90)];
 const par=evidence.firstInningsRunsAndBalls.reduce((n,[runs,balls],p)=>n+lengths[p]*runs/balls,0);
 const chase=i.target!=null&&i.balls>=60&&i.score*Math.max(1,i.maxBalls-i.balls)<(i.target-i.score)*i.balls;
 const behind=i.target==null&&i.balls>=12&&i.score+4<par;
 const urgent=m.botTeams.includes(i.team)&&(chase||behind);
 return {finisher,level:finisher?4:manual??Math.max(base,opener?4:urgent||finishingRole?3:0),power:finisher||opener&&manual==null,dots,reason:finisher?'Finisher · all out':opener?'Powerplay hitter':urgent?(chase?'Behind required rate':'Below IPL phase pace'):''};
}
