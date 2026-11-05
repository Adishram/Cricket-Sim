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

import {skipLot} from './solo';
import {playerById,type Player} from '../../cricket-data/src/players';
import {bowlingKind} from '../../cricket-engine/src/matchup';
import {roleGroup} from '../../cricket-engine/src/selection';
import {makeSide} from '../../league-engine/src';
import {rosterValue,signingValue} from './squad-planner';
it('prefers the missing bowling style and does not buy OVR in isolation',()=>{
 const sample=players.find(p=>p.role==='Bowler')??players.find(p=>roleGroup(p)==='BOWL')!;
 const bowler=(id:string,style:string,rating:number,ovr:number):Player=>({...sample,id,overseas:false,role:'Bowler',bowl:style,rating:{...sample.rating,bowling:rating,value:ovr}});
 const pace=Array.from({length:4},(_,i)=>bowler('pace'+i,'Right arm fast',90,96));
 const spinner=bowler('spin','leg break',72,72),duplicate=bowler('duplicate','Left arm fast',84,99);
 const before=rosterValue(pace);
 expect(signingValue(pace,spinner,before)).toBeGreaterThan(signingValue(pace,duplicate,before));
 expect(signingValue(pace,{...spinner,rating:{...spinner.rating,value:99}},before)).toBe(signingValue(pace,spinner,before));
});
it.each([7,42,314])('assembles balanced squads in a complete auction (seed %i)',seed=>{
 const s=createSolo('rcb',seed);
 for(let lot=0;lot<600&&s.auction.status!=='complete';lot++)skipLot(s);
 expect(s.auction.status).toBe('complete');
 for(const t of s.auction.teams.filter(t=>t.id!==s.human)){
  const ids=t.squad.map(x=>x.playerId),ps=ids.map(id=>playerById.get(id)!);
  const count=(g:string)=>ps.filter(p=>roleGroup(p)===g).length;
  const styles=ps.filter(p=>['AR','BOWL'].includes(roleGroup(p))).map(p=>bowlingKind(p.bowl));
  const check=seed+' '+t.short;
  expect(ids.length,check).toBe(25);expect(t.purse,check).toBeGreaterThanOrEqual(0);
  expect(count('BAT'),check).toBeGreaterThanOrEqual(4);expect(count('WK'),check).toBeGreaterThanOrEqual(2);
  expect(count('AR'),check).toBeGreaterThanOrEqual(2);expect(count('BOWL'),check).toBeGreaterThanOrEqual(4);
  expect(styles.filter(x=>x==='pace').length,check).toBeGreaterThanOrEqual(2);
  expect(styles.filter(x=>x==='spin').length,check).toBeGreaterThanOrEqual(1);
  const xi=makeSide(t.id,ids).xi;expect(xi,check).toHaveLength(11);
  expect(xi.filter(p=>p.overseas).length,check).toBeLessThanOrEqual(4);
 }
});
