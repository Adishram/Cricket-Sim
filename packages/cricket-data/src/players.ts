import iccData from './icc-rankings.json';
import type {IccRanking} from './icc';
import {isIplEligible} from './ipl-eligibility';
import snapshot from './snapshot.json';
import recentData from './recent-evidence.json';
import register from './auction-register.json';
import {computeRating,type Rating,type SeasonForm,type Evidence} from './rating';
export type {Rating} from './rating';
export type Career={competition:string;source:string;provider:string;asOf:string;coverage:string;matches:number;fallback:boolean;batting:{innings:number;runs:number|null;average:number|null;strikeRate:number|null}|null;bowling:{innings:number;wickets:number|null;economy:number|null;average:number|null;strikeRate:number|null}|null};
export type Player={id:string;name:string;country:string;role:string;bat:string;bowl:string;rating:Rating;form:SeasonForm|null;formSeason:number|null;formCompetition:string|null;base:number;overseas:boolean;initials:string;color:string;seasonTeam:string;squadSource:string;career:Career|null;auction?:{year:number;setNumber:number;setCode:string;base:number;source:string;eligibility:string}};
const recent=recentData.players as Record<string,Evidence[]>;const capped=new Set(recentData.verifiedT20ICapped);
const meta=register.meta as Record<string,NonNullable<Player['auction']>>;
export const players:Player[]=[...snapshot.players,...register.extra].map(p=>{const evidence=recent[p.id]??[],latest=[...evidence].filter(e=>e.competition==='IPL').sort((a,b)=>b.season-a.season)[0]??[...evidence].sort((a,b)=>b.season-a.season)[0];return {...p,base:meta[p.id]?.base??p.base,form:latest?.form??null,formSeason:latest?.season??null,formCompetition:latest?.competitionId??latest?.competition??null,auction:meta[p.id],rating:computeRating(p.role,evidence,capped.has(p.id)?'capped':'unknown',recentData.cutoff,(iccData.players as Record<string,IccRanking[]>)[p.id]??[])};});
export const playerById=new Map(players.map(p=>[p.id,p]));
export const activePlayers=players.filter(p=>isIplEligible(p.id));
// Scouting definition, not an official IPL award. Use the specified season only.
export const breakoutPace2026=activePlayers.flatMap(player=>{
 if(player.country!=='India'||!/bowl|all/i.test(player.role)||!/fast|medium|pace|seam/i.test(player.bowl))return [];
 const seasons=(recent[player.id]??[]).filter(e=>e.complete&&e.competition==='IPL');
 const line=seasons.find(e=>e.season===2026)?.form.bowling;
 if(!line||line.wickets<10||!line.balls||seasons.filter(e=>e.season<2026).reduce((n,e)=>n+e.form.bowling.wickets,0)>=50)return [];
 return [{player,wickets:line.wickets,economy:6*line.runs/line.balls,average:line.runs/line.wickets,strikeRate:line.balls/line.wickets}];
}).sort((a,b)=>b.wickets-a.wickets||a.economy-b.economy);
const breakoutIds=new Set(breakoutPace2026.map(x=>x.player.id));
// Custom fresh auction: insert active, established Indian pace specialists after the marquee sets.
const supplement=activePlayers.filter(p=>!meta[p.id]&&p.country==='India'&&p.role==='Bowler'&&/fast|medium|pace/i.test(p.bowl)&&(p.rating.value>=80||breakoutIds.has(p.id))).sort((a,b)=>b.rating.value-a.rating.value);
const firstRoleSet=register.order.findIndex(id=>!meta[id]?.setCode.startsWith('M'));
export const auctionOrder=[...register.order.slice(0,firstRoleSet),...supplement.map(p=>p.id),...register.order.slice(firstRoleSet)].filter(id=>isIplEligible(id));
export const auctionPlayers=auctionOrder.map(id=>playerById.get(id)!);
export const dataset={season:snapshot.season,retrievedAt:snapshot.retrievedAt,total:players.length,formSeason:2026,auctionYear:2025,auctionTotal:auctionPlayers.length,ipl:players.filter(p=>p.career&&!p.career.fallback).length,fallback:players.filter(p=>p.career?.fallback).length,withForm:players.filter(p=>p.form).length};
export function setLabel(p:Player){if(!p.auction)return supplement.includes(p)?'Indian pace · custom set':'Current player';const code=p.auction.setCode;return code==='M1'?'Marquee A':code==='M2'?'Marquee B':`${code.startsWith('U')?'Uncapped ':''}${/BA/.test(code)?'Batters':/WK/.test(code)?'Wicketkeepers':/FA/.test(code)?'Fast bowlers':/SP/.test(code)?'Spinners':'All-rounders'} · ${code}`;}
