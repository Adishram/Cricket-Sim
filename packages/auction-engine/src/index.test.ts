import {describe,it,expect} from 'vitest';
import {createAuction,claim,start,bid,settle,next,tick,setTimer,currentPlayer,OPENING_MIN_MS,RESULT_PAUSE_MS,STARTING_PURSE,FRANCHISES} from './index';
import {playerById} from '../../cricket-data/src/players';
const room=(timer:5|10|15|20=10)=>{const s=createAuction('ROOM01',timer,0);claim(s,'mi','Aman');claim(s,'csk','Ben');start(s,0);return s;};
describe('multiplayer auction engine',()=>{
 it('uses the ten real IPL franchises',()=>{const s=createAuction('X',10,0);expect(s.teams.map(t=>t.name)).toContain('Royal Challengers Bengaluru');expect(s.teams).toHaveLength(10);expect(FRANCHISES.map(f=>f[0])).toContain('srh');});
 it('allows one claimed franchise and blocks double claims',()=>{const s=createAuction('X',10,0);claim(s,'mi','A');expect(()=>claim(s,'mi','B')).toThrow('already taken');start(s,0);expect(s.status).toBe('live');expect(()=>claim(s,'dc','C')).toThrow('started');});
 it('opens lots for at least 10 seconds and resets to the chosen timer on each bid',()=>{const s=room(5);expect(s.deadline).toBe(OPENING_MIN_MS);bid(s,'mi','a',1000);expect(s.deadline).toBe(6000);const t=room(20);expect(t.deadline).toBe(20000);});
 it('rejects invalid timers and locks timer after start',()=>{expect(()=>createAuction('X',7 as 5,0)).toThrow();const s=createAuction('X',5,0);setTimer(s,15);expect(s.timer).toBe(15);claim(s,'mi','A');claim(s,'dc','B');start(s,0);expect(()=>setTimer(s,20)).toThrow('locked');});
 it('rejects bids from unclaimed teams, self-raises and duplicate keys',()=>{const s=room();expect(()=>bid(s,'rcb','a',1)).toThrow('Unknown');bid(s,'mi','k',1);bid(s,'mi','k',2);expect(s.history).toHaveLength(1);expect(()=>bid(s,'mi','z',3)).toThrow('already leading');});
 it('settles once at the deadline and debits the winner',()=>{const s=room();const p=currentPlayer(s);bid(s,'mi','a',1);expect(()=>bid(s,'csk','b',10001)).toThrow('closed');settle(s,20000);settle(s,30000);const mi=s.teams.find(t=>t.id==='mi')!;expect(s.status).toBe('sold');expect(mi.purse).toBe(STARTING_PURSE-p.base);expect(mi.squad).toHaveLength(1);});
 it('auto-advances after the result pause',()=>{const s=room();tick(s,OPENING_MIN_MS);expect(s.status).toBe('unsold');tick(s,OPENING_MIN_MS+RESULT_PAUSE_MS);expect(s.status).toBe('live');expect(s.index).toBe(1);});
 it('enforces 15-player squads and 5 overseas players',()=>{const s=room();const mi=s.teams.find(t=>t.id==='mi')!;mi.squad=Array.from({length:15},()=>({playerId:'x',price:1,overseas:false}));expect(()=>bid(s,'mi','a',1)).toThrow('Squad is full');
  const overseasIndex=s.order.findIndex(id=>playerById.get(id)!.overseas);s.index=overseasIndex;mi.squad=Array.from({length:5},()=>({playerId:'x',price:1,overseas:true}));expect(()=>bid(s,'mi','b',1)).toThrow('Overseas');});
 it('completes when every franchise is full',()=>{const s=room();for(const t of s.teams)t.squad=Array.from({length:15},()=>({playerId:'x',price:1,overseas:false}));settle(s,OPENING_MIN_MS);next(s,OPENING_MIN_MS);expect(s.status).toBe('complete');});
 it('does not skip live lots',()=>{const s=room();expect(()=>next(s,1)).toThrow('Wait');});
 it('orders lots by official marquee and role sets',()=>{const s=room();expect(s.order).toHaveLength(575);expect(s.order).not.toContain('auction-20');expect(s.order).toContain('auction-19');expect(currentPlayer(s).auction?.setCode).toBe('M1');expect(playerById.get(s.order[6])?.auction?.setCode).toBe('M2');});
});
