import snapshot from './snapshot.json';
import formData from './form-2026.json';
import register from './auction-register.json';
import {computeRating,type Rating,type SeasonForm,type Evidence} from './rating';
export type {Rating} from './rating';
export type Career={competition:string;source:string;provider:string;asOf:string;coverage:string;matches:number;fallback:boolean;batting:{innings:number;runs:number|null;average:number|null;strikeRate:number|null}|null;bowling:{innings:number;wickets:number|null;economy:number|null;average:number|null;strikeRate:number|null}|null};
export type Player={id:string;name:string;country:string;role:string;bat:string;bowl:string;rating:Rating;form:SeasonForm|null;base:number;overseas:boolean;initials:string;color:string;seasonTeam:string;squadSource:string;career:Career|null;auction?:{year:number;setNumber:number;setCode:string;base:number;source:string;eligibility:string}};
const seasonForm=formData.players as Record<string,SeasonForm>;
const meta=register.meta as Record<string,NonNullable<Player['auction']>>;
export const players:Player[]=[...snapshot.players,...register.extra].map(p=>{const form=seasonForm[p.id]??null;const evidence:Evidence[]=form?[{season:2026,competition:'IPL',source:'OpenIPL / Cricsheet · IPL 2026 scorecards',complete:true,form}]:[];return {...p,base:meta[p.id]?.base??p.base,form,auction:meta[p.id],rating:computeRating(p.role,evidence,'unknown')};});
export const playerById=new Map(players.map(p=>[p.id,p]));
export const auctionOrder=register.order;
export const auctionPlayers=auctionOrder.map(id=>playerById.get(id)!);
export const dataset={season:snapshot.season,retrievedAt:snapshot.retrievedAt,total:players.length,formSeason:2026,auctionYear:2025,auctionTotal:auctionPlayers.length,ipl:players.filter(p=>p.career&&!p.career.fallback).length,fallback:players.filter(p=>p.career?.fallback).length,withForm:players.filter(p=>p.form).length};
export function setLabel(p:Player){const code=p.auction?.setCode??'';return code==='M1'?'Marquee A':code==='M2'?'Marquee B':`${code.startsWith('U')?'Uncapped ':''}${/BA/.test(code)?'Batters':/WK/.test(code)?'Wicketkeepers':/FA/.test(code)?'Fast bowlers':/SP/.test(code)?'Spinners':'All-rounders'} · ${code}`;}
