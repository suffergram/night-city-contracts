import test from 'node:test';
import assert from 'node:assert/strict';
import { GROUND, generateLevel } from '../src/world.js';
import { center, incomingDamage, physics, segmentHit, projectile, updateEnemies } from '../src/combat.js';

const player = () => ({ x: 700, y: GROUND - 74, w: 27, h: 74, vx: 0, vy: 0, hp: 100, facing: 1, stamina: 100, blocking: false, invuln: 0, dodge: 0, attack: 0 });
const flat = () => ({ depth: 1, width: 2000, platforms: [{ x: 0, y: GROUND, w: 2000, h: 150, ground: true }], enemies: [] });
function enemy(role, x = 900) { const e = generateLevel(1, 41).enemies.find(e => e.role === role); return { ...e, x, y: GROUND - e.h, cooldown: 0, dodgeCooldown: 0, jumpCooldown: 0 }; }
test('front block spends stamina; rear hits, broken guards, armour and dodge behave differently', () => {
  const p = player(), raw = incomingDamage(p, 30, 900, 4).damage;
  p.blocking = true; const blocked = incomingDamage(p, 30, 900, 4);
  assert.ok(blocked.blocked); assert.ok(blocked.damage < raw); assert.ok(p.stamina < 100);
  assert.equal(incomingDamage(p, 30, 500, 4).damage, raw);
  p.stamina = 1; const broken = incomingDamage(p, 30, 900, 4);
  assert.equal(broken.damage, raw); assert.ok(p.guardBreak > 0); assert.equal(p.blocking, false);
  p.dodge = .32; assert.equal(incomingDamage(p, 100, 900, 0).damage, 0);
  p.dodge = .05; assert.ok(incomingDamage(p, 100, 900, 0).damage > 0);
});
test('swept bullets hit thin objects and respect cover', () => {
  const box = { x: 50, y: 10, w: 2, h: 30 };
  assert.equal(segmentHit(0, 20, 100, 20, box), .5);
  assert.equal(segmentHit(0, 50, 100, 50, box), null);
  assert.equal(segmentHit(0, 20, 0, 30, box), null);
  const b = projectile('player', { x: 0, y: 0 }, { x: 3, y: 4 }, 10, 100); assert.equal(Math.hypot(b.vx, b.vy), 100);
});
test('gunners retreat at close range, telegraph and fire aimed projectiles', () => {
  const w = flat(), p = player(), e = enemy('gunner', 950), bullets = []; w.enemies = [e];
  updateEnemies(w, p, bullets, .01, () => {}); assert.equal(e.state, 'windup'); assert.equal(bullets.length, 0);
  assert.ok(e.aimX < e.x);
  for (let i = 0; i < 90; i++) updateEnemies(w, p, bullets, .01, () => {});
  assert.equal(bullets.length, 1); assert.ok(bullets[0].vx < 0);
  e.state = 'chase'; e.cooldown = 1; e.x = p.x + 90; updateEnemies(w, p, bullets, .01, () => {}); assert.ok(e.vx > 0, 'retreat away from nearby player');
});
test('runners evade a telegraphed slash but cannot evade repeatedly', () => {
  const w = flat(), p = player(), e = enemy('runner', 775); w.enemies = [e]; p.attack = .3;
  updateEnemies(w, p, [], .01, () => {}); assert.equal(e.state, 'evade'); assert.ok(e.dodge > 0); assert.ok(e.vx > 0);
  e.dodge = 0; e.x = 775; updateEnemies(w, p, [], .01, () => {}); assert.equal(e.dodge, 0);
});
test('enemies jump to pursue elevated players, descend and land on one-way platforms', () => {
  const w = flat(), e = enemy('runner', 620), p = player();
  w.platforms.push({ x: 600, y: GROUND - 110, w: 260, h: 24 }); w.enemies = [e]; p.y -= 110;
  updateEnemies(w, p, [], .01, () => {}); assert.ok(e.vy < 0, 'enemy starts a jump');
  e.vx = 0; for (let i = 0; i < 120; i++) physics(e, w, 1 / 120);
  assert.equal(e.y + e.h, GROUND - 110); assert.ok(e.grounded);
  p.y = GROUND - p.h; e.state = 'chase'; e.cooldown = 1; e.jumpCooldown = 0;
  updateEnemies(w, p, [], .01, () => {}); assert.ok(e.drop > 0);
  e.vx = 0; for (let i = 0; i < 120; i++) { e.drop = Math.max(0, e.drop - 1 / 120); physics(e, w, 1 / 120); }
  assert.equal(e.y + e.h, GROUND);
});
test('heavy melee has a readable windup and can be evaded before impact', () => {
  const w = flat(), e = enemy('heavy', 760), p = player(); w.enemies = [e]; let damage = 0;
  updateEnemies(w, p, [], .01, raw => damage += raw); assert.equal(e.state, 'windup'); assert.equal(damage, 0);
  p.x -= 180; for (let i = 0; i < 70; i++) updateEnemies(w, p, [], .01, raw => damage += raw);
  assert.equal(damage, 0); assert.equal(e.state, 'recover');
});
