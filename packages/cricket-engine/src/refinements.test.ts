import {it,expect} from 'vitest';
import {createMatch,current,simulate,simulateFirstInnings,replay,restoreLineup,setTactics,probabilities,PITCHES} from './index';
import {autoRotation,rotationProblems,DEFAULT_BOWLING,type BowlingPlan} from './planning';
import {bowlingKind} from './matchup';
import {demoTeams} from '../../league-engine/src';
const match=()=>createMatch(demoTeams(),PITCHES[0],987654);
it('reserves pace for powerplay/death and spin for the middle, with a legal full rotation',()=>{const m=match(),side=m.teams[0],plan=autoRotation(side,m.pitch),isSpin=(id:string)=>bowlingKind(side.xi.find(p=>p.id===id)!.style)==='spin';expect(rotationProblems(side,plan)).toEqual([]);expect([...plan.slice(0,6),...plan.slice(15)].filter(id=>!isSpin(id)).length).toBeGreaterThanOrEqual(8);expect(plan.slice(6,15).filter(isSpin).length).toBeGreaterThanOrEqual(6);expect(autoRotation(side,m.pitch)).toEqual(plan);});
it('simulates only the first innings, is idempotent at the break, and then completes with reproducible replay',()=>{const m=match();simulateFirstInnings(m);expect(m.status).toBe('break');expect(m.innings).toHaveLength(1);expect(current(m).complete).toBe(true);const events=structuredClone(m.events);simulateFirstInnings(m);expect(m.events).toEqual(events);simulate(m);expect(m.status).toBe('complete');expect(replay(m).events).toEqual(m.events);});
it('restores XI, batting order and roles atomically without restoring old ratings or pitch',()=>{const m=match(),original=structuredClone(m),side=m.teams[0],ids=side.xi.map(p=>p.id).reverse();restoreLineup(m,0,{xi:ids,captain:side.captain,keeper:side.keeper});expect(m.teams[0].xi.map(p=>p.id)).toEqual(ids);expect(m.pitch).toEqual(original.pitch);expect(m.initial.teams).toEqual(m.teams);const valid=structuredClone(m);expect(()=>restoreLineup(m,0,{xi:['missing',...ids.slice(1)],captain:side.captain,keeper:side.keeper})).toThrow();expect(m).toEqual(valid);});
it('validates style-specific delivery menus and changes good-length seam and defensive spin probabilities',()=>{const m=match(),team=1-current(m).team,side=m.teams[team];const pace=side.xi.find(p=>bowlingKind(p.style)==='pace'&&/bowl|all/i.test(p.role))!,spin=side.xi.find(p=>bowlingKind(p.style)==='spin'&&/bowl|all/i.test(p.role))!;
 const set=(id:string,plan:BowlingPlan)=>{current(m).bowler=id;setTactics(m,team,{bowlingPlans:{[id]:plan}});return probabilities(m,'nailed');};
 const stock=set(pace.id,DEFAULT_BOWLING),seam=set(pace.id,{...DEFAULT_BOWLING,variation:'wobble-seam'});expect(seam.wicket).toBeGreaterThan(stock.wicket);expect(seam.four).toBeLessThan(stock.four);
 const spinStock=set(spin.id,DEFAULT_BOWLING),defence=set(spin.id,{...DEFAULT_BOWLING,line:'stumps',variation:'slider'});expect(defence.dot).toBeGreaterThan(spinStock.dot);
 expect(()=>set(spin.id,{...DEFAULT_BOWLING,variation:'outswing'})).toThrow('Invalid bowling plan');expect(()=>set(spin.id,{...DEFAULT_BOWLING,length:'yorker'})).toThrow('Invalid bowling plan');
 const attack=set(spin.id,{...DEFAULT_BOWLING,length:'full',variation:'flight'}),miss=probabilities(m,'missed');expect(attack.wicket).toBeGreaterThan(miss.wicket);expect(miss.six).toBeGreaterThan(attack.six);expect(Object.values(attack).reduce((a,b)=>a+b,0)).toBeCloseTo(1);expect(attack.wicket).toBeLessThan(.3);
});
it('keeps swing strongest with the new ball and accounts for defensive pressure before fuller spin',()=>{const m=match(),team=1-current(m).team,side=m.teams[team],pace=side.xi.find(p=>bowlingKind(p.style)==='pace'&&/bowl|all/i.test(p.role))!;current(m).bowler=pace.id;
 const gain=(balls:number)=>{current(m).balls=balls;setTactics(m,team,{bowlingPlans:{[pace.id]:DEFAULT_BOWLING}});const baseline=probabilities(m,'nailed').wicket;setTactics(m,team,{bowlingPlans:{[pace.id]:{...DEFAULT_BOWLING,variation:'outswing'}}});return probabilities(m,'nailed').wicket/baseline;};expect(gain(0)).toBeGreaterThan(gain(90));
});

it('plans speculative deliveries without changing the real match or its random stream',async()=>{
 const {botTactics}=await import('./bots');
 const m=match(),team=1-current(m).team,before=structuredClone(m);
 const choice=botTactics(m,team);
 expect(m).toEqual(before);expect(botTactics(m,team)).toEqual(choice);
 expect(Object.keys(choice.bowlingPlans??{})).not.toHaveLength(0);
 expect(()=>setTactics(m,team,choice)).not.toThrow();
});
