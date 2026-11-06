import type {BowlingPlan} from './planning';
import {bowlingKind} from './matchup';
type Ball=BowlingPlan & {label:string};
const ball=(label:string,variation:Ball['variation'],line:Ball['line']='off',length:Ball['length']='good',pace:Ball['pace']='stock'):Ball=>({label,variation,line,length,pace});
const seam=ball('Hold the channel','wobble-seam'),away=ball('Shape away','outswing'),back=ball('Swing back in','inswing','stumps','full'),cut=ball('Take pace off','cutter','off','good','slower'),toe=ball('At the toes','stock','stumps','yorker','effort'),wide=ball('Outside the arc','stock','wide','wide-yorker');
const skid=ball('Slide at off','slider','stumps'),stock=ball('Hold a length','stock','stumps'),toss=ball('Invite the drive','flight','off','full','slower'),bounce=ball('Find extra bounce','topspinner','off');
const lift=ball('Surprise bouncer','bouncer','off','short','effort'),inward=ball('Angle into off stump','inswing','off','good'),straight=ball('Base of middle stump','stock','stumps','yorker');
const powerplaySample='Bhuvneshwar Kumar & Jasprit Bumrah · 43 bowler wickets in 1,104 legal powerplay deliveries.';
const deathSample='Bhuvneshwar Kumar & Jasprit Bumrah · 55 bowler wickets and 128 boundaries in 730 legal death deliveries.';
export const playbook=[
 {id:'swing-lift',style:'pace',phase:'Powerplay',name:'Swing, lift, swing',aim:'Shape two away, then push the batter back with a bouncer. Pitch the fourth up at the stumps. The short ball can be pulled and the fuller ball driven.',strike:3,balls:[away,away,lift,back,seam,away],sample:powerplaySample},
 {id:'nip-lift',style:'pace',phase:'Powerplay',name:'Inside edge',aim:'Start with inward movement. Test the outside edge on ball three, then change the eye line with a short ball before going full and straight.',strike:4,balls:[inward,seam,away,lift,back,seam],sample:powerplaySample},
 {id:'death-straight',style:'pace',phase:'Death overs',name:'Under the bat',aim:'Start at the toes. Break the pace with a cutter and stretch the batter wide before firing ball five at the base of middle. Miss the length and the batter can swing through it.',strike:4,balls:[straight,cut,wide,seam,toe,straight],sample:deathSample},
 {id:'death-wide',style:'pace',phase:'Death overs',name:'Wide, then straight',aim:'Make the batter reach for the wide yorker. Sell that line again, then swap to a straight yorker on ball four. A wide miss costs an extra and another attempt.',strike:3,balls:[wide,cut,wide,toe,cut,wide],sample:deathSample},
 {id:'swing',style:'pace',phase:'Powerplay',name:'Shape it away',aim:'Show the outside edge, then bring one back at the stumps. Miss full and the drive is on.',strike:3,balls:[away,seam,away,back,seam,away],sample:'Bhuvneshwar Kumar & Jasprit Bumrah · 555 dots in 1,104 legal powerplay balls.'},
 {id:'death',style:'pace',phase:'Death overs',name:'Deny the arc',aim:'Change pace, then attack the toes. A missed yorker can become a boundary; miss wide and bowl again.',strike:4,balls:[cut,seam,wide,cut,toe,wide],sample:'Bhuvneshwar Kumar & Jasprit Bumrah · 128 boundaries in 730 legal death balls.'},
 {id:'squeeze',style:'spin',phase:'Middle overs',name:'Draw the drive',aim:'Slide into the stumps to build dots. Float the fourth ball fuller: grip and pressure help, but the batter can hit over the ring.',strike:3,balls:[skid,stock,skid,toss,bounce,stock],sample:'Ravindra Jadeja & Varun Chakravarthy · 576 dots in 1,729 legal middle-over balls.'},
 {id:'bounce',style:'spin',phase:'Middle overs',name:'Change the bounce',aim:'Alternate a flat trajectory with overspin, then offer flight. The slower ball gives the batter time if it misses its length.',strike:4,balls:[stock,bounce,skid,stock,toss,bounce],sample:'Ravindra Jadeja & Varun Chakravarthy · 243 boundaries and 82 bowler wickets in 1,729 legal middle-over balls.'}
] as const;
export type OverCall={id:string;innings:number;over:number;balls?:BowlingPlan[]};
export function presetFor(style:string,id:string){return playbook.find(x=>x.id===id&&x.style===bowlingKind(style));}
export function deliveryFor(style:string,call:OverCall|undefined,innings:number,legalBalls:number,fallback:BowlingPlan):BowlingPlan{
 const selected=call&&call.innings===innings&&call.over===Math.floor(legalBalls/6)?(call.balls??presetFor(style,call.id)?.balls)?.[legalBalls%6]??fallback:fallback;
 return selected===fallback?fallback:{...fallback,...selected};
}
