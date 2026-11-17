import test from 'node:test';
import assert from 'node:assert/strict';
import {generateLevel} from '../src/world.js';
import {contractOffers,attachContract,contractReady,disableNode} from '../src/contracts.js';
test('sabotage requires both nodes, raises one reinforcement wave and permits leaving living guards',()=>{
  for(let seed=1;seed<=30;seed++){
    const w=generateLevel(2,seed,'industrial');attachContract(w,contractOffers(2)[0]);
    assert.equal(w.sabotageNodes.length,2);assert.notEqual(w.sabotageNodes[0].x,w.sabotageNodes[1].x);
    const count=w.enemies.length;assert.equal(contractReady(w),false);
    assert.equal(disableNode(w,0),true);assert.equal(w.enemies.length,count+2);assert.equal(contractReady(w),false);
    assert.equal(disableNode(w,0),false);assert.equal(w.enemies.length,count+2);
    assert.equal(disableNode(w,1),true);assert.equal(contractReady(w),true);assert.ok(w.enemies.some(e=>!e.dead));
  }
});
test('offers have explicit rewards and sweep retains its completion condition',()=>{
  const offers=contractOffers(4);assert.equal(offers.length,3);assert.ok(offers[2].depth>offers[0].depth);
  const w=generateLevel(4,42,'market');attachContract(w,offers[1]);assert.equal(contractReady(w),false);
  w.kills=w.enemies.length;assert.equal(contractReady(w),true);
});
