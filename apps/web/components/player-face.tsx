'use client';
import {useState} from 'react';
import portraits from '../../../packages/cricket-data/src/player-portraits.json';
export function PlayerFace({id,name}:{id:string;name:string}){
 const [failed,setFailed]=useState(false),[loaded,setLoaded]=useState(false);
 const photo=(portraits as Record<string,{url:string;source:string}>)[id];
 return <div className="player-face">
 <span className="face-fallback" aria-hidden={loaded}>{name.split(' ').map(n=>n[0]).slice(0,2).join('')}</span>
 {photo&&!failed&&<><img src={photo.url} alt={name} loading="lazy" decoding="async" className={loaded?'face-loaded':''} onLoad={()=>setLoaded(true)} onError={()=>{setFailed(true);setLoaded(false);}}/><a className="face-credit" href={photo.source} target="_blank" rel="noreferrer">Photo: IPL ↗</a></>}
 </div>;
}
