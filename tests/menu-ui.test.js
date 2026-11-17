import test from 'node:test';
import assert from 'node:assert/strict';
import {loadProfile} from '../src/world.js';
import {contractOffers,securityOffer} from '../src/contracts.js';
import {campaignOffer} from '../src/campaign.js';
import {boardUI,workshopUI} from '../src/menu-ui.js';
test('board follows story requirements and uses explicit views without disclosures',()=>{
 const p=loadProfile(null);let html=boardUI(p,contractOffers(1));
 assert.ok(html.includes('aria-current="step"'));assert.ok(html.includes('data-action="contract:sabotage"'));assert.ok(!html.includes('<details'));
 p.workshop={built:false,equipment:true,operations:0,researched:[],samples:0};html=boardUI(p,contractOffers(1));
 assert.ok(html.includes('data-action="workshop"'));assert.ok(html.includes('data-action="board-tab:all"'));
 p.workshop.built=true;html=boardUI(p,[...contractOffers(1),securityOffer(1)]);assert.ok(html.includes('data-action="contract:prototype"'));
 p.workshop.operations=1;html=boardUI(p,[...contractOffers(1),securityOffer(1),campaignOffer(p,1)]);assert.equal((html.match(/data-action="contract:blackout"/g)||[]).length,1);
 const all=boardUI(p,contractOffers(1),'all');assert.ok(all.includes('data-action="contract:assault"'));assert.ok(!all.includes('<details'));
});
test('workshop separates equipped module, gadget preparation and research requirements',()=>{
 const p=loadProfile(null);p.workshop={built:true,equipment:true,operations:1,samples:3,researched:['duplex'],mod:'duplex',gadget:'emp',empReady:false};
 const html=workshopUI(p,1);assert.ok(!html.includes('<details'));
 assert.ok(html.includes('data-action="prepare-emp"'));assert.ok(html.includes('После главы H10'));
 const modules=workshopUI(p,1,'modules');assert.ok(modules.includes('Каждая пуля: 60% урона'));assert.ok(modules.includes('Две пули за один патрон'));assert.ok(!modules.includes('<details'));
});
