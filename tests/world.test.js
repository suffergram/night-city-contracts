import test from 'node:test';
import assert from 'node:assert/strict';
import { GROUND, BAG_LIMIT, BALANCE, SLOTS, DEFAULT_PROFILE, stats, random, generateLevel, makeItem, loadProfile, addXp, recommendedDepth, enemyReward, trainingCost } from '../src/world.js';
import {MARKET_HOTELS,hotelSize,hotelSink} from '../src/market-hotels.js';

function walkableNodes(world) {
  return world.platforms.flatMap(p=>{
    const nodes=[];let x=p.x;
    for(const h of [...(p.holes||[])].sort((a,b)=>a.x-b.x)){if(h.x-x>=20)nodes.push({...p,x,w:h.x-x});x=Math.max(x,h.x+h.w);}
    if(p.x+p.w-x>=20)nodes.push({...p,x,w:p.x+p.w-x});return nodes;
  });
}
function reachableNodes(w) {
  const nodes=walkableNodes(w),start=nodes.findIndex(p=>p.ground),seen=new Set([start]),queue=[start];
  while(queue.length){
    const p=nodes[queue.shift()];
    for(let i=0;i<nodes.length;i++){
      if(seen.has(i))continue;const q=nodes[i],rise=p.y-q.y,gap=Math.max(0,Math.max(p.x,q.x)-Math.min(p.x+p.w,q.x+q.w));
      const flight=rise<=138?(620+Math.sqrt(620**2-2*1330*rise))/1330:0;
      let reachable=flight>0&&gap<245*flight-25;
      if(!reachable)reachable=w.ladders.some(l=>((p.y===l.bottom&&q.y===l.top)||(p.y===l.top&&q.y===l.bottom))&&l.x>=p.x&&l.x<=p.x+p.w&&l.x>=q.x&&l.x<=q.x+q.w);
      if(!reachable)reachable=w.connections.some(c=>c.kind==='stairwell'&&[[c.lower,c.upper],[c.upper,c.lower]].some(([a,b])=>p.y===a.y&&q.y===b.y&&a.x>=p.x&&a.x<=p.x+p.w&&b.x>=q.x&&b.x<=q.x+q.w));
      if(reachable){seen.add(i);queue.push(i);}
    }
  }
  return {nodes,seen};
}
test('seeded layouts have four themes and reachable enemies, random caches and exits across multiple levels',()=>{
  const kinds=new Set(),chests=new Set(),exits=new Set();
  for(let seed=1;seed<=300;seed++){
    const w=generateLevel(1+seed%20,seed),{nodes,seen}=reachableNodes(w);
    kinds.add(w.kind);chests.add(w.chests.map(c=>c.x+':'+c.y).join('|'));exits.add(w.portal.x+':'+w.portal.y);
    assert.ok(w.width<6000);assert.equal(w.platforms[0].w,w.width);assert.ok(w.enemies.length>=6);
    assert.equal(new Set(w.enemies.map(e=>e.role)).size,3);assert.ok(w.chests.length>=2&&w.chests.length<=3);
    const reachable=(x,y)=>nodes.some((p,i)=>seen.has(i)&&p.y===y&&x>=p.x&&x<=p.x+p.w);
    for(const c of w.chests)assert.ok(reachable(c.x+17,c.y+25),w.kind+' cache seed '+seed);
    for(const e of w.enemies)assert.ok(reachable(e.x+e.w/2,e.y+e.h),w.kind+' enemy seed '+seed);
    assert.ok(reachable(w.portal.x,w.portal.y),w.kind+' portal seed '+seed);
    if(w.kind==='megablock'){assert.ok(w.floors.length>=3);assert.ok(w.stairs.length>=2);assert.ok(w.ladders.length>=2);assert.equal(w.portal.y,Math.min(...w.floors));}
  }
  assert.equal(kinds.size,4);assert.ok(chests.size>290);assert.ok(exits.size>290);
  assert.deepEqual(generateLevel(3,42),generateLevel(3,42));assert.notDeepEqual(generateLevel(3,42),generateLevel(3,43));
});
test('each location theme supports different layouts at the same difficulty',()=>{
  for(const kind of ['industrial','port','market','megablock']){
    const variants=Array.from({length:20},(_,i)=>generateLevel(2,i,kind));
    assert.ok(variants.every(w=>w.kind===kind));
    assert.ok(new Set(variants.map(w=>JSON.stringify(w.platforms))).size>=19);
    assert.ok(new Set(variants.map(w=>JSON.stringify(w.chests))).size>=19);
  }
});

test('market rolls its backdrop once per seed with an even split; other locations retain the district preset',()=>{
  let metropolitan=0;
  for(let seed=1;seed<=500;seed++){
    const w=generateLevel(1,seed,'market');metropolitan+=w.backdrop==='metropolis';
    assert.equal(w.backdrop,generateLevel(1,seed,'market').backdrop);
  }
  assert.ok(metropolitan>210&&metropolitan<290,'50/50 backdrop distribution: '+metropolitan);
  for(const kind of ['industrial','port','megablock'])assert.equal(generateLevel(1,42,kind).backdrop,'district');
});

test('market hotels are complete ground-standing buildings with reachable balconies and roofs',()=>{
  const variants=new Set();let count=0;
  for(let seed=1;seed<=60;seed++){
    const w=generateLevel(1,seed,'market');
    assert.ok(w.lamps.length>0);assert.ok(w.lamps.every(l=>l.y===GROUND));
    assert.ok(!w.decor.some(d=>d.kind==='canopy'&&d.y+d.h<GROUND));
    assert.ok(!w.decor.some(d=>d.kind==='marketUpper'));
    const hotels=w.decor.filter(d=>d.kind==='marketHotel');assert.ok(hotels.length>=1&&hotels.length<=2);
    for(const d of hotels){
      count++;variants.add(d.style);const def=MARKET_HOTELS[d.style],size=hotelSize(d.style);
      assert.ok(Math.abs(d.y+d.h-GROUND-hotelSink(d.style))<1e-7);assert.equal(d.w,size.w);assert.equal(d.h,size.h);
      assert.ok(Math.abs(d.w/d.h-def.size[0]/def.size[1])<1e-7);
      const balcony=w.platforms.find(p=>p.id===d.balconyId),roof=w.platforms.find(p=>p.id===d.roofId);
      assert.ok(balcony.y<GROUND&&roof.y<balcony.y);
      assert.ok(GROUND-balcony.y>=109,'ground storey stands above the 105px stalls');
      assert.ok(w.connections.some(c=>c.kind==='stairwell'&&c.upper.y===balcony.y&&c.lower.y===GROUND));
      assert.ok(!w.ladders.some(l=>l.top===balcony.y&&l.bottom===GROUND&&l.x>d.x&&l.x<d.x+d.w));
      assert.ok(w.ladders.some(l=>l.top===roof.y&&l.bottom===balcony.y));
      assert.ok(w.lamps.every(l=>l.x<d.x-15||l.x>d.x+d.w+15));
      assert.ok(w.decor.every(s=>s===d||s.x+s.w<=d.x||s.x>=d.x+d.w));
    }
  }
  assert.ok(count>=60);assert.equal(variants.size,3);
});
test('megablock uses wall lights on every floor instead of street poles',()=>{
  for(let seed=1;seed<=30;seed++){
    const w=generateLevel(1,seed,'megablock');assert.equal(w.lamps.length,0);
    for(const [floor,y]of w.floors.entries())assert.ok(w.wallLights.some(l=>l.floor===floor&&l.y===y-150));
  }
});

test('a full early contract cannot grant a level; XP carries across higher thresholds', () => {
  const p = structuredClone(DEFAULT_PROFILE), w = generateLevel(1, 42);
  const total = 12 + w.enemies.reduce((sum, e) => sum + enemyReward(e, 1).xp, 0);
  assert.ok(total < stats(p).nextXp / 3); assert.equal(addXp(p, total), 0);
  p.xp = 0; const a = stats(p).nextXp; p.level = 2; const b = stats(p).nextXp; p.level = 1;
  assert.equal(addXp(p, a + b + 10), 2); assert.equal(p.level, 3); assert.equal(p.xp, 10);
  assert.ok(trainingCost(p, 'strength') >= 120);
});
test('difficulty rises with levels, equipment, upgrades and completed sectors and persists after unequipping', () => {
  const p = structuredClone(DEFAULT_PROFILE); assert.equal(recommendedDepth(p), 1);
  p.level = 6; const fromLevels = recommendedDepth(p); assert.ok(fromLevels >= 4);
  p.equipment.weapon.power += 16; assert.ok(recommendedDepth(p) > fromLevels);
  p.strength += 4; const fromPower = recommendedDepth(p); assert.ok(fromPower > fromLevels);
  p.threat = fromPower; p.equipment.weapon = null; p.strength = 0; assert.ok(recommendedDepth(p) >= fromPower);
  p.best = 30; assert.equal(recommendedDepth(p), 30);
  assert.equal(loadProfile(JSON.stringify(p)).threat, 30);
});
test('all eight item slots generate and loot rarity is deliberately scarce', () => {
  for (const type of Object.keys(SLOTS)) for (let seed = 1; seed < 50; seed++) {
    const low = makeItem(1, random(seed), type), high = makeItem(8, random(seed), type);
    assert.equal(low.type, type); assert.ok(high.power > low.power); assert.ok([0, 1, 2].includes(low.rarity));
  }
  let rare = 0, legendary = 0; const rng = random(99);
  for (let i = 0; i < 10000; i++) { const item = makeItem(1, rng); if (item.rarity === 1) rare++; if (item.rarity === 2) legendary++; }
  assert.ok(rare < 1400); assert.ok(legendary < 230);
  assert.equal(BALANCE.killDrop, .06); assert.ok(BALANCE.cacheDrop < .3);
});
test('v3 saves gain the two new weapon slots without losing skills, money or existing items', () => {
  const old = structuredClone(DEFAULT_PROFILE); old.version = 3; old.gold = 321; old.level = 4; old.skills = { blades: 2 };
  delete old.equipment.rifle; delete old.equipment.shotgun; delete old.activeWeapon;
  const p = loadProfile(JSON.stringify(old));
  assert.equal(p.version,4);assert.equal(p.gold,321);assert.equal(p.skills.blades,2);
  assert.equal(p.equipment.weapon.id,old.equipment.weapon.id);
  assert.equal(p.equipment.rifle.type,'rifle');assert.equal(p.equipment.shotgun.type,'shotgun');assert.equal(p.activeWeapon,'weapon');
  p.activeWeapon='rifle';assert.equal(loadProfile(JSON.stringify(p)).activeWeapon,'rifle');
});
test('v1 saves migrate without losing progress and v2 validates each slot independently', () => {
  const item = { id: 'old', name: 'Old', type: 'weapon', power: 25, rarity: 1 };
  const old = { version: 1, gold: 500, level: 7, xp: 19, strength: 2, vitality: 3, best: 4, potions: 8, weapon: item, armor: { ...item, type: 'armor' }, bag: [item, { ...item, type: 'armor' }] };
  const p = loadProfile(JSON.stringify(old));
  assert.equal(p.version, 4); assert.equal(p.level, 7); assert.equal(p.gold, 500); assert.equal(p.xp, 19);
  assert.equal(p.equipment.weapon.power, 25); assert.equal(p.equipment.torso.type, 'torso'); assert.equal(p.bag[1].type, 'torso');
  assert.ok(p.equipment.gun); assert.ok(p.threat > 1);
  p.equipment.head = null; assert.equal(loadProfile(JSON.stringify(p)).equipment.head, null);
  p.equipment.gun.type = 'feet'; p.gold = -1; p.bag = Array.from({ length: 30 }, () => makeItem(1));
  const loaded = loadProfile(JSON.stringify(p)); assert.equal(loaded.gold, 60); assert.equal(loaded.equipment.gun.type, 'gun'); assert.equal(loaded.bag.length, BAG_LIMIT);
  for (const raw of [null, '', '{broken', 'null', '{"version":9}']) assert.deepEqual(loadProfile(raw), DEFAULT_PROFILE);
});
