import test from 'node:test';
import assert from 'node:assert/strict';
import {tickCommander} from '../src/commander.js';
import {generateLevel} from '../src/world.js';
import {attachContract} from '../src/contracts.js';
import {relayOffer} from '../src/campaign.js';
import {updateEnemies} from '../src/combat.js';
import {deployEmp} from '../src/workshop.js';
const setup=()=>{const w=generateLevel(3,42,'port');attachContract(w,relayOffer({campaign:{finished:true,relaySignal:true,relaySupply:true}},1));return w;};
test('commander telegraphs and locks a burst, opens its shield and changes phase',()=>{
 const w=setup(),e=w.enemies.find(e=>e.commander),p={x:e.x-350,y:e.y,w:20,h:54};e.cooldown=0;
 let a=tickCommander(e,p,.01);assert.equal(e.state,'windup');assert.equal(e.bossMove,'burst');assert.equal(a.shots.length,0);
 tickCommander(e,p,.9);const x=e.aimX;p.x+=50;tickCommander(e,p,.1);assert.equal(e.aimX,x);
 a=tickCommander(e,p,.21);assert.equal(a.shots.length,3);assert.equal(e.state,'recover');assert.ok(e.shieldDown>0);
 e.hp=e.maxHp*.5;tickCommander(e,p,.01);assert.equal(e.bossPhase,2);assert.equal(e.state,'recover');
 tickCommander(e,p,1.3);e.cooldown=0;tickCommander(e,p,.01);a=tickCommander(e,p,1.21);assert.equal(a.shots.length,5);
});
test('charge telegraphs, hits once and EMP interrupts attacks',()=>{
 const w=setup(),e=w.enemies.find(e=>e.commander);w.enemies=[e];const p={x:e.x-50,y:e.y,w:20,h:54,vx:0,attack:0};
 e.sequence=1;e.cooldown=0;tickCommander(e,p,.01);assert.equal(e.bossMove,'charge');tickCommander(e,p,.86);assert.equal(e.state,'charge');
 assert.equal(tickCommander(e,p,.01).hit,true);assert.equal(tickCommander(e,p,.01).hit,false);
 w.empCharges=1;deployEmp(w,p);const bullets=[];let hits=0;updateEnemies(w,p,bullets,1,()=>hits++);assert.equal(hits,0);assert.equal(bullets.length,0);assert.equal(e.disabledFor,3);
});
test('commander melee damage is redirected to a nearby hologram',()=>{
 const w=setup(),e=w.enemies.find(e=>e.commander);w.enemies=[e];const hero={x:e.x-450,y:e.y,w:20,h:54,vx:0,attack:0};
 w.decoy={decoy:true,x:e.x-40,y:e.y,w:20,h:54,life:10,hp:60,vx:0,attack:0};e.state='charge';e.timer=.3;e.facing=-1;e.chargeHit=false;
 let hits=0;updateEnemies(w,hero,[],.01,()=>hits++);assert.equal(hits,0);assert.ok(w.decoy.hp<60);
});
