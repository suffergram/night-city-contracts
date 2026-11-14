import {ambientGlow,drawVentSteam,drawLampAtmosphere,drawWarningBeacon,drawSceneDust,drawElectricalFault} from './ambient.js';
import {fixtureLight} from './building-light-variation.js';

// Native facade proportions and measured playable ledges (relative to trimmed alpha).
export const INDUSTRIAL_BUILDINGS={
  workshop:{asset:'industrialWorkshop',size:[1850,827],height:255,gallery:.550,roof:.117,ladder:.035,
    lamps:[[.047,.215],[.502,.658],[.952,.215]],vents:[[.445,.074],[.562,.074]],beacon:[.884,.075]},
  warehouse:{asset:'industrialWarehouse',size:[1837,826],height:250,gallery:.489,roof:.13,ladder:.965,
    lamps:[[.041,.274],[.953,.274]],vents:[[.88,.16]],beacon:[.76,.032]},
  plant:{asset:'industrialPlant',size:[1846,823],height:240,gallery:.518,roof:.090,ladder:.035,
    lamps:[[.027,.24],[.964,.24]],vents:[[.17,.018],[.86,.018]],beacon:[.52,.043]},
  control:{asset:'industrialControl',size:[1850,830],height:240,gallery:.570,roof:.12,ladder:.965,
    lamps:[[.051,.22],[.963,.22]],vents:[[.11,.028],[.41,.078]],beacon:[.56,.055]},
};
export const INDUSTRIAL_STRUCTURES={
  shed:{asset:'industrialShed',size:[2138,626],height:140,roof:.20,ladder:.04,lamps:[[.145,.37],[.911,.37]],vents:[[.39,.16],[.57,.16]],beacon:null},
  scaffold:{asset:'industrialScaffold',size:[1421,1081],height:210,gallery:.548,roof:.14,ladder:.035,lamps:[],vents:[],beacon:null},
};
export const INDUSTRIAL_CARGO=[
  {index:0,size:[390,152],height:80},{index:1,size:[390,152],height:80},
  {index:2,size:[404,262],height:76},{index:3,size:[386,200],height:46},
  {index:4,size:[385,280],height:48},{index:5,size:[417,245],height:38},
  {index:6,size:[254,354],height:56},{index:7,size:[326,339],height:40},
];
export function industrialSize(style){const d=INDUSTRIAL_BUILDINGS[style]||INDUSTRIAL_STRUCTURES[style];return {w:d.height*d.size[0]/d.size[1],h:d.height};}
export function industrialCargoSize(index){const d=INDUSTRIAL_CARGO[index];return {w:d.height*d.size[0]/d.size[1],h:d.height};}
export const INDUSTRIAL_LAYERS=[
  {asset:'industrialFar',speed:.055,height:718,bottom:546,alpha:1,filter:'brightness(.82) saturate(.78)'},
  {asset:'industrialMid',speed:.22,height:430,bottom:544,alpha:.88,filter:'brightness(.70) saturate(.70)',overlap:70},
];

export function drawIndustrialScene(ctx,canvas,world,camera,cameraY,time,sourceFor){
  const fence=sourceFor('industrialFence',0);
  if(fence){
    const h=112,w=h*fence.w/fence.h,ground=world.platforms[0].y;
    ctx.save();
    // Fixed world-space origins: camera movement only reveals existing sections.
    for(let x=Math.floor(camera/w)*w;x<Math.min(world.width,camera+canvas.width+w);x+=w)
      ctx.drawImage(fence.image,fence.x,fence.y,fence.w,fence.h,x,ground-h+2,w+1,h);
    ctx.restore();
  }
  for(const d of world.decor){
    if(!['industrialBuilding','industrialStructure','industrialCargo'].includes(d.kind)||d.x+d.w<camera-80||d.x>camera+canvas.width+80||d.y+d.h<cameraY||d.y>cameraY+canvas.height)continue;
    if(d.kind==='industrialCargo'){
      const p=sourceFor(d.index>=3?'industrialFreightFlat':'industrialFreight',d.index);if(!p)continue;
      ctx.drawImage(p.image,p.x,p.y,p.w,p.h,d.x,d.y,d.w,d.h);
      if(d.index===2)drawWarningBeacon(ctx,d.x+d.w*.47,d.y+d.h*.08,time,d.lightSeed||d.x);
      continue;
    }
    const def=INDUSTRIAL_BUILDINGS[d.style]||INDUSTRIAL_STRUCTURES[d.style],p=sourceFor(def.asset,0);if(!p)continue;
    ctx.drawImage(p.image,p.x,p.y,p.w,p.h,d.x,d.y,d.w,d.h);
    for(const [i,[x,y]]of def.lamps.entries()){
      const level=fixtureLight(time,d.lightSeed+i*31,d.lampModes[i]),px=d.x+x*d.w,py=d.y+y*d.h;
      ambientGlow(ctx,px,py,21,'#ffd094',.42*level);
      // Small emitter seated inside the painted housing, not a flat flood over the facade.
      ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=level*.85;ctx.fillStyle='#ffe0a0';ctx.fillRect(px-3,py,6,1.1);ctx.restore();
      drawLampAtmosphere(ctx,px,py,d.y+d.h-py,time,d.lightSeed+i,level);
    }
    for(const [i,[x,y]]of def.vents.entries())drawVentSteam(ctx,d.x+x*d.w,d.y+y*d.h,34,time,d.lightSeed+i*71,1.05);
    if(def.beacon)drawWarningBeacon(ctx,d.x+def.beacon[0]*d.w,d.y+def.beacon[1]*d.h,time,d.lightSeed);
    if(d.style==='workshop')drawElectricalFault(ctx,d.x+d.w*.70,d.y+d.h*.84,time,d.lightSeed);
  }
  // Ladders are real connections, placed on structural edge columns.
  const p=sourceFor('locations',11);
  if(p)for(const l of world.ladders){
    if(l.x<camera-25||l.x>camera+canvas.width+25)continue;
    const w=16,tile=w*p.h/p.w;
    for(let y=l.top;y<l.bottom;y+=tile){const h=Math.min(tile,l.bottom-y);ctx.drawImage(p.image,p.x,p.y,p.w,p.h*h/tile,l.x-w/2,y,w,h);}
  }
  drawSceneDust(ctx,camera,canvas.width,time,world,world.platforms[0].y);
}
