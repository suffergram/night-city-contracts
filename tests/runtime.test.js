import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import * as worldModule from '../src/world.js';
import * as combat from '../src/combat.js';
import { drawWorld, drawMinimap } from '../src/render.js';
import * as skills from '../src/skills.js';
import { mercenarySvg } from '../src/character.js';
import { advanceAnimation, animationInfo } from '../src/animation.js';
import { preloadSprites, previewMarkup, paintPreviews, muzzleAnchor } from '../src/raster.js';
import { preloadEnvironment } from '../src/environment.js';
import * as weapons from '../src/weapons.js';
import * as aiming from '../src/aim.js';

async function boot(saved) {
  const gradient = { addColorStop() {} };
  const drawing = new Proxy({}, { get: (o, key) => o[key] ?? (key.startsWith('create') ? () => gradient : () => {}), set: (o, key, value) => (o[key] = value, true) });
  const elements = new Map(), events = {};
  const element = id => {
    if (!elements.has(id)) elements.set(id, { textContent: '', innerHTML: '', style: {}, listeners: {}, width: 1200, height: 660,
      classList: { add() {}, remove() {}, toggle() {} }, focus() {},
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 1200, height: 660 }),
      parentElement: { getBoundingClientRect: () => ({ width: 1200, height: 660 }) },
      getContext: () => drawing, querySelector: () => ({ focus() {} }), querySelectorAll: () => [],
      addEventListener(name, cb) { this.listeners[name] = cb; },
    }); return elements.get(id);
  };
  const storage = new Map(saved ? [['emberfall-save-v1', saved]] : []);
  const context = vm.createContext({ ...worldModule, ...combat, ...skills, ...weapons, ...aiming, mercenarySvg, advanceAnimation, animationInfo, preloadEnvironment, preloadSprites, previewMarkup, paintPreviews, muzzleAnchor, drawWorld, drawMinimap, console, Math, JSON, Date, structuredClone,
    document: { getElementById: element, querySelector: element, querySelectorAll: () => [], addEventListener() {} }, window: { addEventListener(name, cb) { events[name] = cb; } },
    localStorage: { getItem: k => storage.get(k), setItem: (k, v) => storage.set(k, v) },
    setTimeout: () => 1, clearTimeout() {}, requestAnimationFrame() {}, ResizeObserver: class { observe() {} },
  });
  const code = (await readFile(new URL('../src/game.js', import.meta.url), 'utf8')).replace(/^import .*?;\r?\n/gm, '');
  vm.runInContext(code, context);
  const run = code => vm.runInContext(code, context), tick = count => run(`for(let i=0;i<${count};i++) { update(1/120); if(terminal()) break; }`);
  const click = action => element('overlay').listeners.click({ target: { closest: () => ({ dataset: { action } }) } });
  return { run, click, tick, elements, storage, events };
}
test('game boots, renders the cyberpunk hub, moves, jumps, trades and persists upgrades', async () => {
  const { run, click, tick, elements, storage } = await boot();
  run('render()'); assert.equal(run('mode'), 'hub'); assert.equal(elements.get('hp-text').textContent, '100 / 100');
  const start = run('player.x'); run("press('d')"); tick(120); run('keys.clear()'); assert.ok(run('player.x') > start + 200);
  run("press('w')"); tick(30); run('keys.clear()'); assert.ok(run('player.y') < worldModule.GROUND - 148);
  tick(120); assert.equal(run('player.y + player.h'), worldModule.GROUND);
  run('merchant()'); click('potion'); assert.equal(run('profile.gold'), 25); assert.equal(run('profile.potions'), 4);
  run('profile.gold=200; trainer()'); click('strength'); assert.equal(run('profile.strength'), 1); assert.equal(run('profile.gold'), 80);
  assert.equal(JSON.parse(storage.get('emberfall-save-v1')).version, 4);
});

test('W/S climb generated ladders, space detaches and the camera follows upper floors',async()=>{
  const {run,tick}=await boot();
  run('expedition(1);world=generateLevel(1,23,"megablock");world.enemies=[];const l=world.ladders[0];player.x=l.x-player.w/2;player.y=l.bottom-player.h;keys.clear();press("w");');
  tick(240);assert.equal(run('player.y+player.h'),run('l.top'));assert.ok(run('cameraY')<0);
  run('keys.clear();press("s");');tick(40);assert.notEqual(run('player.climbing'),null);
  run('keys.clear();press(" ");');tick(1);assert.equal(run('player.climbing'),null);assert.ok(run('player.vy')<0);
  run('render()');
});

test('mouse elevation and physical muzzle use world coordinates after the camera moves vertically',async()=>{
  const {run}=await boot();
  run('expedition(1);world=generateLevel(1,17,"megablock");world.enemies=[];player.y=Math.min(...world.floors)-player.h;player.vx=0;player.facing=1;cameraY=world.top;selectWeapon("gun");const origin=aimOrigin(player);mouse.active=true;mouse.x=origin.x-camera+200;mouse.y=origin.y-cameraY-200;updateAim();const tip=aimedMuzzle(player);shoot();');
  assert.ok(Math.abs(run('player.aimAngle')+Math.PI/4)<1e-9);
  assert.equal(run('bullets.at(-1).y'),run('tip.y'));assert.ok(run('bullets.at(-1).vy')<0);
});
test('portal uses character strength on every reentry instead of restarting at difficulty one', async () => {
  const { run, click } = await boot();
  run('profile.level=8; profile.equipment.weapon.power=24; profile.best=5; save(); hub(); player.x=world.portal.x; findTarget(); interact();');
  const tier = run('recommendedDepth(profile)'); assert.ok(tier > 5); click('start'); assert.equal(run('world.depth'), tier);
  run('hub(); profile.equipment.weapon=null; player.x=world.portal.x; findTarget(); interact();'); click('start');
  assert.ok(run('world.depth') >= tier);
});
test('failing a voluntarily harder sector does not permanently lock its threat', async () => {
  const { run, click } = await boot();
  run('expedition(8); die()'); click('hub');
  assert.equal(run('recommendedDepth(profile)'), 1);
});
test('character screen equips and removes each clothing part and both weapons without losing items', async () => {
  const { run, click, elements } = await boot();
  run('profile.bag=Object.keys(SLOTS).map(slot=>makeItem(5,Math.random,slot)); inventory();');
  for (const type of Object.keys(worldModule.SLOTS)) {
    const total = run('profile.bag.length + Object.values(profile.equipment).filter(Boolean).length');
    const i = run(`profile.bag.findIndex(item=>item.type==='${type}')`); click(`equip:${i}`);
    assert.equal(run(`profile.equipment.${type}.type`), type);
    click(`unequip:${type}`); assert.equal(run(`profile.equipment.${type}`), null);
    assert.equal(run('profile.bag.length + Object.values(profile.equipment).filter(Boolean).length'), total);
  }
  click('filter:clothes'); assert.ok(elements.get('overlay').innerHTML.includes('СРАВНЕНИЕ') || elements.get('overlay').innerHTML.includes('Сравнение'));
  run("press('b')"); assert.equal(run('modal'), null);
});
test('left mouse attacks the selected weapon; block, roll and reload still work', async () => {
  const { run, tick, elements, events } = await boot();
  run('expedition(1); const foe=world.enemies[1]; world.enemies=[foe]; foe.x=300; foe.y=GROUND-foe.h; foe.cooldown=10; foe.dodgeCooldown=10; player.x=250; player.y=GROUND-player.h; player.invuln=0;');
  const hp = run('world.enemies[0].hp');
  elements.get('game').listeners.pointerdown({ button: 0, clientX: 340, clientY: 500, pointerType: 'mouse', preventDefault() {} });
  tick(20); assert.ok(run('world.enemies[0].hp') < hp); events.pointerup({ button: 0 });
  run('player.attack=0; player.cooldown=0');
  elements.get('game').listeners.pointerdown({ button: 2, clientX: 340, clientY: 500, pointerType: 'mouse', preventDefault() {} });
  tick(1); assert.equal(run('player.blocking'), true); events.pointerup({ button: 2 });
  run("keys.clear(); player.blocking=false; player.stamina=100; press('shift')"); assert.ok(run('player.dodge') > 0); assert.ok(run('player.stamina') < 100);
  run('damagePlayer(100,player.x+100)'); assert.equal(run('player.hp'), 100);
  tick(45); run("keys.clear(); selectWeapon('gun'); player.attack=0; player.reload=0; player.shotCooldown=0; player.ammo=10; shoot();");
  assert.equal(run('player.ammo'), 9); assert.equal(run('bullets.length'), 1);
  run('reload()'); assert.ok(run('player.reload') > 0); tick(190); assert.equal(run('player.ammo'), 10);
});
test('swept player bullets damage enemies and cover intercepts them', async () => {
  const { run } = await boot();
  run('expedition(1); const foe=world.enemies.find(e=>e.role==="gunner"); world.enemies=[foe]; world.platforms=[{x:0,y:GROUND,w:world.width,h:150,ground:true}]; foe.x=500; foe.y=GROUND-foe.h; foe.dodge=0; const targetY=foe.y+20; const hp=foe.hp; bullets=[projectile("player",{x:450,y:targetY},{x:700,y:targetY},20,850)]; updateBullets(.1);');
  assert.equal(run('world.enemies[0].hp'), run('hp-20'));
  run('world.platforms.push({x:460,y:targetY-10,w:5,h:30}); bullets=[projectile("player",{x:450,y:targetY},{x:700,y:targetY},20,850)]; const before=foe.hp; updateBullets(.1);');
  assert.equal(run('foe.hp'), run('before'));
  run('world.platforms.at(-1).stair=true; bullets=[projectile("player",{x:450,y:targetY},{x:700,y:targetY},10,850)]; updateBullets(.1);');
  assert.equal(run('foe.hp'),run('before-10'),'player fire passes through open stairs');
  run('player.x=420;player.y=foe.y;player.invuln=0;player.dodge=0;player.blocking=false;const health=player.hp;bullets=[projectile("enemy",{x:510,y:targetY},{x:400,y:targetY},10,850)];updateBullets(.1);');
  assert.ok(run('player.hp<health'),'enemy fire also passes through open stairs');
});

test('bullets damage heavy armour without pushing or interrupting its advance',async()=>{
  const {run}=await boot();
  run('expedition(1);const tank=world.enemies.find(e=>e.role==="heavy");tank.x=600;tank.y=GROUND-tank.h;tank.vx=-tank.speed;tank.state="chase";tank.facing=-1;const initialHp=tank.hp;hitEnemy(tank,20,500,true);');
  assert.equal(run('tank.x'),600);assert.ok(run('tank.hp<initialHp'));
  assert.equal(run('tank.vx'),run('-tank.speed'));assert.equal(run('tank.state'),'chase');
});
test('cache is single-use, completion unlocks next stage, and death preserves gear', async () => {
  const { run, click, elements } = await boot();
  run('expedition(1); const box=world.chests.at(-1); player.x=box.x; player.y=box.y; findTarget(); interact();');
  const money = run('profile.gold'); run('interact()'); assert.equal(run('profile.gold'), money);
  run('player.x=world.portal.x; player.y=world.portal.y-player.h; findTarget(); interact();'); assert.equal(run('modal'), null);
  run('for(const e of world.enemies) { e.hp=1; e.dodge=0; hitEnemy(e,1000); } findTarget(); interact();');
  assert.equal(run('modal'), 'complete'); assert.equal(run('profile.level'), 1);
  elements.get('help-button').onclick(); assert.equal(run('modal'), 'complete'); click('next'); assert.equal(run('world.depth'), 2);
  run('profile.gold=100; die()'); assert.equal(run('profile.gold'), 80); elements.get('help-button').onclick(); assert.equal(run('modal'), 'death');
  click('hub'); assert.equal(run('mode'), 'hub'); assert.equal(run('player.hp'), run('stats(profile).maxHp'));
});
test('skills screen spends level points, updates combat stats and persists learned ranks', async () => {
  const { run, click, elements, storage } = await boot();
  run("press('p')"); assert.equal(run('modal'), 'skills');
  assert.equal((elements.get('overlay').innerHTML.match(/class="skill-branch"/g) || []).length, 5);
  click('learn:blades'); assert.equal(run('stats(profile).damage'), 14);
  click('learn:blades'); assert.equal(run('stats(profile).damage'), 16); assert.equal(run('availablePoints(profile)'), 0);
  click('learn:blades'); assert.equal(run('profile.skills.blades'), 2);
  assert.equal(JSON.parse(storage.get('emberfall-save-v1')).skills.blades, 2);
  run("press('p')"); assert.equal(run('modal'), null);
});
test('perks affect actual medicine, rolling, stamina and reload behavior', async () => {
  const { run, tick } = await boot();
  run('profile.level=20; for(const [id,s] of Object.entries(SKILLS)) for(let n=0;n<s.max;n++) learnSkill(profile,id); player.hp=10; drink();');
  assert.equal(run('player.hp'), 71); assert.equal(run('player.healCooldown'), 5);
  run('selectWeapon("gun"); player.ammo=0; reload()'); assert.equal(run('player.reload'), 1.1);
  run('player.grounded=false; player.stamina=100; roll()'); assert.ok(run('player.dodge') > 0); assert.equal(run('player.stamina'), 80);
  run('profile.skills.airDash=0; player.dodgeCooldown=0; player.grounded=false; player.dodge=0;');
  assert.equal(run('roll()'), false);
  run('player.grounded=true; player.attack=0; player.cooldown=0; player.reload=0; player.stamina=100; attack()'); assert.equal(run('player.stamina'), 94);
  tick(1);
});
test('1–4 choose real weapons, left click fires each and magazines survive switching', async () => {
  const { run, tick, events, elements } = await boot();
  for (const [code, slot, rounds, pellets] of [['Digit2', 'gun', 10, 1], ['Digit3', 'rifle', 24, 1], ['Digit4', 'shotgun', 6, 5]]) {
    events.keydown({ code, preventDefault() {} });
    assert.equal(run('player.activeWeapon'), slot);
    run('player.shotCooldown=0; bullets=[];');
    elements.get('game').listeners.pointerdown({ button: 0, clientX: 1000, clientY: 350, pointerType: 'mouse', preventDefault() {} });
    events.pointerup({ button: 0 });
    assert.equal(run('player.ammo'), rounds - 1); assert.equal(run('bullets.length'), pellets);
    assert.ok(run('bullets.every(b=>b.y < player.y+player.h/2-10)'), 'shots start above torso centre at the gun');
  }
  run('selectWeapon("gun")'); assert.equal(run('player.ammo'), 9);
  run('reload()'); assert.ok(run('player.reload') > 0); run('selectWeapon("rifle")'); assert.equal(run('player.reload'), 0); assert.equal(run('player.ammo'), 23);
  run('selectWeapon("gun")'); assert.equal(run('player.ammo'), 9, 'switching does not refill a magazine');
  run('reload()'); tick(190); assert.equal(run('player.ammo'), 10);
  events.keydown({ code: 'Digit1', preventDefault() {} }); assert.equal(run('player.activeWeapon'), 'weapon');
  assert.equal(run('profile.activeWeapon'), 'weapon');
});
test('moving attacks and airborne shots retain movement and select combined animation clips', async () => {
  const { run, tick } = await boot();
  run('mouse.active=true; mouse.x=1100; mouse.y=300; keys.add("a"); press("j");'); tick(3);
  assert.ok(run('player.vx') < 0); assert.equal(run('player.facing'), 1); assert.equal(run('player.animation.name'), 'backAttack');
  run('keys.clear(); player.attack=0; selectWeapon("gun"); player.shotCooldown=0; keys.add("d"); press("w"); press("j");'); tick(5);
  assert.ok(run('player.vy') < 0); assert.ok(run('player.vx') > 0); assert.equal(run('player.animation.name'), 'jumpShoot');
});
test('reload continues once through running, reversing, jumping and landing without firing', async()=>{
  const {run,tick}=await boot();
  run('selectWeapon("gun");player.ammo=1;reload();mouse.active=true;mouse.x=1100;mouse.y=200;');
  assert.equal(run('player.reloadDuration'),1.5);
  tick(20);assert.equal(run('player.animation.name'),'reload');
  run('keys.add("d")');tick(20);assert.equal(run('player.animation.name'),'runReload');
  run('keys.clear();keys.add("a")');tick(20);assert.equal(run('player.animation.name'),'backReload');
  const remaining=run('player.reload');assert.ok(remaining<1.1);
  run('press("w")');tick(5);assert.equal(run('player.animation.name'),'jumpReload');
  assert.equal(run('animationInfo(player).sheet'),'utility');assert.equal(run('player.ammo'),1);
  assert.equal(run('bullets.length'),0);assert.ok(run('player.reload')<remaining);
  run('keys.clear()');tick(145);assert.equal(run('player.reload'),0);assert.equal(run('player.ammo'),10);
  assert.equal(run('bullets.length'),0);
});

test('real pointer aiming fires from the rotated muzzle at cursor elevation on either side', async()=>{
  const {run,elements,events}=await boot();
  run('selectWeapon("gun");player.x=500;player.y=300;camera=120;');
  for(const [x,y,up] of [[1100,50,true],[50,50,true],[50,640,false],[1100,640,false]]) {
    run('player.shotCooldown=0;player.fireVisual=0;bullets=[];');
    elements.get('game').listeners.pointerdown({button:0,clientX:x,clientY:y,pointerType:'mouse',preventDefault(){}});
    events.pointerup({button:0});
    assert.equal(run('bullets.length'),1);
    assert.equal(run('bullets[0].vy<0'),up);
    assert.equal(run('Math.sign(bullets[0].vx)'),x===50?-1:1);
    assert.ok(run('Math.abs(bullets[0].x-aimedMuzzle(player).x)<1e-8'));
    assert.ok(run('Math.abs(bullets[0].y-aimedMuzzle(player).y)<1e-8'));
    assert.ok(run('Math.abs(bullets[0].vx/WEAPONS.gun.speed-aimGeometry(player).direction.x)<1e-8'));
    assert.ok(run('Math.abs(bullets[0].vy/WEAPONS.gun.speed-aimGeometry(player).direction.y)<1e-8'));
  }
  run('mouse.active=false;player.shotCooldown=0;shoot();');
  assert.equal(run('bullets.at(-1).vy'),0,'keyboard-only fire remains horizontal');
});
