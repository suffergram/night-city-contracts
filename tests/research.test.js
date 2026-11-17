import test from 'node:test';
import assert from 'node:assert/strict';
import {loadProfile} from '../src/world.js';
import {workshopState,buildWorkshop,deliverPrototype,researchModule,selectModule,meleeModuleEffect} from '../src/workshop.js';
test('research spends delivered samples once and gates module selection',()=>{
 const p=loadProfile(null),s=workshopState(p);s.equipment=true;buildWorkshop(p);
 assert.equal(selectModule(p,'duplex'),false);assert.equal(researchModule(p,'duplex'),false);
 deliverPrototype(p);assert.equal(s.samples,1);assert.equal(s.operations,1);
 assert.equal(researchModule(p,'duplex'),true);assert.equal(s.samples,0);
 assert.equal(researchModule(p,'duplex'),false);assert.equal(selectModule(p,'duplex'),true);
 assert.equal(researchModule(p,'__proto__'),false);assert.equal(selectModule(p,'missing'),false);
 deliverPrototype(p);assert.equal(researchModule(p,'siphon'),false);
 deliverPrototype(p);assert.equal(researchModule(p,'siphon'),true);selectModule(p,'siphon');
 assert.deepEqual(meleeModuleEffect(p,false),{damage:.8,heal:.12});
 assert.deepEqual(meleeModuleEffect(p,true),{damage:1,heal:0});
 assert.deepEqual(meleeModuleEffect(p,false,true),{damage:.8,heal:0});
 const loaded=loadProfile(JSON.stringify(p));assert.equal(loaded.workshop.mod,'siphon');assert.equal(loaded.workshop.samples,0);assert.deepEqual(loaded.workshop.researched,['duplex','siphon']);
});
test('old workshop saves retain available modules and completed deliveries',()=>{
 const p=loadProfile(null);p.workshop={equipment:true,built:true,operations:3,mod:'slug'};
 const migrated=loadProfile(JSON.stringify(p));assert.equal(migrated.workshop.samples,3);
 assert.deepEqual(migrated.workshop.researched,['duplex','slug']);assert.equal(migrated.workshop.mod,'slug');
 p.workshop.researched=['fake','siphon','siphon'];p.workshop.samples=-2;
 const repaired=loadProfile(JSON.stringify(p));assert.equal(repaired.workshop.mod,'standard');assert.deepEqual(repaired.workshop.researched,['siphon']);assert.equal(repaired.workshop.samples,3);
});
