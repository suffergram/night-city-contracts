import test from 'node:test';
import assert from 'node:assert/strict';
import {loadProfile,generateLevel} from '../src/world.js';
import {campaignState,relayOffer,advanceCampaign,useFieldKit} from '../src/campaign.js';
import {attachContract,contractReady,contractObjective} from '../src/contracts.js';
import {startSignal,updateSignal} from '../src/signal.js';
const close=(p,id)=>advanceCampaign(p,{contract:{id,paid:true}});
test('chapter two requires fresh signal delivery, preserves prior chapter and rewards once',()=>{
 const p=loadProfile(null);p.workshop={built:true,equipment:true,samples:0,operations:1};const s=campaignState(p);
 assert.equal(relayOffer(p,1),null);close(p,'signal');assert.equal(s.relaySignal,false);
 s.finished=true;assert.equal(relayOffer(p,1),null);
 advanceCampaign(p,{contract:{id:'signal',paid:false}});assert.equal(relayOffer(p,1),null);
 close(p,'signal');assert.equal(relayOffer(p,1).id,'relay');assert.equal(relayOffer(p,1).prep.supply,false);
 close(p,'assault');assert.equal(relayOffer(p,1).prep.supply,true);
 const w={contract:{id:'relay',paid:true}};assert.ok(advanceCampaign(p,w));assert.equal(p.workshop.samples,4);assert.equal(s.finished,true);
 assert.equal(advanceCampaign(p,w),'');close(p,'relay');assert.equal(p.workshop.samples,4);assert.equal(relayOffer(p,1),null);
 const restored=loadProfile(JSON.stringify(p));assert.equal(restored.campaign.relayFinished,true);assert.equal(restored.campaign.relaySignal,true);
});
test('port finale needs the hack and key, preparation removes a wave and sniper',()=>{
 for(let seed=1;seed<=20;seed++)for(const prepared of [false,true]){
  const p=loadProfile(null);p.campaign={finished:true,relaySignal:true,relaySupply:prepared};const offer=relayOffer(p,1);
  const w=generateLevel(offer.depth,seed,'port');attachContract(w,offer);
  assert.equal(w.signal.duration,60);assert.equal(w.signal.waveLimit,prepared?2:3);
  assert.equal(w.enemies.some(e=>e.variant==='sniper'),!prepared);assert.ok(w.enemies.some(e=>e.variant==='shield'));
  assert.ok(w.signal.x>0&&w.signal.x<w.width);assert.equal(contractReady(w),false);
  startSignal(w);const hero={x:w.signal.x,y:w.signal.y-54,w:20,h:54};
  for(let i=0;i<610;i++)updateSignal(w,hero,.1);
  assert.equal(w.signal.done,true);assert.equal(contractReady(w),false);assert.ok(contractObjective(w).includes('надзирателя'));
  w.package.taken=true;assert.equal(contractReady(w),false);w.enemies.find(e=>e.commander).dead=true;
  assert.equal(contractReady(w),true);assert.ok(w.enemies.some(e=>!e.dead));
 }
});
test('field kit heals once, does not revive and does not waste charges at full health',()=>{
 const w={fieldKits:1},p={hp:100};assert.equal(useFieldKit(w,p,100),false);assert.equal(w.fieldKits,1);
 p.hp=0;assert.equal(useFieldKit(w,p,100),false);p.hp=40;assert.equal(useFieldKit(w,p,100),true);assert.equal(p.hp,75);
 assert.equal(useFieldKit(w,p,100),false);w.fieldKits=1;p.hp=90;useFieldKit(w,p,100);assert.equal(p.hp,100);
});
