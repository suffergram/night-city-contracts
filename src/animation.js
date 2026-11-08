import { WEAPONS } from './weapons.js';
// Frame selection uses actor-local time. Pausing freezes animations; a new action starts at frame 0.
export const HERO_CLIPS = {
  idle: { frames: [0, 1, 2, 3, 4, 5], fps: 5, loop: true },
  run: { sheet:'run', frames: [12, 13, 14, 15, 16, 17], fps: 13, loop: true },
  jump: { frames: [12, 13, 14, 15, 16, 17], fps: 9 },
  land: { frames: [17, 12], fps: 13 },
  roll: { frames: [18, 19, 20, 21, 22, 23], duration: .32 },
  attack: { frames: [24, 25, 26, 27, 28, 29], duration: WEAPONS.weapon.duration },
  shoot: { frames: [31, 32, 33, 34], duration: .27, loop: true },
  reload: { sheet: 'utility', frames: [6, 7, 8, 9, 10, 11], reload: true },
  runReload: { sheet: 'utility', frames: [12, 13, 14, 15, 16, 17], reload: true, fps: 13, loop: true },
  backReload: { sheet: 'utility', frames: [18, 19, 20, 21, 22, 23], reload: true, fps: 12, loop: true },
  jumpReload: { sheet: 'utility', frames: [24, 25, 26, 27, 28, 29], reload: true },
  block: { frames: [25], fps: 1 },
  runBack: { sheet: 'actions', frames: [0, 1, 2, 3, 4, 5], fps: 12, loop: true },
  runAttack: { sheet: 'actions', frames: [6, 7, 8, 9, 10, 11], duration: WEAPONS.weapon.duration },
  backAttack: { sheet: 'utility', frames: [0, 1, 2, 3, 4, 5], duration: WEAPONS.weapon.duration, contactAt: .21/.32*WEAPONS.weapon.duration },
  runShoot: { sheet: 'actions', frames: [12, 13, 14, 15, 16, 17], fps: 13, loop: true, muzzle: [.87, .32] },
  backShoot: { sheet: 'actions', frames: [18, 19, 20, 21, 22, 23], fps: 12, loop: true, muzzle: [.87, .32] },
  runAim: { sheet: 'actions', frames: [12, 13, 14, 15, 16, 17], fps: 13, loop: true, muzzle: [.87, .32] },
  backAim: { sheet: 'actions', frames: [18, 19, 20, 21, 22, 23], fps: 12, loop: true, muzzle: [.87, .32] },
  jumpAttack: { sheet: 'actions', frames: [24, 25, 26, 27, 28, 29], duration: WEAPONS.weapon.duration },
  jumpShoot: { sheet: 'actions', frames: [30, 31, 32, 33, 34, 35], fps: 12, loop: true, muzzle: [.86, .31] },
  jumpAim: { sheet: 'utility', frames: [30, 31, 32, 33, 34, 35], fps: 7, muzzle: [.86, .31] },
};
const reloadClip = (frames, options = {}) => ({ sheet: 'longgunUtility', frames, reload: true, ...options });
export const LONG_GUN_CLIPS = {
  rifle: {
    reload: reloadClip([0, 1, 2]), runReload: reloadClip([3, 4, 5], { fps: 11, loop: true }),
    backReload: reloadClip([6, 7, 8], { fps: 10, loop: true }), jumpReload: reloadClip([9, 10, 11]),
    jumpAim: { sheet: 'longgunUtility', frames: [24, 25, 26, 27, 28, 29] },
    land: { sheet: 'longgunUtility', frames: [29] }, block: { sheet: 'longgunUtility', frames: [0] },
  },
  shotgun: {
    reload: reloadClip([12, 13, 14]), runReload: reloadClip([15, 16, 17], { fps: 11, loop: true }),
    backReload: reloadClip([18, 19, 20], { fps: 10, loop: true }), jumpReload: reloadClip([21, 22, 23]),
    jumpAim: { sheet: 'longgunUtility', frames: [30, 31, 32, 33, 34, 35] },
    land: { sheet: 'longgunUtility', frames: [35] }, block: { sheet: 'longgunUtility', frames: [12] },
  },
};
const enemyClips = base => ({
  idle: { frames: [base], fps: 1 }, run: { frames: [base + 1, base + 2, base + 3, base + 2], fps: 11, loop: true },
  jump: { frames: [base + 6, base + 7] }, land: { frames: [base + 7], fps: 8 },
  roll: { frames: [base + 8, base + 9], duration: .24 },
  attack: { frames: [base + 4, base + 5, base + 10, base + 11], duration: .55 },
  shoot: { frames: [base + 4, base + 5, base + 10, base + 11], duration: .72 },
  block: { frames: [base + 8] },
});
export const ENEMY_CLIPS = { gunner: enemyClips(0), runner: enemyClips(12), heavy: enemyClips(24) };
ENEMY_CLIPS.heavy.attack = { frames: [28, 29, 33, 24], duration: .65 };
ENEMY_CLIPS.heavy.shoot = { frames: [34, 35, 34], duration: .72 };
ENEMY_CLIPS.gunner.shoot.duration = .46;
ENEMY_CLIPS.runner.attack.duration = .62;

export function animationState(actor, role = 'hero') {
  const hero = role === 'hero', moving = Math.abs(actor.vx || 0) > 8, air = actor.grounded === false;
  const back = actor.vx * actor.facing < 0, ranged = actor.activeWeapon && actor.activeWeapon !== 'weapon';
  if (actor.dodge > 0) return !hero&&actor.evadeKind==='hop'?'jump':'roll';
  if (actor.blocking) return 'block';
  if (actor.attack > 0) return hero ? air ? 'jumpAttack' : moving ? back ? 'backAttack' : 'runAttack' : 'attack' : 'attack';
  if (actor.state === 'windup' || actor.state === 'recover') return role === 'gunner' ? 'shoot' : 'attack';
  if (actor.reload > 0) return hero ? air ? 'jumpReload' : moving ? back ? 'backReload' : 'runReload' : 'reload' : 'reload';
  if ((actor.fireVisual ?? actor.shotCooldown) > 0) return hero ? air ? 'jumpShoot' : moving ? back ? 'backShoot' : 'runShoot' : 'shoot' : 'shoot';
  if (air) return hero && ranged ? 'jumpAim' : 'jump';
  if (actor.animation?.name.startsWith('jump') || actor.animation?.name === 'land' && actor.animation.time < .14) return 'land';
  if (moving) return hero ? ranged ? back ? 'backAim' : 'runAim' : back ? 'runBack' : 'run' : 'run';
  return 'idle';
}
function activeClip(actor, role = 'hero') {
  const name = animationState(actor, role);
  let clip = (role === 'hero' ? HERO_CLIPS : ENEMY_CLIPS[role])?.[name] || HERO_CLIPS.idle;
  if (role === 'hero') {
    clip = LONG_GUN_CLIPS[actor.activeWeapon]?.[name] || clip;
    if (actor.activeWeapon === 'gun' && name === 'land') clip = { sheet: 'utility', frames: [35] };
    if (actor.activeWeapon === 'gun' && name === 'block') clip = { sheet: 'utility', frames: [6] };
  }
  return { name, time: actor.animation?.name === name ? actor.animation.time : 0, clip };
}
export function animationInfo(actor, role = 'hero') {
  const { name, clip } = activeClip(actor, role);
  return { name, sheet: clip.sheet || (role === 'hero' ? 'hero' : 'enemies'), muzzle: clip.muzzle, contactAt:role==='hero'&&['attack','runAttack','backAttack','jumpAttack'].includes(name)?clip.contactAt??WEAPONS.weapon.contactAt:clip.contactAt ?? .12 };
}
export function advanceAnimation(actor, dt, role = 'hero') {
  if (actor.grounded && Math.abs(actor.vx || 0) > 8) actor.strideTime = (actor.strideTime || 0) + dt;
  const name = animationState(actor, role);
  if (!actor.animation || actor.animation.name !== name) actor.animation = { name, time: 0 };
  else actor.animation.time += dt;
  return actor.animation;
}
export function animationFrame(actor, role = 'hero') {
  const { name, time, clip } = activeClip(actor, role);
  if(role==='hero'&&['run','runBack','runAim','backAim','runShoot','backShoot'].includes(name))return clip.frames[runStep(actor)];
  if (role === 'hero' && ['attack','runAttack','backAttack','jumpAttack'].includes(name)) {
    const progress = Math.max(0, Math.min(1, 1 - actor.attack / WEAPONS.weapon.duration));
    return clip.frames[Math.min(clip.frames.length - 1, Math.floor(progress * clip.frames.length))];
  }
  if (role === 'hero' && name === 'idle' && actor.activeWeapon && actor.activeWeapon !== 'weapon') return 31;
  if (name === 'jumpAim' || name === 'jumpReload') {
    const phase = clip.frames.length === 3 ? actor.vy < -100 ? 0 : actor.vy < 150 ? 1 : 2 : actor.vy < -250 ? 1 : actor.vy < -30 ? 2 : actor.vy < 150 ? 3 : actor.vy < 350 ? 4 : 5;
    return clip.frames[phase];
  }
  if (clip.reload && !clip.loop) {
    const progress = Math.max(0, Math.min(1, 1 - actor.reload / (actor.reloadDuration || 1.5)));
    return clip.frames[Math.min(clip.frames.length - 1, Math.floor(progress * clip.frames.length))];
  }
  if (name === 'jump') {
    if (role !== 'hero') return clip.frames[actor.vy < 0 ? 0 : 1];
    return clip.frames[actor.vy < -250 ? 1 : actor.vy < -30 ? 2 : actor.vy < 150 ? 3 : 4];
  }
  const fps = clip.duration ? clip.frames.length / clip.duration : clip.fps || 6;
  const clock = clip.reload && clip.loop ? actor.strideTime || 0 : time;
  let index = Math.floor(clock * fps);
  index = clip.loop ? index % clip.frames.length : Math.min(index, clip.frames.length - 1);
  return clip.frames[index];
}

// One complete source cycle for moving with a katana, aiming or firing.
export function runStep(actor) {
  return Math.floor((actor.strideTime||0)*(actor.vx*actor.facing<0?12:13)+1e-9)%6;
}
export function atlasCell(index, width, height, columns = 6, rows = 6) {
  if (!Number.isInteger(index) || index < 0 || index >= columns * rows) throw new RangeError('Invalid sprite frame');
  // Rounded boundaries support source sheets whose resolution is not divisible by six.
  const col = index % columns, row = Math.floor(index / columns);
  const x = Math.round(col * width / columns), y = Math.round(row * height / rows);
  return { x, y, w: Math.round((col + 1) * width / columns) - x, h: Math.round((row + 1) * height / rows) - y };
}
