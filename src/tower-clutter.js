// Human-scale household props. Width bounds reserve space before the atlas is loaded.
export const TOWER_CLUTTER_HEIGHTS=[26,24,27,23,41,40,43,30,30,43,34,15,32,29,21,51];
const groups=[[4,5,6,7],[8,9,10,11,13],[0,1,2,14],[3,12,13,15]];
const accessories=[0,1,3,8,11,12,14];

export function createTowerClutter(world){
  let state=(world.seed^0x7319ab21)|0;
  const random=()=>{state=(state+0x6d2b79f5)|0;let n=Math.imul(state^state>>>15,1|state);n^=n+Math.imul(n^n>>>7,61|n);return ((n^n>>>14)>>>0)/4294967296;};
  const pick=a=>a[Math.floor(random()*a.length)],props=[];
  for(let floor=0;floor<world.floors.length;floor++){
    const y=world.floors[floor];let count=0;
    const rooms=world.decor.filter(d=>d.kind==='towerBay'&&d.floor===floor&&['grey','ochre','residential'].includes(d.style));
    for(let i=rooms.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[rooms[i],rooms[j]]=[rooms[j],rooms[i]];}
    for(const room of rooms){
      if(count>=3||random()<.23)continue;
      // Under the central window, between the two apartment doorways.
      const center=room.x+room.w*.5+(random()-.5)*12,left=center-58,right=center+58;
      const blocked=world.stairs.some(s=>(s.lower.y===y||s.upper.y===y)&&right>Math.min(s.lower.x,s.upper.x)-32&&left<Math.max(s.lower.x,s.upper.x)+32)
        ||world.platforms.some(p=>!p.stair&&p.y===y&&p.holes?.some(h=>right>h.x-16&&left<h.x+h.w+16))
        ||world.chests.some(c=>c.y+25===y&&right>c.x-18&&left<c.x+52)
        ||y===world.portal.y&&Math.abs(center-world.portal.x)<150
        ||y===world.spawn.y&&Math.abs(center-world.spawn.x)<70;
      if(blocked)continue;
      const primary=pick(pick(groups)),pair=random()<.55;
      props.push({index:primary,x:center-(pair?20:0),y,h:TOWER_CLUTTER_HEIGHTS[primary],floor});
      if(pair){const index=pick(accessories);props.push({index,x:center+25,y,h:TOWER_CLUTTER_HEIGHTS[index],floor});}
      count++;
    }
  }
  return props;
}
