import type {BowlingPlan} from './planning';
import type {Cricketer,Match} from './index';
import {bowlingKind} from './matchup';
import {executionChance} from './planning';
type Weights={dot:number;one:number;two:number;three:number;four:number;six:number;wicket:number;wide:number;noBall:number;bye:number;legBye:number};
/** Bounded game-model effects. Execution, surface, phase and recent pressure matter; never a guaranteed wicket. */
export function applyDelivery(weights:Weights,m:Match,bowl:Cricketer,plan:BowlingPlan,execution:'stock'|'nailed'|'missed'){
 const base={...weights};
 const i=m.innings.at(-1)!,spin=bowlingKind(bowl.style)==='spin',early=i.balls<36,death=i.balls>=90,v=plan.variation??'stock';
 const success=execution==='stock'?executionChance(bowl.control,plan):execution==='nailed'?1:0;
 const effect=(key:keyof Weights,good:number,bad:number)=>{weights[key]*=good*success+bad*(1-success);};
 const dew=m.innings.length%2===0?m.pitch.dew/100:0,grip=Math.max(.2,(m.pitch.spin/100+m.pitch.deterioration/100*i.balls/120)*(1-dew*.3));
 const recent=m.events.filter(e=>e.innings===m.innings.length-1&&e.batter===i.striker).slice(-6),pressure=recent.filter(e=>e.legal&&e.runs===0).length/6;
 if(plan.line==='stumps'){weights.wide*=.65;weights.dot*=spin?1.16:1.04;weights.six*=spin?.88:1;weights.wicket*=1.08;}
 if(plan.line==='off'){weights.dot*=1.05;weights.wicket*=1.04;}if(plan.line==='wide'){weights.wide*=1.6;weights.six*=.85;weights.dot*=1.08;}
 if(plan.length==='good'){weights.dot*=spin?1.07:1.1;weights.four*=.92;}
 if(plan.length==='short'){effect('six',spin?1.35:1.08,1.65);effect('wicket',spin?.94:1.2,.85);}
 if(plan.length==='full'){effect('wicket',spin?1.15+grip*.15+pressure*.2:early?1.2:1.04,.85);effect('four',spin?1.02:1.12,1.5);}
 if(plan.pace==='slower'){effect('dot',death?1.22:1.1,.9);effect('six',.85,1.35);}
 if(plan.pace==='effort'){effect('wicket',!spin&&death?1.24:1.12,.85);effect('four',.88,1.2);weights.noBall*=1.35;}
 if(v==='inswing'||v==='outswing'){const movement=early?1+(m.pitch.pace/100)*.36:1.05;effect('wicket',movement,.9);effect('dot',early?1.2:1.03,.95);effect('four',.86,1.3);weights.wide*=1.15;}
 if(v==='wobble-seam'){effect('wicket',plan.length==='good'?1.24+m.pitch.pace/500:1.08,.9);effect('dot',plan.length==='good'?1.2:1.05,.94);effect('four',.9,1.2);}
 if(v==='cutter'){effect('dot',death?1.28:1.16,.9);effect('wicket',1.12,.9);effect('six',.8,1.4);}
 if(v==='bouncer'){effect('wicket',1.23,.85);effect('six',.95,1.55);weights.wide*=1.5;weights.noBall*=1.2;}
 if(spin&&v!=='stock'){effect('wicket',1.06+grip*.18+pressure*.15,.84);effect('dot',1.1,.9);effect('six',.9,1.4);}
 if(v==='flight'){effect('wicket',plan.length==='full'?1.2:1.1,.9);effect('six',1.05,1.5);}
 if(v==='slider'||v==='arm-ball'){effect('dot',plan.line==='stumps'?1.2:1.08,.95);effect('wicket',plan.line==='stumps'?1.16:1.05,.9);}
 if(v==='topspinner'){effect('wicket',1.15,.92);effect('four',.9,1.2);}
 if(v==='wrong-un'||v==='carrom'){effect('wicket',1.2,.82);weights.wide*=1.2;}
 // Avoid multiplying several individually plausible bonuses into an overwhelming advantage.
 for(const key of ['wicket','dot','four','six'] as const)weights[key]=Math.max(base[key]*.65,Math.min(base[key]*(key==='wicket'?1.4:1.3),weights[key]));
 if(plan.length==='yorker'||plan.length==='wide-yorker'){effect('wicket',1.8,.65);effect('dot',1.45,.65);effect('four',.48,2);effect('six',.4,2.1);effect('wide',.75,plan.length==='wide-yorker'?5:1.5);effect('noBall',.8,2);}
}
