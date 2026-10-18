import {NextRequest,NextResponse} from 'next/server';
import type {Room} from '../../../packages/auction-engine/src/rooms';
const root=globalThis as typeof globalThis & {atgRooms?:Map<string,Room>};
export const rooms:Map<string,Room>=root.atgRooms??=new Map<string,Room>();
const COOKIE='atg-player';
/** Anonymous per-browser identity. httpOnly so other players cannot read or reuse it from script. */
export function identity(req:NextRequest){
 const existing=req.cookies.get(COOKIE)?.value;
 return existing&&/^[0-9a-f-]{36}$/.test(existing)?{id:existing,fresh:false}:{id:crypto.randomUUID(),fresh:true};
}
export function json(id:{id:string;fresh:boolean},data:unknown,status=200){
 const res=NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}});
 if(id.fresh)res.cookies.set(COOKIE,id.id,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:60*60*24*7,path:'/'});
 return res;
}
export function badOrigin(req:NextRequest){
 const origin=req.headers.get('origin');
 return !!origin&&origin!==`${req.nextUrl.protocol}//${req.headers.get('host')}`;
}
