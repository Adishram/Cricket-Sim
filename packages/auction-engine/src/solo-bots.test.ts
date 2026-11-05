import {expect,it} from 'vitest';
import {createSolo,willingness} from './solo';
import {players} from '../../cricket-data/src/players';
it('MI passes at three crore when it already has three keepers, with the purse held constant',()=>{
 const s=createSolo('rcb',42),mi=s.auction.teams.find(t=>t.id==='mi')!;
 const ishan=players.find(p=>p.name==='Ishan Kishan')!;
 s.auction.index=s.auction.order.indexOf(ishan.id);
 const empty=willingness(s,'mi');
 for(const name of [/Rishabh Pant/i,/Jitesh Sharma/i,/Bharat/i]){
  const p=players.find(p=>name.test(p.name)&&/keep/i.test(p.role))!;
  mi.squad.push({playerId:p.id,price:p.base,overseas:p.overseas});
 }
 const covered=willingness(s,'mi');
 expect(empty).toBeGreaterThan(300);expect(covered).toBeLessThan(300);
 console.info('Seed 42 · MI maximum valuation in lakh:',{empty,covered});
});
