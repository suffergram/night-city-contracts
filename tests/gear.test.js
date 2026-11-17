import test from 'node:test';
import assert from 'node:assert/strict';
import {loadProfile,makeItem,random,stats} from '../src/world.js';
import {gearTrait,assignTrait,gearShot,gearMeleeStamina,gearIncoming,gearRoll,gearKnockback} from '../src/gear.js';
test('traits respect slots, survive saves and trade base damage for behaviour',()=>{
 const p=loadProfile(null),before=stats(p).gunDamage;p.equipment.gun.trait='capacitor';
 assert.ok(stats(p).gunDamage<before);assert.equal(gearShot(p,'gun',1).damage,2.2);assert.equal(gearShot(p,'gun',2).damage,1);
 assert.equal(loadProfile(JSON.stringify(p)).equipment.gun.trait,'capacitor');
 p.equipment.gun.trait='flow';assert.equal(gearTrait(p.equipment.gun),null);assert.equal(stats(p).gunDamage,before);
 p.equipment.weapon.trait='flow';assert.equal(gearMeleeStamina(p),7);
 p.equipment.rifle.trait='cooled';assert.equal(gearShot(p,'rifle',24).heat,.45);
 p.equipment.shotgun.trait='repulsor';assert.equal(gearKnockback(p,'shotgun',{role:'runner'}),35);assert.equal(gearKnockback(p,'shotgun',{role:'heavy'}),0);assert.equal(gearKnockback(p,'shotgun',{turret:true}),0);
 p.equipment.torso.trait='reactive';assert.equal(gearIncoming(p,35,100),.7);assert.equal(gearIncoming(p,36,100),1);
 p.equipment.feet.trait='impulse';assert.deepEqual(gearRoll(p),{speed:1.25,cost:1.3});
});
test('loot has broad power tiers and guaranteed salvage traits',()=>{
 for(const type of ['gun','rifle','shotgun','weapon','torso','feet']){
  const a=makeItem(1,random(42),type),b=makeItem(4,random(42),type),c=makeItem(5,random(42),type);
  assert.equal(a.power,b.power);assert.ok(c.power>a.power);assert.ok(gearTrait(assignTrait(a,random(1),true)));
 }
});
