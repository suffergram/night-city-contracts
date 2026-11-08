import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PROFILE, addXp, stats, loadProfile } from '../src/world.js';
import { SKILLS, availablePoints, skillStatus, learnSkill, skillEffects } from '../src/skills.js';
import { mercenarySvg, appearance } from '../src/character.js';

test('skill trees enforce point budget, maximum rank, level and prerequisite ranks', () => {
  const p = structuredClone(DEFAULT_PROFILE);
  assert.equal(availablePoints(p), 2); assert.equal(learnSkill(p, 'dash'), false);
  assert.equal(learnSkill(p, 'blades'), true); assert.equal(learnSkill(p, 'blades'), true);
  assert.equal(availablePoints(p), 0); assert.equal(learnSkill(p, 'focus'), false);
  addXp(p, stats(p).nextXp); assert.equal(availablePoints(p), 2);
  assert.equal(skillStatus(p, 'dash').allowed, false, 'requires level three');
  addXp(p, stats(p).nextXp); assert.equal(learnSkill(p, 'dash'), true);
  assert.equal(learnSkill(p, 'blades'), true); assert.equal(learnSkill(p, 'blades'), false);
  assert.equal(learnSkill(p, 'missing'), false);
});
test('all 20 skill effects are defined and alter actual character stats', () => {
  const p = structuredClone(DEFAULT_PROFILE); p.level = 20;
  const before = stats(p);
  for (const [id, skill] of Object.entries(SKILLS)) for (let n = 0; n < skill.max; n++) assert.ok(learnSkill(p, id));
  const after = stats(p), perks = skillEffects(p);
  assert.equal(Object.keys(SKILLS).length, 20);
  assert.equal(after.maxHp - before.maxHp, 24); assert.equal(after.damage - before.damage, 22);
  assert.equal(after.gunDamage - before.gunDamage, 22); assert.equal(after.armor - before.armor, 6);
  assert.equal(after.maxStamina - before.maxStamina, 20); assert.equal(after.staminaRegen, 32);
  assert.equal(after.rollCost, 20); assert.equal(after.meleeCost, 6); assert.equal(after.healing, 61);
  assert.equal(after.reloadTime, 1.1); assert.equal(perks.airDash, 1); assert.equal(perks.scanner, 1);
});
test('v2 migration grants retroactive points and save loading discards invalid skill allocations', () => {
  const old = structuredClone(DEFAULT_PROFILE); old.version = 2; old.level = 6; delete old.skills;
  const p = loadProfile(JSON.stringify(old)); assert.equal(p.version, 4); assert.equal(availablePoints(p), 12);
  p.level = 1; p.skills = { blades: 99, dash: 2, airDash: 1, focus: -1, missing: 99 };
  const loaded = loadProfile(JSON.stringify(p)); assert.equal(loaded.skills.blades, 2); assert.equal(loaded.skills.dash, undefined); assert.equal(availablePoints(loaded), 0);
});
test('equipment preview uses separate visible layers and item-dependent materials', () => {
  const p = structuredClone(DEFAULT_PROFILE);
  const full = mercenarySvg(p.equipment);
  for (const slot of ['weapon','gun','head','torso','legs','feet']) assert.ok(full.includes(`data-slot="${slot}"`));
  p.equipment.head = null; p.equipment.weapon = null; p.equipment.gun = null;
  const stripped = mercenarySvg(p.equipment); assert.ok(!stripped.includes('data-slot="head"')); assert.ok(!stripped.includes('data-slot="weapon"')); assert.ok(!stripped.includes('data-slot="gun"'));
  const torso = p.equipment.torso; assert.notEqual(appearance(torso, 'torso').accent, appearance({ ...torso, rarity: 2 }, 'torso').accent);
  assert.notEqual(mercenarySvg({}, { role: 'runner' }), mercenarySvg({}, { role: 'heavy' }));
  assert.notEqual(mercenarySvg(p.equipment, { pose: 'slash' }), mercenarySvg(p.equipment, { pose: 'shoot' }));
});
