import type {Metadata} from 'next';
import {AuctionRoom} from '@/components/auction-room';
export const metadata:Metadata={title:'Auction room — Auction to Glory',description:'Live multiplayer IPL auction room. Pick a franchise and bid against your friends.'};
export default async function RoomPage({params}:{params:Promise<{code:string}>}){const {code}=await params;return <AuctionRoom code={code.toUpperCase()}/>;}
