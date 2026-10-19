/** Observed ICC points; the adjustment weights below are game-design estimates. */
export type IccRanking={format:'t20'|'odi'|'test';discipline:'batting'|'bowling'|'allrounder';rank:number;points:number;leaderPoints:number;date:string;iccId:string;source:string};
export function rankingInfluence(rows:IccRanking[],cutoff:string){
 const accepted:IccRanking[]=[];const seen=new Set<string>();
 for(const r of [...rows].sort((a,b)=>b.date.localeCompare(a.date))){const key=`${r.format}:${r.discipline}`;
  if(!['t20','odi','test'].includes(r.format)||!['batting','bowling','allrounder'].includes(r.discipline)||!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||r.date>cutoff||r.date<`${Number(cutoff.slice(0,4))-1}${cutoff.slice(4)}`||!Number.isInteger(r.rank)||r.rank<1||r.rank>100||!Number.isFinite(r.points)||!Number.isFinite(r.leaderPoints)||r.points<0||r.leaderPoints<=0||r.points>r.leaderPoints||r.leaderPoints>1000||seen.has(key))continue;
  seen.add(key);accepted.push(r);
 }
 const adjustment=(kind:IccRanking['discipline'])=>accepted.filter(r=>r.discipline===kind).reduce((n,r)=>n+(kind==='allrounder'?{t20:1.6,odi:.9,test:.5}:{t20:4,odi:2,test:1.5})[r.format]*(r.points/r.leaderPoints)**2,0);
 return {batting:adjustment('batting'),bowling:adjustment('bowling'),allrounder:adjustment('allrounder'),entries:accepted};
}
