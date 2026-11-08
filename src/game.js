import { GROUND, BAG_LIMIT, SLOTS, BALANCE, stats, addXp, makeItem, itemValue, buyPrice, generateLevel, loadProfile, recommendedDepth, trainingCost, enemyReward } from './world.js';
import { center, physics, segmentHit, projectile, projectileStep, projectileDamage, incomingDamage, updateEnemies,findLadder } from './combat.js';
import { drawWorld, drawMinimap } from './render.js';
import { BRANCHES, SKILLS, availablePoints, spentPoints, skillBudget, skillStatus, learnSkill } from './skills.js';
import { advanceAnimation, animationInfo } from './animation.js';
import { preloadSprites, previewMarkup, paintPreviews } from './raster.js';
import { aimAngle, aimedMuzzle, aimDirection } from './aim.js';
import { preloadEnvironment } from './environment.js';
import { ACTOR_HEIGHT, WEAPONS, weaponSlots, slotForKey, rifleSpread, coolRifle, fireInterval } from './weapons.js';

const $ = id => document.getElementById(id);
const canvas = $('game'), ctx = canvas.getContext('2d');
const minimap = $('minimap'), minimapCtx = minimap.getContext('2d'), navigation = $('navigation');
// Preserve the original storage key when migrating older saves.
const SAVE_KEY = 'emberfall-save-v1';
let stored = null;
try { stored = localStorage.getItem(SAVE_KEY); } catch { /* Session-only play is supported. */ }
const profile = loadProfile(stored), keys = new Set();
const player = { x: 540, y: GROUND - ACTOR_HEIGHT, w: 20, h: ACTOR_HEIGHT, vx: 0, vy: 0, facing: 1, grounded: true,
  hp: stats(profile).maxHp, stamina: stats(profile).maxStamina, invuln: 0, attack: 0, cooldown: 0, drop: 0,
  coyote: 0, jumpBuffer: 0, dodge: 0, dodgeCooldown: 0, guardBreak: 0, blocking: false, regenDelay: 0,
  shotCooldown: 0, fireVisual: 0, reload: 0, ammo: BALANCE.magazine, healCooldown: 0, attackHit: false, activeWeapon: profile.activeWeapon,
  magazines: Object.fromEntries(weaponSlots.filter(slot => WEAPONS[slot].magazine).map(slot => [slot, WEAPONS[slot].magazine])) };
let mode = 'hub', world, camera = 0,cameraY=0, time = 0, modal = null, last = 0, accumulator = 0, hudTimer = 0, previewTime = 0;
let particles = [], floats = [], bullets = [], shake = 0, toastTimer, stock = [], target = null, bagFilter = 'all';
const mouse = { active: false, x: 0, y: 0 };
player.aimAngle = 0;
const rarityNames = ['Стандарт', 'Редкий', 'Легендарный'], rarityClasses = ['', 'rare', 'epic'];
const icons = { weapon: '⚔', gun: '⌐', rifle: '⌁', shotgun: '═', head: '▱', torso: '◈', legs: 'Ⅱ', feet: '⌁' };
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const button = (label, action, secondary = false, disabled = false) => `<button class="button${secondary ? ' secondary' : ''}" data-action="${action}" ${disabled ? 'disabled' : ''}>${label}</button>`;
const terminal = () => ['death', 'complete'].includes(modal);
const characterTabs = active => `<nav class="character-tabs" aria-label="Меню персонажа">${button('01 / СНАРЯЖЕНИЕ', 'inventory', active !== 'inventory')}${button(`02 / СПОСОБНОСТИ [${availablePoints(profile)}]`, 'skills', active !== 'skills')}</nav>`;
const damageStats={weapon:'damage',gun:'gunDamage',rifle:'rifleDamage',shotgun:'shotgunDamage'};
const itemDamage = item => stats({...profile,equipment:{...profile.equipment,[item.type]:item}})[damageStats[item.type]];
const itemStat = item => !weaponSlots.includes(item.type)?`${item.power} брони`:
  `${itemDamage(item)}${item.type==='shotgun'?' × 5 дробин':item.type==='weapon'?' за удар':' за выстрел'}`;
function itemComparison(item){
  const worn=profile.equipment[item.type],weapon=weaponSlots.includes(item.type);
  const before=worn?(weapon?itemDamage(worn):worn.power):0,after=weapon?itemDamage(item):item.power,delta=after-before;
  const tone=delta>0?'positive':delta<0?'negative':'unchanged';
  const unit=!weapon?'брони':item.type==='shotgun'?'за дробину × 5':'урона';
  return `<b class="item-delta ${tone}" data-compare-slot="${item.type}" data-delta="${delta}">${delta?`(${delta>0?'+':''}${delta} ${unit})`:'(без изменений)'}</b>`;
}

function save() {
  profile.threat = recommendedDepth(profile);
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(profile)); }
  catch { $('save-state').textContent = '● Сохранение недоступно'; }
}
function toast(message) {
  $('toast').textContent = message; $('toast').classList.remove('hidden');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.add('hidden'), 3800);
}
function updateHUD() {
  const s = stats(profile);
  $('hp-text').textContent = `${Math.ceil(player.hp)} / ${s.maxHp}`;
  $('hp-bar').style.width = `${Math.max(0, player.hp / s.maxHp * 100)}%`;
  $('stamina-text').textContent = `${Math.floor(player.stamina)} / ${s.maxStamina}`;
  $('stamina-bar').style.width = `${player.stamina / s.maxStamina * 100}%`;
  const selected = WEAPONS[player.activeWeapon];
  $('ammo-label').textContent = selected.kind === 'melee' ? 'КАТАНА / ЛКМ' : player.reload > 0 ? `ПЕРЕЗАРЯДКА ${player.reload.toFixed(1)}с` : `${player.ammo} / ${selected.magazine} · R`;
  $('weapon-label').textContent = `${selected.name} · ${s[damageStats[player.activeWeapon]]}${player.activeWeapon==='shotgun'?' × 5':''} урона`;
  for (const slot of weaponSlots) $('hot-ammo-' + slot).textContent = WEAPONS[slot].kind === 'melee' ? 'БЛИЖНИЙ БОЙ' : `${slot === player.activeWeapon ? player.ammo : player.magazines[slot]} / ${WEAPONS[slot].magazine}`;
  $('combat-state').textContent = player.climbing!=null?'ЛЕСТНИЦА · W/S · ПРОБЕЛ — СПРЫГНУТЬ':player.guardBreak > 0 ? 'БЛОК ПРОБИТ' : player.dodge > 0 ? 'УКЛОНЕНИЕ' : player.blocking ? 'БЛОК' : 'БОЕВОЙ ИНТЕРФЕЙС';
  if(mode!=='hub'&&world.kind==='megablock'){
    const floor=world.floors.reduce((a,y,i)=>Math.abs(y-player.y-player.h)<Math.abs(world.floors[a]-player.y-player.h)?i:a,0);
    $('world-info').textContent=`Этаж ${floor+1} / ${world.floors.length} · ${world.flavour}`;
  }
}
function renderHotbar() {
  $('weapon-bar').innerHTML = weaponSlots.map(slot => `<button class="weapon-slot ${player.activeWeapon === slot ? 'selected' : ''}" data-weapon="${slot}" aria-label="${WEAPONS[slot].name}" aria-pressed="${player.activeWeapon === slot}"><kbd>${WEAPONS[slot].key}</kbd><span class="weapon-symbol weapon-art ${slot}" aria-hidden="true"></span><strong>${WEAPONS[slot].short}</strong><small id="hot-ammo-${slot}"></small></button>`).join('');
}
function selectWeapon(slot) {
  if (!Object.hasOwn(WEAPONS, slot) || terminal()) return;
  if (WEAPONS[player.activeWeapon].kind === 'gun') player.magazines[player.activeWeapon] = player.ammo;
  player.activeWeapon = slot; profile.activeWeapon = slot;
  player.ammo = player.magazines[slot] ?? 0; player.reload = 0; player.reloadDuration = 0; player.attack = 0; player.attackHit = false; player.fireVisual = 0;
  save(); renderHotbar(); updateHUD();
}
function useWeapon() {
  if (!profile.equipment[player.activeWeapon]) return false;
  return WEAPONS[player.activeWeapon].kind === 'melee' ? attack() : shoot();
}
function updateUI() {
  const s = stats(profile), hub = mode === 'hub';
  navigation.hidden = hub || !world.kind;
  if (!navigation.hidden) drawMinimap(minimapCtx, minimap, world, player);
  renderHotbar(); updateHUD();
  $('level-label').textContent = `· Уровень ${profile.level}`;
  $('xp-text').textContent = `${profile.xp} / ${s.nextXp}`; $('xp-bar').style.width = `${profile.xp / s.nextXp * 100}%`;
  $('damage-stat').textContent = `${s.damage} / ${s.gunDamage}`; $('armor-stat').textContent = s.armor; $('gold-stat').textContent = profile.gold;
  $('bag-count').textContent = `${profile.bag.length} / ${BAG_LIMIT}`;
  $('skills-button').textContent = `Способности · ${availablePoints(profile)} очк. ↗`;
  document.querySelector('.portrait').innerHTML = '<canvas class="raster-avatar closeup" width="180" height="220" aria-label="Портрет наёмника"></canvas>';
  $('equipment').innerHTML = ['weapon', 'gun', 'torso'].map(slot => {
    const item = profile.equipment[slot];
    return `<div class="equipment-row"><div class="item-icon ${rarityClasses[item?.rarity || 0]}">${icons[slot]}</div><div><strong>${item ? escape(item.name) : SLOTS[slot] + ' · пусто'}</strong><small>${item ? itemStat(item) : 'Не экипировано'}</small></div></div>`;
  }).join('');
  $('scene-title').innerHTML = hub ? 'Убежище H10<span> / Уотсон</span>' : `${world.name}<span> / Угроза ${world.depth}</span>`;
  $('scene-subtitle').textContent = hub ? 'Найт-Сити не прощает ошибок. Подготовься к следующему контракту.' : 'Зачисти сектор, забери эдди и доберись до терминала эвакуации.';
  $('expedition-label').textContent = hub ? `Следующий контракт · Угроза ${recommendedDepth(profile)}` : `Угроза ${world.depth} · ${world.kills} / ${world.enemies.length}`;
  $('location-label').textContent = hub ? 'НЕЙТРАЛЬНАЯ ТЕРРИТОРИЯ' : 'ЗОНА КОНФЛИКТА';
  $('world-info').textContent = hub ? 'Найт-Сити · 02:17 · Сухая ночь' : `${world.flavour} · Угроза ${world.depth}`;
  $('scene-icon').textContent = hub ? '⌂' : '⚠'; $('badge-title').textContent = hub ? 'Убежище H10' : world.name;
  $('badge-subtitle').textContent = hub ? 'Оружейник · Рипер · Контракты' : `Цели: ${world.enemies.length - world.kills}`;
  $('objective').textContent = hub ? `Терминал справа · Следующая угроза: ${recommendedDepth(profile)}` : world.kills === world.enemies.length ? 'Сектор чист. Иди к терминалу эвакуации' : `Нейтрализуй противников: ${world.kills} / ${world.enemies.length}`;
  $('quest-title').textContent = hub ? 'Город сожрёт слабых' : 'Зачистка сектора';
  $('quest-description').textContent = hub ? 'Мира торгует оружием и одеждой. Орин установит усиления. Контракт учитывает твою силу и пройденную угрозу.' : 'Стрелки держат дистанцию, клинки заходят прыжками, штурмовики прикрываются бронёй. Следи за красным предупреждением перед атакой.';
  $('quest-progress').textContent = `Медгели: ${profile.potions} · ${hub ? 'Рекорд: ' + profile.best : 'Эдди за контракт: ' + world.earned}`;
  $('hub-button').disabled = hub;
}
function resetCombat() {
  Object.assign(player, { vx: 0, vy: 0, grounded: true, invuln: 0, attack: 0, cooldown: 0, jumpBuffer: 0, drop: 0, coyote: 0,
    dodge: 0, dodgeCooldown: 0, blocking: false, guardBreak: 0, regenDelay: 0, shotCooldown: 0, fireVisual: 0, reload: 0,
    ammo: BALANCE.magazine, stamina: stats(profile).maxStamina, healCooldown: 0, reloadDuration: 0, aimAngle: 0,climbing:null,climbIntent:0,ladderCooldown:0,rifleHeat:0,rifleRest:0 });
  particles = []; floats = []; bullets = []; target = null; mouse.active = false;
  player.animation = { name: 'idle', time: 0 };
  player.magazines = Object.fromEntries(weaponSlots.filter(slot => WEAPONS[slot].magazine).map(slot => [slot, WEAPONS[slot].magazine]));
  player.ammo = player.magazines[player.activeWeapon] ?? 0;
}
function hub() {
  mode = 'hub';
  world = { width: 1400, platforms: [{ x: 0, y: GROUND, w: 1400, h: 160, ground: true }], enemies: [], chests: [], portal: { x: 1150, y: GROUND } };
  resetCombat(); Object.assign(player, { x: 565, y: GROUND - player.h, hp: stats(profile).maxHp });
  stock = Object.keys(SLOTS).map(slot => makeItem(recommendedDepth(profile), Math.random, slot));
  camera = 0;cameraY=0; closeModal(); save(); updateUI();
}
function expedition(depth = recommendedDepth(profile)) {
  // Explicit next-stage depth can never fall below the character's recorded strength.
  depth = Math.max(depth, recommendedDepth(profile));
  mode = 'expedition'; world = generateLevel(depth); resetCombat();
  Object.assign(player, { x:world.spawn.x, y:world.spawn.y-player.h, invuln: 1.2 });
  camera = Math.max(0,Math.min(world.width-canvas.width,player.x-canvas.width*.38));cameraY=0;closeModal();save();updateUI();
  toast(`${world.name} · Угроза ${depth} · Целей: ${world.enemies.length}. W/S — лестницы · Пробел — прыжок.`);
}
function showModal(title, description, content = '', actions = '', wide = false) {
  keys.clear(); player.vx = 0; player.blocking = false;
  $('interaction').classList.add('hidden');
  $('overlay').classList.toggle('character-overlay', ['inventory', 'skills', 'merchant'].includes(modal));
  $('overlay').classList.toggle('skills-overlay', modal === 'skills');
  $('overlay').classList.toggle('merchant-overlay', modal === 'merchant');
  $('overlay').innerHTML = `<section class="modal${wide ? ' wide' : ''}" role="dialog" aria-modal="true" aria-label="${escape(title)}">${terminal() ? '' : '<button class="modal-close" data-action="close" aria-label="Закрыть окно">×</button>'}<div class="eyebrow">NEON / ${mode === 'hub' ? 'УБЕЖИЩЕ H10' : 'КОНТРАКТ'}</div><h2>${title}</h2>${description ? `<p>${description}</p>` : ''}${content}<div class="modal-buttons">${actions}</div></section>`;
  $('overlay').classList.remove('hidden'); $('overlay').querySelector('button:not(:disabled)')?.focus();
}
function closeModal() { modal = null; $('overlay').classList.add('hidden'); $('overlay').classList.remove('character-overlay', 'skills-overlay', 'merchant-overlay'); keys.clear(); canvas.focus({ preventScroll: true }); }
function characterPanels() {
  const s = stats(profile);
  const equipped = Object.entries(SLOTS).map(([slot, name]) => {
    const item = profile.equipment[slot];
    return `<div class="slot-row" data-equipment-slot="${slot}"><span class="item-icon ${rarityClasses[item?.rarity || 0]}">${icons[slot]}</span><div class="item-copy"><small>${name.toUpperCase()}</small><strong>${item ? escape(item.name) : 'Пустой слот'}</strong><small>${item ? `${rarityNames[item.rarity]} · ${itemStat(item)}` : 'Можно надеть из рюкзака'}</small></div>${item ? button('Снять', `unequip:${slot}`, true, profile.bag.length >= BAG_LIMIT) : ''}</div>`;
  }).join('');
  const rows = profile.bag.map((item, i) => {
    const weapon = weaponSlots.includes(item.type);
    if (bagFilter === 'weapons' && !weapon || bagFilter === 'clothes' && weapon) return '';
    return `<div class="shop-row" data-item-slot="${item.type}"><span class="item-icon ${rarityClasses[item.rarity]}">${icons[item.type]}</span><div class="item-copy"><strong>${escape(item.name)}</strong><small>${SLOTS[item.type]} · ${itemStat(item)} ${itemComparison(item)} · ${rarityNames[item.rarity]}</small></div><div class="item-actions">${button('Надеть', `equip:${i}`)}${mode === 'hub' ? button(`Продать · ${itemValue(item)} €$`, `sell:${i}`, true) : ''}</div></div>`;
  }).join('');
  const schematic = previewMarkup(profile.equipment);
  return `<div class="character-stats"><span>HP <b>${Math.ceil(player.hp)}/${s.maxHp}</b></span><span>КАТАНА <b>${s.damage}</b></span><span>ОГОНЬ <b>${s.gunDamage}/${s.rifleDamage}/${s.shotgunDamage}×5</b></span><span>БРОНЯ <b>${s.armor}</b></span><span>ВЫНОСЛ. <b>${s.maxStamina}</b></span><span>ЭДДИ <b>${profile.gold}</b></span></div><div class="character-layout"><section class="loadout"><div class="section-label">ЭКИПИРОВКА / 8 СЛОТОВ</div><div class="loadout-body"><div class="body-schematic">${schematic}<small>СОЛО / H10<br>БИОМЕТРИЯ В НОРМЕ</small></div><div class="slots">${equipped}</div></div><p>Усиления: сила ${profile.strength} / выносливость ${profile.vitality}. Угроза контракта: ${recommendedDepth(profile)}.</p></section><section class="bag-panel"><div class="section-label">РЮКЗАК <span>${profile.bag.length} / ${BAG_LIMIT}</span></div><div class="bag-filters">${['all', 'weapons', 'clothes'].map((f, i) => button(['Всё', 'Оружие', 'Одежда'][i], `filter:${f}`, bagFilter !== f)).join('')}</div><div class="inventory-list">${rows || '<p>Нет предметов в этой категории.</p>'}</div><p>Медгель: ${profile.potions} · +${s.healing} HP · Q.${mode==='hub'?' Предметы из рюкзака можно продать.':''}</p></section></div>`;
}
function inventory() {
  modal='inventory';const s=stats(profile);
  showModal('Персонаж / Наёмник', `Уровень ${profile.level} · Опыт ${profile.xp}/${s.nextXp}. Сравнение предметов показывает разницу с надетой вещью.`, characterTabs('inventory')+characterPanels(), button('Закрыть · B / Esc', 'close', true), true);
}
function skillTree() {
  const previousScroll = modal === 'skills' ? $('overlay').querySelector('.modal')?.scrollTop || 0 : 0;
  modal = 'skills';
  const branches = Object.entries(BRANCHES).map(([branch, info]) => {
    const nodes = Object.entries(SKILLS).filter(([, skill]) => skill.branch === branch);
    return `<section class="skill-branch"><header><span>${info.icon}</span><h3>${info.name}</h3><small>${info.subtitle}</small></header><div class="branch-nodes">${nodes.map(([id, skill], index) => {
      const rank = profile.skills[id] || 0, status = skillStatus(profile, id);
      return `<article class="skill-node tier-${index} ${rank ? 'learned' : ''} ${status.allowed ? 'available' : 'locked'}"><div class="node-emblem">${rank === skill.max ? '✓' : index === 0 ? info.icon : index === 3 ? '✦' : '◇'}</div><span class="node-rank">${rank}/${skill.max}</span><h4>${skill.name}</h4><p>${skill.description}</p><small>УРОВЕНЬ ${skill.level}${skill.requires ? ' · ' + Object.entries(skill.requires).map(([id, n]) => SKILLS[id].name + ' ' + n).join(', ') : ''}</small>${button(status.allowed ? 'ИЗУЧИТЬ · 1' : status.reason, `learn:${id}`, !status.allowed, !status.allowed)}</article>`;
    }).join('')}</div></section>`;
  }).join('');
  showModal('Способности', 'Выбирай специализацию. Каждый ранг стоит 1 очко. Два очка за уровень, включая первый; узлы открываются по уровню и изученным навыкам.', `${characterTabs('skills')}<div class="skill-summary"><div><strong>${availablePoints(profile)}</strong><span>ОЧКОВ ДОСТУПНО</span></div><span>УРОВЕНЬ ${profile.level} / ВЛОЖЕНО ${spentPoints(profile)} ИЗ ${skillBudget(profile)}</span><p>Ранги сохраняются. Начни с верхнего узла любой ветки.</p></div><div class="skill-forest">${branches}</div>`, button('К персонажу', 'inventory', true) + button('Закрыть · P / Esc', 'close', true), true);
  $('overlay').querySelector('.modal').scrollTop = previousScroll;
}
function merchant() {
  const selectors=['.modal','.merchant-stock .inventory-list','.bag-panel .inventory-list'];
  const scroll=selectors.map(selector=>modal==='merchant'?$('overlay').querySelector(selector)?.scrollTop||0:0);
  modal = 'merchant';
  const rows = stock.map((item, i) => `<div class="shop-row" data-item-slot="${item.type}"><span class="item-icon ${rarityClasses[item.rarity]}">${icons[item.type]}</span><div class="item-copy"><strong>${escape(item.name)}</strong><small>${SLOTS[item.type]} · ${itemStat(item)} ${itemComparison(item)} · ${rarityNames[item.rarity]}</small></div>${button(`Купить · ${buyPrice(item)} €$`, `buy:${i}`, false, profile.gold < buyPrice(item) || profile.bag.length >= BAG_LIMIT)}</div>`).join('');
  showModal('Мира / Оружейник', 'Сравни товар с надетой вещью того же типа. Купленное попадёт в рюкзак — здесь же можно надеть его или продать лишнее.', `<div class="merchant-layout"><section class="merchant-stock"><div class="section-label">ТОВАРЫ МИРЫ <span>${stock.length} ПРЕДМЕТОВ</span></div>${profile.bag.length>=BAG_LIMIT?'<p class="negative">Рюкзак заполнен. Продай предмет или освободи место.</p>':''}<div class="inventory-list"><div class="shop-row"><span class="item-icon">✚</span><div class="item-copy"><strong>Медгель</strong><small>+${stats(profile).healing} HP · Есть: ${profile.potions}</small></div>${button(`Купить · ${BALANCE.potionCost} €$`, 'potion', false, profile.gold < BALANCE.potionCost)}</div>${rows}</div></section><section class="merchant-character" aria-label="Персонаж и рюкзак">${characterPanels()}</section></div>`, button('Закрыть · Esc', 'close', true), true);
  selectors.forEach((selector,i)=>{const el=$('overlay').querySelector(selector);if(el)el.scrollTop=scroll[i];});
}
function refreshGear(){if(modal==='merchant')merchant();else inventory();}
function trainer() {
  modal = 'trainer';
  showModal('Орин / Рипер', `Усиления остаются навсегда. Баланс: ${profile.gold} €$. Навыки изучаются отдельно за очки уровня.`, ['strength', 'vitality'].map(type => `<div class="shop-row"><div class="item-copy"><strong>${type === 'strength' ? 'Мышечные волокна' : 'Биомонитор'} · ${profile[type]}</strong><small>${type === 'strength' ? '+2 катана / +1 огнестрел' : '+10 HP / +3 выносливость'}</small></div>${button(`${trainingCost(profile, type)} €$`, type, false, profile.gold < trainingCost(profile, type))}</div>`).join(''), button(`Способности · ${availablePoints(profile)} очк.`, 'skills') + button('Закрыть', 'close', true));
}
function pause() { modal = 'pause'; showModal('Соединение приостановлено', 'Персонаж сохраняется автоматически. Незавершённый контракт после перезагрузки не восстанавливается.', '', button('Продолжить', 'close')); }
function help() {
  modal = 'help';
  showModal('Боевой протокол', 'Выбери оружие на 1–4. ЛКМ всегда атакует выбранным. Можно бежать назад, целиться и атаковать на ходу или в прыжке. Катана и блок расходуют выносливость.', `<div class="help-grid"><span><kbd>A</kbd><kbd>D</kbd></span><span>Движение · Space — прыжок · W/S у лестницы — подъём/спуск</span><kbd>1 / 2 / 3 / 4</kbd><span>Катана / пистолет / автомат / дробовик</span><kbd>ЛКМ / J</kbd><span>Атака выбранным оружием · удерживать</span><kbd>ПКМ / K</kbd><span>Блок спереди · наведи мышь на угрозу</span><kbd>Shift</kbd><span>Перекат; в воздухе — с навыком воздушного рывка</span><kbd>R</kbd><span>Перезарядка · отдельные магазины</span><kbd>E / Q</kbd><span>Действие / медгель (+${stats(profile).healing} HP)</span><kbd>Tab / B / I / P</kbd><span>Персонаж / рюкзак / способности</span><kbd>⛶ / F11</kbd><span>Полноэкранный режим браузера</span><kbd>Esc</kbd><span>Пауза / закрыть окно</span></div>`, button('Принято', 'close'));
}
function complete() {
  if (modal === 'complete') return;
  profile.best = Math.max(profile.best, world.depth);
  const reward = 12 + world.depth * 3; profile.gold += reward; world.earned += reward;
  const levels = addXp(profile, 12);
  if (levels) { player.hp = Math.min(stats(profile).maxHp, player.hp + 20); toast(`Уровень ${profile.level}. +${levels * 2} очка способностей · P.`); }
  save(); updateUI(); modal = 'complete';
  showModal('Контракт закрыт', `Угроза ${world.depth}. Целей: ${world.kills}. Доход: ${world.earned} €$, включая бонус ${reward}. Следующий сектор сложнее; здоровье не восстановится при переходе.`, '', button(`Следующий сектор · ${Math.max(world.depth + 1, recommendedDepth(profile))}`, 'next') + button('В убежище', 'hub', true));
}
function die() {
  if (modal === 'death') return;
  const lost = Math.floor(profile.gold * .2); profile.gold -= lost; player.hp = 0; save(); updateUI(); modal = 'death';
  showModal('Биосигнал потерян', `Эвакуация стоила ${lost} €$ (20%). Опыт и снаряжение сохранены. Рипер восстановит тебя в убежище.`, '', button('Перезапустить биомонитор', 'hub'));
}
function giveItem(item) {
  if (profile.bag.length < BAG_LIMIT) { profile.bag.push(item); toast(`Найдено: ${item.name} · ${itemStat(item)}`); }
  else { const value = itemValue(item); profile.gold += value; if (mode !== 'hub') world.earned += value; toast(`Рюкзак полон. Автопродажа: ${value} €$.`); }
}
function drink() {
  if (player.healCooldown > 0) return toast('Медгель ещё восстанавливается.');
  if (player.hp >= stats(profile).maxHp) return toast('Биометрия в норме.');
  if (!profile.potions) return toast('Медгель закончился. Обратись к Мире.');
  const healed = Math.min(stats(profile).healing, stats(profile).maxHp - player.hp);
  profile.potions--; player.hp += healed; player.healCooldown = stats(profile).healCooldown;
  burst(player.x + 13, player.y + 15, '#48eee4', 16); float(`+${healed} HP`, player.x, player.y - 10, '#48eee4'); save(); updateUI();
}
function interact() {
  if (!target) return;
  if (target.kind === 'merchant') merchant();
  if (target.kind === 'trainer') trainer();
  if (target.kind === 'medbay') { player.hp = stats(profile).maxHp; player.stamina = stats(profile).maxStamina; updateUI(); toast('Медстанция: биометрия восстановлена.'); }
  if (target.kind === 'chest' && !target.object.open) {
    target.object.open = true; const credits = 6 + Math.floor(world.depth * 1.5); profile.gold += credits; world.earned += credits;
    if (Math.random() < BALANCE.cacheDrop) giveItem(makeItem(world.depth)); else toast(`Тайник: ${credits} €$. Снаряжение не найдено.`);
    burst(target.object.x + 15, target.object.y, '#f9ee49', 15); save(); updateUI();
  }
  if (target.kind === 'portal') {
    if (mode === 'hub') {
      modal = 'depart'; const depth = recommendedDepth(profile);
      showModal(`Контракт / Угроза ${depth}`, 'Уровень подобран по твоим характеристикам, экипировке и пройденной угрозе. Зачисти сектор и доберись до терминала. У стрелков есть лазерный прицел, у бойцов — замах перед ударом.', '', button('Принять контракт', 'start') + button('Подготовиться', 'close', true));
    } else if (world.kills < world.enemies.length) toast(`Эвакуация заблокирована. Осталось целей: ${world.enemies.length - world.kills}.`);
    else complete();
  }
}
function highlightEquipment(target){
  const card=target?.closest?.('[data-item-slot]')||document.activeElement?.closest?.('[data-item-slot]');
  const slot=card?.dataset.itemSlot;
  for(const el of $('overlay').querySelectorAll('[data-equipment-slot], .gear-callouts [data-slot]')){
    el.classList.toggle('equipment-highlight',!!slot&&(el.dataset.equipmentSlot||el.dataset.slot)===slot);
  }
  for(const el of $('overlay').querySelectorAll('.gear-callouts'))el.classList.toggle('comparison-active',!!slot);
}
for(const name of ['pointerover','focusin'])$('overlay').addEventListener(name,event=>highlightEquipment(event.target));
for(const name of ['pointerout','focusout'])$('overlay').addEventListener(name,event=>highlightEquipment(event.relatedTarget));
$('overlay').addEventListener('click', event => {
  const action = event.target.closest('[data-action]')?.dataset.action; if (!action) return;
  const [type, raw] = action.split(':'), i = Number(raw);
  if (type === 'close' && !terminal()) closeModal();
  if (type === 'hub') hub();
  if (type === 'start' && modal === 'depart') expedition();
  if (type === 'next' && modal === 'complete') expedition(world.depth + 1);
  if (type === 'inventory' && !terminal()) inventory();
  if (type === 'skills' && !terminal()) skillTree();
  if (type === 'learn' && modal === 'skills' && learnSkill(profile, raw)) { profile.threat = recommendedDepth(profile); skillTree(); }
  if (type === 'filter' && ['inventory','merchant'].includes(modal) && ['all', 'weapons', 'clothes'].includes(raw)) { bagFilter = raw; refreshGear(); }
  if (type === 'potion' && modal === 'merchant' && profile.gold >= BALANCE.potionCost) { profile.gold -= BALANCE.potionCost; profile.potions++; merchant(); }
  if (type === 'buy' && modal === 'merchant') {
    const item = stock[i];
    if (item && profile.gold >= buyPrice(item) && profile.bag.length < BAG_LIMIT) { profile.gold -= buyPrice(item); profile.bag.push(item); stock.splice(i, 1); merchant(); }
  }
  if (type === 'equip' && ['inventory','merchant'].includes(modal)) {
    const item = profile.bag[i];
    if (item) { const old = profile.equipment[item.type]; profile.equipment[item.type] = item; if (old) profile.bag[i] = old; else profile.bag.splice(i, 1); profile.threat = recommendedDepth(profile); refreshGear(); }
  }
  if (type === 'unequip' && ['inventory','merchant'].includes(modal) && Object.hasOwn(SLOTS, raw) && profile.equipment[raw] && profile.bag.length < BAG_LIMIT) { profile.bag.push(profile.equipment[raw]); profile.equipment[raw] = null; refreshGear(); }
  if (type === 'sell' && ['inventory','merchant'].includes(modal) && mode === 'hub' && profile.bag[i]) { profile.gold += itemValue(profile.bag[i]); profile.bag.splice(i, 1); refreshGear(); }
  if (['strength', 'vitality'].includes(type) && modal === 'trainer' && profile.gold >= trainingCost(profile, type)) {
    profile.gold -= trainingCost(profile, type); profile[type]++; player.hp = stats(profile).maxHp; player.stamina = stats(profile).maxStamina; profile.threat = recommendedDepth(profile); trainer();
  }
  save(); updateUI();
});
$('help-button').onclick = () => { if (!terminal()) help(); };
$('pause-button').onclick = () => { if (!terminal()) { if (modal) closeModal(); else pause(); } };
$('inventory-button').onclick = () => { if (!terminal()) inventory(); };
$('skills-button').onclick = () => { if (!terminal()) skillTree(); };
$('weapon-bar').addEventListener('click', event => { const slot = event.target.closest('[data-weapon]')?.dataset.weapon; if (slot && !modal) selectWeapon(slot); });
$('fullscreen-button').onclick = async () => {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
  catch { toast('Игра уже занимает окно. Полный экран также доступен через F11.'); }
};
$('hub-button').onclick = () => { if (mode !== 'hub' && !modal) { modal = 'return'; showModal('Прервать контракт?', 'Добыча останется у тебя. Бонус за зачистку не будет начислен.', '', button('Эвакуироваться', 'hub') + button('Остаться', 'close', true)); } };

function press(key) {
  if(key==='tab'){if(!modal)inventory();return;}
  if (key === 'escape') { if (terminal()) return; if (modal) closeModal(); else pause(); return; }
  if ((key === 'b' || key === 'i') && modal === 'inventory') { closeModal(); return; }
  if (key === 'p') { if (terminal()) return; if (modal === 'skills') closeModal(); else skillTree(); return; }
  if (modal) return;
  const slot = slotForKey(key); if (slot) { selectWeapon(slot); return; }
  keys.add(key);
  if (key === 'j') useWeapon();
  if (key === 'w'&&!findLadder(player,world,-1) || key === ' ') player.jumpBuffer = .14;
  if (key === 'e') interact(); if (key === 'q') drink(); if (key === 'b' || key === 'i') inventory();
  if (key === 'shift') roll(); if (key === 'r') reload();
}
const physicalKeys = { Tab:'tab', Digit1:'1', Digit2:'2', Digit3:'3', Digit4:'4', Numpad1:'1', Numpad2:'2', Numpad3:'3', Numpad4:'4', KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd', KeyJ: 'j', KeyK: 'k', KeyR: 'r', KeyE: 'e', KeyQ: 'q', KeyB: 'b', KeyI: 'i', KeyP: 'p', ShiftLeft: 'shift', ShiftRight: 'shift', Space: ' ', Escape: 'escape', ArrowLeft: 'a', ArrowRight: 'd', ArrowUp: 'w', ArrowDown: 's' };
window.addEventListener('keydown', event => {
  const key = physicalKeys[event.code]; if (!key || event.ctrlKey || event.metaKey || event.altKey) return;
  if(key==='tab'&&event.shiftKey)return;
  if (modal && !['escape', 'b', 'i', 'p'].includes(key)) return;
  event.preventDefault(); if (!event.repeat) press(key);
});
window.addEventListener('keyup', event => keys.delete(physicalKeys[event.code]));
function updateAim() {
  player.aimAngle = aimAngle(player, mouse.active ? { x: mouse.x + camera, y: mouse.y+cameraY } : null);
}
function aim(event) { const bounds = canvas.getBoundingClientRect(); mouse.x = (event.clientX - bounds.left) * canvas.width / bounds.width; mouse.y = (event.clientY - bounds.top) * canvas.height / bounds.height; mouse.active = true; if (player.dodge <= 0) player.facing = mouse.x + camera >= center(player).x ? 1 : -1; updateAim(); }
canvas.addEventListener('pointermove', event => { if (event.pointerType !== 'touch' && !modal) aim(event); });
canvas.addEventListener('pointerleave', () => { mouse.active = false; });
canvas.addEventListener('pointerdown', event => {
  if (modal || event.pointerType === 'touch') return;
  event.preventDefault(); aim(event); canvas.focus({ preventScroll: true });
  if (event.button === 0) press('j'); if (event.button === 2) press('k');
});
window.addEventListener('pointerup', event => { if (event.button === 0) keys.delete('j'); if (event.button === 2) keys.delete('k'); });
canvas.addEventListener('contextmenu', event => event.preventDefault());
window.addEventListener('blur', () => { keys.clear(); if (!modal) pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && !modal) pause(); });
document.addEventListener('keydown', event => {
  if (!modal || event.key !== 'Tab') return;
  const buttons = [...$('overlay').querySelectorAll('button:not(:disabled)')], first = buttons[0], end = buttons.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); end?.focus(); }
  else if (!event.shiftKey && document.activeElement === end) { event.preventDefault(); first?.focus(); }
});
document.querySelectorAll('[data-key]').forEach(element => {
  element.addEventListener('pointerdown', event => { event.preventDefault(); element.setPointerCapture(event.pointerId); press(element.dataset.key); });
  const release = () => keys.delete(element.dataset.key);
  element.addEventListener('pointerup', release); element.addEventListener('pointercancel', release);
});

function burst(x, y, color, count = 10) { for (let i = 0; i < count; i++) particles.push({ x, y, vx: (Math.random() - .5) * 170, vy: -Math.random() * 150 - 30, life: .3 + Math.random() * .4, color }); }
function float(text, x, y, color = '#f5ed4b') { floats.push({ text, x, y, color, life: 1 }); }
function hitEnemy(enemy, raw = stats(profile).damage, sourceX = center(player).x, ranged = false) {
  if (enemy.dead || enemy.dodge > 0) return;
  const guarded = enemy.role === 'heavy' && (sourceX - center(enemy).x) * enemy.facing > 0 && enemy.state !== 'recover' && enemy.state !== 'windup';
  const perks = stats(profile).perks;
  const bonus = (enemy.role === 'heavy' ? perks.breach || 0 : 0) + (enemy.state === 'recover' ? perks.exploit || 0 : 0) + (ranged && enemy.hp / enemy.maxHp < .35 ? perks.execution || 0 : 0);
  const damage = Math.max(1, Math.round(raw * (1 + bonus) * (guarded ? .5 : ranged && enemy.role === 'heavy' ? .8 : 1)));
  enemy.hp -= damage; enemy.flash = .12;
  if(!(ranged&&enemy.role==='heavy'))enemy.x = Math.max(20, Math.min(world.width - 60, enemy.x + Math.sign(enemy.x - sourceX) * 5));
  float(guarded ? `${damage} БРОНЯ` : damage, enemy.x, enemy.y - 12); burst(enemy.x + 15, enemy.y + 15, '#fb736b');
  if (enemy.hp <= 0) {
    enemy.dead = true; world.kills++;
    const reward = enemyReward(enemy, world.depth); profile.gold += reward.gold; world.earned += reward.gold;
    const levels = addXp(profile, reward.xp); float(`+${reward.gold} €$ / ${reward.xp} XP`, enemy.x, enemy.y - 35);
    player.hp = Math.min(stats(profile).maxHp, player.hp + (perks.killHeal || 0));
    if (levels) { player.hp = Math.min(stats(profile).maxHp, player.hp + 20); toast(`Уровень ${profile.level}. +${levels * 2} очка способностей! Нажми P для прокачки.`); }
    if (Math.random() < BALANCE.killDrop) giveItem(makeItem(world.depth));
    if (world.kills === world.enemies.length) toast('Сектор чист. Эвакуация доступна справа.');
    save(); updateUI();
  }
}
function damagePlayer(raw, sourceX) {
  player.blockCostMultiplier = stats(profile).blockCostMultiplier;
  const result = incomingDamage(player, raw, sourceX, stats(profile).armor);
  if (!result.damage) return;
  player.hp = Math.max(0, player.hp - result.damage); player.invuln = result.blocked ? .12 : .45; player.regenDelay = .8;
  shake = result.blocked ? .06 : .16; float(result.blocked ? 'БЛОК' : `−${result.damage}`, player.x, player.y - 12, result.blocked ? '#45e5e0' : '#ff655c');
  burst(player.x + 12, player.y + 20, result.blocked ? '#45e5e0' : '#ff655c', 8); updateHUD();
  if (player.hp <= 0) die();
}
function attack() {
  if (player.cooldown > 0 || player.dodge > 0 || player.blocking || player.reload > 0 || player.stamina < stats(profile).meleeCost) return false;
  player.attack = WEAPONS.weapon.duration; player.cooldown = WEAPONS.weapon.interval; player.attackHit = false; player.stamina -= stats(profile).meleeCost; player.regenDelay = .4; return true;
}
function slash() {
  const pc = center(player);
  for (const e of world.enemies) {
    if(e.dead)continue;
    const ec=center(e),dx=ec.x-pc.x;
    const bodyContact=player.x<=e.x+e.w&&player.x+player.w>=e.x&&player.y<e.y+e.h&&player.y+player.h>e.y;
    const inSwing=Math.abs(dx)<WEAPONS.weapon.reach&&dx*player.facing> -12&&Math.abs(ec.y-pc.y)<48;
    if(bodyContact||inSwing)hitEnemy(e);
  }
}
function roll() {
  if(player.climbing!=null)return false;
  if (player.dodgeCooldown > 0 || player.stamina < stats(profile).rollCost || player.guardBreak > 0 || !player.grounded && !stats(profile).perks.airDash) return false;
  const direction = (keys.has('d') ? 1 : 0) - (keys.has('a') ? 1 : 0);
  player.rollDir = direction || player.facing; player.dodge = .32; player.dodgeCooldown = .85;
  player.stamina -= stats(profile).rollCost; player.regenDelay = .6; player.attack = 0; player.blocking = false; return true;
}
function reload() {
  const cfg = WEAPONS[player.activeWeapon];
  if (cfg.kind !== 'gun' || !profile.equipment[player.activeWeapon] || player.reload > 0 || player.ammo === cfg.magazine) return;
  player.reload = Math.max(.7, cfg.reload - (stats(profile).perks.reloadSaving || 0));
  player.reloadDuration = player.reload;
}
function shoot() {
  const cfg = WEAPONS[player.activeWeapon];
  if (cfg.kind !== 'gun' || !profile.equipment[player.activeWeapon] || player.shotCooldown > 0 || player.reload > 0 || player.dodge > 0 || player.blocking || player.attack > 0) return;
  if (!player.ammo) { reload(); return; }
  updateAim();
  const from = aimedMuzzle(player);
  const damage = stats(profile)[player.activeWeapon === 'rifle' ? 'rifleDamage' : player.activeWeapon === 'shotgun' ? 'shotgunDamage' : 'gunDamage'];
  const direction = aimDirection(player,mouse.active?{x:mouse.x+camera,y:mouse.y+cameraY}:null);
  const angle = Math.atan2(direction.y, direction.x);
  for (let pellet = 0; pellet < cfg.pellets; pellet++) {
    const spread = cfg.pellets > 1 ? (pellet / (cfg.pellets - 1) * 2 - 1) * cfg.spread : (Math.random() - .5) * (player.activeWeapon==='rifle'?rifleSpread(player.rifleHeat||0):cfg.spread);
    bullets.push(projectile('player', from, { x: from.x + Math.cos(angle + spread) * 500, y: from.y + Math.sin(angle + spread) * 500 }, damage, cfg.speed,cfg));
  }
  if(player.activeWeapon==='rifle'){player.rifleHeat=Math.min(1,(player.rifleHeat||0)+.22);player.rifleRest=0;}
  player.ammo--; player.magazines[player.activeWeapon] = player.ammo;
  player.shotCooldown = fireInterval(player.activeWeapon,stats(profile).perks.fireSaving||0);
  player.fireVisual = .18;
  burst(from.x, from.y, '#f9ed48', cfg.pellets > 1 ? 7 : 4);
}
function updateBullets(dt) {
  for (const b of bullets) {
    if (b.life <= 0) continue;
    const step=projectileStep(b,dt,b.owner==='player'?{left:camera,right:camera+canvas.width,top:cameraY,bottom:cameraY+canvas.height}:null);
    if(step.distance<=0){b.life=0;continue;}
    const nx=step.x,ny=step.y;
    let first = null, firstT = Infinity;
    for (const platform of world.platforms) { if(platform.stair)continue; const t = segmentHit(b.x, b.y, nx, ny, platform); if (t !== null && t < firstT) { firstT = t; first = { platform }; } }
    const actors = b.owner === 'player' ? world.enemies.filter(e => !e.dead && e.dodge <= 0) : [player];
    for (const actor of actors) { const t = segmentHit(b.x, b.y, nx, ny, actor, 2); if (t !== null && t < firstT) { firstT = t; first = { actor }; } }
    if (first) {
      const damage=projectileDamage(b,(b.traveled||0)+step.distance*firstT);
      if (first.actor) { if (b.owner === 'player') hitEnemy(first.actor, damage, b.x - Math.sign(b.vx) * 10, true); else damagePlayer(damage, b.x - Math.sign(b.vx) * 10); }
      burst(b.x + (nx - b.x) * firstT, b.y + (ny - b.y) * firstT, '#f8b84c', 4); b.life = 0;
    } else { b.x = nx; b.y = ny; b.traveled=(b.traveled||0)+step.distance;b.life = step.expired?0:b.life-dt; }
    if (terminal()) break;
  }
  bullets = bullets.filter(b => b.life > 0);
}
function update(dt) {
  const p = player;
  coolRifle(p,dt);
  for (const field of ['invuln', 'cooldown', 'attack', 'drop', 'dodge', 'dodgeCooldown', 'guardBreak', 'regenDelay', 'shotCooldown', 'fireVisual', 'healCooldown']) p[field] = Math.max(0, p[field] - dt);
  if (p.reload > 0) { p.reload = Math.max(0, p.reload - dt); if (!p.reload) { p.ammo = WEAPONS[p.activeWeapon].magazine; p.magazines[p.activeWeapon] = p.ammo; } }
  p.jumpBuffer -= dt; p.coyote = p.grounded ? .1 : p.coyote - dt;
  p.blocking = keys.has('k') && p.dodge <= 0 && p.attack <= 0 && p.guardBreak <= 0 && p.stamina > 1 && p.reload <= 0;
  p.vx = ((keys.has('d') ? 1 : 0) - (keys.has('a') ? 1 : 0)) * (p.blocking ? 100 : 245);
  if (p.vx) p.facing = Math.sign(p.vx);
  if (mouse.active && p.dodge <= 0) p.facing = mouse.x + camera >= center(p).x ? 1 : -1;
  if (p.vx * p.facing < 0) p.vx *= .8;
  if (p.dodge > 0) { p.vx = p.rollDir * 560; p.facing = p.rollDir; }
  if (p.blocking) { p.stamina = Math.max(0, p.stamina - 10 * stats(profile).blockCostMultiplier * dt); p.regenDelay = .3; }
  else if (!p.regenDelay) p.stamina = Math.min(stats(profile).maxStamina, p.stamina + stats(profile).staminaRegen * dt);
  const climbDirection=(keys.has('s')?1:0)-(keys.has('w')?1:0);
  p.climbIntent=(p.climbing!=null||findLadder(p,world,climbDirection))?climbDirection:0;
  if(p.climbIntent)p.drop=0;
  if (keys.has('s')&&!p.climbIntent&&p.grounded && p.y + p.h < GROUND - 5) { p.drop = .24; p.grounded = false; p.y += 5; p.coyote = 0; }
  if (p.jumpBuffer > 0 && (p.coyote > 0||p.climbing!=null) && p.dodge <= 0) {
    p.vy = -620;p.grounded = false;p.jumpBuffer = 0;p.coyote = 0;p.climbing=null;p.climbIntent=0;p.ladderCooldown=.3;
  }
  updateAim();
  if (keys.has('j')) useWeapon();
  physics(p, world, dt);
  updateEnemies(world, p, bullets, dt, damagePlayer);
  if (terminal()) return;
  if (p.attack > 0 && p.attack < WEAPONS.weapon.duration - animationInfo(p).contactAt && !p.attackHit) { p.attackHit = true; slash(); }
  updateBullets(dt); if (terminal()) return;
  camera += (Math.max(0, Math.min(world.width - canvas.width, p.x - canvas.width * .38)) - camera) * Math.min(1, dt * 7);
  cameraY+=(Math.max(world.top||0,Math.min(0,p.y-canvas.height*.48))-cameraY)*Math.min(1,dt*7);
  updateAim();
  shake = Math.max(0, shake - dt);
  for (const particle of particles) { particle.x += particle.vx * dt; particle.y += particle.vy * dt; particle.vy += 300 * dt; particle.life -= dt; }
  particles = particles.filter(particle => particle.life > 0);
  for (const f of floats) { f.y -= dt * 35; f.life -= dt; } floats = floats.filter(f => f.life > 0);
  hudTimer -= dt; if (hudTimer <= 0) { updateHUD(); hudTimer = .1; }
  advanceAnimation(p, dt);
  for (const enemy of world.enemies) if (!enemy.dead) advanceAnimation(enemy, dt, enemy.role);
  findTarget();
}
function findTarget() {
  const candidates = [{ kind: 'portal', x: world.portal.x, y: world.portal.y - 30, label: mode === 'hub' ? `Контракт · Угроза ${recommendedDepth(profile)}` : world.kills === world.enemies.length ? 'Эвакуация / Следующий сектор' : 'Терминал заблокирован' }];
  if (mode === 'hub') candidates.push({ kind: 'merchant', x: 325, y: GROUND - 30, label: 'Мира · Оружейник' }, { kind: 'trainer', x: 800, y: GROUND - 30, label: 'Орин · Рипер' }, { kind: 'medbay', x: 580, y: GROUND - 15, label: 'Медстанция · Восстановление' });
  for (const c of world.chests) if (!c.open) candidates.push({ kind: 'chest', x: c.x, y: c.y, label: 'Вскрыть тайник', object: c });
  target = candidates.filter(t => Math.abs(t.x - center(player).x) < 77 && Math.abs(t.y - center(player).y) < 65).sort((a, b) => Math.abs(a.x - player.x) - Math.abs(b.x - player.x))[0];
  $('interaction').classList.toggle('hidden', !target); if (target) $('interaction').innerHTML = `<kbd>E</kbd> ${target.label}`;
}
function render() {
  drawWorld(ctx, canvas, { mode, world, player, profile, camera,cameraY, time, particles, floats, bullets, shake, mouse });
  navigation.hidden = mode === 'hub' || !world.kind;
  if (!navigation.hidden) drawMinimap(minimapCtx, minimap, world, player);
}
function resize() { const bounds = canvas.parentElement.getBoundingClientRect(); canvas.width = Math.round(660 * bounds.width / bounds.height); canvas.height = 660; camera = Math.max(0, Math.min(world.width - canvas.width, player.x - canvas.width * .38)); }
function frame(now) {
  const elapsed = Math.min((now - last) / 1000 || 0, .05); last = now;
  if (!modal) { time += elapsed; accumulator += elapsed; while (accumulator >= 1 / 120) { update(1 / 120); accumulator -= 1 / 120; if (modal) { accumulator = 0; break; } } } else accumulator = 0;
  render(); requestAnimationFrame(frame);
  previewTime += ['inventory','merchant'].includes(modal) ? elapsed : 0;
  paintPreviews(profile.equipment, ['inventory','merchant'].includes(modal) ? previewTime : time);
}
Promise.all([preloadSprites(), preloadEnvironment()]).catch(error => console.warn('Art assets unavailable; fallback is active.', error));
hub(); resize(); new ResizeObserver(resize).observe(canvas.parentElement); requestAnimationFrame(frame);
toast('1–4 — выбрать оружие · ЛКМ — атака · ПКМ — блок · Shift — перекат · Tab — персонаж.');
