import {variations,type BowlingPlan} from './planning';
import {bowlingKind} from './matchup';
export function validBowlingPlan(style:string,plan:BowlingPlan){
 if(!plan||!['stumps','off','wide'].includes(plan.line)||!['good','full','short','yorker','wide-yorker'].includes(plan.length)||!['stock','slower','effort'].includes(plan.pace)||!variations(style).includes(plan.variation??'stock'))return false;
 const kind=bowlingKind(style);
 if(kind==='spin'&&plan.length.includes('yorker'))return false;
 if(plan.speedKph!==undefined&&(kind!=='pace'||!Number.isInteger(plan.speedKph)||plan.speedKph<110||plan.speedKph>155))return false;
 if(plan.spinRpm!==undefined&&(kind!=='spin'||!Number.isInteger(plan.spinRpm)||plan.spinRpm<1000||plan.spinRpm>3000))return false;
 return true;
}
