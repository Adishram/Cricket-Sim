import type {Metadata} from 'next';
import {SquadDashboard} from '@/components/auction-room';
export const metadata:Metadata={title:'Squad dashboard — Auction to Glory',description:'Every player your franchise and your rivals have bought, with OVR, price and purse.'};
export default async function SquadPage({params}:{params:Promise<{code:string}>}){const {code}=await params;return <SquadDashboard code={code.toUpperCase()}/>;}
