'use client';
import {Crosshair,Flame,Shield,Shuffle,Zap,RotateCcw} from 'lucide-react';
import {battingIntent} from '../../../packages/cricket-engine/src/batting-intent';
import type {Cricketer,Match,Tactics} from '../../../packages/cricket-engine/src';
import type {BattingStyle} from '../../../packages/cricket-engine/src/planning';
const plans:{name:string;style:BattingStyle;aggression:0|1|2|3|4;icon:typeof Shield;detail:string;cost:string}[]=[
 {name:'Build an innings',style:'anchor',aggression:1,icon:Shield,detail:'Protect the wicket. Get established.',cost:'Fewer boundary attempts'},
 {name:'Keep it moving',style:'rotate',aggression:2,icon:Shuffle,detail:'Work singles. Break up dot balls.',cost:'Less six-hitting intent'},
 {name:'Take them on',style:'balanced',aggression:3,icon:Crosshair,detail:'Look for boundaries with an attacking intent.',cost:'More dismissal risk'},
 {name:'Clear the ropes',style:'power',aggression:4,icon:Flame,detail:'Commit to the big shot.',cost:'Highest dismissal risk'},
 {name:'Sweep the spin',style:'sweep',aggression:3,icon:Zap,detail:'Use the sweep to challenge spin.',cost:'Poor fit against pace'},
];
export function BattingStudio({match,team,player,apply}:{match:Match;team:number;player:Cricketer;apply:(v:Partial<Tactics>)=>void}){
 const t=match.tactics[team],live=match.innings.at(-1)?.team===team,intent=live?battingIntent(match,player):null;
 const manual=t.batterAggression[player.id],style=t.batterStyle?.[player.id];
 const controlled=manual!==undefined||style!==undefined;
 return <section className="batting-studio">
 <header><span className="eyebrow gold">THE BATTING BLUEPRINT</span><h3>Own the next ball.</h3><p>Set {player.name.split(' ')[0]}’s approach. Every attacking choice carries a tradeoff.</p></header>
 <div className="intent-readout"><span><i/> {intent?.reason||(!controlled?'Adaptive match intent':'Personal instructions')}</span><b>{intent?.level??manual??t.aggression}<small>/4 INTENT</small></b></div>
 <div className="batting-blueprints">{plans.map(p=>{const Icon=p.icon,active=manual===p.aggression&&style===p.style;return <button type="button" key={p.name} aria-pressed={active} onClick={()=>apply({batterAggression:{...t.batterAggression,[player.id]:p.aggression},batterStyle:{...t.batterStyle,[player.id]:p.style}})}><Icon size={20}/><span><strong>{p.name}</strong><small>{p.detail}</small><em>{p.cost}</em></span><b aria-hidden="true">{active?'✓':'↗'}</b></button>;})}</div>
 <div className="batting-context">{(['pace','spin'] as const).map(kind=>{const obs=player.matchups?.[kind]?.observed;return <div key={kind}><small>AGAINST {kind.toUpperCase()}</small><strong>{obs?.balls?(100*obs.runs/obs.balls).toFixed(0):'—'} <small>SR</small></strong><span>{obs?.balls??0} observed balls</span></div>;})}</div>
 {intent?.finisher&&<p className="studio-notice">Finisher mode is active: from over 17 the match engine uses all-out power hitting.</p>}
 <button type="button" className="studio-reset" disabled={!controlled} onClick={()=>{const a={...t.batterAggression},s={...t.batterStyle};delete a[player.id];delete s[player.id];apply({batterAggression:a,batterStyle:s});}}><RotateCcw size={14}/> Use adaptive intent</button>
 </section>;
}
