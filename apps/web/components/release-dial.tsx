import type {CSSProperties} from 'react';
import type {BowlingPlan} from '../../../packages/cricket-engine/src/planning';

export function ReleaseDial({kind,plan,setPlan}:{kind:string;plan:BowlingPlan;setPlan:(v:Partial<BowlingPlan>)=>void}){
 if(kind!=='pace'&&kind!=='spin')return null;
 const spin=kind==='spin',min=spin?1000:110,max=spin?3000:155,value=spin?plan.spinRpm??2000:plan.speedKph??135,unit=spin?'RPM':'km/h';
 const pct=(value-min)/(max-min);
 return <label className="release-dial" style={{'--fill':pct*100+'%','--duration':(1.8-pct*1.25)+'s'} as CSSProperties}>
 <span className={'release-ball '+(spin?'revs':'velocity')} aria-hidden="true">◍</span>
 <span>{spin?'Target revolutions':'Target release speed'}<strong>{value} <small>{unit}</small></strong></span>
 <input type="range" min={min} max={max} step={spin?50:1} value={value} aria-label={spin?'Target spin rate':'Target bowling speed'} aria-valuetext={value+' '+unit} onChange={e=>setPlan(spin?{spinRpm:+e.target.value}:{speedKph:+e.target.value})}/>
 <small>{min} {unit}</small><small>{max} {unit}</small>
 <em>{spin?'More revs can find extra turn on a gripping pitch.':'Extra pace can threaten the edge.'} Misses can cost boundaries or extras.</em></label>;
}
