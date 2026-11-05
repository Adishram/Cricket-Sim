'use client';
import {useState} from 'react';
import {activeBowler,current,type Cricketer,type Match} from '../../../packages/cricket-engine/src';
import {playbook,type OverCall} from '../../../packages/cricket-engine/src/over-plans';
import {bowlingKind} from '../../../packages/cricket-engine/src/matchup';
import {VARIATION_LABELS} from '../../../packages/cricket-engine/src/planning';

export function OverStudio({match,team,bowler,commit}:{match:Match;team:number;bowler:Cricketer;commit:(c?:OverCall)=>void}){
 const library=playbook.filter(p=>p.style===bowlingKind(bowler.style));
 const i=current(match),fielding=i.team!==team,innings=match.innings.length-(fielding?1:0);
 const start=fielding?Math.floor(i.balls/6):0;
 const live=fielding&&!i.complete&&activeBowler(match)?.id===bowler.id;
 const overs=(match.superOver?[0]:Array.from({length:20},(_,n)=>n)).filter(n=>n>=start&&(n===start&&fielding?live:match.rotations?.[team]?.[n]===bowler.id));
 const call=match.tactics[team].overCalls?.[bowler.id];
 const [chosen,setChosen]=useState(''),[slot,setSlot]=useState(-1),[target,setTarget]=useState(-1);
 const over=overs.includes(target)?target:overs.includes(call?.over??-1)&&call?.innings===innings?call.over:overs[0];
 const phase=match.superOver?'Death overs':over==null?null:over<6?'Powerplay':over>=15?'Death overs':'Middle overs';
 const options=[...library.filter(p=>p.phase===phase),...library.filter(p=>p.phase!==phase)];
 const preset=options.find(p=>p.id===chosen)??options.find(p=>call?.over===over&&call?.innings===innings&&call.id===p.id)??options[0];if(!preset)return <p className="data-note">No verified pace or spin style. Use manual instructions below.</p>;
 const active=call?.id===preset.id&&call.innings===innings&&call.over===over;
 const next=live&&over===start?i.balls%6:0;
 const focus=slot<0?next:slot,b=preset.balls[focus];
 const point=(n:number)=>{const d=preset.balls[n];return {x:({wide:109,off:90,stumps:70}[d.line])+(n%3-1)*3,y:({yorker:30,'wide-yorker':34,full:49,good:77,short:99}[d.length])+n%2*3};};
 const {x,y}=point(focus);
 return <section className="over-studio"><header><span className="eyebrow gold">CAPTAIN’S PLAYBOOK</span><h3>Build the over</h3><small>{preset.style==='spin'?'Spin':'Pace'} variations · six legal balls</small></header>
 <div className="play-options">{options.map(p=><button type="button" aria-pressed={preset.id===p.id} key={p.id} onClick={()=>{setChosen(p.id);setSlot(-1);}}><small>{p.phase}{phase===p.phase?' · This phase':''}</small><strong>{p.name}</strong></button>)}</div>
 <div className="play-preview"><svg viewBox="0 0 145 154" aria-label={'Pitch map, ball '+(focus+1)+': '+b.line+' line, '+b.length+' length'} role="img"><path d="M44 14H101L119 142H26Z" fill="#183337" stroke="#508282"/><path d="M39 28H108M24 127H120M70 26V133" stroke="#89bcb3" opacity=".5" strokeDasharray="3 3"/>{[66,70,74].map(n=><path key={n} d={`M${n} 22v-9`} stroke="#e9cd87" strokeWidth="2"/>)}<path key={preset.id+focus} className="play-trace" d={`M56 138 Q37 84 ${x} ${y} Q${x+4} ${y-18} 73 19`} pathLength="1" fill="none" stroke="#fbbf24" strokeWidth="2"/>{preset.balls.map((_,n)=>{const pt=point(n);return <circle key={n} cx={pt.x} cy={pt.y} r={n===focus?5:2.5} fill={n===focus?'#fbbf24':'#80aca8'}/>;})}</svg>
 <div aria-live="polite"><small className="eyebrow gold">BALL 0{focus+1} · {focus===preset.strike?'WICKET ATTEMPT':'SETUP'}</small><h4>{b.label}</h4><p>{VARIATION_LABELS[b.variation??'stock']} · {b.line} line · {b.length} length · {b.pace} pace</p><p>{preset.aim}</p></div></div>
 <div className="play-sequence" aria-label="Inspect each delivery">{preset.balls.map((d,n)=><button type="button" key={n} aria-pressed={focus===n} aria-label={`Ball ${n+1}: ${d.label}`} onClick={()=>setSlot(n)}><b>0{n+1}</b><small>{d.variation==='bouncer'?'Bouncer':d.variation==='outswing'?'Away':d.variation==='inswing'?'In':d.length==='wide-yorker'?'Wide Ykr':d.length==='yorker'?'Yorker':d.variation==='cutter'?'Cutter':d.length}</small></button>)}</div>
 <details><summary>IPL evidence behind this plan</summary><p>{preset.sample} Source: <a href="https://cricsheet.org/downloads/">Cricsheet IPL archive</a>, 2022–25. The archive records outcomes; the lengths and variations here are designed sequences, not tracked deliveries.</p></details>
 <footer><label>Scheduled over<select aria-label="Scheduled over" value={over??''} onChange={e=>{setTarget(Number(e.target.value));setChosen('');setSlot(-1);}}>{!overs.length&&<option value="">No scheduled over</option>}{overs.map(n=><option key={n} value={n}>Over {n+1}</option>)}</select></label><button type="button" className="play-commit" disabled={over===undefined||active} onClick={()=>commit({id:preset.id,over,innings})}>{active?'✓ Plan set':'Set this over'}</button></footer>
 {call?.innings===innings&&overs.includes(call.over)&&<p role="status">Scheduled: {playbook.find(p=>p.id===call.id)?.name} · over {call.over+1}. <button type="button" onClick={()=>commit()}>Clear plan</button></p>}
 <small>One scheduled setup per bowler. Wides and no-balls repeat the slot. Other overs use manual instructions.</small></section>;
}
