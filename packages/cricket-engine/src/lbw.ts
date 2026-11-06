import {random} from '../../shared/src/random';
import type {BowlingPlan} from './planning';
export type LbwTracking={pitchX:number;impactX:number;wicketX:number;height:number;edge:boolean;shotOffered:boolean;pitching:'In line'|'Outside off'|'Outside leg';impact:'In line'|'Outside'|"Umpire’s call";wickets:'Hitting'|'Missing'|"Umpire’s call";onField:'Out'|'Not out'};
export type LbwVerdict={out:boolean;umpiresCall:boolean;reason:string};
/** Seeded gameplay geometry, not measured tracking. Positive x is the batter's off side.
 * Half the wicket width is 1; a ball radius is approximately 0.3 in these units.
 * All coordinates are sampled once, before the captain sees the appeal. */
export function sampleLbw(state:{seed:number},plan:BowlingPlan,spin:boolean):LbwTracking{
 const noise=()=>random(state)*2-1;
 const impactX=(plan.line==='wide'?1.5:plan.line==='off'?.65:0)+noise()*1.4;
 const drift=plan.variation==='inswing'?-.45:plan.variation==='outswing'?.45:spin?noise()*.6:noise()*.25;
 const pitchX=impactX-drift+noise()*.45,wicketX=impactX+drift+noise()*.55;
 const height=Math.max(.15,(plan.length==='short'?3.4:plan.length==='good'?2.2:1.1)+noise()*1.2);
 const edge=random(state)<.07,shotOffered=random(state)>.07;
 const pitching=pitchX < -1?'Outside leg':pitchX>1?'Outside off':'In line';
 const impact=Math.abs(impactX)<=1?'In line':Math.abs(impactX)<=1.3?'Umpire’s call':'Outside';
 const wickets=Math.abs(wicketX)>1.3||height>3.3?'Missing':Math.abs(wicketX)>1||height>3?'Umpire’s call':'Hitting';
 // The on-field estimate is noisy; the review never rerolls the path.
 const onField=!edge&&pitchX+noise()*.3>=-1&&(Math.abs(impactX+noise()*.45)<=1||!shotOffered&&impactX>0)&&Math.abs(wicketX+noise()*.55)<=1&&height+noise()*.5<=3?'Out':'Not out';
 return {pitchX,impactX,wicketX,height,edge,shotOffered,pitching,impact,wickets,onField};
}
export function adjudicateLbw(t:LbwTracking):LbwVerdict{
 if(t.edge)return {out:false,umpiresCall:false,reason:'Bat before pad'};
 if(t.pitching==='Outside leg')return {out:false,umpiresCall:false,reason:'Pitching outside leg'};
 const outsideOffNoShot=!t.shotOffered&&t.impactX>1;
 if(t.impact==='Outside'&&!outsideOffNoShot)return {out:false,umpiresCall:false,reason:'Impact outside the line'};
 if(t.wickets==='Missing')return {out:false,umpiresCall:false,reason:'Wickets missing'};
 const umpiresCall=t.wickets==='Umpire’s call'||t.impact==='Umpire’s call'&&!outsideOffNoShot;
 return {out:umpiresCall?t.onField==='Out':true,umpiresCall,reason:umpiresCall?'Umpire’s call — original decision stands':'Pitching legal · impact eligible · wickets hitting'};
}
export type LbwAppeal={eventId:number;innings:number;reviewTeam:number;tracking:LbwTracking};
export type LbwReviewResult={tracking:LbwTracking;decision:'review'|'accept';out:boolean;retained:boolean;reason:string};
/** A captain judges only the visible pitch/pad path, never the hidden projection. */
export function captainReviews(appeal:LbwAppeal){const t=appeal.tracking;return t.onField==='Out'?Math.abs(t.impactX)>1||t.pitchX < -1:Math.abs(t.impactX)<1.15&&t.pitchX>=-1;}
