import { GROUND } from './world.js';

export const center = actor => ({ x: actor.x + actor.w / 2, y: actor.y + actor.h / 2 });
export function physics(actor, world, dt) {
  const oldBottom = actor.y + actor.h;
  actor.x = Math.max(20, Math.min(world.width - actor.w - 20, actor.x + actor.vx * dt));
  actor.vy += 1330 * dt; actor.y += actor.vy * dt; actor.grounded = false;
  let landing = Infinity;
  for (const p of world.platforms) {
    if (actor.vy >= 0 && (!(actor.drop > 0) || p.ground) && actor.x + actor.w > p.x && actor.x < p.x + p.w && oldBottom <= p.y + 2 && actor.y + actor.h >= p.y) landing = Math.min(landing, p.y);
  }
  if (landing !== Infinity) { actor.y = landing - actor.h; actor.vy = 0; actor.grounded = true; }
  if (actor.y > 800) { actor.y = GROUND - actor.h; actor.vy = 0; }
}
// Swept collision prevents fast bullets passing through narrow actors or platforms.
export function segmentHit(x1, y1, x2, y2, box, padding = 0) {
  let near = 0, far = 1;
  for (const [start, delta, min, max] of [[x1, x2 - x1, box.x - padding, box.x + box.w + padding], [y1, y2 - y1, box.y - padding, box.y + box.h + padding]]) {
    if (Math.abs(delta) < 1e-8) { if (start < min || start > max) return null; continue; }
    let a = (min - start) / delta, b = (max - start) / delta;
    if (a > b) [a, b] = [b, a]; near = Math.max(near, a); far = Math.min(far, b);
    if (near > far) return null;
  }
  return near;
}
export function lineOfSight(world, from, to) {
  return !world.platforms.some(p => segmentHit(from.x, from.y, to.x, to.y, p) !== null);
}
export function projectile(owner, from, to, damage, speed) {
  const dx = to.x - from.x, dy = to.y - from.y, length = Math.hypot(dx, dy) || 1;
  return { owner, x: from.x, y: from.y, vx: dx / length * speed, vy: dy / length * speed, damage, life: 2.2 };
}
export function incomingDamage(player, raw, sourceX, armor) {
  if (player.invuln > 0 || player.dodge > .1) return { damage: 0, blocked: false };
  const base = Math.max(2, raw * 100 / (100 + armor * 4));
  const front = (sourceX - center(player).x) * player.facing >= 0;
  if (player.blocking && front) {
    const cost = (12 + raw * .65) * (player.blockCostMultiplier ?? 1);
    if (player.stamina >= cost) { player.stamina -= cost; return { damage: Math.max(1, Math.round(base * .18)), blocked: true }; }
    player.stamina = 0; player.guardBreak = 1.2; player.blocking = false;
  }
  return { damage: Math.round(base), blocked: false };
}
export function updateEnemies(world, player, bullets, dt, damagePlayer) {
  const pc = center(player);
  for (const e of world.enemies) {
    if (e.dead) continue;
    for (const field of ['cooldown', 'flash', 'dodge', 'dodgeCooldown', 'jumpCooldown', 'drop']) e[field] = Math.max(0, e[field] - dt);
    const ec = center(e), dx = pc.x - ec.x, dy = pc.y - ec.y, distance = Math.abs(dx);
    const aggro = distance < 560 && Math.abs(dy) < 300;
    if (e.state === 'windup') {
      e.vx = 0; e.timer -= dt;
      if (e.timer <= 0) {
        if (e.role === 'gunner') bullets.push(projectile('enemy', { x: ec.x + e.facing * 20, y: ec.y - 4 }, { x: e.aimX, y: e.aimY }, e.damage, 430 + Math.min(world.depth, 20) * 5));
        else if (distance < (e.role === 'heavy' ? 82 : 64) && Math.abs(dy) < 55 && dx * e.facing > -10) damagePlayer(e.damage, ec.x);
        e.state = 'recover'; e.timer = e.role === 'heavy' ? .85 : .5; e.cooldown = e.role === 'gunner' ? 1.3 : .7;
      }
    } else if (e.state === 'recover') {
      e.vx = 0; e.timer -= dt; if (e.timer <= 0) e.state = 'chase';
    } else if (e.dodge > 0) {
      e.state = 'evade';
    } else {
      e.state = aggro ? 'chase' : 'patrol';
      if (aggro) {
        e.facing = Math.sign(dx) || e.facing;
        e.vx = e.facing * e.speed;
        if (e.role === 'gunner') e.vx = distance < 185 ? -e.facing * e.speed : distance < 300 ? 0 : e.vx;
        const danger = e.role !== 'heavy' && e.dodgeCooldown <= 0 && e.grounded &&
          ((distance < 110 && player.attack > .18) || bullets.some(b => b.owner === 'player' && Math.abs(b.x - ec.x) < 135 && Math.abs(b.y - ec.y) < 35 && (ec.x - b.x) * b.vx > 0));
        if (danger) {
          e.dodge = .24; e.dodgeCooldown = e.role === 'runner' ? 3 : 4.5; e.vx = -e.facing * 370; e.state = 'evade';
        } else {
          const canShoot = e.role === 'gunner' && distance < 530 && distance > 80 && lineOfSight(world, { x: ec.x, y: ec.y - 4 }, pc);
          const canSlash = e.role !== 'gunner' && distance < (e.role === 'heavy' ? 70 : 55) && Math.abs(dy) < 48;
          if (e.cooldown <= 0 && (canShoot || canSlash)) {
            e.state = 'windup'; e.timer = e.role === 'heavy' ? .65 : e.role === 'gunner' ? .72 : .36; e.vx = 0;
            e.aimX = pc.x + player.vx * .12; e.aimY = pc.y;
          }
        }
        if (e.state === 'chase' && e.grounded && e.jumpCooldown <= 0) {
          const step = world.platforms.find(p => !p.ground && p.y < e.y + e.h - 10 && e.y + e.h - p.y < 140 && ec.x > p.x - 100 && ec.x < p.x + p.w + 100 && pc.x > p.x - 80 && pc.x < p.x + p.w + 80);
          if ((dy < -45 && distance < 240 && step) || (e.role === 'runner' && distance > 95 && distance < 185)) {
            e.vy = -620; e.grounded = false; e.jumpCooldown = e.role === 'runner' ? 2.3 : 3;
            if (step && dy < -45) e.vx = Math.sign(step.x + step.w / 2 - ec.x) * e.speed;
          }
          if (dy > 70 && e.y + e.h < GROUND - 10 && (e.role !== 'gunner' || distance > 320)) { e.drop = .25; e.y += 5; }
        }
      } else {
        if (Math.abs(e.x - e.home) > 75) e.facing = e.x > e.home ? -1 : 1;
        e.vx = e.facing * e.speed * .25;
      }
    }
    // Local separation keeps a group from occupying a single point.
    if (e.state === 'chase') for (const other of world.enemies) if (other !== e && !other.dead && Math.abs(other.x - e.x) < 30 && Math.abs(other.y - e.y) < 20) e.vx += Math.sign(e.x - other.x || 1) * 30;
    physics(e, world, dt);
  }
}
