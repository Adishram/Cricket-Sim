import type {Cricketer,Pitch,Side} from './index';
import {bowlingKind} from './matchup';
export function roleGroup(p:{role:string}){return /keep/i.test(p.role)?'WK':/all/i.test(p.role)?'AR':/bowl/i.test(p.role)?'BOWL':'BAT';}
export function balancedXI(pool:Cricketer[],pitch?:Pitch,opponent?:Side){const oppositionSpin=opponent?opponent.xi.filter(p=>bowlingKind(p.style)==='spin').length/Math.max(1,opponent.xi.filter(p=>roleGroup(p)==='BOWL'||roleGroup(p)==='AR').length):.4;
 const score=(p:Cricketer)=>{const g=roleGroup(p),bat=p.batting+((p.matchups?.spin.strikeRate??135)*oppositionSpin+(p.matchups?.pace.strikeRate??135)*(1-oppositionSpin)-135)*.08;const bowl=p.bowling+(pitch?(bowlingKind(p.style)==='spin'?pitch.spin:pitch.pace)-50:0)*.12;return g==='BOWL'?bowl:g==='AR'?(bat+bowl)/2:bat;};
 const sorted=[...pool].sort((a,b)=>score(b)-score(a)||a.id.localeCompare(b.id)),xi:Cricketer[]=[];
 const feasible=(candidate:Cricketer)=>{const chosen=[...xi,candidate],remaining=sorted.filter(p=>!chosen.includes(p)),foreign=4-chosen.filter(p=>p.overseas).length;if(foreign<0)return false;const available=(ps:Cricketer[])=>ps.filter(p=>!p.overseas).length+Math.min(foreign,ps.filter(p=>p.overseas).length);return available(remaining)>=11-chosen.length&&available(remaining.filter(p=>['AR','BOWL'].includes(roleGroup(p))))>=Math.max(0,5-chosen.filter(p=>['AR','BOWL'].includes(roleGroup(p))).length);};
 const add=(group:string,required=false)=>{const p=sorted.find(p=>!xi.includes(p)&&roleGroup(p)===group&&feasible(p));if(p)xi.push(p);else if(required)throw Error(`No eligible ${group} for a balanced XI.`);};
 // Search legal domestic/overseas combinations so an early keeper pick cannot
 // spend the overseas place needed for the second quick or third spinner.
 if(pitch&&pitch.spin>pitch.pace){
  const attack=(kind:string)=>sorted.filter(p=>['BOWL','AR'].includes(roleGroup(p))&&bowlingKind(p.style)===kind).sort((a,b)=>b.bowling-a.bowling||score(b)-score(a));
  const mix=(ps:Cricketer[],size:number,foreign:number)=>[...ps.filter(p=>p.overseas).slice(0,foreign),...ps.filter(p=>!p.overseas).slice(0,size-foreign)];
  let best:Cricketer[]|undefined,bestScore=-Infinity;
  for(const keeper of sorted.filter(p=>roleGroup(p)==='WK'))for(let q=0;q<=2;q++)for(let r=0;r<=3;r++){
   const pace=mix(attack('pace'),2,q),spin=mix(attack('spin'),3,r);
   if(pace.length!==2||spin.length!==3)continue;
   const side=[keeper,...pace,...spin];let overseas=side.filter(p=>p.overseas).length;if(overseas>4)continue;
   for(const p of [...sorted].sort((a,b)=>Number(['AR','BOWL'].includes(roleGroup(a)))-Number(['AR','BOWL'].includes(roleGroup(b)))||b.batting-a.batting)){if(side.includes(p)||p.overseas&&overseas===4)continue;side.push(p);if(p.overseas)overseas++;if(side.length===11)break;}
   const value=side.reduce((n,p)=>n+p.batting,0)+[...pace,...spin].reduce((n,p)=>n+p.bowling,0);
   if(side.length===11&&value>bestScore){bestScore=value;best=side;}
  }
  if(best)return best.sort((a,b)=>b.batting-a.batting||a.id.localeCompare(b.id));
 }
 add('WK',true);for(let n=0;n<2;n++)add('AR');for(let n=0;n<4;n++)add('BOWL');
 while(xi.filter(p=>['AR','BOWL'].includes(roleGroup(p))).length<5){const before=xi.length;add('AR');if(xi.length===before)add('BOWL',true);}
 while(xi.length<11){const before=xi.length;add('BAT');if(xi.length===before){const p=sorted.find(p=>!xi.includes(p)&&feasible(p));if(!p)throw Error('Insufficient eligible players.');xi.push(p);}}
 return xi.sort((a,b)=>{const order=(p:Cricketer)=>roleGroup(p)==='BOWL'?2:roleGroup(p)==='AR'?1:0;return order(a)-order(b)||b.batting-a.batting;});
}
