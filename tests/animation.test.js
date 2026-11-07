import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { HERO_CLIPS, ENEMY_CLIPS, LONG_GUN_CLIPS, advanceAnimation, animationFrame, animationState, animationInfo, atlasCell } from '../src/animation.js';
import { muzzlePosition, ACTOR_HEIGHT } from '../src/weapons.js';
import { SPRITES } from '../src/raster.js';

test('running plays six distinct poses and changing action resets local animation time', () => {
  const actor = { vx: 245, vy: 0, grounded: true };
  const frames = new Set();
  for (let i = 0; i < 60; i++) { advanceAnimation(actor, 1 / 120); frames.add(animationFrame(actor)); }
  assert.equal(actor.animation.name, 'run'); assert.equal(frames.size, 6);
  actor.vx = 0; actor.attack = .32; advanceAnimation(actor, 1 / 120); assert.equal(actor.animation.name, 'attack'); assert.equal(actor.animation.time, 0); assert.equal(animationFrame(actor), 24);
  for (let i = 0; i < 30; i++) { actor.attack -= 1 / 120; advanceAnimation(actor, 1 / 120); }
  assert.ok(animationFrame(actor) >= 28);
});
test('backpedalling, running attacks, running fire and air combat use distinct authored clips', () => {
  const actor = { vx: -200, vy: 0, grounded: true, facing: 1, activeWeapon: 'weapon' };
  assert.equal(animationState(actor), 'runBack'); assert.equal(animationInfo(actor).sheet, 'actions');
  actor.attack = .3; assert.equal(animationState(actor), 'backAttack');
  actor.vx = 200; assert.equal(animationState(actor), 'runAttack');
  actor.grounded = false; assert.equal(animationState(actor), 'jumpAttack');
  actor.attack = 0; actor.activeWeapon = 'gun'; actor.shotCooldown = .2; assert.equal(animationState(actor), 'jumpShoot');
  actor.grounded = true; assert.equal(animationState(actor), 'runShoot');
  actor.vx = -200; assert.equal(animationState(actor), 'backShoot');
  actor.shotCooldown = 0; assert.equal(animationState(actor), 'backAim');
});
test('muzzle anchor mirrors with facing and follows the same scaled sprite geometry', () => {
  const actor = { x: 100, y: 200, w: 24, h: ACTOR_HEIGHT, facing: 1, grounded: true, vx: 0 };
  const right = muzzlePosition(actor); actor.facing = -1; const left = muzzlePosition(actor);
  assert.ok(right.x > actor.x + actor.w); assert.ok(left.x < actor.x);
  assert.equal(right.y, left.y); assert.ok(right.y < actor.y + actor.h / 2 - 10);
  assert.equal((right.x + left.x) / 2, actor.x + actor.w / 2);
});
test('jump selects ascent, apex, descent, then a brief landing before idle', () => {
  const actor = { vx: 0, vy: -500, grounded: false };
  advanceAnimation(actor, .01); assert.equal(animationFrame(actor), 13);
  actor.vy = -100; assert.equal(animationFrame(actor), 14);
  actor.vy = 60; assert.equal(animationFrame(actor), 15);
  actor.vy = 300; assert.equal(animationFrame(actor), 16);
  actor.grounded = true; advanceAnimation(actor, .01); assert.equal(actor.animation.name, 'land');
  for (let i = 0; i < 25; i++) advanceAnimation(actor, .01);
  assert.equal(actor.animation.name, 'idle');
});
test('roll uses six authored tumbling frames, overrides attacks and finishes without wrapping', () => {
  const actor = { dodge: .32, attack: .2, grounded: true, vx: 0 }, frames = new Set();
  for (let i = 0; i < 40; i++) { advanceAnimation(actor, .01); frames.add(animationFrame(actor)); }
  assert.equal(actor.animation.name, 'roll'); assert.equal(frames.size, 6); assert.equal(animationFrame(actor), 23);
  actor.dodge = 0; actor.attack = 0; advanceAnimation(actor, .01); assert.equal(actor.animation.name, 'idle');
});
test('all hero/enemy action frames stay inside their correct atlas ranges', () => {
  for (const clip of Object.values(HERO_CLIPS)) for (const frame of clip.frames) assert.ok(frame >= 0 && frame < 36);
  for (const [role, base] of [['gunner', 0], ['runner', 12], ['heavy', 24]]) for (const clip of Object.values(ENEMY_CLIPS[role])) for (const frame of clip.frames) assert.ok(frame >= base && frame < base + 12);
  for (const clips of Object.values(LONG_GUN_CLIPS)) for (const clip of Object.values(clips)) for (const frame of clip.frames) assert.ok(frame >= 0 && frame < 36);
  assert.throws(() => atlasCell(36, 1254, 1254), RangeError);
  for (const width of [1254, 1536, 1024]) {
    let right = 0;
    for (let col = 0; col < 6; col++) { const cell = atlasCell(col, width, width); assert.equal(cell.x, right); right += cell.w; }
    assert.equal(right, width);
  }
});
test('backward katana attacks use complete authored poses, not forward attack pieces', () => {
  const actor={grounded:true,vx:-180,vy:0,facing:1,activeWeapon:'weapon',attack:.32};
  const frames=new Set();
  for(let i=0;i<37;i++){advanceAnimation(actor,1/120);frames.add(animationFrame(actor));assert.equal(animationInfo(actor).sheet,'utility');actor.attack-=1/120;}
  assert.equal(frames.size,6);assert.ok([...frames].every(frame=>frame<6));
});
test('attack pose progress survives reversing direction or leaving the ground mid-swing',()=>{
  const actor={grounded:true,vx:200,vy:0,facing:1,activeWeapon:'weapon',attack:.10,animation:{name:'runAttack',time:.22}};
  assert.equal(animationFrame(actor),10);
  actor.vx=-180;advanceAnimation(actor,.001);assert.equal(animationFrame(actor),4);
  assert.equal(animationInfo(actor).contactAt,.21);
  actor.grounded=false;advanceAnimation(actor,.001);assert.equal(animationFrame(actor),28);
  assert.equal(actor.attack,.10);
});
test('non-firing jumps never use the flash-bearing shooting atlas, even after an interrupted shot', () => {
  for(const weapon of ['gun','rifle','shotgun'])for(const vy of [-550,-120,0,200,500]){
    const actor={grounded:false,vx:150,vy,facing:1,activeWeapon:weapon,shotCooldown:0,animation:{name:'jumpShoot',time:.16}};
    assert.equal(animationState(actor),'jumpAim');
    const info=animationInfo(actor),frame=animationFrame(actor);
    assert.equal(info.sheet,weapon==='gun'?'utility':'longgunUtility');
    assert.ok(weapon==='rifle'?frame>=24&&frame<=29:frame>=30&&frame<=35);
    actor.shotCooldown=.2;assert.equal(animationInfo(actor).sheet,'actions');
    actor.shotCooldown=0;actor.grounded=true;actor.animation={name:'jumpAim',time:1};
    assert.equal(animationState(actor),'land');assert.notEqual(animationInfo(actor).sheet,'actions');
  }
});
test('reloads choose gun-specific standing, forward, backward and airborne poses', () => {
  for(const weapon of ['gun','rifle','shotgun']){
    const actor={grounded:true,vx:0,vy:0,facing:1,activeWeapon:weapon,reload:1.2,reloadDuration:1.5,strideTime:.15};
    for(const [vx,grounded,name] of [[0,true,'reload'],[200,true,'runReload'],[-180,true,'backReload'],[-180,false,'jumpReload']]){
      actor.vx=vx;actor.grounded=grounded;
      const info=animationInfo(actor);assert.equal(info.name,name);
      assert.equal(info.sheet,weapon==='gun'?'utility':'longgunUtility');
      const clip=weapon==='gun'?HERO_CLIPS[name]:LONG_GUN_CLIPS[weapon][name];
      assert.ok(clip.frames.includes(animationFrame(actor)));
    }
  }
});
test('stationary reload frames follow actual progress and walking reload legs keep cycling', () => {
  const actor={grounded:true,vx:0,vy:0,facing:1,activeWeapon:'gun',reload:1.5,reloadDuration:1.5};
  assert.equal(animationFrame(actor),6);
  actor.reload=.2;assert.equal(animationFrame(actor),11);
  actor.vx=200;const frames=new Set();
  for(let i=0;i<60;i++){advanceAnimation(actor,1/120);frames.add(animationFrame(actor));}
  assert.equal(frames.size,6);assert.equal(actor.reload,.2,'animation sampling never resets the reload timer');
  actor.vx=0;advanceAnimation(actor,1/120);assert.equal(animationFrame(actor),11);
});
test('weapon cooldown alone never produces a firing pose after the shot visual has ended',()=>{
  const actor={grounded:false,vx:180,vy:0,facing:1,activeWeapon:'shotgun',shotCooldown:.8,fireVisual:0};
  assert.equal(animationState(actor),'jumpAim');
  actor.grounded=true;assert.equal(animationState(actor),'runAim');
  actor.vx=0;assert.equal(animationState(actor),'idle');
  actor.fireVisual=.1;assert.equal(animationState(actor),'shoot');
});
test('production raster atlases are committed local PNGs with valid dimensions', async () => {
  for (const asset of Object.values(SPRITES)) {
    const data = await readFile(new URL(asset));
    assert.equal(data.subarray(1, 4).toString(), 'PNG');
    const width = data.readUInt32BE(16), height = data.readUInt32BE(20);
    assert.ok(width >= 1000); assert.equal(width, height); assert.ok(data.length > 100000);
  }
});
