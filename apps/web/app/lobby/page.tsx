import type {Metadata} from 'next';
import {Header,CreateRoomForm} from '@/components/auction-room';
export const metadata:Metadata={title:'Play with friends — Auction to Glory',description:'Create an IPL auction room, choose a bid timer and share the link with your friends.'};
export default function Lobby(){return <><Header active="League lobby"/><main className="lobby"><span className="eyebrow gold">THE JOURNEY STARTS HERE</span><h1>Your league. Your legacy.</h1><p className="muted">Create a room, share the link, and bid against your friends in real time.</p><CreateRoomForm/></main></>}
