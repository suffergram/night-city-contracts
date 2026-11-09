import {detailSize} from './detail-sizes.js';
import {locationSize} from './scenery-sizes.js';
import {exitBounds} from './exits.js';
// Raster scenery only: none of these props creates collision or changes gameplay RNG.
export const DETAIL_SPRITES = {
  bench:{atlas:'life',frame:0,w:92,h:38}, vending:{atlas:'life',frame:1,w:47,h:88},
  recycling:{atlas:'life',frame:2,w:53,h:38}, directionSign:{atlas:'life',frame:3,w:88,h:30,wall:true},
  clothesRack:{atlas:'life',frame:4,w:77,h:65}, spiceCart:{atlas:'life',frame:5,w:65,h:48},
  grill:{atlas:'life',frame:6,w:57,h:50}, menuBoard:{atlas:'life',frame:7,w:39,h:49,wall:true},
  laundry:{atlas:'life',frame:8,w:92,h:37,wall:true}, mailboxes:{atlas:'life',frame:9,w:65,h:39,wall:true},
  janitorCart:{atlas:'life',frame:10,w:52,h:46}, chairPlant:{atlas:'life',frame:11,w:61,h:40},
  noticeboard:{atlas:'life',frame:12,w:60,h:47,wall:true}, bicycle:{atlas:'life',frame:13,w:75,h:45,mirror:true},
  purifier:{atlas:'life',frame:14,w:38,h:40}, parcels:{atlas:'life',frame:15,w:48,h:27},
  valves:{atlas:'worksite',frame:0,w:82,h:66}, generator:{atlas:'worksite',frame:1,w:72,h:51},
  toolCabinet:{atlas:'worksite',frame:2,w:54,h:49}, cableDrum:{atlas:'worksite',frame:3,w:47,h:38},
  forklift:{atlas:'worksite',frame:4,w:105,h:73,mirror:true,groundOnly:true}, cargoPallet:{atlas:'worksite',frame:5,w:67,h:55},
  dockRopes:{atlas:'worksite',frame:6,w:57,h:32}, fuelPump:{atlas:'worksite',frame:7,w:45,h:67,groundOnly:true},
  breaker:{atlas:'worksite',frame:8,w:43,h:49,wall:true}, hoseReel:{atlas:'worksite',frame:9,w:49,h:35},
  cones:{atlas:'worksite',frame:10,w:58,h:36}, pressureTank:{atlas:'worksite',frame:11,w:54,h:65},
  anchorReel:{atlas:'worksite',frame:12,w:63,h:43}, dockFenders:{atlas:'worksite',frame:13,w:53,h:34},
  portNotice:{atlas:'worksite',frame:14,w:60,h:42,wall:true}, cargoTrolley:{atlas:'worksite',frame:15,w:50,h:46},
};
export const DETAIL_POOLS = {
  hub:['bench','vending','recycling','directionSign','noticeboard','bicycle','purifier','parcels'],
  industrial:['valves','generator','toolCabinet','cableDrum','breaker','hoseReel','cones','pressureTank'],
  port:['forklift','cargoPallet','dockRopes','fuelPump','anchorReel','dockFenders','portNotice','cargoTrolley'],
  market:['clothesRack','spiceCart','grill','menuBoard','recycling','noticeboard','parcels','bench'],
  megablock:['laundry','mailboxes','janitorCart','chairPlant','noticeboard','purifier','recycling'],
};
const intersects=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
export const detailFootprints=d=>[d];
function sceneRandom(seed){
  let state=(seed^0x4d83b521)>>>0;
  return ()=>{state=(state+0x6D2B79F5)|0;let t=Math.imul(state^state>>>15,1|state);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;};
}
export function dressingExclusions(world,ground,kind=world.kind||'hub'){
  const occupied=(world.decor||[]).filter(d=>d.kind!=='crane').map(d=>({x:d.x,y:['container','foodStall','techStall','clothesStall','canopy','marketHotel','marketBuilding'].includes(d.kind)?d.y:d.y-d.h,w:d.w,h:d.h}));
  for(const l of world.ladders||[])occupied.push({x:l.x-24,y:l.top-12,w:48,h:l.bottom-l.top+24});
  for(const s of world.stairs||[])occupied.push({x:Math.min(s.lower.x,s.upper.x)-22,y:s.upper.y-60,w:Math.abs(s.lower.x-s.upper.x)+44,h:s.lower.y-s.upper.y+70});
  for(const c of world.chests||[])occupied.push({x:c.x-12,y:c.y-15,w:63,h:55});
  for(const l of world.wallLights||[])occupied.push({x:l.x-28,y:l.y-8,w:56,h:18});
  if(world.portal){const b=exitBounds(world);occupied.push({x:b.x-12,y:b.y-10,w:b.w+24,h:b.h+20});}
  if(world.spawn)occupied.push({x:world.spawn.x-65,y:world.spawn.y-80,w:150,h:90});
  if(kind==='hub')for(const [x,y,w,h]of [[65,ground-195,180,195],[255,ground-155,180,155],[715,ground-155,180,155],[520,ground-85,100,85]])occupied.push({x,y,w,h});
  return occupied;
}
export function marketMerchandise(world,ground){
  if(world.kind!=='market')return [];
  const rng=sceneRandom(world.seed^0x15bad),size=locationSize(6,26),result=[],blocked=dressingExclusions(world,ground);
  const foods=world.decor.filter(d=>d.kind==='foodStall').map(stall=>({stall,rank:rng()})).sort((a,b)=>a.rank-b.rank);
  for(const {stall}of foods){
    if(result.length===2)break;
    if(result.some(d=>Math.abs(d.ownerX-stall.x)<450))continue;
    for(const x of [stall.x+stall.w+1,stall.x-size.w-1]){
      const rect={x,y:ground-size.h,...size};
      if(x<24||x+size.w>world.width-24||blocked.some(o=>intersects(rect,o)))continue;
      result.push({kind:'produce',x,y:ground,...size,ownerX:stall.x});blocked.push(rect);break;
    }
  }
  return result;
}
export function createDressing(world,seed,ground,kind=world.kind||'hub'){
  const rng=sceneRandom(seed);
  const ownerKind={spiceCart:'foodStall',grill:'foodStall',clothesRack:'clothesStall',parcels:'techStall'};
  const owners=key=>(world.decor||[]).filter(d=>d.kind===ownerKind[key]);
  // Outdoor wall fixtures are omitted unless there is an actual solid interior wall.
  // A parallax facade cannot support a world-space poster while the camera moves.
  const pool=(DETAIL_POOLS[kind]||DETAIL_POOLS.industrial).filter(key=>(kind==='megablock'||!DETAIL_SPRITES[key].wall)&&(kind!=='market'||!ownerKind[key]||owners(key).length));
  const platforms=(world.platforms?.length?world.platforms:[{id:0,x:0,y:ground,w:world.width,ground:true}]).filter(p=>p.ground||kind==='megablock'&&p.deck);
  const occupied=dressingExclusions(world,ground,kind),details=[],counts=new Map();
  const target=kind==='hub'?8:Math.min(45,Math.ceil(world.width/180)+(kind==='megablock'?(world.floors.length-1)*3:0));
  const offset=Math.floor(rng()*pool.length);
  // Reserve space for one of each silhouette, placing wide floor props first.
  const priority=[...pool].sort((a,b)=>Number(!!DETAIL_SPRITES[a].wall)-Number(!!DETAIL_SPRITES[b].wall)||DETAIL_SPRITES[b].w-DETAIL_SPRITES[a].w);
  const initial=priority.flatMap(sprite=>Array(65).fill(sprite));
  for(let attempt=0;attempt<initial.length+target*35&&details.length<target;attempt++){
    const sprite=attempt<initial.length?initial[attempt]:pool[(offset+attempt)%pool.length],def=DETAIL_SPRITES[sprite],size=detailSize(def);
    if(attempt<initial.length&&counts.has(sprite))continue;
    if((counts.get(sprite)||0)>=Math.ceil(target/pool.length)+2)continue;
    const p=platforms[Math.floor(rng()*platforms.length)];
    if(!p||p.w<size.w+16)continue;
    const related=kind==='market'&&ownerKind[sprite],candidates=related?owners(sprite):[];
    const owner=related?candidates[Math.floor(rng()*candidates.length)]:null;
    const x=owner?(rng()<.5?owner.x-size.w-2:owner.x+owner.w+2):Math.round(p.x+8+rng()*(p.w-size.w-16));
    if(x<p.x+8||x+size.w>p.x+p.w-8)continue;
    if(p.holes?.some(h=>x+size.w>h.x-8&&x<h.x+h.w+8))continue;
    const mountHeight=sprite==='laundry'?42:sprite==='mailboxes'?18:28;
    const y=def.wall?p.y-mountHeight-size.h:p.y-size.h;
    const rect={x,y,...size};
    const detail={...rect,sprite,platformId:p.id,floorY:p.y,wall:!!def.wall,mirror:!!def.mirror&&rng()<.5,...(owner?{ownerX:owner.x}:{})};
    const footprints=detailFootprints(detail);
    if(footprints.some(part=>occupied.some(o=>intersects(part,o))))continue;
    details.push(detail);
    counts.set(sprite,(counts.get(sprite)||0)+1);
    for(const part of footprints)occupied.push({x:part.x-4,y:part.y-3,w:part.w+8,h:part.h+3});
  }
  return details;
}
