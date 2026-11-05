import {breakoutPace2026,type Player} from '../../../packages/cricket-data/src/players';
export function BreakoutPace({onPick}:{onPick:(p:Player)=>void}){
 return <details className="pace-watch"><summary><span>IPL 2026</span> Emerging Indian pacers <small>{breakoutPace2026.length} players</small></summary>
 <p>At least 10 wickets in 2026 and fewer than 50 in earlier covered IPL seasons. Select a name to scout the player.</p>
 <div className="table-scroll"><table><thead><tr>{['Bowler','Wkts','Econ','Avg','SR','OVR'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{breakoutPace2026.map(x=><tr key={x.player.id}><th scope="row"><button onClick={()=>onPick(x.player)}>{x.player.name}</button></th><td>{x.wickets}</td><td>{x.economy.toFixed(2)}</td><td>{x.average.toFixed(2)}</td><td>{x.strikeRate.toFixed(2)}</td><td>{x.player.rating.value}</td></tr>)}</tbody></table></div><p>Season figures: <a href="https://cricsheet.org/downloads/">Cricsheet</a>. OVR is the game’s career estimate.</p></details>;
}
