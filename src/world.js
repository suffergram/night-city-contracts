import { skillEffects, validateSkills } from './skills.js';
import { ACTOR_HEIGHT } from './weapons.js';
export const GROUND = 538;
export const BAG_LIMIT = 24;
export const SLOTS = { weapon: 'Катана', gun: 'Пистолет', rifle: 'Автомат', shotgun: 'Дробовик', head: 'Голова', torso: 'Куртка', legs: 'Брюки', feet: 'Обувь' };
export const BALANCE = { killDrop: .06, cacheDrop: .28, potionCost: 35, magazine: 10, reload: 1.5, rollCost: 28, meleeCost: 9 };
const starter = (type, name, power) => ({ id: `starter-${type}`, type, name, rarity: 0, power });
export const DEFAULT_PROFILE = {
  version: 4, gold: 60, xp: 0, level: 1, strength: 0, vitality: 0, potions: 3, best: 0, threat: 1, skills: {}, activeWeapon: 'weapon',
  equipment: {
    weapon: starter('weapon', 'Катана «Ронин»', 4), gun: starter('gun', 'Пистолет «Unity»', 8),
    rifle: starter('rifle', 'Автомат «Copperhead»', 4), shotgun: starter('shotgun', 'Дробовик «Carnage»', 4),
    head: starter('head', 'Визор наёмника', 1), torso: starter('torso', 'Куртка самурая', 2),
    legs: starter('legs', 'Тактические брюки', 1), feet: starter('feet', 'Уличные кроссовки', 0),
  }, bag: [],
};
export function random(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function stats(profile) {
  const e = profile.equipment, level = profile.level - 1, perks = skillEffects(profile);
  return {
    maxHp: 100 + level * 6 + profile.vitality * 10 + (perks.hp || 0),
    damage: 8 + (e.weapon?.power || 0) + level + profile.strength * 2 + (e.weapon ? perks.melee || 0 : 0) + (perks.analysis || 0),
    gunDamage: e.gun ? e.gun.power + level + profile.strength + (perks.gun || 0) + (perks.analysis || 0) : 0,
    rifleDamage: e.rifle ? e.rifle.power + level + profile.strength + (perks.gun || 0) + (perks.analysis || 0) : 0,
    shotgunDamage: e.shotgun ? e.shotgun.power + level + profile.strength + (perks.gun || 0) + (perks.analysis || 0) : 0,
    armor: ['head', 'torso', 'legs', 'feet'].reduce((sum, slot) => sum + (e[slot]?.power || 0), 0) + (perks.armor || 0),
    maxStamina: 100 + profile.vitality * 3 + (perks.stamina || 0),
    staminaRegen: 24 + (perks.staminaRegen || 0), meleeCost: BALANCE.meleeCost - (perks.meleeSaving || 0),
    rollCost: BALANCE.rollCost - (perks.rollSaving || 0), reloadTime: BALANCE.reload - (perks.reloadSaving || 0),
    healing: 45 + (perks.healing || 0), healCooldown: 8 - (perks.healCooldownSaving || 0),
    fireInterval: .27 - (perks.fireSaving || 0), blockCostMultiplier: 1 - (perks.blockSaving || 0),
    perks,
    nextXp: 320 + level * 110 + level * level * 25,
  };
}
export function recommendedDepth(profile) {
  const s = stats(profile);
  const rangedGrowth = Math.max(0, s.gunDamage - 8, (s.rifleDamage - 4) * 1.4, (s.shotgunDamage - 4) * 1.2);
  const power = 1 + Math.floor(Math.max(0, s.damage - 12) / 4 + rangedGrowth / 6 + Math.max(0, s.maxHp - 100) / 40 + Math.max(0, s.armor - 4) / 5);
  return Math.max(1, profile.best, profile.threat, power, 1 + Math.floor((profile.level - 1) * .65));
}
export function addXp(profile, amount) {
  profile.xp += amount; let levels = 0;
  while (profile.xp >= stats(profile).nextXp) { profile.xp -= stats(profile).nextXp; profile.level++; levels++; }
  return levels;
}
export function trainingCost(profile, type) { return 120 + profile[type] * 90; }
export function makeItem(depth, rng = Math.random, forcedType) {
  const type = forcedType || Object.keys(SLOTS)[Math.floor(rng() * Object.keys(SLOTS).length)];
  const roll = rng(), rarity = roll > .985 ? 2 : roll > .88 ? 1 : 0;
  const names = {
    weapon: ['Катана «Ронин»', 'Катана «Бякко»', 'Катана «Неон»'],
    gun: ['Пистолет «Unity»', 'Тяжёлый «Lexington»', 'Пистолет «Nue»'],
    rifle: ['Автомат «Copperhead»', 'Автомат «Ajax»', 'Автомат «Неон»'],
    shotgun: ['Дробовик «Carnage»', 'Дробовик «Tactician»', 'Дробовик «Crusher»'],
    head: ['Визор «Kiroshi»', 'Маска нетраннера', 'Баллистический шлем'],
    torso: ['Куртка самурая', 'Бронежилет Militech', 'Плащ фиксера'],
    legs: ['Тактические брюки', 'Штаны нетраннера', 'Арамидные брюки'],
    feet: ['Ботинки соло', 'Кроссовки с усилением', 'Тактические берцы'],
  };
  const weapon = ['weapon', 'gun', 'rifle', 'shotgun'].includes(type);
  const power = (type === 'gun' ? 8 : weapon ? 4 : type === 'torso' ? 2 : 1) + Math.floor(depth * (weapon ? .8 : .35)) + rarity * (weapon ? 3 : 1) + Math.floor(rng() * 2);
  return { id: `${Date.now()}-${Math.floor(rng() * 1e9)}`, type, rarity, power, name: names[type][Math.floor(rng() * names[type].length)] };
}
export function itemValue(item) { return 10 + item.power * 2 + item.rarity * 15; }
export function buyPrice(item) { return itemValue(item) * 4; }
export function enemyReward(enemy, depth) {
  return { gold: (enemy.role === 'heavy' ? 7 : 4) + Math.floor(depth / 2), xp: (enemy.role === 'heavy' ? 8 : 5) + Math.min(depth, 20) };
}
export function generateLevel(depth, seed = Date.now()) {
  depth = Math.max(1, Math.floor(depth));
  const rng = random(seed), width = 3400 + Math.min(depth, 12) * 150;
  const platforms = [{ x: 0, y: GROUND, w: width, h: 150, ground: true }], enemies = [], chests = [];
  const cacheIndex = 1 + Math.floor(rng() * 5);
  let index = 0;
  for (let x = 430; x < width - 420; x += 330 + rng() * 95) {
    const y = GROUND - 90 - Math.floor(rng() * 35), w = 170 + Math.floor(rng() * 70);
    platforms.push({ x, y, w, h: 24 });
    if (index === cacheIndex) chests.push({ x: x + 65, y: y - 25, open: false });
    const role = ['gunner', 'runner', 'heavy'][index % 3];
    const hp = (role === 'heavy' ? 65 : role === 'runner' ? 38 : 42) + depth * 9;
    const elevated = role === 'gunner' && rng() < .5;
    enemies.push({ x: x + 70, y: (elevated ? y : GROUND) - ACTOR_HEIGHT, w: role === 'heavy' ? 28 : 22, h: ACTOR_HEIGHT,
      hp, maxHp: hp, damage: (role === 'heavy' ? 17 : 11) + depth * 2, speed: (role === 'runner' ? 155 : role === 'gunner' ? 95 : 82) + Math.min(depth, 20) * 2,
      role, vx: 0, vy: 0, grounded: true, home: x + 70, facing: -1, cooldown: .5 + rng(),
      flash: 0, dead: false, state: 'patrol', timer: 0, dodge: 0, dodgeCooldown: 1 + rng(), jumpCooldown: 0, drop: 0, aimX: 0, aimY: 0 });
    index++;
  }
  chests.push({ x: width - 330, y: GROUND - 25, open: false });
  return { depth, seed, width, platforms, enemies, chests, portal: { x: width - 180, y: GROUND }, kills: 0, earned: 0 };
}
function validItem(item) {
  return item && typeof item.id === 'string' && typeof item.name === 'string' && item.name.length < 80 && Object.hasOwn(SLOTS, item.type) && Number.isInteger(item.power) && item.power >= 0 && item.power < 10000 && [0, 1, 2].includes(item.rarity);
}
export function loadProfile(raw) {
  const fresh = () => structuredClone(DEFAULT_PROFILE);
  try {
    const value = JSON.parse(raw);
    if (!value || ![1, 2, 3, 4].includes(value.version)) return fresh();
    const p = fresh();
    for (const field of ['gold', 'xp', 'level', 'strength', 'vitality', 'potions', 'best', 'threat']) {
      const limit = ['level', 'strength', 'vitality', 'best', 'threat'].includes(field) ? 1000 : 1e7;
      if (Number.isSafeInteger(value[field]) && value[field] >= (['level', 'threat'].includes(field) ? 1 : 0) && value[field] <= limit) p[field] = value[field];
    }
    if (value.version === 1) {
      const convert = (item, slot) => item && validItem({ ...item, type: slot }) ? { ...item, type: slot, name: slot === 'weapon' ? 'Архивный клинок' : 'Архивная бронекуртка' } : null;
      p.equipment.weapon = convert(value.weapon, 'weapon') || p.equipment.weapon;
      p.equipment.torso = convert(value.armor, 'torso') || p.equipment.torso;
      p.bag = Array.isArray(value.bag) ? value.bag.map(item => convert(item, item?.type === 'armor' ? 'torso' : 'weapon')).filter(Boolean).slice(0, BAG_LIMIT) : [];
      p.xp = Math.min(p.xp, stats(p).nextXp - 1);
    } else {
      for (const slot of Object.keys(SLOTS)) {
        const item = value.equipment?.[slot];
        if (item === null) p.equipment[slot] = null;
        else if (validItem(item) && item.type === slot) p.equipment[slot] = item;
      }
      p.bag = Array.isArray(value.bag) ? value.bag.filter(validItem).slice(0, BAG_LIMIT) : [];
      p.xp = Math.min(p.xp, stats(p).nextXp - 1);
    }
    p.skills = validateSkills(value.skills, p.level);
    if (['weapon', 'gun', 'rifle', 'shotgun'].includes(value.activeWeapon)) p.activeWeapon = value.activeWeapon;
    for (const item of [p.equipment.weapon, ...p.bag.filter(item => item.type === 'weapon')]) {
      if (item && !item.name.startsWith('Катана')) item.name = `Катана «Архив»`;
    }
    p.threat = recommendedDepth(p);
    return p;
  } catch { return fresh(); }
}
