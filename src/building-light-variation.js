import {controlledLight,lightLevel} from './ambient.js';

const configurations=new WeakMap();
// Each facade owns a stable configuration; drawing never consumes gameplay RNG.
export function buildingLighting(building,windowCount,lampCount,signCount){
  const cached=configurations.get(building);if(cached)return cached;
  const seed=building.lightSeed??Math.floor(building.x*113+building.w*31);
  let state=seed|0;
  const random=()=>{state=(state+0x6d2b79f5)|0;let n=Math.imul(state^state>>>15,1|state);n^=n+Math.imul(n^n>>>7,61|n);return ((n^n>>>14)>>>0)/4294967296;};
  const variant=building.lightVariant??Math.floor(random()*4);
  const order=Array.from({length:windowCount},(_,i)=>i);
  for(let i=order.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
  const count=variant===0?windowCount:variant===1?Math.min(windowCount,1):variant===2?0:Math.min(Math.max(0,windowCount-1),2+Math.floor(random()*2));
  const windows=Array(windowCount).fill(false);for(let i=0;i<count;i++)windows[order[i]]=true;
  const modes=['steady',false,'strong','blink','off'];
  const styleHash=Array.from(building.style||'building').reduce((hash,char)=>(hash*31+char.charCodeAt(0))>>>0,0);
  // Adjacent copies rotate modes too, so their corresponding lamps cannot match.
  const fixture=i=>modes[(styleHash+variant+i*3)%modes.length];
  const result={seed,windows,lamps:Array.from({length:lampCount},(_,i)=>fixture(i)),signs:Array.from({length:signCount},(_,i)=>fixture(i+lampCount))};
  configurations.set(building,result);return result;
}
export function fixtureLight(time,seed,mode){
  return mode==='off'?controlledLight(0):mode==='steady'?controlledLight(.98):lightLevel(time,seed,mode);
}
