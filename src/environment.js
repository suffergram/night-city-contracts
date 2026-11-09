import { GROUND } from './world.js';
import { ACTOR_HEIGHT } from './weapons.js';
import {createDressing,DETAIL_SPRITES} from './dressing.js';
import {fitScenery,sceneryContactInset} from './scenery-sizes.js';
import {marketCell,marketStyle,isMarketStall} from './market-stalls.js';
import {MARKET_HOTELS} from './market-hotels.js';
import {HOTEL_ATMOSPHERE} from './hotel-atmosphere.js';
import {withUnlitBase,drawSpriteEmission} from './sprite-lighting.js';
import {OBJECT_LIGHTS} from './object-lights.js';
import {exitStyle} from './exits.js';
import {drawTransportExit} from './exit-render.js';
import {lightLevel,controlledLight,ambientGlow,drawLampAtmosphere,drawVentSteam,drawCityTraffic,drawHologram,drawScreenAnimation,drawCookingSteam,drawStallLights,drawHarbourHaze,drawElectricalFault,drawSceneDust,drawWarningBeacon} from './ambient.js';

export const ENVIRONMENT_ASSETS = {
  farCity: new URL('../assets/environment/skyline-dry-v2.png', import.meta.url).href,
  midCity: new URL('../assets/environment/district-dry-v2.png', import.meta.url).href,
  nearCity: new URL('../assets/environment/walls-dry-v2.png', import.meta.url).href,
  props: new URL('../assets/environment/props-dry-v2.png', import.meta.url).href,
  road: new URL('../assets/environment/asphalt-dry-v1.png', import.meta.url).href,
  locations:new URL('../assets/environment/locations-v1.png',import.meta.url).href,
  interiorWall:new URL('../assets/environment/megablock-interior-v1.png',import.meta.url).href,
  metropolisFar:new URL('../assets/environment/metropolis-far-v1.png',import.meta.url).href,
  metropolisMid:new URL('../assets/environment/metropolis-mid-v1.png',import.meta.url).href,
  life:new URL('../assets/environment/city-life-v1.png',import.meta.url).href,
  worksite:new URL('../assets/environment/worksite-details-v1.png',import.meta.url).href,
  market:new URL('../assets/environment/market-stalls-v1.png',import.meta.url).href,
  hotelHourly:new URL('../assets/environment/market-hotel-hourly-v2.png',import.meta.url).href,
  hotelLove:new URL('../assets/environment/market-hotel-love-v2.png',import.meta.url).href,
  hotelBusiness:new URL('../assets/environment/market-hotel-business-v2.png',import.meta.url).href,
  hotelHourlyOff:new URL('../assets/environment/hotel-hourly-unlit-v1.png',import.meta.url).href,
  hotelLoveOff:new URL('../assets/environment/hotel-love-unlit-v1.png',import.meta.url).href,
  hotelBusinessOff:new URL('../assets/environment/hotel-business-unlit-v1.png',import.meta.url).href,
  propsOff:new URL('../assets/environment/props-unlit-v1.png',import.meta.url).href,
  locationsOff:new URL('../assets/environment/locations-unlit-v1.png',import.meta.url).href,
  marketOff:new URL('../assets/environment/market-unlit-v1.png',import.meta.url).href,
  lifeOff:new URL('../assets/environment/life-unlit-v1.png',import.meta.url).href,
  worksiteOff:new URL('../assets/environment/worksite-unlit-v1.png',import.meta.url).href,
  exitGarage:new URL('../assets/environment/exit-garage-v1.png',import.meta.url).href,
  exitIndustrial:new URL('../assets/environment/exit-industrial-v1.png',import.meta.url).href,
  exitMarket:new URL('../assets/environment/exit-market-v1.png',import.meta.url).href,
  exitPort:new URL('../assets/environment/exit-port-v1.png',import.meta.url).href,
  exitMegablock:new URL('../assets/environment/exit-megablock-v1.png',import.meta.url).href,
  exitCar:new URL('../assets/environment/exit-car-v1.png',import.meta.url).href,
  exitVan:new URL('../assets/environment/exit-van-v1.png',import.meta.url).href,
};
export const PARALLAX_LAYERS = [
  { asset: 'farCity', speed: .06, height: GROUND + 180, bottom: GROUND + 8, alpha: 1, filter: 'brightness(.75) saturate(.75)' },
  { asset: 'midCity', speed: .24, height: ACTOR_HEIGHT * 7, bottom: GROUND - 18, alpha: .78, filter: 'brightness(.75) saturate(.8)' },
  { asset: 'nearCity', speed: .52, height: ACTOR_HEIGHT * 4.5, bottom: GROUND + 3, alpha: .94, filter: 'brightness(.82)' },
];
export const HUB_PARALLAX_LAYERS = [
  { asset:'metropolisFar',speed:.04,height:GROUND+220,bottom:GROUND+8,alpha:1,filter:'brightness(.82) saturate(.95)' },
  { asset:'metropolisMid',speed:.18,height:ACTOR_HEIGHT*12,bottom:GROUND+4,alpha:.92,filter:'brightness(.82) saturate(.95)' },
  {...PARALLAX_LAYERS[2]},
];
export function backdropLayers(world=null){
  return !world?.kind||world.kind==='market'&&world.backdrop==='metropolis'?HUB_PARALLAX_LAYERS:PARALLAX_LAYERS;
}
// Frontmost doors are roughly 1.3–1.5 actor heights, rather than embedded in a scaled panorama.
export const HUMAN_SCALE = {
  safehouse: { index: 0, center: 158, height: ACTOR_HEIGHT * 3.55, doorFraction: .37 },
  arms: { index: 1, center: 340, height: ACTOR_HEIGHT * 2.6, doorFraction: .5 },
  clinic: { index: 2, center: 800, height: ACTOR_HEIGHT * 2.7, doorFraction: .5 },
  medbay: { index: 3, center: 565, height: ACTOR_HEIGHT * 1.3 },
  gate: { index: 4, height: ACTOR_HEIGHT * 2, doorFraction: .7 },
};
export function parallaxTiles(camera, viewportWidth, tileWidth, speed) {
  const start = -(((camera * speed) % tileWidth + tileWidth) % tileWidth);
  const tiles = [];
  for (let x = start - tileWidth; x < viewportWidth + tileWidth; x += tileWidth) tiles.push(x);
  return tiles;
}
const images = new Map(); let loading;
const slices = new Map();
const layerSurfaces = new Map();
const roadSurfaces=new Map();
const PROP_LIGHTS={
  0:[{rect:[.38,.63,.22,.07],colour:'#ffc46f'}],
  1:[{rect:[.15,.24,.73,.14],colour:'#ff426f',mode:'strong'},{rect:[.055,.56,.07,.2],colour:'#4fe6ec'}],
  2:[{rect:[.13,.25,.8,.25],colour:'#42e5ed'},{rect:[.53,.51,.28,.06],colour:'#fc4eab',mode:'blink'}],
  3:[{rect:[.27,.05,.53,.25],colour:'#48ece1'}],
  4:[{rect:[.39,.27,.23,.07],colour:'#4ce9e1'}],
  6:[{rect:[.43,.35,.15,.25],colour:'#ffc25d'}],
  7:[{rect:[.58,.08,.38,.1],colour:'#ffca7c',lamp:true}],
};
const WALL_LIGHTS=[
  {rect:[.145,.62,.055,.03],colour:'#48e3ec'},
  {rect:[.515,.50,.015,.14],colour:'#fc59b8',unstable:true},
  {rect:[.81,.59,.06,.03],colour:'#48e3ec'},
];
const CITY_SCREENS={
  metropolisFar:[{r:[.806,.085,.115,.36],colour:'#e556c3'},{r:[.225,.02,.08,.28],colour:'#53ddea'}],
  metropolisMid:[{r:[.388,.33,.063,.25],colour:'#53ddea'},{r:[.633,.405,.044,.24],colour:'#e556c3'},{r:[.10,.38,.04,.18],colour:'#53ddea'}],
};
export function preloadEnvironment() {
  if (typeof Image === 'undefined') return Promise.resolve();
  return loading ||= Promise.all(Object.entries(ENVIRONMENT_ASSETS).map(([id, url]) => new Promise((resolve, reject) => {
    const image = new Image(); image.onload = () => { images.set(id, image);if(id.endsWith('Off')){slices.clear();detailMaterials.clear();locationVariants.clear();}resolve(); }; image.onerror = () => reject(new Error(`Cannot load ${url}`)); image.src = url;
  })));
}
export function environmentDiagnostics() { return Object.fromEntries(Object.keys(ENVIRONMENT_ASSETS).map(id => [id, images.has(id)])); }
// Trim transparent padding once; props can then be placed exactly on collision surfaces.
function prop(index,atlas='props') {
  const key=atlas+':'+index;
  if (slices.has(key)) return slices.get(key);
  const image = images.get(atlas); if (!image) return null;
  const col = index % 4, row = Math.floor(index / 4);
  const rows=atlas==='props'?3:4;
  const cell=atlas.startsWith('hotel')||atlas.startsWith('exit')?{x:0,y:0,w:image.width,h:image.height}:atlas==='market'?marketCell(index,image.width,image.height):{x:Math.round(col*image.width/4),y:Math.round(row*image.height/rows),w:Math.round((col+1)*image.width/4)-Math.round(col*image.width/4),h:Math.round((row+1)*image.height/rows)-Math.round(row*image.height/rows)};
  const {x,y,w,h}=cell;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true }); ctx.drawImage(image, x, y, w, h, 0, 0, w, h);
  const pixels = ctx.getImageData(0, 0, w, h).data;
  let left = w, top = h, right = 0, bottom = 0;
  const threshold=atlas==='life'||atlas==='worksite'?160:75;
  for (let yy = 2; yy < h - 2; yy++) for (let xx = 2; xx < w - 2; xx++) if (pixels[(yy * w + xx) * 4 + 3] > threshold) { left = Math.min(left, xx); top = Math.min(top, yy); right = Math.max(right, xx); bottom = Math.max(bottom, yy); }
  const result = withUnlitBase({ image, x: x + left, y: y + top, w: Math.max(1, right - left + 1), h: Math.max(1, bottom - top + 1),contactInset:sceneryContactInset(pixels,w,h,{left,top,right,bottom}) },images.get(atlas+'Off'),cell,threshold);
  slices.set(key, result); return result;
}
function drawProp(ctx, index, x, feet, width, height,time=0) {
  const p = prop(index); if (!p) return false;
  height ||= width * p.h / p.w;
  const fitted=fitScenery(p.w,p.h,x,feet-height,width,height);x=fitted.x;width=fitted.w;height=fitted.h;
  feet+=1+p.contactInset*height/p.h;
  ctx.drawImage(p.image, p.x, p.y, p.w, p.h, x, feet - height, width, height);
  drawLights(ctx,p,PROP_LIGHTS[index]||[],x,feet-height,width,height,time,index*137+Math.floor(x*3),'prop:'+index);
  for(const [i,light]of (PROP_LIGHTS[index]||[]).entries())if(!light.lamp&&light.rect[2]>.15){
    ctx.save();ctx.globalAlpha*=lightLevel(time,index*137+Math.floor(x*3)+i*23,light.mode??light.unstable);
    const [lx,ly,lw,lh]=light.rect;drawScreenAnimation(ctx,p,light.rect,x+lx*width,feet-height+ly*height,lw*width,lh*height,time,x+index,'props:'+index);
    ctx.restore();
  }
  if(index===9)drawVentSteam(ctx,x+width*.52,feet-height*.98,height*.6,time,x);
  return true;
}
function drawScaledProp(ctx, index, center, feet, height,time=0) {
  const p = prop(index); if (!p) return;
  const width = height * p.w / p.h;
  drawProp(ctx, index, center - width / 2, feet, width, height,time);
}
function drawLights(ctx,source,lights,x,y,width,height,time,seed,key) {
  drawSpriteEmission(ctx,source,lights,x,y,width,height,time,seed);
  lights.forEach((light,i)=>{
    const level=controlledLight(light.level??lightLevel(time,seed+i*23,light.mode??light.unstable)),[lx,ly,lw,lh]=light.rect;
    const cx=x+(lx+lw/2)*width,cy=y+(ly+lh/2)*height;
    ambientGlow(ctx,cx,cy,Math.max(lw*width,lh*height)*1.4,light.colour,.32*level*(light.glow??1));
    if(light.lamp)drawLampAtmosphere(ctx,cx,cy,y+height-cy,time,seed+i,level);
  });
}
function drawRoad(ctx,canvas,camera) {
  const image=images.get('road'),height=canvas.height-GROUND+8;if(!image||height<=0)return;
  ctx.save();ctx.translate(0,GROUND);
  for(const [width,alpha,band]of [[1024,1,.34],[1493,.18,.68]]){
    const key=width+':'+height;
    if(!roadSurfaces.has(key)){
      const c=document.createElement('canvas');c.width=width*2;c.height=height;
      const x=c.getContext('2d'),sh=Math.min(image.height,image.width*height/width),sy=(image.height-sh)*band;
      x.drawImage(image,0,sy,image.width,sh,0,0,width,height);
      // Mirrored edge pairs meet on the exact same texels, with no overlapping prop borders.
      x.translate(width*2,0);x.scale(-1,1);x.drawImage(c,0,0,width,height,0,0,width,height);
      roadSurfaces.set(key,c);
    }
    ctx.globalAlpha=alpha;ctx.fillStyle=ctx.createPattern(roadSurfaces.get(key),'repeat');
    ctx.fillRect(Math.floor(camera)-2,0,canvas.width+4,height);
  }
  const shade=ctx.createLinearGradient(0,0,0,height);shade.addColorStop(0,'#10151c22');shade.addColorStop(1,'#040812aa');
  ctx.globalAlpha=1;ctx.fillStyle=shade;ctx.fillRect(camera-2,0,canvas.width+4,height);
  ctx.fillStyle='#4a505b';ctx.fillRect(camera-2,0,canvas.width+4,2);
  ctx.fillStyle='#080d16';ctx.fillRect(camera-2,2,canvas.width+4,3);
  ctx.restore();
}
export function drawRasterBackdrop(ctx, canvas, camera,time=0,world=null,cameraY=0) {
  if (!images.has('farCity')) return false;
  if(world?.kind==='megablock'){
    ctx.fillStyle='#0c101b';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.save();ctx.translate(-camera,-cameraY);
    const image=images.get('interiorWall'),rise=world.floorRise||190,bay=Math.round(rise*(image?image.width/image.height:1.5));
    const tileKey='interior:'+rise;
    if(image&&!layerSurfaces.has(tileKey)){
      const tile=document.createElement('canvas');tile.width=bay;tile.height=rise;
      const c=tile.getContext('2d');c.filter='brightness(.7) saturate(.65)';c.drawImage(image,0,0,bay,rise);layerSurfaces.set(tileKey,tile);
    }
    for(const y of world.floors){
      ctx.fillStyle='#242b2c';ctx.fillRect(camera,y-rise,canvas.width,rise);
      const tile=layerSurfaces.get(tileKey);
      for(let x=Math.floor(camera/bay)*bay;x<camera+canvas.width;x+=bay){
        if(tile)ctx.drawImage(tile,x,y-rise,bay+1,rise);
        // Structural joints and pilasters make continuous indoor corridor bays.
        ctx.fillStyle='#131c20';ctx.fillRect(x,y-rise,12,rise);
        ctx.fillStyle='#465050';ctx.fillRect(x+1,y-rise,2,rise);
        ctx.fillStyle='#88918b55';for(const yy of [y-rise+20,y-26])ctx.fillRect(x+5,yy,2,2);
      }
      ctx.fillStyle='#0c1318';ctx.fillRect(camera,y-rise,canvas.width,12);
      ctx.fillStyle='#4e5954';ctx.fillRect(camera,y-rise+12,canvas.width,2);
      ctx.fillStyle='#121b20';ctx.fillRect(camera,y-13,canvas.width,13);
      ctx.fillStyle='#53605b';ctx.fillRect(camera,y-14,canvas.width,2);
    }
    for(const lamp of world.wallLights||[]){
      if(lamp.x<camera-100||lamp.x>camera+canvas.width+100)continue;
      const {x,y,colour}=lamp,level=lightLevel(time,x,false);
      ambientGlow(ctx,x,y+20,90,colour,.16*level);
      const beam=ctx.createLinearGradient(x,y,x,y+120);beam.addColorStop(0,'#a7e3d219');beam.addColorStop(1,'#a7e3d200');
      ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(x-18,y+5);ctx.lineTo(x+18,y+5);ctx.lineTo(x+55,y+120);ctx.lineTo(x-55,y+120);ctx.closePath();ctx.fill();
      ctx.fillStyle='#080e13';ctx.fillRect(x-24,y-5,48,13);
      ctx.fillStyle='#596763';ctx.fillRect(x-23,y-5,46,2);
      ctx.fillStyle=colour;ctx.globalAlpha=.7+.3*level;ctx.fillRect(x-18,y-1,36,4);ctx.globalAlpha=1;
      ctx.fillStyle='#84928a';ctx.fillRect(x-21,y,2,2);ctx.fillRect(x+19,y,2,2);
    }
    ctx.restore();return true;
  }
  for (const layer of backdropLayers(world)) {
    if(world?.kind==='port'&&layer.asset==='nearCity')continue;
    const image = images.get(layer.asset); if (!image) continue;
    const width = layer.height * image.width / image.height;
    let surface = layerSurfaces.get(layer.asset);
    if (!surface) {
      surface = document.createElement('canvas'); surface.width = Math.ceil(width); surface.height = Math.ceil(layer.height);
      const c = surface.getContext('2d'); c.filter = layer.filter;
      c.drawImage(image, 0, 0, surface.width, surface.height); layerSurfaces.set(layer.asset, surface);
    }
    // Bake the distance colour treatment once instead of filtering large PNGs every frame.
    ctx.save(); ctx.globalAlpha = layer.alpha;
    for (const x of parallaxTiles(camera, canvas.width, width, layer.speed)) {
      if (x + width < 0 || x > canvas.width) continue;
      ctx.drawImage(surface, x, layer.bottom - layer.height, width + 1, layer.height);
      if(layer.asset==='nearCity')drawLights(ctx,{image:surface,x:0,y:0,w:surface.width,h:surface.height},WALL_LIGHTS,
        x,layer.bottom-layer.height,width+1,layer.height,time,Math.round((x+camera*layer.speed)/width)*19,'nearCity');
      for(const [index,screen]of (CITY_SCREENS[layer.asset]||[]).entries()){
        const [sx,sy,sw,sh]=screen.r;drawScreenAnimation(ctx,{image,x:0,y:0,w:image.width,h:image.height},screen.r,x+sx*width,layer.bottom-layer.height+sy*layer.height,sw*width,sh*layer.height,time,index*37,layer.asset);
      }
    }
    ctx.restore();
    if(['farCity','metropolisFar'].includes(layer.asset))drawCityTraffic(ctx,time,camera,canvas.width,layer.asset==='metropolisFar');
  }
  if(world?.kind==='port'){
    const water=ctx.createLinearGradient(0,GROUND-80,0,GROUND+15);water.addColorStop(0,'#193242');water.addColorStop(1,'#101d29');
    ctx.fillStyle=water;ctx.fillRect(0,GROUND-80,canvas.width,95);
    ctx.strokeStyle='#648c9933';ctx.lineWidth=1;
    for(let i=0;i<22;i++){const x=((i*137+time*8-camera*.15)%canvas.width+canvas.width)%canvas.width,y=GROUND-70+(i*19)%65;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+20+(i%4)*9,y);ctx.stroke();}
    for(let x=Math.floor(camera*.3/400)*400;x<camera*.3+canvas.width;x+=400)drawVentSteam(ctx,x-camera*.3,GROUND-40,130,time,x);
  }
  return true;
}
export function drawRasterEnvironment(ctx, canvas, world, mode, camera,time=0) {
  if (!images.has('props')) return false;
  if(mode!=='hub'&&world.kind)return drawLocation(ctx,canvas,world,camera,time);
  drawRoad(ctx,canvas,camera);
  drawDetails(ctx,canvas,world,camera,time,mode==='hub'?'hub':'industrial');
  for (const platform of world.platforms) {
    if (platform.ground || platform.x + platform.w < camera - 30 || platform.x > camera + canvas.width + 30) continue;
    drawDeck(ctx,platform.x,platform.y,platform.w,18);
  }
  for (let x = 180; x < world.width - 180; x += 410) {
    if (x < camera - 180 || x > camera + canvas.width + 100) continue;
    if (mode !== 'hub') { drawScaledProp(ctx, 9, x - 35, GROUND, ACTOR_HEIGHT * 3,time); drawScaledProp(ctx, 10, x + 110, GROUND, ACTOR_HEIGHT * .8,time); }
    drawScaledProp(ctx, 7, x + 175, GROUND, ACTOR_HEIGHT * 2.2,time);
  }
  if (mode === 'hub') {
    for (const name of ['safehouse', 'arms', 'clinic', 'medbay']) {
      const object = HUMAN_SCALE[name]; drawScaledProp(ctx, object.index, object.center, GROUND, object.height,time);
    }
  }
  drawTransportExit(ctx,world,mode,time,prop(0,exitStyle(world).asset));
  for (const c of world.chests) {
    if (!c.open) drawProp(ctx, 6, c.x, c.y + 25, 36, 25,time);
    else { ctx.save(); ctx.globalAlpha = .5; drawProp(ctx, 6, c.x, c.y + 25, 36, 23,time); ctx.restore(); }
  }
  drawSceneDust(ctx,camera,canvas.width,time,world,GROUND);
  return true;
}

const locationKinds={container:0,cargo:1,crane:2,bollard:3,foodStall:4,techStall:5,produce:6,canopy:7,apartment:8,maintenance:9,vent:12,barrier:13};
const detailLayouts=new WeakMap();
const detailMaterials=new Map();
function detailMaterial(p,def){
  const key=def.atlas+':'+def.frame;
  if(!detailMaterials.has(key)){
    const c=document.createElement('canvas');c.width=p.w;c.height=p.h;const x=c.getContext('2d');
    x.drawImage(p.image,p.x,p.y,p.w,p.h,0,0,p.w,p.h);
    const pixels=x.getImageData(0,0,p.w,p.h),d=pixels.data;
    for(let i=0;i<d.length;i+=4){
      if(!d[i+3])continue;
      const r=d[i],g=d[i+1],b=d[i+2],light=r*.2126+g*.7152+b*.0722;
      const emission=Math.max(r,g,b)>150&&b>110&&Math.max(r,g,b)-Math.min(r,g,b)>60;
      const gain=emission?.96:def.atlas==='worksite'?.72:.80,saturation=emission?.9:.65;
      for(let channel=0;channel<3;channel++)d[i+channel]=(light+(d[i+channel]-light)*saturation)*gain*[.96,1,1.02][channel];
    }
    x.putImageData(pixels,0,0);detailMaterials.set(key,c);
  }
  return detailMaterials.get(key);
}
function drawDetails(ctx,canvas,world,camera,time,kind=world.kind){
  let details=world.details;
  if(!details){
    let cached=detailLayouts.get(world);if(!cached){cached={};detailLayouts.set(world,cached);}
    details=cached[kind] ||= createDressing(world,731,GROUND,kind);
  }
  for(const d of details){
    if(d.x+d.w<camera-20||d.x>camera+canvas.width+20)continue;
    const def=DETAIL_SPRITES[d.sprite],p=prop(def.frame,def.atlas);if(!p)continue;
    const material=detailMaterial(p,def);
    const y=d.y+(d.wall?0:1+p.contactInset*d.h/p.h);
    ctx.save();
    if(!d.wall){
      ctx.fillStyle='#03080b50';ctx.beginPath();ctx.ellipse(d.x+d.w/2,d.floorY-.5,d.w*.42,1.5,0,0,Math.PI*2);ctx.fill();
    }
    const lights=OBJECT_LIGHTS[def.atlas]?.[def.frame]||[];
    if(d.mirror){ctx.translate(d.x+d.w,y);ctx.scale(-1,1);ctx.drawImage(material,0,0,p.w,p.h,0,0,d.w,d.h);drawLights(ctx,p,lights,0,0,d.w,d.h,time,d.x,def.atlas+':'+def.frame);}
    else{ctx.drawImage(material,0,0,p.w,p.h,d.x,y,d.w,d.h);drawLights(ctx,p,lights,d.x,y,d.w,d.h,time,d.x,def.atlas+':'+def.frame);}
    ctx.restore();
    if(['vending','directionSign','menuBoard','portNotice'].includes(d.sprite))ambientGlow(ctx,d.x+d.w*.5,d.y+d.h*.3,d.w*.42,'#6fd9d8',.12*lightLevel(time,d.x));
    if(d.sprite==='grill')drawCookingSteam(ctx,d.x+d.w*.45,d.y+8,30,time,d.x);
  }
}
function hotelLights(style,time,seed){
  return HOTEL_ATMOSPHERE[style].lights.map((light,i)=>{
    if(!light.window)return light;
    const phase=((time+seed*.03+i*11)%45+45)%45;
    const dark=Math.max(0,Math.min(1,(phase-29)/2,(39-phase)/2));
    return {...light,level:(1-dark*.95)*(.90+.06*Math.sin(time*.3+i)),glow:.35};
  });
}
function drawHotelAtmosphere(ctx,d,source,time){
  const profile=HOTEL_ATMOSPHERE[d.style];if(!profile||!source)return;
  const x=d.x,y=d.y+1+source.contactInset*d.h/source.h,seed=d.x*7+d.w*13;
  drawLights(ctx,{...source,emission:null},hotelLights(d.style,time,seed),x,y,d.w,d.h,time,seed,'hotel:'+d.style);
  for(const [i,[lx,ly,floor]]of profile.lamps.entries()){
    drawLampAtmosphere(ctx,x+lx*d.w,y+ly*d.h,(floor-ly)*d.h,time,seed+i*31,lightLevel(time,seed+i));
  }
  for(const [i,[vx,vy]]of profile.vents.entries()){
    const phase=((time+seed*.01+i*11)%26+26)%26;
    const strength=Math.max(0,Math.min(1,phase/2,(20-phase)/3));
    if(strength>0){ctx.save();ctx.globalAlpha*=strength;drawVentSteam(ctx,x+vx*d.w,y+vy*d.h,d.h*.23,time,seed+i*41);ctx.restore();}
  }
}
const locationVariants=new Map();
function drawLocationProp(ctx,index,x,y,w,h,variant=0,interior=false,atlas='locations',time=0){
  const p=prop(index,atlas);if(!p)return;
  const fitted=fitScenery(p.w,p.h,x,y,w,h);x=fitted.x;y=fitted.y;w=fitted.w;h=fitted.h;
  y+=1+p.contactInset*h/p.h;
  if(atlas==='locations'&&interior&&(index===8||index===9)){
    const key='interior-material:'+index;
    if(!locationVariants.has(key)){
      const c=document.createElement('canvas');c.width=p.w;c.height=p.h;
      const a=c.getContext('2d');a.drawImage(p.image,p.x,p.y,p.w,p.h,0,0,p.w,p.h);
      const pixels=a.getImageData(0,0,c.width,c.height),data=pixels.data;
      for(let i=0;i<data.length;i+=4){
        if(!data[i+3])continue;
        const r=data[i],g=data[i+1],b=data[i+2],max=Math.max(r,g,b),min=Math.min(r,g,b);
        // Shared graphite/sage material palette; retain bright coloured emitters.
        const emission=Math.min(1,Math.max(0,(max-140)/70))*Math.min(1,(max-min)/80);
        const light=(r*.2126+g*.7152+b*.0722)*.8;
        for(const [channel,factor]of [[0,.91],[1,1],[2,.96]])data[i+channel]=light*factor*(1-emission)+data[i+channel]*emission;
      }
      a.putImageData(pixels,0,0);locationVariants.set(key,c);
    }
    ctx.drawImage(locationVariants.get(key),x,y,w,h);
  }else if(atlas==='locations'&&index===0&&variant){
    const key=index+':'+variant;if(!locationVariants.has(key)){
      const c=document.createElement('canvas');c.width=p.w;c.height=p.h;
      const a=c.getContext('2d');a.filter=['none','hue-rotate(140deg)','hue-rotate(230deg)','saturate(.25)','brightness(.7)'][variant%5];a.drawImage(p.image,p.x,p.y,p.w,p.h,0,0,p.w,p.h);locationVariants.set(key,c);
    }
    ctx.drawImage(locationVariants.get(key),x,y,w,h);
  }else ctx.drawImage(p.image,p.x,p.y,p.w,p.h,x,y,w,h);
  const hotel=Object.keys(MARKET_HOTELS).find(style=>MARKET_HOTELS[style].asset===atlas),seed=x*7+w*13;
  if(hotel)drawSpriteEmission(ctx,p,hotelLights(hotel,time,seed),x,y,w,h,time,seed);
  else drawLights(ctx,p,OBJECT_LIGHTS[atlas]?.[index]||[],x,y,w,h,time,seed,atlas+':'+index);
}
function drawDeck(ctx,x,y,w,h){
  const p=prop(10,'locations');
  if(!p){ctx.fillStyle='#515868';ctx.fillRect(x,y,w,h);return;}
  const tileWidth=p.w/p.h*h;
  for(let xx=x;xx<x+w;xx+=tileWidth){const width=Math.min(tileWidth,x+w-xx);ctx.drawImage(p.image,p.x,p.y,p.w*width/tileWidth,p.h,xx,y,width,h);}
}
function drawLocation(ctx,canvas,world,camera,time){
  if(world.kind!=='megablock')drawRoad(ctx,canvas,camera);
  else{ctx.fillStyle='#080c15';ctx.fillRect(camera,GROUND,canvas.width,canvas.height+Math.abs(world.top));}
  const visible=o=>o.x+o.w>camera-100&&o.x<camera+canvas.width+100;
  for(const d of world.decor.filter(d=>d.kind==='crane'&&visible(d))){ctx.save();ctx.globalAlpha=.65;drawLocationProp(ctx,2,d.x,d.y-d.h,d.w,d.h,0,false,'locations',time);ctx.restore();}
  drawDetails(ctx,canvas,world,camera,time);
  for(const original of world.decor){
    let d=original;
    if(d.kind==='crane'||!visible(d))continue;
    if(d.kind==='marketHotel'){
      ctx.save();ctx.beginPath();ctx.rect(d.x-2,d.y-2,d.w+4,GROUND-d.y+3);ctx.clip();
      drawLocationProp(ctx,0,d.x,d.y,d.w,d.h,0,false,MARKET_HOTELS[d.style].asset,time);
      ctx.restore();
      drawHotelAtmosphere(ctx,d,prop(0,MARKET_HOTELS[d.style].asset),time);
      continue;
    }
    const under=['container','canopy'].includes(d.kind)||isMarketStall(d.kind);
    const style=isMarketStall(d.kind)?marketStyle(d):null;
    const frame=style?.frame??locationKinds[d.kind]??9,atlas=style?.atlas||'locations',source=prop(frame,atlas);
    const top=under?d.y:d.y-d.h,fitted=source?fitScenery(source.w,source.h,d.x,top,d.w,d.h):{x:d.x,y:top,w:d.w,h:d.h};
    d={...d,x:fitted.x,w:fitted.w,h:fitted.h};const y=fitted.y;
    if(d.kind==='produce'){ctx.save();ctx.filter='brightness(.78) saturate(.65)';}
    drawLocationProp(ctx,frame,d.x,y,d.w,d.h,d.variant||0,world.kind==='megablock',atlas,time);
    if(d.kind==='produce')ctx.restore();
    if(isMarketStall(d.kind)||['apartment','maintenance'].includes(d.kind)){
      const colour=d.kind==='foodStall'?'#ff9e51':d.kind==='apartment'?'#e956b4':'#42dce5';
      ambientGlow(ctx,d.x+d.w*.6,y+d.h*.26,d.w*.4,colour,.22*lightLevel(time,d.x,true));
    }
    if(d.kind==='vent')drawVentSteam(ctx,d.x+d.w*.67,y,d.h*.65,time,d.x);
    if(d.kind==='vent'||d.kind==='maintenance'){
      drawElectricalFault(ctx,d.x+d.w*.72,y+d.h*.43,time,d.x);
      if(d.kind==='maintenance')drawVentSteam(ctx,d.x+d.w*.25,y+d.h*.3,32,time,d.x);
    }
    if(d.kind==='container')drawWarningBeacon(ctx,d.x+d.w-8,y+5,time,d.x);
    if(d.kind==='foodStall'){
      if(style?.cooking!==false){
      drawCookingSteam(ctx,d.x+d.w*.34,y+d.h*.61,55,time,d.x);
      drawCookingSteam(ctx,d.x+d.w*.53,y+d.h*.64,40,time,d.x+17);
      }
      drawStallLights(ctx,d.x+d.w*.16,y+d.h*.31,d.w*.68,time,d.x);
      ambientGlow(ctx,d.x+d.w*.5,y+d.h*.62,d.w*.4,'#ffb66c',.16);
    }
    if(d.kind==='techStall')drawScreenAnimation(ctx,source,[.42,.32,.39,.22],d.x+d.w*.42,y+d.h*.32,d.w*.39,d.h*.22,time,d.x,atlas+':'+frame);
    if(d.kind==='apartment'){
      ctx.fillStyle='#10272c';ctx.fillRect(d.x+d.w*.73,y+d.h*.44,d.w*.20,d.h*.15);
      ctx.save();ctx.globalAlpha*=lightLevel(time,d.x);
      ctx.fillStyle='#71dadd';ctx.font='7px monospace';ctx.fillText(`${d.floor+1}-${Math.floor(d.x/10)%100}`,d.x+d.w*.74,y+d.h*.54);
      drawHologram(ctx,d.x+d.w*.73,y+d.h*.44,d.w*.20,d.h*.15,time,d.x);
      ctx.restore();
    }
  }
  for(const p of world.platforms){
    if(p.x+p.w<camera||p.x>camera+canvas.width)continue;
    if(p.ground){if(world.kind==='megablock')drawDeck(ctx,0,GROUND,world.width,20);continue;}
    if(p.stair)continue; // Open metal treads are drawn with their flight below.
    if(!p.art||p.art==='canopy'||p.art==='pavilionRoof'){
      let start=p.x;
      for(const hole of [...(p.holes||[])].sort((a,b)=>a.x-b.x)){if(hole.x>start)drawDeck(ctx,start,p.y,hole.x-start,p.stair?9:18);start=Math.max(start,hole.x+hole.w);}
      if(start<p.x+p.w)drawDeck(ctx,start,p.y,p.x+p.w-start,p.stair?9:18);
    }
  }
  for(const flight of world.stairs){
    const a=flight.lower,b=flight.upper;
    if(Math.max(a.x,b.x)<camera||Math.min(a.x,b.x)>camera+canvas.width)continue;
    ctx.save();ctx.lineJoin='round';
    const stroke=(x1,y1,x2,y2,colour,width=1)=>{ctx.strokeStyle=colour;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();};
    // Twin steel stringers, attached to bolted floor plates, leave the flight open.
    stroke(a.x+7,a.y+8,b.x+7,b.y+8,'#18242e',10);
    stroke(a.x,a.y+9,b.x,b.y+9,'#465560',7);
    stroke(a.x,a.y+6,b.x,b.y+6,'#82918a',1);
    const steps=world.platforms.filter(p=>p.stair&&p.stairId===flight.id);
    for(const [i,p] of steps.entries()){
      drawDeck(ctx,p.x,p.y,p.w,5);
      ctx.fillStyle='#a0aaa0';ctx.fillRect(p.x,p.y,p.w,1);
      ctx.fillStyle='#202c34';ctx.fillRect(p.x+3,p.y+2,p.w-6,2);
      for(let x=p.x+5;x<p.x+p.w-3;x+=6){ctx.fillStyle='#69786f';ctx.fillRect(x,p.y+2,2,1);}
      const lip=flight.dir>0?p.x:p.x+p.w-3;
      ctx.fillStyle=i===0||i===steps.length-1?'#d2ad58':'#77857c';ctx.fillRect(lip,p.y,3,5);
      if(i%2===0){const x=p.x+p.w/2;stroke(x,p.y+7,x,p.y-38,'#24343e',4);stroke(x-1,p.y+5,x-1,p.y-38,'#7c8d8a');}
    }
    // Continuous handrail and knee rail with horizontal returns at both landings.
    for(const offset of [-38,-19]){
      stroke(a.x-flight.dir*12,a.y+offset,a.x,a.y+offset,'#273740',5);
      stroke(a.x,a.y+offset,b.x,b.y+offset,'#273740',5);
      stroke(b.x,b.y+offset,b.x+flight.dir*12,b.y+offset,'#273740',5);
      stroke(a.x,a.y+offset-1,b.x,b.y+offset-1,offset===-38?'#b2ac83':'#758985',offset===-38?2:1);
    }
    for(const end of [a,b]){
      stroke(end.x,end.y+5,end.x,end.y-38,'#758681',3);
      ctx.fillStyle='#293941';ctx.fillRect(end.x-10,end.y+2,20,5);
      ctx.fillStyle='#d4b365';ctx.fillRect(end.x-8,end.y+2,5,2);ctx.fillRect(end.x+3,end.y+2,5,2);
      ctx.fillStyle='#a9b3a5';ctx.fillRect(end.x-7,end.y+5,2,2);ctx.fillRect(end.x+5,end.y+5,2,2);
    }
    ctx.restore();
  }
  for(const l of world.ladders)if(l.x>camera-30&&l.x<camera+canvas.width+30){
    const p=prop(11,'locations');
    if(p){const tileHeight=24*p.h/p.w;for(let yy=l.top;yy<l.bottom;yy+=tileHeight){const h=Math.min(tileHeight,l.bottom-yy);ctx.drawImage(p.image,p.x,p.y,p.w,p.h*h/tileHeight,l.x-12,yy,24,h);}}
    ambientGlow(ctx,l.x,l.top+6,12,'#5aede6',.13);
  }
  drawTransportExit(ctx,world,'expedition',time,prop(0,exitStyle(world).asset));
  for(const c of world.chests){ctx.save();if(c.open)ctx.globalAlpha=.45;drawProp(ctx,6,c.x,c.y+25,36,25,time);ctx.restore();}
  // Lamps remain sparse and fixed in world space; their positions vary with each layout.
  for(const lamp of world.lamps||[])if(lamp.x>camera-70&&lamp.x<camera+canvas.width+70)drawScaledProp(ctx,7,lamp.x,lamp.y,ACTOR_HEIGHT*2,time);
  if(world.kind==='port')drawHarbourHaze(ctx,camera,canvas.width,time,GROUND);
  drawSceneDust(ctx,camera,canvas.width,time,world,GROUND);
  return true;
}
