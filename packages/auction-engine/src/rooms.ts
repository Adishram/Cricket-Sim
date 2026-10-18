// In-memory room registry. Isolated to a single server process: rooms are lost on restart.
// Production requires transactional PostgreSQL and real authentication.
import {createAuction,claim,start,bid,setTimer,tick,type Auction,type BidTimer} from './index';
import {advanceSolo,type Solo} from './solo';
import {seedFrom} from '../../shared/src/random';
export type Room={state:Auction;host:string;seats:Map<string,string>;commands:Map<string,string>;touched:number;bots?:Solo};
export type Command=
 {action:'join';team:string;name:string;key:string}|
 {action:'start'|'bid'|'bots';key:string}|
 {action:'timer';timer:BidTimer;key:string};
const ROOM_TTL=6*3600000,MAX_ROOMS=500;
const ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function roomCode(random:()=>number=Math.random){return Array.from({length:6},()=>ALPHABET[Math.floor(random()*ALPHABET.length)]).join('');}
export function purge(rooms:Map<string,Room>,now:number){for(const [code,r] of rooms)if(now-r.touched>ROOM_TTL)rooms.delete(code);}
export function createRoom(rooms:Map<string,Room>,host:string,timer:BidTimer,now:number){
 purge(rooms,now);
 if(rooms.size>=MAX_ROOMS)throw Error('Too many active rooms. Try again later.');
 let code=roomCode();while(rooms.has(code))code=roomCode();
 rooms.set(code,{state:createAuction(code,timer,now),host,seats:new Map(),commands:new Map(),touched:now});
 return code;
}
export function getRoom(rooms:Map<string,Room>,code:string,now:number){
 const room=rooms.get(code.toUpperCase());
 if(!room)return null;
 room.touched=now;if(room.bots&&room.state.status!=='lobby')advanceSolo(room.bots,Math.max(0,now-room.bots.clock));else tick(room.state,now);
 return room;
}
export const viewer=(room:Room,identity:string)=>({team:room.seats.get(identity)??null,host:room.host===identity});
/** Applies a command for an identity. Team ownership is always resolved server-side. */
export function apply(room:Room,identity:string,cmd:Command,now:number){
 const fingerprint=JSON.stringify({...cmd,key:undefined});
 const previous=room.commands.get(cmd.key);
 if(previous){if(previous!==fingerprint)throw Error('Idempotency key already used for another command.');return;}
 const s=room.state,team=room.seats.get(identity);
 switch(cmd.action){
  case 'join':{
   if(team)throw Error('You already manage a franchise in this room.');
   claim(s,cmd.team,cmd.name);room.seats.set(identity,cmd.team);break;
  }
  case 'bots':{if(room.host!==identity)throw Error('Only the host can fill bot seats.');if(!team)throw Error('Claim a franchise first.');for(const t of s.teams)if(!t.manager)claim(s,t.id,'Bot · Balanced architect');room.bots={version:1,seed:seedFrom(s.code),initialSeed:seedFrom(s.code),human:team,clock:now,paused:false,auction:s,pending:null,decisions:0,round:1};break;}
  case 'timer':if(room.host!==identity)throw Error('Only the host can change the bid timer.');setTimer(s,cmd.timer);break;
  case 'start':if(room.host!==identity)throw Error('Only the host can start the auction.');start(s,now);if(room.bots)room.bots.clock=now;break;
  case 'bid':if(!team)throw Error('Join a franchise before bidding.');bid(s,team,cmd.key,now);break;
 }
 room.commands.set(cmd.key,fingerprint);

}
