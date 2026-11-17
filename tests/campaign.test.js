import test from 'node:test';
import assert from 'node:assert/strict';
import {loadProfile,generateLevel} from '../src/world.js';
import {campaignState,campaignOffer,advanceCampaign,empCapacity,firstChapterStatus} from '../src/campaign.js';
import {workshopState,buildWorkshop} from '../src/workshop.js';
import {attachContract,contractReady,disableNode,contractObjective} from '../src/contracts.js';
const close=(p,id)=>advanceCampaign(p,{contract:{id,paid:true}});
test('preparations unlock finale only on delivery and reward is permanent and once-only',()=>{
 const p=loadProfile(null);assert.equal(campaignOffer(p,1),null);
 advanceCampaign(p,{contract:{id:'sabotage',paid:false}});assert.equal(campaignState(p).sabotage,false);
 close(p,'sabotage');close(p,'prototype');assert.equal(campaignOffer(p,1),null);
 workshopState(p).equipment=true;buildWorkshop(p);assert.equal(campaignOffer(p,1).id,'blackout');
 close(p,'sweep');close(p,'assault');assert.deepEqual(campaignOffer(p,1).prep,{intel:true,supply:true});
 const w={contract:{id:'blackout',paid:true}},before=p.workshop.samples;
 assert.ok(advanceCampaign(p,w));assert.equal(p.workshop.samples,before+3);assert.equal(empCapacity(p),2);
 assert.equal(advanceCampaign(p,w),'');close(p,'blackout');assert.equal(p.workshop.samples,before+3);
 assert.equal(campaignOffer(p,1),null);const saved=loadProfile(JSON.stringify(p));assert.equal(empCapacity(saved),2);assert.equal(saved.campaign.finished,true);
});
test('finale requires both locks and archive; preparation changes actual security',()=>{
 for(let seed=1;seed<=15;seed++)for(const prepared of [false,true]){
  const p=loadProfile(null);p.workshop={built:true,equipment:true,operations:1,samples:0};p.campaign={sabotage:true,prototype:true,intel:prepared,supply:prepared,finished:false};
  const w=generateLevel(3,seed,'industrial');attachContract(w,campaignOffer(p,1));
  assert.equal(w.enemies.filter(e=>e.turret).length,2);assert.equal(w.enemies.some(e=>e.variant==='sniper'),!prepared);
  assert.equal(w.enemies.filter(e=>e.turret).every(e=>!!e.powerOff),prepared);
  assert.equal(contractReady(w),false);w.package.taken=true;assert.equal(contractReady(w),false);
  disableNode(w,0);assert.equal(contractReady(w),false);disableNode(w,1);assert.equal(contractReady(w),true);
  assert.ok(contractObjective(w).includes('Архив'));assert.ok(w.enemies.some(e=>!e.dead));
 }
});
test('existing workshop deliveries migrate into chapter progress without granting completion',()=>{
 const p=loadProfile(null);p.workshop={built:true,equipment:true,operations:2,mod:'standard'};
 const saved=loadProfile(JSON.stringify(p));assert.equal(saved.campaign.sabotage,true);assert.equal(saved.campaign.prototype,true);assert.equal(saved.campaign.finished,false);
 assert.ok(campaignOffer(saved,2));assert.equal(empCapacity(saved),1);
});

test('stale chapter flags reconcile with recorded deliveries without unlocking unfinished requirements',()=>{
 const p=loadProfile(null);p.workshop={built:true,equipment:true,operations:2,mod:'standard'};
 p.campaign={sabotage:false,prototype:false,intel:false,supply:false,finished:false};
 const restored=loadProfile(JSON.stringify(p));assert.equal(restored.campaign.sabotage,true);assert.equal(restored.campaign.prototype,true);
 assert.equal(firstChapterStatus(restored).ready,true);assert.equal(campaignOffer(restored,2).id,'blackout');
 p.workshop.built=false;assert.equal(campaignOffer(p,2),null);assert.equal(firstChapterStatus(p).missing.length,1);assert.ok(firstChapterStatus(p).missing[0].includes('мастерскую'));
 p.workshop.built=true;p.campaign.finished=true;assert.equal(firstChapterStatus(p).finished,true);assert.equal(campaignOffer(p,2),null);
 const fresh=loadProfile(null);assert.equal(firstChapterStatus(fresh).missing.length,3);assert.equal(firstChapterStatus(fresh).ready,false);
 assert.equal(firstChapterStatus(fresh).next.action,'contract:sabotage');
 workshopState(fresh).equipment=true;assert.equal(firstChapterStatus(fresh).next.action,'workshop');
 buildWorkshop(fresh);assert.equal(firstChapterStatus(fresh).next.action,'contract:prototype');
 fresh.workshop.operations=1;assert.equal(firstChapterStatus(fresh).next.action,'contract:blackout');
});
