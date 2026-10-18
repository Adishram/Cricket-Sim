import {random,seedFrom} from '../../shared/src/random';
export type Trajectory={zone:string;kind:'ground'|'lofted'|'defended'|'missed'|'wicket';x:number;y:number;controlX:number;controlY:number};
/** Separate visual seed: drawing changes must never consume the outcome RNG. */
export function trajectory(seed:number,eventId:number,outcome:string,dismissal:string,hand:string,spin:boolean):Trajectory{
 const rng={seed:seedFrom(`${seed}:shot:${eventId}`)},r=()=>random(rng),left=/left|lhb/i.test(hand);
 const zones=spin?['cover','straight','midwicket','square leg','fine leg','point']:['third man','point','cover','straight','midwicket','square leg'];
 let zone=zones[Math.floor(r()*zones.length)],angle=({cover:-.65,straight:Math.PI/2,midwicket:2.4,'square leg':Math.PI,'fine leg':-2.5,point:0,'third man':-.95} as Record<string,number>)[zone]+(r()-.5)*.5;
 let kind:Trajectory['kind']=outcome==='six'?'lofted':'ground',distance=outcome==='four'?.98:outcome==='six'?1.035:.25+r()*.45;
 if(outcome==='dot'){kind='defended';distance=.06+r()*.12;}
 if(outcome==='wide'||outcome==='noBall'||outcome==='bye'||outcome==='legBye'){kind='missed';zone='behind the wicket';angle=-Math.PI/2+(r()-.5)*.25;distance=.3+r()*.15;}
 if(dismissal){kind='wicket';if(['bowled','lbw','stumped'].includes(dismissal)){zone='at the stumps';distance=.03;angle=-Math.PI/2;}else if(dismissal==='caught'){distance=.25+r()*.7;}else distance=.25+r()*.35;}
 let x=300+Math.cos(angle)*260*distance;if(left)x=600-x;const y=215+Math.sin(angle)*175*distance;
 return {zone,kind,x:Math.round(x),y:Math.round(y),controlX:Math.round((294+x)/2),controlY:Math.round((186+y)/2-(outcome==='six'?70:10))};
}
