/** Serializable xorshift32. No clocks, global randomness or I/O. */
export function random(state:{seed:number}){let x=state.seed|0;x^=x<<13;x^=x>>>17;x^=x<<5;state.seed=x>>>0||1;return state.seed/4294967296;}
export function seedFrom(text:string){let n=2166136261;for(const c of text)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0||1;}
