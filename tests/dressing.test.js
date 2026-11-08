import test from 'node:test';
import assert from 'node:assert/strict';
import {generateLevel,GROUND} from '../src/world.js';
import {DETAIL_SPRITES,DETAIL_POOLS,createDressing,dressingExclusions,detailFootprints} from '../src/dressing.js';
import {DETAIL_SOURCE_SIZES} from '../src/detail-sizes.js';
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;

test('all five location families have distinct pools backed by 32 raster detail sprites',()=>{
  assert.equal(Object.keys(DETAIL_SPRITES).length,32);
  for(const pool of Object.values(DETAIL_POOLS)){
    assert.ok(pool.length>=7);assert.equal(new Set(pool).size,pool.length);
    for(const key of pool){const d=DETAIL_SPRITES[key];assert.ok(d&&d.frame>=0&&d.frame<16&&d.w>0&&d.h>0);}
  }
});

test('seeded details have real supports and preserve clear ladders, stairs, doors, caches and spawn',()=>{
  for(const kind of ['industrial','port','market','megablock'])for(let seed=1;seed<=35;seed++){
    const world=generateLevel(1,seed,kind),details=world.details,blocked=dressingExclusions(world,GROUND);
    assert.ok(details.length>=3,kind+' details '+seed);
    assert.deepEqual(details,createDressing(world,seed,GROUND));
    for(const [i,d]of details.entries()){
      const p=world.platforms.find(p=>p.id===d.platformId);
      assert.ok(p&&!p.stair);assert.ok(d.x>=p.x&&d.x+d.w<=p.x+p.w);
      assert.ok(p.ground||kind==='megablock'&&p.deck,'no props on stall, container or technical roofs');
      const def=DETAIL_SPRITES[d.sprite],[w,h]=DETAIL_SOURCE_SIZES[def.atlas][def.frame];
      assert.ok(Math.abs(d.w/d.h-w/h)<1e-8,'original art proportions');
      if(!d.wall)assert.ok(Math.abs(d.y+d.h-p.y)<1e-8);
      else{assert.equal(kind,'megablock');assert.ok(p.y-d.y<=100,'wall fixtures within human reach');assert.ok(p.y-d.y-d.h>=15);}
      assert.ok(!p.holes?.some(h=>d.x+d.w>h.x&&d.x<h.x+h.w));
      for(const part of detailFootprints(d)){
        assert.ok(!blocked.some(b=>overlap(part,b)),kind+' reserved space '+d.sprite);
        assert.ok(!details.slice(i+1).some(b=>detailFootprints(b).some(q=>overlap(part,q))),kind+' overlapping props');
      }
    }
  }
});

test('hub dressing includes different everyday silhouettes and remains deterministic',()=>{
  const hub={width:1400,platforms:[{id:0,x:0,y:GROUND,w:1400,ground:true}],portal:{x:1150,y:GROUND}};
  const details=createDressing(hub,731,GROUND);
  assert.ok(new Set(details.map(d=>d.sprite)).size>=6);
  assert.deepEqual(details,createDressing(hub,731,GROUND));
  assert.notDeepEqual(details,createDressing(hub,732,GROUND));
});
