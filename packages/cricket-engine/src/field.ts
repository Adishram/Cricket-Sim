import type {Side} from './index';
export type FieldPosition={id:string;name:string;position:string;x:number;y:number;outside:boolean};
/** Original field presets. Nine fielders plus keeper and bowler; max two/five outside. */
export function fieldPositions(side:Side,bowler:string,preset:string,powerplay:boolean,leftHanded=false):FieldPosition[]{
 const outer=powerplay?2:preset==='defensive'?5:preset==='attacking'?2:4;
 const angles=preset==='attacking'?[-1.25,-.95,-.3,.3,1,1.7,2.5,3.1,3.7]:preset==='defensive'?[-1,-.25,.5,1.3,2.2,2.9,3.5,4,4.5]:[-1.1,-.5,.2,.9,1.85,2.2,2.8,3.5,4.2];
 const names=['Third man','Point','Cover','Mid-off','Long-on','Midwicket','Square leg','Fine leg','Slip'];
 const outfield=side.xi.filter(p=>p.id!==bowler&&p.id!==side.keeper).map((p,n)=>{const outside=n<outer,r=outside?.88:preset==='attacking'?.28:.47,a=angles[n];const x=300+Math.cos(a)*260*r;return {id:p.id,name:p.name,position:names[n],x:Math.round(leftHanded?600-x:x),y:Math.round(215+Math.sin(a)*175*r),outside};});
 const keeper=side.xi.find(p=>p.id===side.keeper);if(keeper)outfield.push({id:keeper.id,name:keeper.name,position:'Wicketkeeper',x:300,y:145,outside:false});return outfield;
}
