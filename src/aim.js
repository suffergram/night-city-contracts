import { spriteGeometry, spriteHeight, WEAPONS } from './weapons.js';
import { AIM_POSE_DATA } from './aim-pose-data.js';

export const AIM_STEP_DEGREES = 15;
export const AIM_STEP = AIM_STEP_DEGREES * Math.PI / 180;
// Authored shoulder sockets vary with the torso lean and jump compression.
const BODY_PIVOTS = [
  [.42,.28],[.44,.28],[.44,.28],[.44,.28],[.44,.28],[.44,.28],
  [.51,.25],[.52,.25],[.53,.25],[.53,.25],[.52,.25],[.52,.26],
  [.43,.29],[.45,.29],[.45,.27],[.46,.28],[.46,.29],[.47,.28],
  [.40,.47],[.44,.39],[.46,.26],[.49,.21],[.45,.38],[.41,.47],
];
const ARM_PIVOT = [.20,.36], ARM_SCALE = .65;
export const AIM_MUZZLES = { gun: [.90,.36], rifle: [.97,.36], shotgun: [.96,.36] };
// A single firearm drawing and physical size are shared by every aiming pose.
export const AIM_GUNS = {
  gun: { width: .27, aspect: 642 / 397, grip: [.17,.70], muzzle: [.99,.18], reach: .22 },
  rifle: { width: .49, aspect: 867 / 364, grip: [.32,.66], muzzle: [.99,.32], reach: .40 },
  shotgun: { width: .51, aspect: 867 / 261, grip: [.28,.70], muzzle: [.99,.34], reach: .42 },
};

export function canAim(actor) {
  return WEAPONS[actor.activeWeapon]?.kind === 'gun' && !(actor.reload > 0 || actor.dodge > 0 || actor.blocking || actor.attack > 0);
}

export function aimOrigin(actor) {
  const box = spriteGeometry(spriteHeight(actor));
  const pivot = BODY_PIVOTS[aimBodyFrame(actor)];
  return { x: actor.x + actor.w / 2 + (box.x + box.w * pivot[0]) * actor.facing,
    y: actor.y + actor.h + box.y + box.h * pivot[1] };
}

// The angle is local to the facing direction; mirroring preserves up/down on both sides.
export function aimAngle(actor, target) {
  if (!target) return 0;
  const pivot = aimOrigin(actor), dx = (target.x - pivot.x) * actor.facing, dy = target.y - pivot.y;
  if (Math.hypot(dx, dy) < 1) return actor.aimAngle || 0;
  return Math.max(-Math.PI / 2, Math.min(Math.PI / 2, Math.round(Math.atan2(dy, dx) / AIM_STEP) * AIM_STEP));
}

export function aimGeometry(actor, height = spriteHeight(actor)) {
  const box = spriteGeometry(height), angle = actor.aimAngle || 0;
  const degrees = angle * 180 / Math.PI;
  const poseIndex = degrees < -45.01 ? Math.min(2, Math.round((-degrees - 60) / 15))
    : degrees > .01 ? Math.min(5, 3 + Math.floor((degrees - 14.99) / 30)) : -1;
  const row = { gun: 0, rifle: 12, shotgun: 24 }[actor.activeWeapon] || 0;
  const pose = poseIndex >= 0 ? AIM_POSE_DATA[actor.activeWeapon || 'gun'][poseIndex] : null;
  // Match sleeve/shoulder thickness to the horizontal arm layer, not total weapon bounds.
  const sourcePivot = pose?.pivot || ARM_PIVOT, scale = pose ? .62 : ARM_SCALE;
  const rotation = angle - (pose?.degrees || 0) * Math.PI / 180;
  const socket = BODY_PIVOTS[aimBodyFrame(actor)];
  const pivot = { x: box.x + box.w * socket[0], y: box.y + box.h * socket[1] };
  const arms = { x: pivot.x - box.w * scale * sourcePivot[0], y: pivot.y - box.h * scale * sourcePivot[1],
    w: box.w * scale, h: box.h * scale };
  const anchor = pose?.muzzle || AIM_MUZZLES[actor.activeWeapon] || AIM_MUZZLES.gun;
  const gun = AIM_GUNS[actor.activeWeapon] || AIM_GUNS.gun;
  const base = (pose?.degrees || 0) * Math.PI / 180;
  const sourceGrip = pose ? [anchor[0] - Math.cos(base) * gun.reach - Math.sin(base) * .05,
    anchor[1] - Math.sin(base) * gun.reach + Math.cos(base) * .05]
    : actor.activeWeapon === 'gun' ? [.68,.49] : actor.activeWeapon === 'rifle' ? [.57,.46] : [.56,.46];
  const gripX = arms.w * (sourceGrip[0] - sourcePivot[0]), gripY = arms.h * (sourceGrip[1] - sourcePivot[1]);
  const grip = { x: pivot.x + gripX * Math.cos(rotation) - gripY * Math.sin(rotation),
    y: pivot.y + gripX * Math.sin(rotation) + gripY * Math.cos(rotation) };
  const gunWidth = height * gun.width, gunHeight = gunWidth / gun.aspect;
  const weapon = { grip, angle, x: -gun.grip[0] * gunWidth, y: -gun.grip[1] * gunHeight, w: gunWidth, h: gunHeight };
  const dx = gunWidth * (gun.muzzle[0] - gun.grip[0]), dy = gunHeight * (gun.muzzle[1] - gun.grip[1]);
  const recoil = actor.fireVisual > .1 ? 1 : 0;
  return { box, arms, pivot, angle, rotation, anchor, weapon,
    sheet: pose ? 'aimExtremes' : 'aimRig',
    frame: pose ? row + poseIndex + recoil * 6 : 24 + ({ gun: 0, rifle: 2, shotgun: 4 }[actor.activeWeapon] || 0) + recoil,
    muzzle: { x: grip.x + dx * Math.cos(angle) - dy * Math.sin(angle),
    y: grip.y + dx * Math.sin(angle) + dy * Math.cos(angle) },
    direction: { x: Math.cos(angle) * actor.facing, y: Math.sin(angle) } };
}

export function aimedMuzzle(actor) {
  const rig = aimGeometry(actor);
  return { x: actor.x + actor.w / 2 + rig.muzzle.x * actor.facing, y: actor.y + actor.h + rig.muzzle.y };
}

export function aimBodyFrame(actor) {
  if (actor.grounded === false) return 18 + (actor.vy < -250 ? 1 : actor.vy < -30 ? 2 : actor.vy < 150 ? 3 : 4);
  if (actor.animation?.name === 'land') return 23;
  if (Math.abs(actor.vx || 0) > 8) return (actor.vx * actor.facing < 0 ? 12 : 6) + Math.floor((actor.strideTime || 0) * 12) % 6;
  return Math.floor((actor.animation?.time || 0) * 5) % 6;
}
