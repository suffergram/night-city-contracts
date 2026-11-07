import { GROUND } from './world.js';
import { ACTOR_HEIGHT } from './weapons.js';
import {lightLevel,ambientGlow,drawLampAtmosphere,drawVentSteam} from './ambient.js';

export const ENVIRONMENT_ASSETS = {
  farCity: new URL('../assets/environment/skyline-dry-v2.png', import.meta.url).href,
  midCity: new URL('../assets/environment/district-dry-v2.png', import.meta.url).href,
  nearCity: new URL('../assets/environment/walls-dry-v2.png', import.meta.url).href,
  props: new URL('../assets/environment/props-dry-v2.png', import.meta.url).href,
  road: new URL('../assets/environment/asphalt-dry-v1.png', import.meta.url).href,
};
export const PARALLAX_LAYERS = [
  { asset: 'farCity', speed: .06, height: GROUND + 180, bottom: GROUND + 8, alpha: 1, filter: 'brightness(.75) saturate(.75)' },
  { asset: 'midCity', speed: .24, height: ACTOR_HEIGHT * 7, bottom: GROUND - 18, alpha: .78, filter: 'brightness(.75) saturate(.8)' },
  { asset: 'nearCity', speed: .52, height: ACTOR_HEIGHT * 4.5, bottom: GROUND - 6, alpha: .94, filter: 'brightness(.82)' },
];
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
const roadSurfaces=new Map(),emissionMasks=new Map();
const PROP_LIGHTS={
  0:[{rect:[.38,.63,.22,.07],colour:'#ffc46f'}],
  1:[{rect:[.15,.24,.73,.14],colour:'#ff426f',unstable:true},{rect:[.055,.56,.07,.2],colour:'#4fe6ec'}],
  2:[{rect:[.13,.25,.8,.25],colour:'#42e5ed'},{rect:[.53,.51,.28,.06],colour:'#fc4eab',unstable:true}],
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
export function preloadEnvironment() {
  if (typeof Image === 'undefined') return Promise.resolve();
  return loading ||= Promise.all(Object.entries(ENVIRONMENT_ASSETS).map(([id, url]) => new Promise((resolve, reject) => {
    const image = new Image(); image.onload = () => { images.set(id, image); resolve(); }; image.onerror = () => reject(new Error(`Cannot load ${url}`)); image.src = url;
  })));
}
export function environmentDiagnostics() { return Object.fromEntries(Object.keys(ENVIRONMENT_ASSETS).map(id => [id, images.has(id)])); }
// Trim transparent padding once; props can then be placed exactly on collision surfaces.
function prop(index) {
  if (slices.has(index)) return slices.get(index);
  const image = images.get('props'); if (!image) return null;
  const col = index % 4, row = Math.floor(index / 4);
  const x = Math.round(col * image.width / 4), y = Math.round(row * image.height / 3);
  const w = Math.round((col + 1) * image.width / 4) - x, h = Math.round((row + 1) * image.height / 3) - y;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true }); ctx.drawImage(image, x, y, w, h, 0, 0, w, h);
  const pixels = ctx.getImageData(0, 0, w, h).data;
  let left = w, top = h, right = 0, bottom = 0;
  for (let yy = 2; yy < h - 2; yy++) for (let xx = 2; xx < w - 2; xx++) if (pixels[(yy * w + xx) * 4 + 3] > 75) { left = Math.min(left, xx); top = Math.min(top, yy); right = Math.max(right, xx); bottom = Math.max(bottom, yy); }
  const result = { image, x: x + left, y: y + top, w: Math.max(1, right - left + 1), h: Math.max(1, bottom - top + 1) };
  slices.set(index, result); return result;
}
function drawProp(ctx, index, x, feet, width, height,time=0) {
  const p = prop(index); if (!p) return false;
  height ||= width * p.h / p.w;
  ctx.drawImage(p.image, p.x, p.y, p.w, p.h, x, feet - height, width, height);
  drawLights(ctx,p,PROP_LIGHTS[index]||[],x,feet-height,width,height,time,index*137+Math.floor(x*3),'prop:'+index);
  if(index===9)drawVentSteam(ctx,x+width*.52,feet-height*.98,height*.6,time,x);
  return true;
}
function drawScaledProp(ctx, index, center, feet, height,time=0) {
  const p = prop(index); if (!p) return;
  const width = height * p.w / p.h;
  drawProp(ctx, index, center - width / 2, feet, width, height,time);
}
function drawLights(ctx,source,lights,x,y,width,height,time,seed,key) {
  lights.forEach((light,i)=>{
    const level=lightLevel(time,seed+i*23,light.unstable),[lx,ly,lw,lh]=light.rect;
    const maskKey=key+':'+i;
    if(!emissionMasks.has(maskKey)){
      const c=document.createElement('canvas');c.width=source.w;c.height=source.h;
      const m=c.getContext('2d');m.drawImage(source.image,source.x,source.y,source.w,source.h,0,0,c.width,c.height);
      const pixels=m.getImageData(0,0,c.width,c.height),d=pixels.data;
      for(let yy=0;yy<c.height;yy++)for(let xx=0;xx<c.width;xx++){
        const n=(yy*c.width+xx)*4,max=Math.max(d[n],d[n+1],d[n+2]),min=Math.min(d[n],d[n+1],d[n+2]);
        const inside=xx>=lx*c.width&&xx<(lx+lw)*c.width&&yy>=ly*c.height&&yy<(ly+lh)*c.height;
        const emissive=Math.max(0,Math.min(1,(max-70)/110))*Math.max(Math.min(1,(max-min)/40),Math.max(0,(min-130)/100));
        d[n+3]=inside?d[n+3]*emissive*.94:0;d[n]=12;d[n+1]=16;d[n+2]=24;
      }
      m.putImageData(pixels,0,0);emissionMasks.set(maskKey,c);
    }
    ctx.save();ctx.globalAlpha*=1-level;ctx.drawImage(emissionMasks.get(maskKey),x,y,width,height);ctx.restore();
    const cx=x+(lx+lw/2)*width,cy=y+(ly+lh/2)*height;
    ambientGlow(ctx,cx,cy,Math.max(lw*width,lh*height)*1.4,light.colour,.32*level);
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
export function drawRasterBackdrop(ctx, canvas, camera,time=0) {
  if (!images.has('farCity')) return false;
  for (const layer of PARALLAX_LAYERS) {
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
    }
    ctx.restore();
  }
  return true;
}
export function drawRasterEnvironment(ctx, canvas, world, mode, camera,time=0) {
  if (!images.has('props')) return false;
  drawRoad(ctx,canvas,camera);
  for (const platform of world.platforms) {
    if (platform.ground || platform.x + platform.w < camera - 30 || platform.x > camera + canvas.width + 30) continue;
    drawProp(ctx, 5, platform.x, platform.y + 18, platform.w, 40,time);
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
  drawScaledProp(ctx, HUMAN_SCALE.gate.index, world.portal.x, GROUND, HUMAN_SCALE.gate.height,time);
  for (const c of world.chests) {
    if (!c.open) drawProp(ctx, 6, c.x, c.y + 25, 36, 25,time);
    else { ctx.save(); ctx.globalAlpha = .5; drawProp(ctx, 6, c.x, c.y + 25, 36, 23,time); ctx.restore(); }
  }
  return true;
}
