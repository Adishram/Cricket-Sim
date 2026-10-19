import {isIplEligible} from '../../cricket-data/src/ipl-eligibility';
import {auctionOrder,playerById} from '../../cricket-data/src/players';
export const SQUAD_MAX=15;
export const OVERSEAS_MAX=5;
export const STARTING_PURSE=12000; // integer lakh (₹120 Cr)
export const BID_INCREMENT=25;
export const BID_TIMERS=[5,10,15,20] as const;
export type BidTimer=typeof BID_TIMERS[number];
/** Minimum time a new lot stays open before the first bid, so everyone can read the card. */
export const OPENING_MIN_MS=10000;
/** Pause after the hammer before the next lot opens automatically. */
export const RESULT_PAUSE_MS=4000;
export const FRANCHISES=[
 ['csk','Chennai Super Kings','CSK','#facc15'],
 ['dc','Delhi Capitals','DC','#60a5fa'],
 ['gt','Gujarat Titans','GT','#7dd3fc'],
 ['kkr','Kolkata Knight Riders','KKR','#a78bfa'],
 ['lsg','Lucknow Super Giants','LSG','#22d3ee'],
 ['mi','Mumbai Indians','MI','#3b82f6'],
 ['pbks','Punjab Kings','PBKS','#f87171'],
 ['rr','Rajasthan Royals','RR','#f472b6'],
 ['rcb','Royal Challengers Bengaluru','RCB','#ef4444'],
 ['srh','Sunrisers Hyderabad','SRH','#fb923c'],
] as const;
export type SquadEntry={playerId:string;price:number;overseas:boolean};
export type Franchise={id:string;name:string;short:string;color:string;purse:number;squad:SquadEntry[];manager:string|null};
export type Status='lobby'|'live'|'sold'|'unsold'|'complete';
export type Auction={
 squadMax?:number;overseasMax?:number;code:string;status:Status;timer:BidTimer;order:string[];index:number;bid:number;leader:string|null;
 deadline:number;closedAt:number;history:{id:number;team:string;amount:number;at:number}[];
 teams:Franchise[];version:number;seen:string[];
};
export const money=(lakh:number)=>`₹${(lakh/100).toFixed(2)}`;
export const overseasCount=(t:Franchise)=>t.squad.filter(s=>s.overseas).length;
export const currentPlayer=(s:Auction)=>playerById.get(s.order[s.index])!;
export const nextBidAmount=(s:Auction)=>s.bid?s.bid+BID_INCREMENT:currentPlayer(s).base;
const timerMs=(s:Auction)=>s.timer*1000;
/** Official 2025 register order; no rating-based reshuffling. */
export const defaultOrder=()=>[...auctionOrder];
export function createAuction(code:string,timer:BidTimer,now:number):Auction{
 if(!BID_TIMERS.includes(timer))throw Error('Bid timer must be 5, 10, 15 or 20 seconds.');
 return {code,status:'lobby',timer,order:defaultOrder(),index:0,bid:0,leader:null,deadline:now,closedAt:0,history:[],version:0,seen:[],
  teams:FRANCHISES.map(([id,name,short,color])=>({id,name,short,color,purse:STARTING_PURSE,squad:[],manager:null}))};
}
export const activeTeams=(s:Auction)=>s.teams.filter(t=>t.manager);
export function eligibility(s:Auction,t:Franchise,amount=nextBidAmount(s)){
 if(!isIplEligible(currentPlayer(s).id))return 'This player has retired from the IPL.';
 if(t.squad.length>=(s.squadMax??SQUAD_MAX))return `Squad is full (${s.squadMax??SQUAD_MAX} players).`;
 if(currentPlayer(s).overseas&&overseasCount(t)>=(s.overseasMax??OVERSEAS_MAX))return `Overseas player limit reached (${s.overseasMax??OVERSEAS_MAX}).`;
 if(t.purse<amount)return 'Insufficient purse.';
 if(!Number.isInteger(amount)||amount<0)return 'Invalid price.';
 if(s.teams.some(team=>team.squad.some(x=>x.playerId===currentPlayer(s).id)))return 'Player already owned.';
 if(t.purse-amount<Math.max(0,(s.squadMax??SQUAD_MAX)-1-t.squad.length)*30)return 'Reserve enough purse to complete the squad.';
 const ps=t.squad.map(x=>playerById.get(x.playerId)).filter(Boolean);
 const keepers=ps.filter(p=>/keep/i.test(p!.role)).length,bowlers=ps.filter(p=>/bowl|all/i.test(p!.role)).length;
 const needs=(keepers?0:1)+Math.max(0,5-bowlers),remaining=(s.squadMax??SQUAD_MAX)-t.squad.length;
 if(remaining<=needs){const role=currentPlayer(s).role;if(!keepers&&/keep/i.test(role))return null;if(bowlers<5&&/bowl|all/i.test(role))return null;return 'Reserve remaining slots for a wicketkeeper and five bowling options.';}

 return null;
}
export function claim(s:Auction,teamId:string,manager:string){
 if(s.status!=='lobby')throw Error('The auction has started. New franchises cannot join.');
 const team=s.teams.find(t=>t.id===teamId);
 if(!team)throw Error('Unknown franchise.');
 if(team.manager)throw Error(`${team.name} is already taken.`);
 team.manager=manager;s.version++;
}
export function setTimer(s:Auction,timer:BidTimer){
 if(s.status!=='lobby')throw Error('The bid timer is locked once the auction starts.');
 if(!BID_TIMERS.includes(timer))throw Error('Bid timer must be 5, 10, 15 or 20 seconds.');
 s.timer=timer;s.version++;
}
function openLot(s:Auction,now:number){s.bid=0;s.leader=null;s.history=[];s.deadline=now+Math.max(OPENING_MIN_MS,timerMs(s));s.status='live';s.version++;}
export function start(s:Auction,now:number){
 if(s.status!=='lobby')throw Error('The auction has already started.');
 if(activeTeams(s).length<1)throw Error('At least one franchise is needed to start.');
 s.index=0;openLot(s,now);
}
const allFull=(s:Auction)=>activeTeams(s).every(t=>t.squad.length>=(s.squadMax??SQUAD_MAX));
/** Closes the current lot once its server deadline has passed. Idempotent. */
export function settle(s:Auction,now:number){
 if(s.status!=='live'||now<s.deadline)return;
 const p=currentPlayer(s);
 if(!isIplEligible(p.id)){s.leader=null;s.bid=0;}
 if(s.leader){const team=s.teams.find(t=>t.id===s.leader)!;team.purse-=s.bid;team.squad.push({playerId:p.id,price:s.bid,overseas:p.overseas});s.status='sold';}
 else s.status='unsold';
 s.closedAt=s.deadline;s.version++;
}
/** Moves to the next lot that at least one franchise can still legally bid on. */
export function next(s:Auction,now:number){
 settle(s,now);
 if(s.status==='live')throw Error('Wait for the current lot to close.');
 if(s.status==='lobby'||s.status==='complete')return;
 while(s.index<s.order.length-1){
  s.index++;
  if(allFull(s))break;
  if(activeTeams(s).some(t=>!eligibility(s,t)))return openLot(s,now);
 }
 s.status='complete';s.version++;
}
/** Advances time: settles expired lots and opens the next lot after the result pause. */
export function tick(s:Auction,now:number){
 settle(s,now);
 if((s.status==='sold'||s.status==='unsold')&&now>=s.closedAt+RESULT_PAUSE_MS)next(s,s.closedAt+RESULT_PAUSE_MS);
}
export function bid(s:Auction,teamId:string,key:string,now:number){
 if(s.seen.includes(key))return;
 settle(s,now);
 if(s.status!=='live')throw Error('This lot has closed.');
 const team=s.teams.find(t=>t.id===teamId);
 if(!team||!team.manager)throw Error('Unknown franchise.');
 if(s.leader===teamId)throw Error('Your franchise is already leading.');
 const amount=nextBidAmount(s),problem=eligibility(s,team,amount);
 if(problem)throw Error(problem);
 s.bid=amount;s.leader=teamId;s.deadline=now+timerMs(s);
 s.history.unshift({id:++s.version,team:teamId,amount,at:now});s.seen.push(key);
 // Keep command identities for the full demo auction lifetime.
}
