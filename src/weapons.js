export const WEAPONS = {
  weapon: { key: '1', name: 'Катана', short: 'КАТАНА', kind: 'melee', icon: '⚔', interval:.38,duration:.26,contactAt:.095,reach:84 },
  gun: { key: '2', name: 'Пистолет', short: 'ПИСТОЛЕТ', kind: 'gun', icon: '⌐', magazine: 10, interval: .32, reload: 1.5, speed: 850, pellets: 1, spread: 0,range:480,falloffStart:280,minMultiplier:.55 },
  rifle: { key: '3', name: 'Автомат', short: 'АВТОМАТ', kind: 'gun', icon: '⌁', magazine: 24, interval: .13, reload: 1.9, speed: 1050, pellets: 1, spread: .008,range:560,falloffStart:320,minMultiplier:.45 },
  shotgun: { key: '4', name: 'Дробовик', short: 'ДРОБОВИК', kind: 'gun', icon: '═', magazine: 6, interval: .9, reload: 2.2, speed: 740, pellets: 5, spread: .19,range:250,falloffStart:90,minMultiplier:.05 },
};
// Item power remains save-compatible; each weapon converts it to its own damage scale.
export function weaponDamage(slot,power){
  return Math.max(1,Math.round(slot==='rifle'?power*.6+2:power*2.5));
}
export const rifleSpread = heat => WEAPONS.rifle.spread + Math.min(1,Math.max(0,heat))**2*.24;
export const fireInterval = (slot,saving=0) => WEAPONS[slot].interval*Math.max(.65,1-saving/WEAPONS.gun.interval);
export function coolRifle(actor,dt){
  const before=actor.rifleRest||0;actor.rifleRest=before+dt;
  const cooling=Math.max(0,actor.rifleRest-Math.max(before,.22));
  actor.rifleHeat=Math.max(0,(actor.rifleHeat||0)-cooling*3.5);
}
export const weaponSlots = Object.keys(WEAPONS);
export const slotForKey = key => weaponSlots.find(slot => WEAPONS[slot].key === key);
// These anchors use the same cell rectangle as the renderer (no independent centre-of-body origin).
export const ACTOR_HEIGHT = 54;
export const spriteHeight = actor => (actor.h || ACTOR_HEIGHT) + 6;
export function spriteGeometry(height) {
  const size = height / .94;
  return { x: -size * .5, y: -size * .98, w: size, h: size };
}
export function muzzlePosition(actor, frameInfo = {}) {
  const box = spriteGeometry(spriteHeight(actor));
  const running = Math.abs(actor.vx || 0) > 8;
  const airborne = actor.grounded === false;
  // Normalised barrel-tip anchors for original and combined-action atlas rows.
  const anchor = frameInfo.muzzle || (airborne ? [.86, .31] : running ? [.87, .28] : [.81, .17]);
  const localX = box.x + anchor[0] * box.w, localY = box.y + anchor[1] * box.h;
  return { x: actor.x + actor.w / 2 + localX * actor.facing, y: actor.y + actor.h + localY };
}
