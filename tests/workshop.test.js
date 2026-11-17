import test from 'node:test';
import assert from 'node:assert/strict';
import {generateLevel,loadProfile} from '../src/world.js';
import {workshopState,buildWorkshop,prepareEmp,deployEmp,disconnectPower} from '../src/workshop.js';
import {securityOffer,attachContract,contractReady} from '../src/contracts.js';
import {updateEnemies} from '../src/combat.js';
test('workshop unlock, preparation and saving',()=>{
 const p=loadProfile(null);p.gold=100;
 assert.equal(buildWorkshop(p),false);workshopState(p).equipment=true;
 assert.equal(buildWorkshop(p),true);assert.equal(buildWorkshop(p),false);
 assert.equal(prepareEmp(p),true);assert.equal(p.gold,75);assert.equal(prepareEmp(p),false);
 assert.equal(loadProfile(JSON.stringify(p)).workshop.empReady,true);
});
test('turret telegraphs a stationary shot and stops when disabled',()=>{
 const w=generateLevel(2,42,'industrial');attachContract(w,securityOffer(2));
 const turret=w.enemies.find(e=>e.turret);w.enemies=[turret];turret.cooldown=0;
 const p={x:turret.x-120,y:turret.y,w:24,h:60},bullets=[];const x=turret.x;
 updateEnemies(w,p,bullets,.1,()=>{});assert.equal(turret.state,'windup');assert.equal(bullets.length,0);
 updateEnemies(w,p,bullets,1.3,()=>{});assert.equal(bullets.length,1);assert.equal(turret.x,x);
 w.empCharges=1;deployEmp(w,p);updateEnemies(w,p,bullets,1,()=>{});assert.equal(bullets.length,1);
 disconnectPower(w);turret.disabledFor=0;updateEnemies(w,p,bullets,3,()=>{});assert.equal(bullets.length,1);
});
test('prototype objective and alternative turret shutdown',()=>{
 const w=generateLevel(2,42,'industrial');attachContract(w,securityOffer(2));
 const turret=w.enemies.find(e=>e.turret);assert.ok(turret);assert.equal(contractReady(w),false);
 w.empCharges=1;assert.equal(deployEmp(w,turret),true);assert.equal(turret.disabledFor,18);
 assert.equal(deployEmp(w,turret),false);assert.equal(disconnectPower(w),true);assert.equal(turret.powerOff,true);
 assert.equal(disconnectPower(w),false);w.package.taken=true;assert.equal(contractReady(w),true);
 assert.ok(w.enemies.some(e=>!e.dead));
});
