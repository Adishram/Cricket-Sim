/** Pace/spin evidence remains distinct from game estimates. Never infer splits from career totals. */
export type BowlingKind='pace'|'spin'|'unknown';
export type ObservedSplit={balls:number;runs:number;dismissals:number;source:string;from:string;to:string};
export type StyleBatting={strikeRate:number;dismissalRate:number;sample:number;observed:ObservedSplit|null};
export type BattingMatchups={pace:StyleBatting;spin:StyleBatting};
export function bowlingKind(style:string):BowlingKind{if(/spin|break|slow|orthodox|chinaman/i.test(style))return 'spin';if(/fast|medium|pace|seam/i.test(style))return 'pace';return 'unknown';}
export function estimateSplit(batting:number,observed:ObservedSplit|null=null):StyleBatting{
 const priorSR=105+(batting-40)*1.2,priorDismissal=Math.max(.025,.075-(batting-40)*.001);
 if(!observed||!Number.isFinite(observed.balls)||observed.balls<=0)return {strikeRate:priorSR,dismissalRate:priorDismissal,sample:0,observed:null};
 if(![observed.runs,observed.dismissals,observed.balls].every(n=>Number.isInteger(n)&&n>=0)||observed.dismissals>observed.balls)throw Error('Invalid pace/spin evidence.');
 // 180-ball prior prevents a few successful deliveries from creating an elite matchup.
 return {strikeRate:(observed.runs+priorSR/100*180)/(observed.balls+180)*100,dismissalRate:(observed.dismissals+priorDismissal*180)/(observed.balls+180),sample:observed.balls,observed};
}
export function battingMatchups(batting:number,evidence?:Partial<Record<'pace'|'spin',ObservedSplit>>):BattingMatchups{return {pace:estimateSplit(batting,evidence?.pace),spin:estimateSplit(batting,evidence?.spin)};}
