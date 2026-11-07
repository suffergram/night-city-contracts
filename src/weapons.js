export const WEAPONS = {
  weapon: { key: '1', name: 'Катана', short: 'КАТАНА', kind: 'melee', icon: '⚔' },
  gun: { key: '2', name: 'Пистолет', short: 'ПИСТОЛЕТ', kind: 'gun', icon: '⌐', magazine: 10, interval: .27, reload: 1.5, speed: 850, pellets: 1, spread: 0 },
  rifle: { key: '3', name: 'Автомат', short: 'АВТОМАТ', kind: 'gun', icon: '⌁', magazine: 24, interval: .13, reload: 1.9, speed: 1050, pellets: 1, spread: .035 },
  shotgun: { key: '4', name: 'Дробовик', short: 'ДРОБОВИК', kind: 'gun', icon: '═', magazine: 6, interval: .9, reload: 2.2, speed: 740, pellets: 5, spread: .19 },
};
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
