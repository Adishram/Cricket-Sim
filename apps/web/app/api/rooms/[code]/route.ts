import {NextRequest} from 'next/server';
import {z} from 'zod';
import {getRoom,apply,viewer} from '../../../../../../packages/auction-engine/src/rooms';
import {FRANCHISES} from '../../../../../../packages/auction-engine/src';
import {rooms,identity,json,badOrigin} from '@/lib/server-rooms';
export const runtime='nodejs';
type Ctx={params:Promise<{code:string}>};
const key=z.string().uuid();
const schema=z.discriminatedUnion('action',[
 z.object({action:z.literal('join'),team:z.enum(FRANCHISES.map(f=>f[0]) as [string,...string[]]),name:z.string().trim().min(1).max(24),key}).strict(),
 z.object({action:z.enum(['start','bid','bots']),key}).strict(),
 z.object({action:z.literal('timer'),timer:z.union([z.literal(5),z.literal(10),z.literal(15),z.literal(20)]),key}).strict(),
]);
export async function GET(req:NextRequest,{params}:Ctx){
 const id=identity(req),now=Date.now(),room=getRoom(rooms,(await params).code,now);
 if(!room)return json(id,{error:'Room not found. Check the link or create a new room.'},404);
 return json(id,{state:room.state,me:viewer(room,id.id),serverNow:now});
}
export async function POST(req:NextRequest,{params}:Ctx){
 const id=identity(req);
 if(badOrigin(req))return json(id,{error:'Invalid origin'},403);
 let input:z.infer<typeof schema>;
 try{input=schema.parse(await req.json());}catch{return json(id,{error:'Invalid auction command.'},400);}
 // Read authoritative time only after the request body has arrived.
 const now=Date.now(),room=getRoom(rooms,(await params).code,now);
 if(!room)return json(id,{error:'Room not found.'},404);
 try{apply(room,id.id,input,now);return json(id,{state:room.state,me:viewer(room,id.id),serverNow:now});}
 catch(e){return json(id,{error:e instanceof Error?e.message:'Command rejected',state:room.state,me:viewer(room,id.id),serverNow:now},400);}
}
