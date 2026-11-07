import { animationFrame, animationInfo, atlasCell } from './animation.js';
import { appearance } from './character.js';
import { spriteGeometry } from './weapons.js';

export const SPRITES = {
  hero: new URL('../assets/characters/mercenary-clean-v1.png', import.meta.url).href,
  enemies: new URL('../assets/characters/enemies-clean-v1.png', import.meta.url).href,
  actions: new URL('../assets/characters/mercenary-actions-v1.png', import.meta.url).href,
  utility: new URL('../assets/characters/mercenary-utility-v2.png', import.meta.url).href,
  longgunUtility: new URL('../assets/characters/mercenary-longgun-utility-v2.png', import.meta.url).href,
};
export const WEAPON_ART = new URL('../assets/characters/weapons-v1.png', import.meta.url).href;
const weaponParts = new Map();
const sheets = new Map(), variants = new Map();
const muzzleAnchors = new Map();
let preloadPromise;
function loadSheet(key, url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => { sheets.set(key, { image, width: image.naturalWidth, height: image.naturalHeight }); resolve(); };
    image.onerror = () => reject(new Error(`Cannot load ${url}`)); image.src = url;
  });
}
export function preloadSprites() {
  if (typeof Image === 'undefined') return Promise.resolve();
  return preloadPromise ||= Promise.all(Object.entries({ ...SPRITES, weaponArt: WEAPON_ART }).map(([key, url]) => loadSheet(key, url)));
}
export function spriteDiagnostics() {
  return Object.fromEntries(Object.entries({ ...SPRITES, weaponArt: WEAPON_ART }).map(([key, url]) => [key, { url, loaded: sheets.has(key), width: sheets.get(key)?.width || 0, height: sheets.get(key)?.height || 0 }]));
}
export function muzzleAnchor(actor, forcedSheet, forcedFrame) {
  const info = animationInfo(actor), name = forcedSheet || info.sheet;
  const matched = { ...actor, animation: { name: info.name, time: actor.animation?.name === info.name ? actor.animation.time : 0 } };
  const index = forcedFrame ?? animationFrame(matched), key = name + ':' + index;
  if (muzzleAnchors.has(key)) return muzzleAnchors.get(key);
  const sheet = sheets.get(name); if (!sheet || typeof document === 'undefined') return info.muzzle;
  const cell = atlasCell(index, sheet.width, sheet.height), surface = document.createElement('canvas');
  surface.width=cell.w;surface.height=cell.h;
  const c=surface.getContext('2d',{willReadFrequently:true});c.drawImage(sheet.image,cell.x,cell.y,cell.w,cell.h,0,0,cell.w,cell.h);
  const data=c.getImageData(0,0,cell.w,cell.h).data;
  const metal=(x,y)=>{const i=(y*cell.w+x)*4,r=data[i],g=data[i+1],b=data[i+2],light=(r+g+b)/3;return data[i+3]>200&&light>25&&light<205&&Math.max(r,g,b)-Math.min(r,g,b)<48;};
  let found;
  // Find the rightmost connected neutral metal tip in the upper-body band.
  // Warm muzzle-flash pixels and transparent antialiasing do not move this anchor.
  for(let x=cell.w-3;x>cell.w*.57&&!found;x--){
    const ys=[];for(let y=Math.floor(cell.h*.08);y<cell.h*.52;y++)if(metal(x,y)&&metal(x-1,y)&&metal(x-2,y))ys.push(y);
    if(ys.length>=3)found=[(x-1.5)/(cell.w-4),(ys[Math.floor(ys.length/2)]-1.5)/(cell.h-4)];
  }
  const result=found||info.muzzle||[.81,.17];muzzleAnchors.set(key,result);return result;
}
function weaponPart(slot) {
  if (weaponParts.has(slot)) return weaponParts.get(slot);
  const sheet = sheets.get('weaponArt'); if (!sheet) return null;
  const index = slot === 'rifle' ? 2 : 3, w = Math.floor(sheet.width / 2), h = Math.floor(sheet.height / 2), sx = index % 2 * w, sy = Math.floor(index / 2) * h;
  const surface = document.createElement('canvas'); surface.width = w; surface.height = h;
  const c = surface.getContext('2d', { willReadFrequently:true }); c.drawImage(sheet.image, sx, sy, w, h, 0, 0, w, h);
  const pixels = c.getImageData(0, 0, w, h).data; let l=w,t=h,r=0,b=0;
  for(let y=2;y<h-2;y++)for(let x=2;x<w-2;x++)if(pixels[(y*w+x)*4+3]>75){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}
  const result={ image:sheet.image,x:sx+l,y:sy+t,w:r-l+1,h:b-t+1,barrel:slot==='rifle'?.32:.34 };
  weaponParts.set(slot,result);return result;
}
const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
function heroMaterial(equipment, sheetName = 'hero') {
  const source = sheets.get(sheetName); if (!source || !equipment || typeof document === 'undefined') return source?.image;
  const signature = sheetName + JSON.stringify(['head', 'torso', 'legs', 'feet'].map(slot => equipment[slot] ? [slot, equipment[slot].id, equipment[slot].rarity] : [slot, null]));
  if (variants.has(signature)) return variants.get(signature);
  // Recolour fabric while retaining painted highlights, scratches, folds and transparent edges.
  // This is a runtime material variant; the generated source atlas stays untouched.
  const surface = document.createElement('canvas'); surface.width = source.width; surface.height = source.height;
  const c = surface.getContext('2d', { willReadFrequently: true }); c.drawImage(source.image, 0, 0);
  const pixels = c.getImageData(0, 0, surface.width, surface.height), data = pixels.data;
  const jacket = equipment.torso, target = rgb(appearance(jacket, 'torso').color);
  const visor = rgb(appearance(equipment.head, 'head').accent);
  const legs = rgb(appearance(equipment.legs, 'legs').color), feet = rgb(appearance(equipment.feet, 'feet').color);
  const keepOriginal = jacket?.id === 'starter-torso';
  for (let y = 0; y < surface.height; y++) for (let x = 0; x < surface.width; x++) {
    const i = (y * surface.width + x) * 4; if (data[i + 3] < 30) continue;
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    const fy = (y % (surface.height / 6)) / (surface.height / 6);
    if (r > g * 1.2 && r > b * 1.05 && r > 35 && fy > .12 && fy < .68 && !keepOriginal) {
      const light = Math.max(.18, (r * .55 + g * .3 + b * .15) / 110);
      for (let channel = 0; channel < 3; channel++) data[i + channel] = Math.min(255, target[channel] * light);
    }
    if (fy < .25 && g > r * 1.3 && b > r * 1.3) {
      const light = (g + b) / 400;
      for (let channel = 0; channel < 3; channel++) data[i + channel] = equipment.head ? Math.min(255, visor[channel] * light) : (r + g + b) / 4;
    }
    if (fy > .62 && fy < .84 && equipment.legs?.id !== 'starter-legs' || fy > .84 && equipment.feet?.id !== 'starter-feet') {
      const value = (r + g + b) / 3, item = fy > .84 ? equipment.feet : equipment.legs, tone = fy > .84 ? feet : legs;
      if (Math.max(r, g, b) - Math.min(r, g, b) < 45) for (let channel = 0; channel < 3; channel++) data[i + channel] = item ? Math.min(255, tone[channel] * value / 62) : value * .78;
    }
  }
  c.putImageData(pixels, 0, 0); variants.set(signature, surface);
  // One atlas is a few MB; bound material variants even during a long equipment session.
  if (variants.size > 12) variants.delete(variants.keys().next().value);
  return surface;
}
export function drawRasterActor(ctx, actor, role, equipment, options = {}) {
  const hero = role === 'hero';
  const actualRole = role === 'merchant' ? 'gunner' : role === 'trainer' ? 'heavy' : role;
  const info = animationInfo(actor, hero ? 'hero' : actualRole);
  const sheetName = options.sheet || (hero ? info.sheet : 'enemies'), sheet = sheets.get(sheetName);
  if (!sheet) return false;
  const frame = options.frame ?? animationFrame(actor, hero ? 'hero' : actualRole);
  const cell = atlasCell(frame, sheet.width, sheet.height), height = options.height || 104;
  const source = hero ? heroMaterial(equipment, sheetName) : sheet.image;
  const box = spriteGeometry(height);
  ctx.save();
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  if (options.alpha !== undefined) ctx.globalAlpha *= options.alpha;
  // Fixed bottom-center anchor prevents action frames from drifting with weapon bounds.
  ctx.drawImage(source, cell.x + 2, cell.y + 2, cell.w - 4, cell.h - 4, box.x, box.y, box.w, box.h);
  const longGun = hero && ['rifle','shotgun'].includes(actor.activeWeapon) && info.sheet !== 'longgunUtility' && !['roll','block'].includes(info.name) && info.name !== 'attack';
  if (longGun) {
    const part = weaponPart(actor.activeWeapon);
    if (part) {
      const anchor = muzzleAnchor(actor) || [.81,.17], x=box.x+anchor[0]*box.w,y=box.y+anchor[1]*box.h;
      const width = height * (actor.activeWeapon==='rifle'?.47:.51), gunHeight=width*part.h/part.w;
      ctx.drawImage(part.image,part.x,part.y,part.w,part.h,x-width,y-gunHeight*part.barrel,width,gunHeight);
    }
  }
  ctx.restore(); return true;
}
export function previewMarkup(equipment) {
  const locations = { head: [148, 72], torso: [140, 160], legs: [128, 274], feet: [135, 355], weapon: [204, 239], gun: [110, 208] };
  const callouts = Object.entries(locations).filter(([slot]) => equipment[slot]).map(([slot, [x, y]]) => `<g data-slot="${slot}"><path d="M${x} ${y}h${x > 140 ? 32 : -30}"/><circle cx="${x}" cy="${y}" r="2"/></g>`).join('');
  return `<div class="raster-stage"><canvas class="raster-avatar" width="600" height="900" aria-label="Растровый портрет наёмника с надетой экипировкой"></canvas><svg class="gear-callouts" viewBox="0 0 260 400" aria-hidden="true">${callouts}</svg></div>`;
}
export function paintPreviews(equipment, time) {
  if (typeof document === 'undefined' || !sheets.has('hero')) return;
  for (const canvas of document.querySelectorAll('canvas.raster-avatar')) {
    const ctx = canvas.getContext('2d'); if (!ctx) continue;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const portrait = canvas.classList.contains('closeup');
    ctx.save();
    if (portrait) { ctx.translate(canvas.width * .4, canvas.height * 3.65); }
    else ctx.translate(canvas.width * .47, canvas.height * .92);
    const actor = { animation: { name: 'idle', time } };
    drawRasterActor(ctx, actor, 'hero', equipment, { height: portrait ? canvas.height * 3.55 : canvas.height * .9 });
    ctx.restore();
  }
}
