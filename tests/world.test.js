import test from 'node:test';
import assert from 'node:assert/strict';
import { GROUND, BAG_LIMIT, BALANCE, SLOTS, DEFAULT_PROFILE, stats, random, generateLevel, makeItem, loadProfile, addXp, recommendedDepth, enemyReward, trainingCost } from '../src/world.js';

test('200 seeded sectors are finite, have reachable caches and all three enemy roles', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const w = generateLevel(1 + seed % 20, seed);
    assert.ok(w.width < 6000); assert.equal(w.platforms[0].w, w.width);
    assert.ok(w.portal.x < w.width - 50); assert.ok(w.enemies.length >= 6);
    assert.equal(new Set(w.enemies.map(e => e.role)).size, 3);
    assert.equal(w.chests.length, 2);
    for (const p of w.platforms.slice(1)) { assert.ok(GROUND - p.y < 620 ** 2 / (2 * 1330) - 5); assert.ok(p.x + p.w < w.width); }
    for (const c of w.chests) assert.ok(w.platforms.some(p => c.x >= p.x && c.x + 34 <= p.x + p.w && c.y + 25 === p.y));
    for (const e of w.enemies) { assert.ok(e.hp > 0); assert.ok(w.platforms.some(p => p.y === e.y + e.h)); assert.ok(e.x < w.portal.x); }
  }
  assert.deepEqual(generateLevel(3, 42), generateLevel(3, 42));
  assert.notDeepEqual(generateLevel(3, 42), generateLevel(3, 43));
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
