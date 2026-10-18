import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Auction to Glory — IPL auction with friends',description:'Run a live IPL player auction with your friends: real franchises, OVR ratings, custom bid timers and squad dashboards.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
