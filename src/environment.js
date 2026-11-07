import { GROUND } from './world.js';
import { ACTOR_HEIGHT } from './weapons.js';

export const ENVIRONMENT_ASSETS = {
  farCity: new URL('../assets/environment/skyline-dry-v2.png', import.meta.url).href,
  midCity: new URL('../assets/environment/district-dry-v2.png', import.meta.url).href,
  nearCity: new URL('../assets/environment/walls-dry-v2.png', import.meta.url).href,
  props: new URL('../assets/environment/props-dry-v2.png', import.meta.url).href,
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
function drawProp(ctx, index, x, feet, width, height) {
  const p = prop(index); if (!p) return false;
  height ||= width * p.h / p.w;
  ctx.drawImage(p.image, p.x, p.y, p.w, p.h, x, feet - height, width, height); return true;
}
function drawScaledProp(ctx, index, center, feet, height) {
  const p = prop(index); if (!p) return;
  const width = height * p.w / p.h;
  drawProp(ctx, index, center - width / 2, feet, width, height);
}
export function drawRasterBackdrop(ctx, canvas, camera) {
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
    }
    ctx.restore();
  }
  return true;
}
export function drawRasterEnvironment(ctx, canvas, world, mode, camera) {
  if (!images.has('props')) return false;
  const street = prop(8);
  // The top of the raster road matches GROUND, including the foreground extension.
  for (let x = Math.floor(camera / 410) * 410; x < camera + canvas.width + 410; x += 410) {
    ctx.drawImage(street.image, street.x, street.y, street.w, street.h, x, GROUND, 412, canvas.height - GROUND + 8);
  }
  for (const platform of world.platforms) {
    if (platform.ground || platform.x + platform.w < camera - 30 || platform.x > camera + canvas.width + 30) continue;
    drawProp(ctx, 5, platform.x, platform.y + 18, platform.w, 40);
  }
  for (let x = 180; x < world.width - 180; x += 410) {
    if (x < camera - 180 || x > camera + canvas.width + 100) continue;
    if (mode !== 'hub') { drawScaledProp(ctx, 9, x - 35, GROUND, ACTOR_HEIGHT * 3); drawScaledProp(ctx, 10, x + 110, GROUND, ACTOR_HEIGHT * .8); }
    drawScaledProp(ctx, 7, x + 175, GROUND, ACTOR_HEIGHT * 2.2);
  }
  if (mode === 'hub') {
    for (const name of ['safehouse', 'arms', 'clinic', 'medbay']) {
      const object = HUMAN_SCALE[name]; drawScaledProp(ctx, object.index, object.center, GROUND, object.height);
    }
  }
  drawScaledProp(ctx, HUMAN_SCALE.gate.index, world.portal.x, GROUND, HUMAN_SCALE.gate.height);
  for (const c of world.chests) {
    if (!c.open) drawProp(ctx, 6, c.x, c.y + 25, 36, 25);
    else { ctx.save(); ctx.globalAlpha = .5; drawProp(ctx, 6, c.x, c.y + 25, 36, 23); ctx.restore(); }
  }
  return true;
}
