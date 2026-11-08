import {LOCATION_SOURCE_SIZES} from './scenery-sizes.js';
// Columns have different widths to accommodate genuinely wider storefronts.
export function marketCell(frame,width,height){
  const edges=[0,.24,.555,1],col=frame%3,row=Math.floor(frame/3);
  const x=Math.round(edges[col]*width),y=Math.round(row*height/3);
  return {x,y,w:Math.round(edges[col+1]*width)-x,h:Math.round((row+1)*height/3)-y};
}
// Native artwork bounds; generation and rendering share these measurements.
const sizes=[[248,347],[377,349],[536,300],[260,339],[373,328],[516,307],[259,327],[374,330],[522,308]];
export const MARKET_STALLS = {
  'food-original':{kind:'foodStall',atlas:'locations',frame:4,size:LOCATION_SOURCE_SIZES[4],body:[.085,.97]},
  'tech-original':{kind:'techStall',atlas:'locations',frame:5,size:LOCATION_SOURCE_SIZES[5],body:[.05,.96]},
};
const bodies=[[.04,.965],[.02,.975],[.03,.97],[.06,.96],[.035,.975],[.022,.978],[.042,.969],[.03,.976],[.035,.973]];
for(const [frame,id]of ['food-tea','food-grill','food-deli','tech-repair','tech-cyberware','tech-electronics','clothes-tailor','clothes-boutique','clothes-streetwear'].entries()){
  MARKET_STALLS[id]={kind:frame<3?'foodStall':frame<6?'techStall':'clothesStall',atlas:'market',frame,size:sizes[frame],body:bodies[frame],cooking:id!=='food-deli'};
}
export const marketStyle=(d)=>MARKET_STALLS[d.style]||MARKET_STALLS[d.kind==='foodStall'?'food-original':'tech-original'];
export const marketStallSize=(style,height=105)=>({w:height*MARKET_STALLS[style].size[0]/MARKET_STALLS[style].size[1],h:height});
export const isMarketStall=kind=>['foodStall','techStall','clothesStall'].includes(kind);
// Join structural walls; awnings, lanterns and baskets may overlap naturally.
export const stallBody=d=>{const [left,right]=marketStyle(d).body;return {left:d.x+d.w*left,right:d.x+d.w*right};};
export const stallAdvance=(a,b,gap=0)=>a.w*MARKET_STALLS[a.style].body[1]-b.w*MARKET_STALLS[b.style].body[0]+gap;
