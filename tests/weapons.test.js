import test from 'node:test';
import assert from 'node:assert/strict';
import {WEAPONS,rifleSpread,coolRifle,fireInterval} from '../src/weapons.js';
import {DEFAULT_PROFILE,stats,recommendedDepth,loadProfile} from '../src/world.js';
import {projectile,projectileDamage,projectileStep} from '../src/combat.js';

test('equal-power weapons have distinct per-hit damage and melee rewards close-range risk',()=>{
  for(const power of [4,8,20]){
    const p=structuredClone(DEFAULT_PROFILE);
    for(const slot of ['weapon','gun','rifle','shotgun'])p.equipment[slot].power=power;
    const s=stats(p);
    assert.ok(s.gunDamage>s.rifleDamage*2);
    assert.ok(s.damage/WEAPONS.weapon.interval>s.rifleDamage/WEAPONS.rifle.interval);
    assert.ok(s.shotgunDamage*5>s.gunDamage*3);
  }
  assert.equal(recommendedDepth(DEFAULT_PROFILE),1,'balance does not inflate starting threat');
  const p=loadProfile(JSON.stringify(DEFAULT_PROFILE));
  assert.deepEqual(p.equipment,DEFAULT_PROFILE.equipment,'saved item power is retained');
  assert.deepEqual([stats(p).damage,stats(p).gunDamage,stats(p).rifleDamage,stats(p).shotgunDamage],[30,20,4,10]);
});

test('shotgun damage is concentrated nearby and drops sharply before its hard range',()=>{
  const b=projectile('player',{x:0,y:0},{x:1,y:0},20,740,WEAPONS.shotgun);
  assert.equal(projectileDamage(b,80),20);
  assert.ok(projectileDamage(b,220)<=5);
  assert.equal(projectileDamage(b,250),1);
  assert.equal(projectileDamage(b,251),0);
});

test('all firearms stop at their exact range even with a large simulation step',()=>{
  for(const slot of ['gun','rifle','shotgun']){
    const c=WEAPONS[slot],b=projectile('player',{x:100,y:100},{x:400,y:500},10,c.speed,c);
    const step=projectileStep(b,5);
    assert.ok(Math.abs(Math.hypot(step.x-100,step.y-100)-c.range)<1e-6);
    assert.ok(step.expired);assert.ok(projectileDamage(b,c.range)<10);
  }
  const enemy=projectile('enemy',{x:0,y:0},{x:1,y:0},10,500);
  assert.equal(projectileStep(enemy,5).distance,680);
});

test('projectiles are clipped to the visible rectangle including vertical camera offset',()=>{
  const bounds={left:100,right:500,top:-200,bottom:100};
  for(const [dx,dy,expected]of [[1,0,200],[-1,0,200],[0,1,150],[0,-1,150]]){
    const b=projectile('player',{x:300,y:-50},{x:300+dx,y:-50+dy},10,1000);
    const step=projectileStep(b,1,bounds);assert.equal(step.distance,expected);assert.ok(step.expired);
  }
});

test('rifle bursts start accurate, sustained fire blooms, and a short pause restores control',()=>{
  const a={rifleHeat:0,rifleRest:0},spread=[];
  for(let i=0;i<9;i++){
    spread.push(rifleSpread(a.rifleHeat));a.rifleHeat=Math.min(1,a.rifleHeat+.22);a.rifleRest=0;coolRifle(a,.13);
  }
  assert.ok(spread[2]<.06);assert.ok(spread[8]>spread[0]*20);
  coolRifle(a,.4);assert.equal(a.rifleHeat,0);
  assert.equal(rifleSpread(a.rifleHeat),spread[0]);
  const b={rifleHeat:1,rifleRest:0},c={...b};coolRifle(b,.4);
  for(let i=0;i<40;i++)coolRifle(c,.01);
  assert.ok(Math.abs(b.rifleHeat-c.rifleHeat)<1e-6,'cooling is independent of frame rate');
});

test('rate-of-fire perks boost each firearm proportionally rather than doubling the rifle rate',()=>{
  for(const slot of ['gun','rifle','shotgun'])assert.ok(Math.abs(fireInterval(slot,.07)/fireInterval(slot)-.78125)<1e-6);
});
