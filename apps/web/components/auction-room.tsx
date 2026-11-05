'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {AnimatePresence,motion,MotionConfig} from 'motion/react';
import {ArrowRight,Check,ChevronRight,ChevronLeft,Copy,Crown,Gavel,Globe,LayoutDashboard,Play,Radio,Shield,Sparkles,Timer,Users,X} from 'lucide-react';
import {Button} from './ui/button';
import {activePlayers as players,playerById,dataset,setLabel,type Player} from '../../../packages/cricket-data/src/players';
import {money,currentPlayer,nextBidAmount,eligibility,overseasCount,activeTeams,BID_TIMERS,BID_INCREMENT,SQUAD_MAX,OVERSEAS_MAX,STARTING_PURSE,type Auction,type Franchise,type BidTimer} from '../../../packages/auction-engine/src';

export type Viewer={team:string|null;host:boolean};
type RoomData={state:Auction;me:Viewer;serverNow:number};

export function Brand(){return <Link href="/" className="brand"><span className="brand-icon"><Gavel size={23}/></span><span>AUCTION<span className="brand-bottom">TO GLORY<span className="gold">.</span></span></span></Link>}
export function Header({active='Auction room'}:{active?:string}){return <header className="header"><Brand/><nav aria-label="Main navigation"><Link href="/lobby" className={active==='League lobby'?'active':''}>Play with friends</Link><Link href="/play">Solo &amp; Match Centre</Link><Link href="/data-sources" className={active==='Data sources'?'active':''}>Data &amp; ratings</Link></nav><div className="header-right"/></header>}

export function OvrBadge({player:p,size='md'}:{player:Player;size?:'sm'|'md'}){
 const tier=p.rating.value>=88?'elite':p.rating.value>=80?'gold':p.rating.value>=70?'silver':'bronze';
 return <span className={`ovr-badge ovr-${tier} ovr-${size}`} title={`Estimated OVR · ${p.rating.note}`} aria-label={`Estimated overall rating ${p.rating.value}`}><strong>{p.rating.value}</strong><small>OVR</small></span>;
}

export function AuctionPlayerCard({player:p,status,lot}:{player:Player;status:Auction['status'];lot?:number}){return <motion.article key={p.id} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="player-card"><div className="card-top"><span className="eyebrow gold"><Sparkles size={13}/> IPL PLAYER COLLECTION</span>{lot!=null&&<span className="lot-number">{String(lot).padStart(3,'0')}</span>}</div><div className="portrait" aria-label={`${p.name}, original initials artwork`}><div className="portrait-orbit orbit-one"/><div className="portrait-orbit orbit-two"/><span className="portrait-word">GLORY</span><span className="rating"><strong>{p.rating.value}</strong><small>OVR</small><span>✦</span></span><div className="monogram">{p.initials}<span>THE NEXT CHAPTER IS YOURS</span></div><span className="portrait-caption">ORIGINAL INITIALS ARTWORK</span><span className="country-tag">{p.overseas?<Globe size={12}/>:<span className="india-flag"/>}{p.country}</span></div><div className="player-identity"><div className="eyebrow muted">{p.role}</div><h2>{p.name.split(' ')[0]} <strong>{p.name.split(' ').slice(1).join(' ')}</strong></h2><div className="player-tags"><span>{p.overseas?'OVERSEAS':'INDIAN PLAYER'}</span><span>{setLabel(p)}</span></div><div className="styles"><span>{p.bat}</span><span>{p.bowl}</span></div><div className="player-card-bottom"><span>BASE PRICE<strong>{money(p.base)} <small>Cr</small></strong></span><span className="form">{p.rating.form!=null?'RECENT ESTIMATE':'PROVISIONAL'}<small>{p.rating.confidence>=75?'HIGH CONFIDENCE':p.rating.confidence>=40?'MODERATE CONFIDENCE':'LIMITED DATA'} · {p.rating.confidence}%</small></span></div><div className="auction-skill-strip"><span>BAT <b>{p.rating.batting}</b></span><span>BOWL <b>{p.rating.bowling}</b></span><span>FIELD <b>{p.rating.fielding}</b></span></div><details className="rating-explanation"><summary>How is this rated?</summary><p>{p.rating.note} Model {p.rating.version} · cutoff {p.rating.cutoff}. Attributes are estimates, not observed statistics.</p>{p.rating.contributions.map(c=><p key={`${c.season}-${c.competition}`}>{c.season} {c.competition}: {c.battingBalls} batting / {c.bowlingBalls} bowling balls. Season weight {c.weight*100}%, strength factor {c.factor}.</p>)}<p>{p.rating.capped==='capped'?'Verified T20I appearance.':'International status unverified: conservative 90 ceiling.'}</p><Link href={`/play?tab=compare&player=${p.id}`}>Compare this player ↗</Link></details></div>{(status==='sold'||status==='unsold')&&<SoldPlayerOverlay status={status}/>}</motion.article>}
export function SoldPlayerOverlay({status}:{status:'sold'|'unsold'}){return <motion.div initial={{scale:1.25,opacity:0}} animate={{scale:1,opacity:1}} className={`sold-stamp ${status}`}><Gavel size={20}/>{status.toUpperCase()}</motion.div>}
export function CurrentBidDisplay({amount,leader}:{amount:number;leader?:Franchise}){return <div className="current-bid"><span className="eyebrow muted">{leader?'CURRENT HIGHEST BID':'BIDDING OPENS AT'}</span><div className="bid-value" aria-live="polite"><AnimatePresence mode="wait" initial={false}><motion.strong key={amount} initial={{y:12,opacity:0}} animate={{y:0,opacity:1}} exit={{y:-12,opacity:0}}>{money(amount)}</motion.strong></AnimatePresence><span>Cr</span></div><div className="leader">{leader?<><span className="team-mini" style={{color:leader.color}}>{leader.short}</span><span>{leader.name}</span><span className="leading-label">LEADING</span></>:<><Gavel size={15}/><span>Be the first to raise the paddle</span></>}</div></div>}
export function AuctionCountdown({seconds,max,status,timer}:{seconds:number;max:number;status:Auction['status'];timer:number}){return <div className={`countdown ${seconds<=3&&status==='live'?'urgent':''}`}><div><span>{status==='live'?<><span className="live-dot"/> GOING ONCE. GOING TWICE.</>:status==='complete'?'AUCTION COMPLETE':'THE HAMMER HAS FALLEN'}</span><strong>{status==='live'?`${seconds.toString().padStart(2,'0')}s`:'00s'}</strong></div><div className="timer-track" role="progressbar" aria-label="Auction time remaining" aria-valuenow={seconds} aria-valuemin={0} aria-valuemax={max}><span style={{width:`${Math.min(100,seconds/max*100)}%`}}/></div><p>{status==='live'?`Every new bid resets the clock to ${timer} seconds`:status==='complete'?'Review every squad on the dashboard':'Next player opens automatically'}</p></div>}

export function BidControlPanel({state,me,busy,onBid}:{state:Auction;me:Viewer;busy:boolean;onBid:()=>void}){
 const team=state.teams.find(t=>t.id===me.team);
 if(!team)return <div className="bid-controls"><p className="data-note">You are spectating. Franchises can only be claimed before the auction starts.</p></div>;
 if(state.status!=='live')return <div className="bid-controls"><p className="data-note" role="status">{state.status==='complete'?'Auction complete.':'Lot closed. Next player coming up…'}</p></div>;
 const amount=nextBidAmount(state),leading=state.leader===team.id,problem=eligibility(state,team,amount);
 return <div className="bid-controls"><Button className="bid-button" disabled={busy||leading||!!problem} onClick={onBid} aria-keyshortcuts="B"><Gavel size={19}/>{leading?'You’re leading the auction':problem??`Place bid · ${money(amount)} Cr`}<ArrowRight size={18}/></Button><div className="bid-meta"><span>Increment <b>₹{BID_INCREMENT} L</b></span><span>Playing as <b style={{color:team.color}}>{team.name}</b></span><span>Press <kbd>B</kbd> to bid</span></div></div>;
}

const fmt=(n:number|null|undefined,rate=false)=>n==null||!Number.isFinite(n)?'—':rate?n.toFixed(2):Math.round(n).toLocaleString('en-IN');
export function PlayerStatsPanel({player:p}:{player:Player}){
 const c=p.career,f=p.form,allRounder=p.role.toLowerCase().includes('all'),bowler=p.role.toLowerCase()==='bowler';
 const metric=(label:string,value:number|null|undefined,rate=false)=><div key={label}><strong>{fmt(value,rate)}</strong><span>{label}</span></div>;
 return <section className="stats-panel" aria-label={`${p.name} career statistics`}>
 <div className="ovr-breakdown"><OvrBadge player={p}/><div><strong>Estimated OVR</strong><p className="data-note">{p.rating.note} Confidence {p.rating.confidence}%. Cutoff {p.rating.cutoff}. Career context model; no reputation bonus.</p></div></div>
 <div className="form-heading"><strong>{c?.competition??'Career stats unavailable'}</strong><span className="eyebrow muted">CAREER RECORD · OBSERVED</span></div>
 {c?<><p className="data-note">{c.fallback?'T20 career fallback · IPL career statistics unavailable.':'IPL career totals across seasons.'} {c.matches} matches.</p>
 {(!bowler||allRounder)&&<div className="career-discipline"><h4>Batting</h4><div className="season-stats">{metric('RUNS',c.batting?.runs)}{metric('AVERAGE',c.batting?.average,true)}{metric('STRIKE RATE',c.batting?.strikeRate,true)}</div></div>}
 {(bowler||allRounder)&&<div className="career-discipline"><h4>Bowling</h4><div className="season-stats bowling-stats">{metric('WICKETS',c.bowling?.wickets)}{metric('ECONOMY',c.bowling?.economy,true)}{metric('AVERAGE',c.bowling?.average,true)}{metric('STRIKE RATE',c.bowling?.strikeRate,true)}</div></div>}
 <p className="data-note">Source: <a href={c.source} target="_blank" rel="noreferrer">{c.provider} ↗</a> · Retrieved {c.asOf}.</p>
 </>:<p className="data-note">Neither IPL nor T20 career statistics could be verified in this snapshot. No values have been estimated.</p>}
 {f&&p.rating.basis==='ipl'&&<div className="career-discipline recent-season"><h4>{p.formCompetition} {p.formSeason} season · observed</h4><div className="season-stats">{metric('MATCHES',f.matches)}{f.batting.innings>0&&metric('RUNS',f.batting.runs)}{f.batting.balls>0&&metric('BAT SR',f.batting.runs/f.batting.balls*100,true)}{f.bowling.innings>0&&metric('WICKETS',f.bowling.wickets)}{f.bowling.balls>0&&metric('ECONOMY',f.bowling.runs/(f.bowling.balls/6),true)}</div><p className="data-note">Aggregated from covered Cricsheet deliveries (ODC Attribution 1.0). Season form is separate from career-based OVR.</p></div>}
 <Link className="text-link" href="/play?tab=compare">Compare players &amp; rating explanation ↗</Link><p className="data-note">— means unavailable, not zero. <a href={p.squadSource} target="_blank" rel="noreferrer">2026 registration: {p.seasonTeam} ↗</a></p>
 </section>;
}

export function PlayerDirectory(){
 const [query,setQuery]=useState(''),[selected,setSelected]=useState<Player|null>(null);
 const matches=players.filter(p=>`${p.name} ${p.country} ${p.role} ${p.seasonTeam}`.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>b.rating.value-a.rating.value);
 return <section className="player-directory"><div className="section-heading"><div><span className="eyebrow gold">SCOUT THE FULL POOL</span><h3>{dataset.total} registered players</h3></div></div>
 <label htmlFor="player-search">Find a player, role, country or IPL team</label><input id="player-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search the player pool…"/>
 <div className="directory-results">{matches.slice(0,24).map(p=><button key={p.id} aria-pressed={selected?.id===p.id} onClick={()=>setSelected(p)}><span>{p.name}<small>{p.country} · {p.role}</small></span><OvrBadge player={p} size="sm"/></button>)}</div>
 <p className="data-note" role="status">{matches.length===0?'No players match your search.':`Showing ${Math.min(24,matches.length)} of ${matches.length} matches, highest OVR first.`}</p>
 {selected&&<div className="scout-preview"><div className="section-heading"><h3>{selected.name}</h3><Button variant="ghost" onClick={()=>setSelected(null)} aria-label="Close player preview"><X size={18}/></Button></div><PlayerStatsPanel player={selected}/></div>}
 </section>;
}

export function FranchisePurseCard({team,leading,mine}:{team:Franchise;leading:boolean;mine:boolean}){return <div className={`franchise-row ${leading?'is-leading':''}`}><span className="team-badge" style={{color:team.color,background:`${team.color}12`}}><Shield size={30}/><b>{team.short}</b></span><div><strong>{team.name}{mine&&<small>YOU</small>}</strong><span>{team.manager} <i>•</i> {team.squad.length}/{SQUAD_MAX} players <i>•</i> {overseasCount(team)}/{OVERSEAS_MAX} overseas</span><div className="purse-track"><span style={{width:`${team.purse/STARTING_PURSE*100}%`,background:team.color}}/></div></div><div className="purse-value">{money(team.purse)}<small>Cr left</small></div></div>}
export function LiveBidHistory({state}:{state:Auction}){return <details className="history-panel" open><summary><span><Radio size={15}/> Bid history</span><span className="count-badge">{state.history.length}</span></summary><div className="history-list">{state.history.length?state.history.slice(0,5).map((h,i)=><motion.div initial={{opacity:0,x:8}} animate={{opacity:1,x:0}} key={h.id} className="history-row"><span className={`history-dot ${i===0?'latest':''}`}/><div><strong>{state.teams.find(t=>t.id===h.team)?.name}</strong><small>{i===0?'Latest bid':'Accepted bid'} · {new Date(h.at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</small></div><b>{money(h.amount)} <small>Cr</small></b></motion.div>):<div className="empty-history"><Gavel size={22}/><span>The stage is set.<br/>The first bid could be yours.</span></div>}</div><div className="history-foot"><Shield size={12}/> {state.code==='SOLO'?'Local simulation · rules validated on this device':'Bids validated by the room server'}</div></details>}
export function UpcomingPlayerCarousel({state}:{state:Auction}){const ref=useRef<HTMLDivElement>(null);const upcoming=state.order.slice(state.index+1,state.index+13).map(id=>playerById.get(id)!);return <section className="upcoming"><div className="section-heading"><div><span className="eyebrow muted">THE TALENT PIPELINE</span><h3>Next under the hammer <span>{Math.max(0,state.order.length-state.index-1)} players</span></h3></div><div className="carousel-controls"><Button variant="outline" aria-label="Previous upcoming players" onClick={()=>ref.current?.scrollBy({left:-270,behavior:'smooth'})}><ChevronLeft size={17}/></Button><Button variant="outline" aria-label="Next upcoming players" onClick={()=>ref.current?.scrollBy({left:270,behavior:'smooth'})}><ChevronRight size={17}/></Button></div></div><div className="queue" ref={ref}>{upcoming.map((p,i)=><article className="queue-card" key={p.id}><span className="queue-position">{String(i+1).padStart(2,'0')}</span><div className="queue-portrait" style={{color:p.color}}>{p.initials}</div><div><h4>{p.name}</h4><p>{p.country} · {p.role}</p><span>{money(p.base)} Cr <small>BASE</small></span></div><b className="queue-rating">{p.rating.value}<small>OVR</small></b></article>)}</div></section>}

/** Live room data with 1 s polling and server clock offset. */
export function useRoom(code:string){
 const [data,setData]=useState<RoomData|null>(null),[missing,setMissing]=useState(false),[offline,setOffline]=useState(false),[offset,setOffset]=useState(0),[time,setTime]=useState(()=>Date.now());
 const version=useRef(-1);
 const accept=useCallback((d:RoomData)=>{if(d.state.version>=version.current){version.current=d.state.version;setData(d);}setOffset(d.serverNow-Date.now());setTime(Date.now());},[]);
 const refresh=useCallback(async()=>{try{const r=await fetch(`/api/rooms/${code}`,{cache:'no-store'});if(r.status===404){setMissing(true);return;}if(!r.ok)throw Error();accept(await r.json());setOffline(false);}catch{setOffline(true);}},[code,accept]);
 useEffect(()=>{void refresh();const t=setInterval(()=>{setTime(Date.now());void refresh();},1000);const fast=setInterval(()=>setTime(Date.now()),250);return()=>{clearInterval(t);clearInterval(fast);};},[refresh]);
 const send=useCallback(async(body:Record<string,unknown>)=>{const r=await fetch(`/api/rooms/${code}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,key:crypto.randomUUID()})});const d=await r.json();if(d.state){version.current=-1;accept(d);}if(!r.ok)throw Error(d.error??'Request failed');setOffline(false);},[code,accept]);
 return {data,missing,offline,now:time+offset,refresh,send};
}

function ShareLink({code}:{code:string}){
 const [copied,setCopied]=useState(false),[url,setUrl]=useState(`/room/${code}`);
 useEffect(()=>setUrl(`${window.location.origin}/room/${code}`),[code]);
 return <div className="share-link"><label htmlFor="share-url">Invite link</label><div><input id="share-url" readOnly value={url} onFocus={e=>e.currentTarget.select()}/><Button variant="outline" onClick={async()=>{try{await navigator.clipboard.writeText(url);setCopied(true);setTimeout(()=>setCopied(false),2000);}catch{}}}>{copied?<Check size={15}/>:<Copy size={15}/>}{copied?'Copied':'Copy'}</Button></div><p className="data-note">Room code <b className="room-code">{code}</b> · Friends open this link to pick a franchise.</p></div>;
}

export function TimerPicker({value,onChange,disabled,name='bid-timer'}:{value:BidTimer;onChange:(t:BidTimer)=>void;disabled?:boolean;name?:string}){
 return <fieldset className="timer-picker" disabled={disabled}><legend><Timer size={14}/> Bid timer</legend>{BID_TIMERS.map(t=><label key={t} className={value===t?'selected':''}><input type="radio" name={name} value={t} checked={value===t} onChange={()=>onChange(t)}/>{t}s</label>)}</fieldset>;
}

function RoomLobby({state,me,send,busy,setBusy,setError}:{state:Auction;me:Viewer;send:(b:Record<string,unknown>)=>Promise<void>;busy:boolean;setBusy:(b:boolean)=>void;setError:(e:string)=>void}){
 const [name,setName]=useState(''),[pick,setPick]=useState<string|null>(null);
 useEffect(()=>{const saved=localStorage.getItem('atg-name');if(saved)setName(saved);},[]);
 const run=async(body:Record<string,unknown>)=>{setBusy(true);setError('');try{await send(body);}catch(e){setError(e instanceof Error?e.message:'Request failed');}finally{setBusy(false);}};
 const joined=activeTeams(state);
 return <section className="room-lobby">
  <div className="lobby-main">
   <span className="eyebrow gold">ROOM {state.code}</span>
   <h2>{me.team?'You’re in. Waiting for the host…':'Pick your franchise'}</h2>
   <p className="muted">{SQUAD_MAX} players per squad · max {OVERSEAS_MAX} overseas · {money(STARTING_PURSE)} Cr purse · {state.timer}s bid timer</p>
   {!me.team&&<form className="join-form" onSubmit={e=>{e.preventDefault();if(!pick)return setError('Choose a franchise first.');localStorage.setItem('atg-name',name.trim());void run({action:'join',team:pick,name:name.trim()});}}>
    <label htmlFor="manager-name">Your name</label><input id="manager-name" required maxLength={24} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Adish"/>
    <div className="franchise-grid" role="radiogroup" aria-label="Franchise">{state.teams.map(t=><button type="button" role="radio" aria-checked={pick===t.id} key={t.id} disabled={!!t.manager} className={`franchise-pick ${pick===t.id?'selected':''}`} style={{'--team':t.color} as React.CSSProperties} onClick={()=>setPick(t.id)}><b>{t.short}</b><span>{t.name}</span><small>{t.manager?`Taken by ${t.manager}`:'Available'}</small></button>)}</div>
    <Button type="submit" disabled={busy||!pick||!name.trim()}>Claim franchise <ArrowRight size={16}/></Button>
   </form>}
   {me.host&&<div className="host-panel"><span className="eyebrow muted"><Crown size={13}/> HOST CONTROLS</span><TimerPicker value={state.timer} disabled={busy} onChange={t=>void run({action:'timer',timer:t})}/><Button variant="outline" disabled={busy||!me.team||joined.length===10} onClick={()=>void run({action:'bots'})}>Fill empty seats with bots</Button><Button disabled={busy||joined.length<1} onClick={()=>void run({action:'start'})}><Play size={16}/>{joined.length<1?'Claim a franchise to start':`Start auction with ${joined.length} franchises`}</Button></div>}
  </div>
  <aside className="lobby-side"><ShareLink code={state.code}/><div className="joined-list"><span className="eyebrow muted"><Users size={13}/> IN THE ROOM · {joined.length}/10</span>{joined.length?joined.map(t=><div key={t.id} className="joined-row"><span className="team-mini" style={{color:t.color}}>{t.short}</span><span>{t.manager}</span>{t.id===me.team&&<small>YOU</small>}</div>):<p className="data-note">No franchises claimed yet.</p>}</div></aside>
 </section>;
}

export function AuctionRoom({code}:{code:string}){
 const {data,missing,offline,now,refresh,send}=useRoom(code);
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const bidNow=useCallback(async()=>{setBusy(true);setError('');try{await send({action:'bid'});}catch(e){setError(e instanceof Error?e.message:'Bid failed');}finally{setBusy(false);}},[send]);
 useEffect(()=>{const h=(e:KeyboardEvent)=>{if(e.key.toLowerCase()!=='b'||e.repeat||(e.target as HTMLElement).closest('input,textarea'))return;if(data?.state.status==='live'&&data.me.team&&!busy)void bidNow();};window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h);},[data,busy,bidNow]);
 if(missing)return <><Header/><main className="lobby"><span className="eyebrow gold">ROOM NOT FOUND</span><h1>This auction room doesn’t exist.</h1><p className="muted">It may have expired or the server restarted.</p><Link className="button button-gold" href="/lobby">Create a new room <ArrowRight size={16}/></Link></main></>;
 const state=data?.state,me=data?.me??{team:null,host:false};
 const seconds=state?Math.max(0,Math.ceil((state.deadline-now)/1000)):0;
 const myTeam=state?.teams.find(t=>t.id===me.team);
 return <MotionConfig reducedMotion="user"><Header/><main className="room">
 <div className="breadcrumbs"><Link href="/lobby">Play with friends</Link><ChevronRight size={12}/><span>Auction room</span><span className="session-tag">ROOM / {code.toUpperCase()}</span></div>
 <div className="room-heading"><div><div className="eyebrow gold">BUILD YOUR SQUAD. WRITE YOUR LEGACY.</div><h1>The auction room<span className="gold">.</span></h1><p>{myTeam?<>Managing <b style={{color:myTeam.color}}>{myTeam.name}</b></>:'Claim a franchise to bid'}</p></div><div className="room-actions"><span className="room-status"><span className="live-dot"/>{offline?'RECONNECTING':state?.status==='lobby'?'WAITING ROOM':'LIVE ROOM'}</span><Button asChild variant="outline"><Link href={`/room/${code}/squad`}><LayoutDashboard size={16}/> Squad dashboard</Link></Button></div></div>
 {offline&&<div role="status" className="error-banner">Reconnecting to the room server… Bidding is temporarily unavailable. <button onClick={()=>void refresh()}>Retry now</button></div>}
 {error&&<div role="alert" className="error-banner">{error}<button onClick={()=>setError('')} aria-label="Dismiss error"><X size={14}/></button></div>}
 {!state?<div className="loading-grid" aria-label="Loading auction" aria-busy="true"><div className="skeleton"/><div className="skeleton"/><div className="skeleton"/></div>
 :state.status==='lobby'?<RoomLobby state={state} me={me} send={send} busy={busy} setBusy={setBusy} setError={setError}/>
 :<>{(()=>{const p=currentPlayer(state);const leader=state.teams.find(t=>t.id===state.leader);const max=state.history.length?state.timer:Math.max(10,state.timer);return <>
  <div className="auction-toolbar"><span><span className="live-dot"/> {state.status==='live'?'ON THE BLOCK':state.status==='complete'?'AUCTION COMPLETE':'LOT CLOSED'}</span><span>LOT {String(state.index+1).padStart(3,'0')} OF {state.order.length} <i>/</i> {state.timer}s TIMER</span></div>
  {state.status==='complete'?<div className="complete-panel"><h2>The hammer has fallen for the last time.</h2><p className="muted">Every squad is locked in.</p><Button asChild><Link href={`/room/${code}/squad`}><LayoutDashboard size={16}/> View all squads</Link></Button></div>:
  <div className="auction-grid"><AuctionPlayerCard player={p} status={state.status} lot={state.index+1}/><section className="bidding-stage"><div className="stage-heading"><span className="eyebrow muted">THE WINNING MOVE IS YOURS</span><Gavel size={17}/></div><CurrentBidDisplay amount={state.bid||p.base} leader={leader}/><AuctionCountdown seconds={seconds} max={max} status={state.status} timer={state.timer}/><BidControlPanel state={state} me={me} busy={busy||offline} onBid={()=>void bidNow()}/><PlayerStatsPanel player={p}/></section>
  <aside><details className="franchises" open><summary><span><Users size={15}/> The franchises</span><span className="count-badge">{String(activeTeams(state).length).padStart(2,'0')}</span></summary>{activeTeams(state).map(t=><FranchisePurseCard key={t.id} team={t} leading={state.leader===t.id} mine={t.id===me.team}/>)}</details><LiveBidHistory state={state}/></aside></div>}
  {state.status!=='complete'&&<UpcomingPlayerCarousel state={state}/>}
  {state.status==='live'&&myTeam&&<div className="mobile-bid-dock"><div><span>CURRENT LOT</span><strong>{money(state.bid||p.base)} <small>Cr</small></strong></div><span className="dock-timer">{seconds}s</span><Button disabled={busy||offline||state.leader===myTeam.id||!!eligibility(state,myTeam)} onClick={()=>void bidNow()}>{state.leader===myTeam.id?'You’re leading':`Bid ${money(nextBidAmount(state))} Cr`}<Gavel size={15}/></Button></div>}
 </>;})()}</>}
 <PlayerDirectory/>
 <footer className="room-footer"><span><Shield size={12}/> <Link href="/data-sources">Player data, ratings &amp; attribution ↗</Link></span><span>Rooms live in server memory and reset if the server restarts.</span></footer>
 </main></MotionConfig>;
}

export function SquadDashboard({code}:{code:string}){
 const {data,missing}=useRoom(code);
 const [view,setView]=useState<string|null>(null);
 if(missing)return <><Header/><main className="lobby"><h1>Room not found.</h1><Link className="text-link" href="/lobby">Create a new room →</Link></main></>;
 if(!data)return <><Header/><main className="room"><div className="loading-grid" aria-busy="true" aria-label="Loading squads"><div className="skeleton"/></div></main></>;
 const {state,me}=data,teams=activeTeams(state);
 const selected=state.teams.find(t=>t.id===(view??me.team??teams[0]?.id));
 return <MotionConfig reducedMotion="user"><Header/><main className="room dashboard">
  <div className="breadcrumbs"><Link href={`/room/${code}`}>Auction room</Link><ChevronRight size={12}/><span>Squad dashboard</span><span className="session-tag">ROOM / {state.code}</span></div>
  <div className="room-heading"><div><div className="eyebrow gold">YOUR WAR ROOM</div><h1>Squad dashboard<span className="gold">.</span></h1><p>{state.status==='complete'?'Auction complete — final squads.':'Updates live as the hammer falls.'}</p></div><Button asChild variant="outline"><Link href={`/room/${code}`}><Gavel size={16}/> Back to auction</Link></Button></div>
  {teams.length===0?<p className="muted">No franchises have joined yet.</p>:<>
  <div className="team-tabs" role="tablist" aria-label="Franchises">{teams.map(t=><button key={t.id} role="tab" aria-selected={selected?.id===t.id} onClick={()=>setView(t.id)} style={{'--team':t.color} as React.CSSProperties}><b>{t.short}</b>{t.id===me.team?' · You':''}</button>)}</div>
  {selected&&<SquadSheet team={selected} mine={selected.id===me.team}/>}</>}
 </main></MotionConfig>;
}

function SquadSheet({team,mine}:{team:Franchise;mine:boolean}){
 const roster=team.squad.map(s=>({...s,player:playerById.get(s.playerId)!})).sort((a,b)=>b.player.rating.value-a.player.rating.value);
 const spent=STARTING_PURSE-team.purse,avg=roster.length?Math.round(roster.reduce((n,r)=>n+r.player.rating.value,0)/roster.length):null;
 const roles=['Batter','Wicketkeeper batter','All-rounder','Bowler'].map(r=>[r,roster.filter(x=>x.player.role===r).length] as const);
 return <section className="squad-sheet" aria-label={`${team.name} squad`} style={{'--team':team.color} as React.CSSProperties}>
  <header><div><span className="eyebrow muted">{mine?'YOUR FRANCHISE':'RIVAL FRANCHISE'} · {team.manager}</span><h2>{team.name}</h2></div><div className="squad-kpis">
   <div><strong>{roster.length}<small>/{SQUAD_MAX}</small></strong><span>Players</span></div>
   <div><strong>{overseasCount(team)}<small>/{OVERSEAS_MAX}</small></strong><span>Overseas</span></div>
   <div><strong>{money(team.purse)}</strong><span>Purse left</span></div>
   <div><strong>{money(spent)}</strong><span>Spent</span></div>
   <div><strong>{avg??'—'}</strong><span>Avg OVR</span></div>
  </div></header>
  <div className="role-split">{roles.map(([r,n])=><span key={r}>{r} <b>{n}</b></span>)}</div>
  {roster.length?<table className="squad-table"><thead><tr><th scope="col">Player</th><th scope="col">Role</th><th scope="col">OVR</th><th scope="col">Price</th></tr></thead><tbody>{roster.map(r=><tr key={r.playerId}><td><b>{r.player.name}</b><small>{r.player.country}{r.overseas&&<span className="os-tag">OS</span>}</small></td><td>{r.player.role}</td><td><OvrBadge player={r.player} size="sm"/></td><td>{money(r.price)} Cr</td></tr>)}</tbody></table>
  :<div className="empty-history"><Users/><span>{mine?'Your squad starts with your first winning bid.':'No signings yet.'}</span></div>}
 </section>;
}

export function CreateRoomForm(){
 const router=useRouter();
 const [timer,setTimer]=useState<BidTimer>(10),[busy,setBusy]=useState(false),[error,setError]=useState(''),[joinCode,setJoinCode]=useState('');
 async function create(){setBusy(true);setError('');try{const r=await fetch('/api/rooms',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({timer})});const d=await r.json();if(!r.ok)throw Error(d.error);router.push(`/room/${d.code}`);}catch(e){setError(e instanceof Error?e.message:'Could not create room');setBusy(false);}}
 return <div className="create-grid">
  <article className="league-card"><div className="league-art"><Crown size={64}/><span>HOST AN<br/>AUCTION</span><small>UP TO 10 FRANCHISES</small></div><div><h2>Create a room</h2><p className="muted">You’ll get a link to share. Everyone who opens it picks one of the ten IPL franchises.</p><div className="league-facts"><span><Users size={16}/> {SQUAD_MAX} players · {OVERSEAS_MAX} overseas</span><span><Gavel size={16}/> {money(STARTING_PURSE)} Cr purse</span></div><TimerPicker value={timer} onChange={setTimer} name="create-timer"/>{error&&<p role="alert" className="error-banner">{error}</p>}<Button disabled={busy} onClick={()=>void create()}>{busy?'Creating…':'Create auction room'} <ArrowRight size={17}/></Button></div></article>
  <form className="league-card join-card" onSubmit={e=>{e.preventDefault();const c=joinCode.trim().toUpperCase();if(c)router.push(`/room/${c}`);}}><h2>Have a code?</h2><label htmlFor="join-code">Room code</label><input id="join-code" value={joinCode} onChange={e=>setJoinCode(e.target.value)} maxLength={6} placeholder="ABC123" autoCapitalize="characters"/><Button variant="outline" type="submit" disabled={!joinCode.trim()}>Join room <ArrowRight size={16}/></Button></form>
 </div>;
}
