import {NextRequest} from 'next/server';
import {z} from 'zod';
import {createRoom} from '../../../../../packages/auction-engine/src/rooms';
import {rooms,identity,json,badOrigin} from '@/lib/server-rooms';
export const runtime='nodejs';
const schema=z.object({timer:z.union([z.literal(5),z.literal(10),z.literal(15),z.literal(20)])}).strict();
export async function POST(req:NextRequest){
 const id=identity(req);
 if(badOrigin(req))return json(id,{error:'Invalid origin'},403);
 let input:z.infer<typeof schema>;
 try{input=schema.parse(await req.json());}catch{return json(id,{error:'Choose a bid timer of 5, 10, 15 or 20 seconds.'},400);}
 try{return json(id,{code:createRoom(rooms,id.id,input.timer,Date.now())},201);}
 catch(e){return json(id,{error:e instanceof Error?e.message:'Could not create room'},503);}
}
