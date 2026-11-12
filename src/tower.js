import {ambientGlow,drawVentSteam,drawLampAtmosphere,controlledLight} from './ambient.js';
import {withInteriorLight,drawSpriteEmission} from './sprite-lighting.js';
import {buildingLighting,fixtureLight} from './building-light-variation.js';

// A single architectural grid, shared by painted assets, platforms and stair treads.
export const TOWER_ARCH={
  bay:280,stairBay:300,width:1420,rise:144,floors:11,steps:25,
  stairSize:[1226,1066],stairLower:[58/1226,1028/1066],stairUpper:[1103/1226,5/1066],
};
export function towerStairGeometry(){
  const a=TOWER_ARCH,scale=a.rise/(a.stairSize[1]*(a.stairLower[1]-a.stairUpper[1]));
  return {scale,run:a.stairSize[0]*(a.stairUpper[0]-a.stairLower[0])*scale};
}
export const TOWER_BAYS={
  residential:{asset:'towerResidential',size:[1893,750],windows:[[.39,.31,.215,.30]],lamps:[[.246,.125,.20,.25],[.795,.125,.20,.25]],vents:[]},
  grey:{asset:'towerHousingGrey',size:[1897,751],windows:[[.39,.31,.215,.30]],lamps:[[.246,.125,.20,.25],[.795,.125,.20,.25]],vents:[]},
  ochre:{asset:'towerHousingOchre',size:[1897,750],windows:[[.39,.31,.215,.30]],lamps:[[.246,.125,.20,.25],[.795,.125,.20,.25]],vents:[]},
  services:{asset:'towerServices',size:[1919,757],windows:[[.09,.45,.245,.28],[.588,.448,.366,.505]],lamps:[[.213,.197,.19,.20],[.473,.197,.19,.20],[.796,.197,.19,.20],[.039,.433,.06,.20],[.358,.433,.07,.20],[.552,.433,.06,.20]],vents:[[.95,.25]]},
  utility:{asset:'towerUtility',size:[1906,743],windows:[],lamps:[[.050,.222,.10,.28],[.950,.225,.10,.28]],vents:[[.80,.26]]},
  gunsmith:{asset:'towerCommons',index:0,windows:[],lamps:[],vents:[]},
  gym:{asset:'towerCommons',index:1,windows:[],lamps:[],vents:[]},
  canteen:{asset:'towerCommons',index:2,windows:[],lamps:[],vents:[[.43,.60]]},
  alcove:{asset:'towerCommons',index:3,windows:[],lamps:[],vents:[[.18,.34]]},
};

export function drawTowerScene(ctx,canvas){
  ctx.fillStyle='#151b19';ctx.fillRect(0,0,canvas.width,canvas.height);
}
function drawSource(ctx,p,x,y,w,h){if(p)ctx.drawImage(p.image,p.x,p.y,p.w,p.h,x,y,w,h);}
function detail(ctx,source,x,y,h){
  if(source)drawSource(ctx,source,x,y,h*source.w/source.h,h);
}
function towerEdges(canvas,world,camera){
  return {left:Math.min(0,camera-8),right:Math.max(world.width,camera+canvas.width+8)};
}
function drawConcreteFill(ctx,source,x,y,w,h){
  if(!source||h<=0)return;
  const sy=source.y+source.h*.18,sh=source.h*.50,scale=.20,tw=source.w*scale,th=sh*scale;
  ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
  for(let xx=Math.floor(x/tw)*tw;xx<x+w;xx+=tw)for(let yy=Math.floor(y/th)*th;yy<y+h;yy+=th)
    ctx.drawImage(source.image,source.x,sy,source.w,sh,xx,yy,tw,th);
  ctx.restore();
}
function drawSlab(ctx,source,x,feet,w){
  if(!source)return;
  const h=52*2/3,tile=h*source.w/source.h,top=feet-h*43/52;
  // Tile phase belongs to world coordinates, including cropped viewport extensions.
  ctx.save();ctx.beginPath();ctx.rect(x,top,w,h);ctx.clip();
  for(let origin=Math.floor(x/tile)*tile;origin<x+w;origin+=tile){
    ctx.drawImage(source.image,source.x,source.y,source.w,source.h,origin,top,tile,h);
  }
  ctx.restore();
}
export function drawTowerBay(ctx,d,source,lit,time){
  if(!source)return;
  const def=TOWER_BAYS[d.style],h=d.w*source.h/source.w,y=d.y-h;
  drawSource(ctx,source,d.x,y,d.w,h);
  const variant=buildingLighting(d,def.windows.length,def.lamps.length,0);
  const windows=def.windows.map((rect,i)=>({rect,window:true,level:controlledLight(variant.windows[i]?1:0)}));
  const lamps=def.lamps.map(([x,y,w,h],i)=>({rect:[Math.max(0,x-w/2),Math.max(0,y-.055),w,h],level:fixtureLight(time,variant.seed+i*37,d.towerLampModes?.[i]??variant.lamps[i])}));
  const lights=[...windows,...lamps],on=withInteriorLight(source,lit,lights);
  if(on)drawSpriteEmission(ctx,on,lights,d.x,y,d.w,h,time,variant.seed);
  for(const [i,[lx,ly]]of def.lamps.entries()){
    const level=lamps[i].level,px=d.x+lx*d.w,py=y+ly*h;
    ambientGlow(ctx,px,py,12,'#efca90',.34*level);
    drawLampAtmosphere(ctx,px,py,h*(1-ly),time,variant.seed+i,level);
  }
  for(const [i,[vx,vy]]of def.vents.entries())drawVentSteam(ctx,d.x+vx*d.w,y+vy*h,16,time,variant.seed+i,.65);
}
export function drawTowerArchitecture(ctx,canvas,world,camera,cameraY,time,sourceFor,imageFor){
  const slab=sourceFor('towerConcrete',0);
  const {left,right}=towerEdges(canvas,world,camera),ground=world.platforms[0].y;
  // The galleries continue into the side walls of the atrium, beyond the playable section.
  ctx.fillStyle='#272e29';ctx.fillRect(left,world.top,right-left,ground-world.top+22);
  for(const floor of world.floors){
    if(floor<cameraY-30||floor-TOWER_ARCH.rise>cameraY+canvas.height+30)continue;
    // Continuous shared ceiling/spandrel, rather than isolated floating room cards.
    ctx.fillStyle='#101814';ctx.fillRect(left,floor-TOWER_ARCH.rise+9,right-left,4);
    drawConcreteFill(ctx,slab,left,floor-TOWER_ARCH.rise+5,right-left,44);
    const side=sourceFor('towerHousingGrey',0);
    if(side){
      ctx.save();ctx.globalAlpha=.65;
      const h=TOWER_ARCH.bay*side.h/side.w;
      for(let x=-TOWER_ARCH.bay;x>left-TOWER_ARCH.bay;x-=TOWER_ARCH.bay)drawSource(ctx,side,x,floor-h,TOWER_ARCH.bay,h);
      for(let x=world.width;x<right;x+=TOWER_ARCH.bay)drawSource(ctx,side,x,floor-h,TOWER_ARCH.bay,h);
      ctx.restore();
    }
  }
  for(const d of world.decor){
    if(d.kind!=='towerBay'||d.x+d.w<camera-30||d.x>camera+canvas.width+30||d.y<cameraY-20||d.y-TOWER_ARCH.rise>cameraY+canvas.height+30)continue;
    const def=TOWER_BAYS[d.style],asset=def.asset;
    drawTowerBay(ctx,d,sourceFor(asset,def.index||0),imageFor(asset+'Lit'),time);
  }
  // Floor slabs are present behind the front parapets too, aligned to physics.
  if(slab)for(const p of world.platforms){
    if(p.stair||p.y<cameraY-40||p.y>cameraY+canvas.height+40)continue;
    ctx.fillStyle='#3f453a';ctx.fillRect(left,p.y,right-left,8);
  }
  // The stair-core walls close the section; there is no unrelated distant scenery.
  const spine=sourceFor('towerResidential',0);
  if(spine)for(const x of [0,world.width-22]){
    const h=132,w=h*(spine.w*.075)/spine.h;
    for(let y=world.top;y<ground+22;y+=h){
      const remaining=Math.min(h,ground+22-y);
      ctx.drawImage(spine.image,spine.x,spine.y,spine.w*.075,spine.h*remaining/h,x,y,w,remaining);
    }
  }
  // Piers span the clear distance between two slabs; caps are hidden by those slabs.
  for(let f=1;f<world.floors.length;f++){
    const ceiling=world.floors[f],below=world.floors[f-1];
    if(ceiling>cameraY+canvas.height||below<cameraY)continue;
    const dressing=world.towerDressing?.[f],pierX=dressing?.pierX??world.width*.52,number=dressing?.number??92+f*4;
    if(dressing?.hasPier){
      const pier=sourceFor('towerStructure',0),h=below-ceiling-15;
      detail(ctx,pier,pierX,ceiling+8,h);
      if(pier){
        const w=h*pier.w/pier.h;
        ctx.save();ctx.fillStyle='#2e3730';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`bold ${Math.round(w*.55)}px monospace`;
        ctx.fillText(String(number).padStart(3,'0'),pierX+w/2,ceiling+8+h*.52,w*.84);ctx.restore();
      }
      if(dressing.sign&&pier){
        // Flat wall-mounted plate, with no dangling concrete bracket.
        const pierWidth=h*pier.w/pier.h;
        const sign=sourceFor('towerStructure',1),sx=pierX+pierWidth-2,sy=ceiling+12,sh=17,sw=sign?sh*sign.w/sign.h:0;
        detail(ctx,sign,sx,sy,sh);
        if(sign){ctx.save();ctx.fillStyle='#97b8ad';ctx.font='bold 7px monospace';ctx.textBaseline='middle';ctx.textAlign='center';ctx.fillText(`← RES ${number}–${number+4}`,sx+sw/2,sy+sh/2,sw*.88);ctx.restore();}
      }
    }
  }
  // Attached risers have proper clamps and stop at the foundation, never hanging below it.
  const riser=sourceFor('towerDetails',3);
  for(let f=1;f<world.floors.length;f++){
    const x=world.towerDressing?.[f]?.riserX;
    if(x!=null)detail(ctx,riser,x,world.floors[f]-8,TOWER_ARCH.rise+20);
  }
  // Distribution boxes and wires are mounted high on the apartment wall, behind people.
  for(let f=0;f<world.floors.length;f++){
    const y=world.floors[f];
    if(y<cameraY||y-TOWER_ARCH.rise>cameraY+canvas.height)continue;
    const dressing=world.towerDressing?.[f],wiring=dressing?.electrical;
    const electrical=wiring?sourceFor('towerElectrics',wiring.index):null;
    if(electrical){const w=430;drawSource(ctx,electrical,wiring.x,y-122,w,w*electrical.h/electrical.w);}
    if(dressing?.ac)detail(ctx,sourceFor('towerFacade',dressing.ac.index),dressing.ac.x,y-78,43);
  }
  // Household clutter stands on the actual gallery floor, behind people and railings.
  for(const d of world.towerClutter||[]){
    if(d.y<cameraY-10||d.y-d.h>cameraY+canvas.height||d.x<camera-60||d.x>camera+canvas.width+60)continue;
    const source=sourceFor('towerClutter',d.index);if(!source)continue;
    const w=d.h*source.w/source.h;
    ctx.save();ctx.fillStyle='#0b100e';ctx.globalAlpha=.2;ctx.beginPath();ctx.ellipse(d.x,d.y-1,w*.36,1.2,0,0,Math.PI*2);ctx.fill();ctx.restore();
    drawSource(ctx,source,d.x-w/2,d.y-d.h,w,d.h);
  }
  const plant=sourceFor('towerPlant',0),basement=sourceFor('towerBasement',0);
  ctx.fillStyle='#1c231f';ctx.fillRect(left,ground+22,right-left,Math.max(0,cameraY+canvas.height-ground-22));
  if(basement){
    const h=150,w=h*basement.w/basement.h;
    for(let x=Math.floor(left/w)*w;x<right;x+=w)drawSource(ctx,basement,x,ground+22,w,h);
  }
  if(plant){
    const h=120,w=h*plant.w/plant.h;
    for(const center of [world.width*.27,world.width*.73]){
      detail(ctx,plant,center-w/2,ground+24,h);
      drawVentSteam(ctx,center+w*.36,ground+35,21,time,center,.8);
    }
  }
}
export function drawTowerSceneForeground(ctx,canvas,world,camera,cameraY,sourceFor){
  const slab=sourceFor('towerSlab',0),stair=sourceFor('towerStair',0),a=TOWER_ARCH,g=towerStairGeometry();
  const {left,right}=towerEdges(canvas,world,camera);
  // Stair ends are behind the gallery fronts, which conceal both landing joins.
  if(stair)for(const flight of world.stairs){
    const lower=flight.renderLower||flight.lower;
    if(lower.y<cameraY-40||lower.y-a.rise>cameraY+canvas.height+50)continue;
    ctx.save();ctx.beginPath();ctx.rect(left,lower.y-a.rise+6,right-left,a.rise-6);ctx.clip();
    ctx.translate(lower.x,lower.y);ctx.scale(flight.dir*g.scale,g.scale);
    drawSource(ctx,stair,-a.stairLower[0]*stair.w,-a.stairLower[1]*stair.h,stair.w,stair.h);ctx.restore();
  }
  for(const p of world.platforms){
    if(p.stair||p.y<cameraY-50||p.y>cameraY+canvas.height+50)continue;
    // Physics openings stay behind a continuous closed concrete front.
    drawSlab(ctx,slab,left,p.y,right-left);
    const f=p.floor||0;
    const laundry=world.towerDressing?.[f]?.laundry;
    if(laundry)detail(ctx,sourceFor('towerFacade',laundry.index),laundry.x,p.y-32,48);
  }
}
