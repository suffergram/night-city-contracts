import test from 'node:test';
import assert from 'node:assert/strict';
import {generateLevel} from '../src/world.js';
import {attachContract,contractReady} from '../src/contracts.js';
import {signalOffer,startSignal,updateSignal,signalWarning} from '../src/signal.js';
const setup=()=>{const w=generateLevel(3,42,'industrial');attachContract(w,signalOffer(2));return w;};
const near=w=>({x:w.signal.x-10,y:w.signal.y-54,w:20,h:54});
test('signal must start, only progresses near terminal and completes without kills',()=>{
 const w=setup(),p=near(w);assert.equal(w.enemies.length,5);
 updateSignal(w,p,10);assert.equal(w.signal.progress,0);assert.equal(contractReady(w),false);
 assert.equal(startSignal(w),true);assert.equal(startSignal(w),false);
 updateSignal(w,p,12);assert.equal(signalWarning(w.signal),true);assert.equal(w.signal.progress,12);
 const away={...p,x:p.x+1000};updateSignal(w,away,10);assert.equal(w.signal.progress,12);assert.equal(w.signal.inside,false);
 const upper={...p,y:p.y-200};updateSignal(w,upper,10);assert.equal(w.signal.progress,12);
 for(let i=0;i<640;i++)updateSignal(w,p,.1);
 assert.equal(w.signal.done,true);assert.equal(contractReady(w),true);assert.ok(w.enemies.some(e=>!e.dead));
 const count=w.enemies.length;updateSignal(w,p,100);assert.equal(w.enemies.length,count);assert.equal(w.signal.progress,75);
});
test('reinforcements are finite, capped and retain role identity',()=>{
 const w=setup(),p=near(w);startSignal(w);
 for(const t of [15,35,55]){
  w.signal.progress=t;updateSignal(w,p,0);assert.ok(w.enemies.filter(e=>!e.dead).length<=9);
 }
 assert.equal(w.signal.wave,2);assert.equal(w.enemies.length,9);
 w.enemies.slice(0,2).forEach(e=>e.dead=true);updateSignal(w,p,0);
 assert.equal(w.signal.wave,3);assert.equal(w.enemies.length,11);assert.deepEqual(w.enemies.slice(-2).map(e=>e.role),['heavy','runner']);
 for(let i=0;i<50;i++)updateSignal(w,p,.1);assert.equal(w.enemies.length,11);
});
