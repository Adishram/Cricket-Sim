'use client';
import {useState} from 'react';
import {activeBowler,current,type Cricketer,type Match} from '../../../packages/cricket-engine/src';
import {playbook,type OverCall} from '../../../packages/cricket-engine/src/over-plans';
import {bowlingKind} from '../../../packages/cricket-engine/src/matchup';
import {executionChance,variations,type BowlingPlan,VARIATION_LABELS} from '../../../packages/cricket-engine/src/planning';

export function OverStudio({match,team,bowler,commit}:{match:Match;team:number;bowler:Cricketer;commit:(c?:OverCall)=>void}){
 const library=playbook.filter(p=>p.style===bowlingKind(bowler.style));
 const i=current(match),fielding=i.team!==team,innings=match.innings.length-(fielding?1:0);
 const start=fielding?Math.floor(i.balls/6):0;
 const live=fielding&&!i.complete&&activeBowler(match)?.id===bowler.id;
 const overs=(match.superOver?[0]:Array.from({length:20},(_,n)=>n)).filter(n=>n>=start&&(n===start&&fielding?live:match.rotations?.[team]?.[n]===bowler.id));
 const call=match.tactics[team].overCalls?.[bowler.id];
 const [draft,setDraft]=useState<{key:string;balls:BowlingPlan[]}|null>(null);
 const [chosen,setChosen]=useState(''),[slot,setSlot]=useState(-1),[target,setTarget]=useState(-1);
 const over=overs.includes(target)?target:overs.includes(call?.over??-1)&&call?.innings===innings?call.over:overs[0];
 const phase=match.superOver?'Death overs':over==null?null:over<6?'Powerplay':over>=15?'Death overs':'Middle overs';
 const options=[...library.filter(p=>p.phase===phase),...library.filter(p=>p.phase!==phase)];
 const preset=options.find(p=>p.id===chosen)??options.find(p=>call?.over===over&&call?.innings===innings&&call.id===p.id)??options[0];if(!preset)return <p className="data-note">No verified pace or spin style. Use manual instructions below.</p>;
 const scope=`${preset.id}:${innings}:${over}`,saved=call?.id===preset.id&&call.innings===innings&&call.over===over;
 const balls=(draft?.key===scope?draft.balls:saved&&call.balls?call.balls:preset.balls).map((b,n)=>({...b,label:'label' in b?String(b.label):VARIATION_LABELS[b.variation??'stock']}));
 const active=saved&&JSON.stringify(call.balls??preset.balls)===JSON.stringify(balls);
 const update=(n:number,patch:Partial<BowlingPlan>)=>setDraft({key:scope,balls:balls.map((d,k)=>k===n?{...d,...patch,label:VARIATION_LABELS[patch.variation??d.variation??'stock']}:d)});
 const next=live&&over===start?i.balls%6:0;
 const focus=slot<0?next:slot,b=balls[focus];
 const point=(n:number)=>{const d=balls[n];const y=({yorker:30,'wide-yorker':34,full:49,good:77,short:99}[d.length])+n%2*3;return {x:62+(({wide:108,off:83,stumps:70}[d.line])-62)*(138-y)/119,y};};
 const {y}=point(focus);
 const targetX=b.line==='wide'?108:b.line==='off'?83:70;
 const deviation=b.variation==='inswing'?3:b.variation==='outswing'?-3:0;
 const releaseX=62;
 const landingX=releaseX+(targetX-releaseX)*(138-y)/119;
 const flight=`M${releaseX} 138 Q${(releaseX+landingX)/2+deviation} ${(138+y)/2} ${landingX} ${y} L${targetX} 19`;
 return <section className="over-studio"><header><span className="eyebrow gold">CAPTAIN’S PLAYBOOK</span><h3>Build the over</h3><small>{preset.style==='spin'?'Spin':'Pace'} variations · six legal balls</small></header>
 <details className="blueprint-library"><summary>Choose blueprint · {preset.name}</summary><div className="play-options">{options.map(p=><button type="button" aria-pressed={preset.id===p.id} key={p.id} onClick={()=>{setChosen(p.id);setSlot(-1);}}><small>{p.phase}{phase===p.phase?' · This phase':''}</small><strong>{p.name}</strong></button>)}</div></details>
 <div className="play-preview"><svg viewBox="0 0 145 154" aria-label={'Pitch map, ball '+(focus+1)+': '+b.line+' line, '+b.length+' length'} role="img"><path d="M44 14H101L119 142H26Z" fill="#183337" stroke="#508282"/><path d="M39 28H108M24 127H120M70 26V133" stroke="#89bcb3" opacity=".5" strokeDasharray="3 3"/>{[66,70,74].map(n=><path key={n} d={`M${n} 22v-9`} stroke="#e9cd87" strokeWidth="2"/>)}<path key={preset.id+focus} className="play-trace" d={flight} pathLength="1" fill="none" stroke="#fbbf24" strokeWidth="2"/>{balls.map((_,n)=>{const pt=point(n);return <circle key={n} cx={pt.x} cy={pt.y} r={n===focus?5:2.5} fill={n===focus?'#fbbf24':'#80aca8'}/>;})}<g key={preset.id+'-flight-'+focus} aria-hidden="true" className="delivery-flight"><circle r="4.5" fill="#fcf5da" stroke="#192438"/><path d="M-2 -3Q1 0 -2 3" fill="none" stroke="#9d6031"/><animateMotion dur=".8s" path={flight} rotate="auto" fill="freeze"/></g></svg>
 <div aria-live="polite"><small className="eyebrow gold">BALL 0{focus+1} · {focus===preset.strike?'WICKET ATTEMPT':'SETUP'}</small><h4>{b.label}</h4><p>{VARIATION_LABELS[b.variation??'stock']} · {b.line} line · {b.length} length · {b.pace} pace</p><p>{preset.aim}</p></div></div>
 <div className="play-sequence" aria-label="Inspect each delivery">{balls.map((d,n)=><button type="button" key={n} aria-pressed={focus===n} aria-label={`Ball ${n+1}: ${d.label}`} onClick={()=>setSlot(n)}><b>0{n+1}</b><small>{d.variation==='bouncer'?'Bouncer':d.variation==='outswing'?'Away':d.variation==='inswing'?'In':d.length==='wide-yorker'?'Wide Ykr':d.length==='yorker'?'Yorker':d.variation==='cutter'?'Cutter':d.length}</small></button>)}</div>
 <div className="ball-composer"><header><span className="eyebrow gold">EDIT BALL 0{focus+1}</span><span>{Math.round(executionChance(bowler.control,b)*100)}% <small>model execution</small></span></header>
 <label>Variation<select value={b.variation??'stock'} onChange={e=>update(focus,{variation:e.target.value as BowlingPlan['variation']})}>{variations(bowler.style).map(v=><option key={v} value={v}>{VARIATION_LABELS[v]}</option>)}</select></label>
 <div className="composer-chips" aria-label="Delivery line">{(['stumps','off','wide'] as const).map(v=><button type="button" key={v} aria-pressed={b.line===v} onClick={()=>update(focus,{line:v})}>{v==='stumps'?'At stumps':v==='off'?'Off channel':'Wide line'}</button>)}</div>
 <div className="composer-chips" aria-label="Delivery length">{(['full','good','short',...(preset.style==='pace'?['yorker','wide-yorker'] as const:[])] as BowlingPlan['length'][]).map(v=><button type="button" key={v} aria-pressed={b.length===v} onClick={()=>update(focus,{length:v})}>{v.replace('-',' ')}</button>)}</div>
 <div className="composer-chips" aria-label="Delivery speed">{(['slower','stock','effort'] as const).map(v=><button type="button" key={v} aria-pressed={b.pace===v} onClick={()=>update(focus,{pace:v})}>{v==='effort'?'Quicker':v==='stock'?'Stock pace':'Pace off'}</button>)}</div>
 <div className="composer-tools"><button type="button" onClick={()=>setDraft({key:scope,balls:balls.map((d,n)=>n>focus?{...b}:d)})} disabled={focus===5}>Copy to remaining balls</button><button type="button" onClick={()=>setDraft({key:scope,balls:preset.balls.map(d=>({...d}))})}>Reset sequence</button></div><small>Changes apply when you set the over. Accuracy is an estimate, not a wicket probability.</small></div>
 <details><summary>IPL evidence behind this plan</summary><p>{preset.sample} Source: <a href="https://cricsheet.org/downloads/">Cricsheet IPL archive</a>, 2022–25. The archive records outcomes; the lengths and variations here are designed sequences, not tracked deliveries.</p></details>
 <footer><label>Scheduled over<select aria-label="Scheduled over" value={over??''} onChange={e=>{setTarget(Number(e.target.value));setChosen('');setSlot(-1);}}>{!overs.length&&<option value="">No scheduled over</option>}{overs.map(n=><option key={n} value={n}>Over {n+1}</option>)}</select></label><button type="button" className="play-commit" disabled={over===undefined||active} onClick={()=>commit({id:preset.id,over,innings,balls:balls.map(d=>({...d}))})}>{active?'✓ Plan set':'Set this over'}</button></footer>
 {call?.innings===innings&&overs.includes(call.over)&&<p role="status">Scheduled: {playbook.find(p=>p.id===call.id)?.name} · over {call.over+1}. <button type="button" onClick={()=>commit()}>Clear plan</button></p>}
 <small>One scheduled setup per bowler. Wides and no-balls repeat the slot. Other overs use manual instructions.</small></section>;
}
