import test from 'node:test';
import assert from 'node:assert/strict';
import {loadProfile,generateLevel} from '../src/world.js';
import {workshopState,researchModule,selectModule} from '../src/workshop.js';
import {selectGadget,prepareDecoy,equipGadget,deployDecoy,decoyTarget,hitDecoy} from '../src/decoy.js';
import {updateEnemies} from '../src/combat.js';
test('projector research gates a separate gadget slot and persists preparation',()=>{
 const p=loadProfile(null),s=workshopState(p);s.built=true;s.equipment=true;s.samples=3;p.gold=100;
 assert.equal(researchModule(p,'projector'),false);assert.equal(selectGadget(p,'decoy'),false);assert.equal(prepareDecoy(p),false);
 p.campaign={finished:true};assert.equal(researchModule(p,'projector'),true);assert.equal(s.samples,0);
 assert.equal(selectModule(p,'projector'),false);assert.equal(selectGadget(p,'decoy'),true);assert.equal(prepareDecoy(p),true);assert.equal(prepareDecoy(p),false);assert.equal(p.gold,75);
 s.empReady=true;const w={};equipGadget(w,p,2);assert.equal(w.decoyCharges,1);assert.equal(s.empReady,true);assert.equal(s.decoyReady,false);
 selectGadget(p,'emp');equipGadget(w,p,2);assert.equal(w.empCharges,2);assert.equal(s.empReady,false);
 selectGadget(p,'decoy');prepareDecoy(p);const saved=loadProfile(JSON.stringify(p));assert.equal(saved.workshop.gadget,'decoy');assert.equal(saved.workshop.decoyReady,true);
});
test('decoy attracts nearby enemies, consumes its charge and can be destroyed',()=>{
 const w={width:2000,decoyCharges:1},hero={x:700,y:484,w:20,h:54,facing:-1};
 assert.equal(deployDecoy(w,hero),true);assert.equal(w.decoyCharges,0);assert.equal(deployDecoy(w,hero),false);
 const enemy={x:550,y:484};assert.equal(decoyTarget(w,hero,enemy),w.decoy);assert.equal(decoyTarget(w,hero,{x:1700,y:484}),hero);
 assert.equal(decoyTarget(w,hero,{x:600,y:200}),hero);hitDecoy(w,60);assert.equal(w.decoy,null);assert.equal(decoyTarget(w,hero,enemy),hero);
});
test('melee aimed at the decoy cannot damage the hero',()=>{
 const w=generateLevel(1,42,'industrial'),e=w.enemies.find(e=>e.role==='runner');w.enemies=[e];
 Object.assign(e,{x:500,y:484,state:'windup',timer:.01,facing:1,dodge:0,dodgeCooldown:10});
 const hero={x:900,y:484,w:20,h:54,facing:-1,vx:0,grounded:true};w.decoy={decoy:true,x:535,y:484,w:20,h:54,hp:60,life:10,vx:0,attack:0,grounded:true};
 let damaged=0;updateEnemies(w,hero,[],.02,()=>damaged++);assert.equal(damaged,0);assert.ok(w.decoy.hp<60);
});
