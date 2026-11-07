import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ENVIRONMENT_ASSETS, PARALLAX_LAYERS, HUMAN_SCALE, parallaxTiles } from '../src/environment.js';
import { WEAPON_ART } from '../src/raster.js';
import { WEAPONS, ACTOR_HEIGHT } from '../src/weapons.js';
import {lightLevel,lampMotes} from '../src/ambient.js';

test('faulty neon has independent brief outages while regular lights shimmer continuously',()=>{
  const levels=Array.from({length:1200},(_,i)=>lightLevel(i/100,17,true));
  assert.ok(Math.min(...levels)<.1);assert.ok(Math.max(...levels)>.8);
  assert.ok(levels.filter(v=>v<.1).length<levels.length*.08);
  for(let i=0;i<1200;i++)assert.ok(lightLevel(i/100,17)>.7);
  assert.notEqual(lightLevel(3,17,true),lightLevel(3,92,true));
});
test('ambient particles follow their lamp and freeze exactly when game time is paused',()=>{
  const a=lampMotes(2,13,100,200,18),b=lampMotes(2,13,400,150,18);
  assert.deepEqual(a,lampMotes(2,13,100,200,18));assert.equal(a.length,6);
  for(let i=0;i<a.length;i++){
    assert.ok(Math.abs(b[i].x-a[i].x-300)<1e-9);assert.ok(Math.abs(b[i].y-a[i].y+50)<1e-9);
  }
  assert.notDeepEqual(a,lampMotes(3,13,100,200,18));
});

test('painted city, modular props and weapon artwork exist as local high-resolution PNGs', async()=>{
  for(const asset of [...Object.values(ENVIRONMENT_ASSETS),WEAPON_ART]){
    const png=await readFile(new URL(asset));
    assert.equal(png.subarray(1,4).toString(),'PNG');assert.ok(png.readUInt32BE(16)>=1000);assert.ok(png.readUInt32BE(20)>=700);
  }
});
test('independent background layers move increasingly faster with distance from skyline',()=>{
  assert.equal(PARALLAX_LAYERS.length,3);
  const speeds=PARALLAX_LAYERS.map(l=>l.speed);
  assert.ok(speeds[0]>0&&speeds[0]<speeds[1]&&speeds[1]<speeds[2]&&speeds[2]<1);
  for(const layer of PARALLAX_LAYERS){
    const before=parallaxTiles(0,1200,1500,layer.speed)[0];
    const after=parallaxTiles(100,1200,1500,layer.speed)[0];
    assert.ok(Math.abs((before-after)-100*layer.speed)<1e-8);
  }
});
test('repeating parallax panels cover wide screens without gaps or jumps at negative camera positions',()=>{
  for(const camera of [-1000,-1,0,1,1200,10000])for(const viewport of [320,1200,2800])for(const layer of PARALLAX_LAYERS){
    const tiles=parallaxTiles(camera,viewport,750,layer.speed);
    assert.ok(tiles[0]<=0);assert.ok(tiles.at(-1)+750>=viewport);
    for(let i=1;i<tiles.length;i++)assert.ok(Math.abs(tiles[i]-tiles[i-1]-750)<1e-8);
  }
});
test('interactive doorway proportions stay close to the actor instead of scaling with panorama height',()=>{
  for(const object of Object.values(HUMAN_SCALE))if(object.doorFraction){
    const doorHeight=object.height*object.doorFraction;
    assert.ok(doorHeight>=ACTOR_HEIGHT*1.2);assert.ok(doorHeight<=ACTOR_HEIGHT*1.6);
  }
});
test('ranged weapons have separate capacities and distinct firing roles',()=>{
  assert.equal(WEAPONS.gun.magazine,10);assert.equal(WEAPONS.rifle.magazine,24);assert.equal(WEAPONS.shotgun.magazine,6);
  assert.ok(WEAPONS.rifle.interval<WEAPONS.gun.interval);assert.ok(WEAPONS.shotgun.interval>WEAPONS.gun.interval);
  assert.equal(WEAPONS.shotgun.pellets,5);assert.ok(WEAPONS.shotgun.spread>0);
});
