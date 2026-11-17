import test from 'node:test';
import assert from 'node:assert/strict';
import {generateLevel} from '../src/world.js';
import {contractOffers,attachContract,securityOffer} from '../src/contracts.js';
import {shieldActive,variantHit,securityIntel} from '../src/enemy-variants.js';
import {updateEnemies} from '../src/combat.js';
import {deployEmp} from '../src/workshop.js';
test('contract composition introduces specialists without increasing their health',()=>{
 for(const offer of [...contractOffers(3),securityOffer(3)]){
  const w=generateLevel(offer.depth,42,offer.kind),health=w.enemies.map(e=>e.hp);attachContract(w,offer);
  assert.deepEqual(w.enemies.slice(0,health.length).map(e=>e.hp),health);
  assert.ok(w.enemies.some(e=>e.variant));assert.ok(securityIntel(offer));
  assert.equal(w.enemies.filter(e=>e.variant==='sniper').length,offer.id==='sabotage'?0:1);
 }
 const w=generateLevel(1,42,'industrial');attachContract(w,contractOffers(1)[0]);assert.ok(w.enemies.every(e=>!e.variant));
});
test('shield counters depend on side, katana breaks it temporarily and EMP suppresses it',()=>{
 const e={variant:'shield',x:100,y:100,w:28,h:54,facing:1,dead:false};
 assert.equal(variantHit(e,200,true),.2);assert.equal(variantHit(e,0,true),1);
 assert.equal(variantHit(e,200,false),1);assert.equal(e.shieldDown,3);assert.equal(shieldActive(e),false);
 e.shieldDown=0;const w={enemies:[e],empCharges:1};deployEmp(w,{x:100,y:100});assert.equal(shieldActive(e),false);assert.equal(variantHit(e,200,true),1);
 e.disabledFor=0;assert.equal(shieldActive(e),true);
});
test('sniper locks the aim before firing and leaves a recovery window',()=>{
 const w=generateLevel(2,42,'market');attachContract(w,contractOffers(2)[1]);
 const e=w.enemies.find(e=>e.variant==='sniper');w.enemies=[e];e.x=700;e.y=484;e.state='windup';e.timer=1.5;e.aimX=300;e.aimY=510;
 const p={x:300,y:484,w:24,h:54,vx:0,vy:0,grounded:true,attack:0},bullets=[];
 updateEnemies(w,p,bullets,.9,()=>{});const target=e.aimX;
 p.x=400;updateEnemies(w,p,bullets,.3,()=>{});assert.equal(e.aimX,target);assert.equal(bullets.length,0);
 updateEnemies(w,p,bullets,.31,()=>{});assert.equal(bullets.length,1);assert.equal(e.state,'recover');assert.equal(e.timer,1);assert.equal(e.cooldown,2.6);
 assert.ok(bullets[0].vx<0);assert.equal(bullets[0].damage,e.damage*1.4);
});
