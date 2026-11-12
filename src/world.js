import { skillEffects, validateSkills } from './skills.js';
import { ACTOR_HEIGHT, weaponDamage } from './weapons.js';
import {createLayout,LEVEL_KINDS} from './level-layout.js';
import {createDressing,marketMerchandise} from './dressing.js';
import {createTowerClutter} from './tower-clutter.js';
export {LEVEL_KINDS} from './level-layout.js';
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
  const power=offensivePower(profile);
  return {
    maxHp: 100 + level * 6 + profile.vitality * 10 + (perks.hp || 0),
    damage: weaponDamage('weapon',power.damage),
    gunDamage: e.gun ? weaponDamage('gun',power.gunDamage) : 0,
    rifleDamage: e.rifle ? weaponDamage('rifle',power.rifleDamage) : 0,
    shotgunDamage: e.shotgun ? weaponDamage('shotgun',power.shotgunDamage) : 0,
    armor: ['head', 'torso', 'legs', 'feet'].reduce((sum, slot) => sum + (e[slot]?.power || 0), 0) + (perks.armor || 0),
    maxStamina: 100 + profile.vitality * 3 + (perks.stamina || 0),
    staminaRegen: 24 + (perks.staminaRegen || 0), meleeCost: BALANCE.meleeCost - (perks.meleeSaving || 0),
    rollCost: BALANCE.rollCost - (perks.rollSaving || 0), reloadTime: BALANCE.reload - (perks.reloadSaving || 0),
    healing: 45 + (perks.healing || 0), healCooldown: 8 - (perks.healCooldownSaving || 0),
    fireInterval: .32 - (perks.fireSaving || 0), blockCostMultiplier: 1 - (perks.blockSaving || 0),
    perks,
    nextXp: 320 + level * 110 + level * level * 25,
  };
}
function offensivePower(profile){
  const e=profile.equipment,level=profile.level-1,perks=skillEffects(profile);
  const ranged=slot=>e[slot]?e[slot].power+level+profile.strength+(perks.gun||0)+(perks.analysis||0):0;
  return {damage:8+(e.weapon?.power||0)+level+profile.strength*2+(e.weapon?perks.melee||0:0)+(perks.analysis||0),gunDamage:ranged('gun'),rifleDamage:ranged('rifle'),shotgunDamage:ranged('shotgun')};
}
export function recommendedDepth(profile) {
  const s = stats(profile);
  // Weapon tuning must not raise contract threat for unchanged equipment/saves.
  const offense=offensivePower(profile);
  const rangedGrowth = Math.max(0, offense.gunDamage - 8, (offense.rifleDamage - 4) * 1.4, (offense.shotgunDamage - 4) * 1.2);
  const power = 1 + Math.floor(Math.max(0, offense.damage - 12) / 4 + rangedGrowth / 6 + Math.max(0, s.maxHp - 100) / 40 + Math.max(0, s.armor - 4) / 5);
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
let seedCounter=0;
export function freshLevelSeed() {
  return globalThis.crypto?.getRandomValues?globalThis.crypto.getRandomValues(new Uint32Array(1))[0]:(Date.now()+Math.imul(++seedCounter,2654435761))>>>0;
}
export function generateLevel(depth, seed = freshLevelSeed(), kind) {
  depth = Math.max(1, Math.floor(depth));
  const rng = random(seed),layout=createLayout(rng,GROUND,kind),enemies=[],chests=[];
  const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const slots=shuffle(layout.slots),selected=[];
  const enemyCount=7+Math.floor(rng()*3)+Math.min(2,Math.floor(depth/5));
  for(const floor of shuffle(layout.floors.map((_,i)=>i))){const s=slots.find(s=>s.floor===floor);if(s&&!selected.includes(s)&&selected.length<enemyCount)selected.push(s);}
  for(const s of slots)if(selected.length<enemyCount&&!selected.includes(s))selected.push(s);
  const roles=shuffle(['gunner','runner','heavy']);
  for (const [index,s]of selected.entries()) {
    const role = index<3?roles[index]:roles[Math.floor(rng()*roles.length)];
    const hp = (role === 'heavy' ? 190 : role === 'runner' ? 38 : 42) + depth * (role === 'heavy' ? 18 : 9);
    enemies.push({ x:s.x, y:s.y-ACTOR_HEIGHT, w: role === 'heavy' ? 28 : 22, h: ACTOR_HEIGHT,platformId:s.platformId,
      hp, maxHp: hp, damage: (role === 'heavy' ? 17 : 11) + depth * 2, speed: (role === 'runner' ? 210 : role === 'gunner' ? 115 : 82) + Math.min(depth, 20) * 2,
      role, vx: 0, vy: 0, grounded: true, home:s.x, facing:rng()<.5?-1:1, cooldown: .5 + rng(),
      flash: 0, dead: false, state: 'patrol', timer: 0, dodge: 0, dodgeCooldown: 1 + rng(), jumpCooldown: 0, drop: 0, aimX: 0, aimY: 0 });
  }
  const count=rng()<.22?3:2;
  for(const s of shuffle(slots)){
    if(chests.length>=count)break;
    if(chests.some(c=>Math.abs(c.x-s.x)<160&&c.y+25===s.y))continue;
    chests.push({x:s.x,y:s.y-25,open:false,platformId:s.platformId});
  }
  delete layout.slots;
  const world={...layout,depth,seed,enemies,chests,kills:0,earned:0};
  world.decor.push(...marketMerchandise(world,GROUND));
  if(world.towerArchitecture)world.towerClutter=createTowerClutter(world);
  world.details=world.towerArchitecture?[]:createDressing(world,seed,GROUND);return world;
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
