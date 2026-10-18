'use client';
import {Button} from '@/components/ui/button';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="lobby"><span className="eyebrow gold">A BRIEF TIMEOUT</span><h1>Let’s get you back to the table.</h1><p className="muted" style={{marginBottom:24}}>The auction interface could not load. Retry to reconnect to your room.</p><Button onClick={reset}>Try again</Button></main>}
