import * as skillUI from '../src/skill-ui.js';
import * as gearUI from '../src/gear-ui.js';
import * as menuUI from '../src/menu-ui.js';
import * as commander from '../src/commander.js';
import * as decoy from '../src/decoy.js';
import * as signal from '../src/signal.js';
import * as campaign from '../src/campaign.js';
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
import * as stairwells from '../src/stairwells.js';
import * as gear from '../src/gear.js';
import * as workshop from '../src/workshop.js';
import * as contracts from '../src/contracts.js';
import * as variants from '../src/enemy-variants.js';

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
  const context = vm.createContext({ ...worldModule, ...combat, ...skills, ...weapons, ...aiming, ...stairwells, ...gear, ...workshop, ...contracts, ...variants, ...campaign, ...signal, ...decoy, ...commander, ...menuUI, ...gearUI, ...skillUI, mercenarySvg, advanceAnimation, animationInfo, preloadEnvironment, preloadSprites, previewMarkup, paintPreviews, muzzleAnchor, drawWorld, drawMinimap, console, Math, JSON, Date, structuredClone,
    document: { getElementById: element, querySelector: element, querySelectorAll: () => [], addEventListener() {} }, window: { addEventListener(name, cb) { events[name] = cb; } },
    localStorage: { getItem: k => storage.get(k), setItem: (k, v) => storage.set(k, v) },
    setTimeout: () => 1, clearTimeout() {}, requestAnimationFrame() {}, ResizeObserver: class { observe() {} },
  });
  const code = (await readFile(new URL('../src/game.js', import.meta.url), 'utf8')).replace(/^import .*?;\r?\n/gm, '');
  // Exercise gameplay synchronously; asset loading is covered by browser checks.
  vm.runInContext(code.replace(/\nboot\(\);\s*$/, ''), context);
  vm.runInContext('setupHub();preparedEquipment=equipmentSignature();loadingScene=false;',context);
  const run = code => vm.runInContext(code, context), tick = count => run(`for(let i=0;i<${count};i++) { update(1/120); if(terminal()) break; }`);
  const click = action => element('overlay').listeners.click({ target: { closest: () => ({ dataset: { action } }) } });
  return { run, click, tick, elements, storage, events };
}

test('gear traits affect actual shots, melee hits and one-time salvage selection',async()=>{
 const {run,click,storage}=await boot();
 run("mode='expedition';world=generateLevel(1,42,'industrial');player.activeWeapon='gun';player.ammo=1;player.shotCooldown=0;profile.equipment.gun.trait='capacitor';shoot();");
 assert.ok(run('bullets[0].damage>stats(profile).gunDamage*2'));
 run("player.activeWeapon='weapon';player.stamina=10;profile.equipment.weapon.trait='flow';world.enemies[0].dodge=0;world.enemies[0].hp=1000;hitEnemy(world.enemies[0],1);");
 assert.equal(run('player.stamina'),17);
 run("world.kills=world.enemies.length;complete();");
 assert.equal(run('world.salvage.length'),2);assert.ok(run('world.salvage.every(item=>gearTrait(item))'));
 const count=run('profile.bag.length');click('salvage:0');click('salvage:1');
 assert.equal(run('profile.bag.length'),count+1);assert.equal(run('world.salvageClaimed'),true);
 assert.ok(JSON.parse(storage.get('emberfall-save-v1')).bag.at(-1).trait);
});

test('repulsor keeps its shot property after switching weapons and pushes once per volley',async()=>{
 const {run}=await boot();
 run("mode='expedition';world=generateLevel(1,42,'industrial');player.activeWeapon='shotgun';profile.equipment.shotgun.trait='repulsor';player.ammo=6;shoot();const shot=bullets[0];const victim=world.enemies.find(e=>e.role==='runner');victim.hp=10000;victim.dodge=0;victim.x=1000;player.activeWeapon='gun';hitEnemy(victim,1,0,true,shot);");
 assert.equal(run('victim.x'),1040);
 run('hitEnemy(victim,1,0,true,bullets[1]);');assert.equal(run('victim.x'),1045);
 run("victim.turret=true;hitEnemy(victim,1,0,true,{repulsor:true,volley:{}});");assert.equal(run('victim.x'),1045);
});

test('shield specialist applies directional protection and katana opens a damage window',async()=>{
 const {run}=await boot();
 run("mode='expedition';world=generateLevel(3,42,'industrial');const guard=world.enemies.find(e=>e.role==='heavy');Object.assign(guard,{variant:'shield',hp:1000,dodge:0,state:'patrol',facing:1,x:700});hitEnemy(guard,100,1000,true);");
 assert.equal(run('guard.hp'),984);
 run('hitEnemy(guard,100,0,true);');assert.equal(run('guard.hp'),904);
 run('hitEnemy(guard,100,1000,false);');assert.equal(run('guard.hp'),804);assert.equal(run('guard.shieldDown'),3);
 run('hitEnemy(guard,100,1000,true);');assert.equal(run('guard.hp'),724);
});

test('finale locks the archive, completes the chapter once and persists its reward',async()=>{
 const {run,storage}=await boot();
 run("profile.workshop={built:true,equipment:true,mod:'standard',samples:0,operations:1};profile.campaign={sabotage:true,prototype:true,intel:true,supply:true,finished:false};mode='expedition';world=generateLevel(3,42,'industrial');attachContract(world,campaignOffer(profile,1));target={kind:'package'};interact();");
 assert.equal(run('world.package.taken'),false);
 run('disableNode(world,0);disableNode(world,1);interact();complete();');
 assert.equal(run('profile.campaign.finished'),true);assert.equal(run('profile.workshop.samples'),3);assert.equal(run('modal'),'complete');
 run('complete();');assert.equal(run('profile.workshop.samples'),3);
 assert.equal(JSON.parse(storage.get('emberfall-save-v1')).campaign.finished,true);
 assert.equal(run('availableContracts().some(c=>c.id==="blackout")'),false);
  run("profile.workshop.empReady=true;loadingScene=true;setupExpedition(1,'industrial',false);");assert.equal(run('world.empCharges'),2);assert.equal(run('profile.workshop.empReady'),false);
});

test('signal unlocks after chapter, runs in gameplay and pays once on return',async()=>{
 const {run,storage}=await boot();assert.equal(run('availableContracts().some(c=>c.id==="signal")'),false);
 run("profile.campaign={sabotage:true,prototype:true,intel:true,supply:true,finished:true};workshopState(profile).built=true;profile.workshop.samples=0;mode='expedition';world=generateLevel(3,42,'industrial');attachContract(world,signalOffer(2));Object.assign(player,{x:world.signal.x-10,y:world.signal.y-player.h});target={kind:'signal'};interact();");
 assert.equal(run('world.signal.started'),true);assert.equal(run('availableContracts().some(c=>c.id==="signal")'),true);
 run('world.signal.progress=74.999;update(1/120);');assert.equal(run('world.signal.done'),true);assert.equal(run('modal'),null);
 run('complete();');assert.equal(run('profile.workshop.samples'),2);run('complete();');assert.equal(run('profile.workshop.samples'),2);
 assert.equal(JSON.parse(storage.get('emberfall-save-v1')).workshop.samples,2);
});

test('enemy bullets hit the decoy before the hero and its lifetime expires in simulation',async()=>{
 const {run}=await boot();
 run("mode='expedition';world=generateLevel(1,42,'industrial');world.enemies=[];Object.assign(player,{x:800,y:484,hp:100});world.decoy={decoy:true,x:650,y:484,w:20,h:54,hp:60,life:10,vx:0,vy:0,attack:0};bullets=[projectile('enemy',{x:600,y:510},{x:900,y:510},20,1000)];updateBullets(.2);");
 assert.equal(run('player.hp'),100);assert.equal(run('world.decoy.hp'),40);assert.equal(run('bullets.length'),0);
 run('world.decoy.life=.001;update(1/120);');assert.equal(run('world.decoy'),null);
});

test('port finale blocks its key, awards field kit and H uses it once on a new contract',async()=>{
 const {run,events}=await boot();
 run("profile.workshop={built:true,equipment:true,samples:0,operations:1,researched:[],mod:'standard'};profile.campaign={finished:true,relaySignal:true,relaySupply:true,relayFinished:false};mode='expedition';world=generateLevel(3,42,'port');attachContract(world,relayOffer(profile,1));target={kind:'package'};interact();");assert.equal(run('world.package.taken'),false);
 run('world.signal.done=true;interact();if(world.package.taken)throw Error("Commander gate bypassed");world.enemies.find(e=>e.commander).dead=true;interact();complete();');assert.equal(run('profile.campaign.relayFinished'),true);assert.equal(run('profile.workshop.samples'),4);
 run("loadingScene=true;setupExpedition(1,'industrial',false);loadingScene=false;player.hp=40;");assert.equal(run('world.fieldKits'),1);
 events.keydown({code:'KeyH',repeat:false});assert.equal(run('player.hp'),75);assert.equal(run('world.fieldKits'),0);
 events.keydown({code:'KeyH',repeat:false});assert.equal(run('player.hp'),75);
});

test('chapter finale stays visible with exact requirements and accepts reconciled progress',async()=>{
 const {run,elements}=await boot();run('departure();');
 assert.ok(elements.get('overlay').innerHTML.includes('data-finale-status="locked"'));
 assert.ok(elements.get('overlay').innerHTML.includes('mission-steps'));
 run("profile.workshop={built:true,equipment:true,operations:1,samples:0,researched:[],mod:'standard'};profile.campaign={sabotage:false,prototype:false,finished:false};departure();");
 const html=elements.get('overlay').innerHTML;assert.ok(html.includes('data-finale-status="ready"'));
 assert.equal((html.match(/data-action="contract:blackout"/g)||[]).length,1);
 assert.ok(!html.includes('data-action="contract:sabotage"'));
 assert.equal(run('availableContracts().some(c=>c.id==="blackout")'),true);
});

test('chapter guidance leads from workshop launch to delivering one prototype',async()=>{
 const {run,click,elements}=await boot();
 run("profile.workshop={built:false,equipment:true,operations:0,samples:0,researched:[],mod:'standard'};departure();");
 let html=elements.get('overlay').innerHTML;assert.ok(html.includes('data-action="workshop"'));
 click('workshop');assert.ok(elements.get('overlay').innerHTML.includes('1 прототип'));
 click('build-workshop');assert.ok(elements.get('overlay').innerHTML.includes('доставь 1 прототип'));
 click('board');html=elements.get('overlay').innerHTML;assert.ok(html.includes('Доставить 1 прототип'));assert.ok(html.includes('data-action="contract:prototype"'));
 assert.equal(run('campaignOffer(profile,1)'),null);
});
test('menu tabs switch content and keep module selection on its tab',async()=>{
 const {run,click,elements}=await boot();run('departure();');click('board-tab:all');assert.ok(elements.get('overlay').innerHTML.includes('data-action="contract:assault"'));
 click('board-tab:story');assert.ok(elements.get('overlay').innerHTML.includes('mission-focus'));
 run("profile.workshop={built:true,equipment:true,operations:1,samples:2,researched:['duplex'],mod:'standard',gadget:'emp'};workshopMenu();");
 click('workshop-tab:modules');assert.ok(elements.get('overlay').innerHTML.includes('Две пули за один патрон'));
 click('weapon-mod:duplex');assert.equal(run('workshopView'),'modules');assert.equal(run('profile.workshop.mod'),'duplex');assert.ok(!elements.get('overlay').innerHTML.includes('<details'));
});
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

test('E uses the hotel entrance and returns through the upper exit without opening a modal',async()=>{
  const {run,tick}=await boot();
  run(`mode='expedition';world=generateLevel(1,42,'market');world.enemies.forEach(e=>e.dead=true);const stairs=world.connections.find(c=>c.kind==='stairwell');Object.assign(player,{x:stairs.lower.x-player.w/2,y:stairs.lower.y-player.h,grounded:true,stairwellCooldown:0});findTarget();`);
  assert.equal(run('target.kind'),'stairwell');run("press('e')");
  assert.equal(run('player.y+player.h'),run('stairs.upper.y'));assert.equal(run('modal'),null);
  tick(60);run('findTarget()');assert.equal(run('target.kind'),'stairwell');run("press('e')");
  assert.equal(run('player.y+player.h'),worldModule.GROUND);assert.equal(run('modal'),null);
});

test('Tab opens the character window in gameplay and keeps keyboard navigation inside menus',async()=>{
  const {run,events}=await boot();let prevented=false;
  events.keydown({code:'Tab',preventDefault(){prevented=true;}});
  assert.equal(run('modal'),'inventory');assert.ok(prevented);
  prevented=false;events.keydown({code:'Tab',preventDefault(){prevented=true;}});
  assert.equal(run('modal'),'inventory');assert.equal(prevented,false,'Tab remains available for focus navigation');
  run('closeModal();');events.keydown({code:'Tab',shiftKey:true,preventDefault(){}});assert.equal(run('modal'),null);
  events.keydown({code:'Tab',ctrlKey:true,preventDefault(){}});assert.equal(run('modal'),null);
  run('expedition(1);');events.keydown({code:'Tab',preventDefault(){}});assert.equal(run('modal'),'inventory');
  run('closeModal();profile.gold=100;die();');events.keydown({code:'Tab',preventDefault(){}});assert.equal(run('modal'),'death');
});

test('merchant inspector compares the selected item to the same equipment slot',async()=>{
 const {run,elements}=await boot();
 run('stock=[{id:"g",type:"gun",name:"Pistol",power:10,rarity:0},{id:"r",type:"rifle",name:"Rifle",power:10,rarity:0},{id:"t",type:"torso",name:"Jacket",power:1,rarity:0},{id:"h",type:"head",name:"Visor",power:1,rarity:0}];merchant();');
 for(const [i,slot,delta]of [[0,'gun',5],[1,'rifle',4],[2,'torso',-1],[3,'head',0]])assert.ok(run("gearInspector(profile,stock,'stock-"+i+"',mode)").includes('data-compare-slot="'+slot+'" data-delta="'+delta+'"'));
 run('profile.equipment.gun=null;');assert.ok(run("gearInspector(profile,stock,'stock-0',mode)").includes('data-delta="25"'));
 assert.ok(elements.get('overlay').innerHTML.includes('stock-grid'));assert.ok(!elements.get('overlay').innerHTML.includes('<details'));
});

test('hover previews keep following the action under the pointer',async()=>{
 const {run}=await boot();run("merchant();inspectGear({closest:()=>({dataset:{inspect:'stock-0'}})},true);");
 assert.equal(run('gearPinned'),false);run("inspectGear({closest:()=>({dataset:{inspect:'stock-1'}})});");assert.equal(run('inspectedGear'),'stock-1');
 run("inspectGear({closest:()=>({dataset:{inspect:'stock-1'}})},true);");assert.equal(run('inspectedGear'),'stock-1');
});

test('skills navigate overview, branch and focused perk while preserving learned ranks',async()=>{
 const {run,click,elements}=await boot();run('skillTree();');assert.equal(run('skillBranch'),null);assert.ok(elements.get('overlay').innerHTML.includes('attribute-menu'));
 click('branch:body');click('perk:constitution');click('learn:constitution');assert.equal(run('profile.skills.constitution'),1);assert.equal(run('skillFocus'),'constitution');
 click('skill-overview');assert.equal(run('skillBranch'),null);click('branch:reflex');assert.equal(run('skillBranch'),'reflex');assert.equal(run('profile.skills.constitution'),1);
});

test('merchant purchases, equips, filters and sells without leaving its combined window',async()=>{
  const {run,click,elements,storage}=await boot();
  run('profile.gold=1000;stock=[{id:"upgrade",type:"gun",name:"Upgrade",power:12,rarity:0}];const cost=buyPrice(stock[0]);merchant();');
  click('buy:0');assert.equal(run('modal'),'merchant');assert.equal(run('profile.gold'),run('1000-cost'));
  assert.equal(run('profile.bag[0].id'),'upgrade');assert.equal(run('stock.length'),0);
  click('equip:0');assert.equal(run('modal'),'merchant');assert.equal(run('profile.equipment.gun.id'),'upgrade');
  assert.equal(run('profile.bag[0].id'),'starter-gun');
  click('filter:clothes');assert.equal(run('modal'),'merchant');assert.ok(!elements.get('overlay').innerHTML.includes('data-inspect="bag-0"'));
  click('filter:weapons');assert.match(elements.get('overlay').innerHTML,/data-inspect="bag-0"/);
  run('const sale=itemValue(profile.bag[0]);const money=profile.gold;');click('sell:0');
  assert.equal(run('modal'),'merchant');assert.equal(run('profile.gold'),run('money+sale'));assert.equal(run('profile.bag.length'),0);
  click('unequip:gun');assert.equal(run('modal'),'merchant');assert.equal(run('profile.equipment.gun'),null);
  assert.equal(run('profile.bag[0].id'),'upgrade');
  assert.equal(JSON.parse(storage.get('emberfall-save-v1')).equipment.gun,null);
});

test('merchant refuses purchases with full backpack or insufficient funds',async()=>{
  const {run,click,elements}=await boot();
  run('profile.gold=1000;profile.bag=Array.from({length:BAG_LIMIT},(_,i)=>({...profile.equipment.head,id:"bag-"+i}));merchant();const money=profile.gold;const count=stock.length;');
  click('buy:0');assert.equal(run('profile.gold'),run('money'));assert.equal(run('stock.length'),run('count'));
  assert.match(elements.get('overlay').innerHTML,/Рюкзак заполнен/);
  run('profile.bag=[];profile.gold=0;merchant();');click('buy:0');
  assert.equal(run('profile.bag.length'),0);assert.equal(run('stock.length'),run('count'));
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
  run('expedition(1); camera=0;cameraY=0;const foe=world.enemies.find(e=>e.role==="gunner"); world.enemies=[foe]; world.platforms=[{x:0,y:GROUND,w:world.width,h:150,ground:true}]; foe.x=500; foe.y=GROUND-foe.h; foe.dodge=0; const targetY=foe.y+20; const hp=foe.hp; bullets=[projectile("player",{x:450,y:targetY},{x:700,y:targetY},20,850)]; updateBullets(.1);');
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

test('shots stop at the screen edge and cannot hit invisible enemies',async()=>{
  const {run}=await boot();
  run('expedition(1);camera=0;cameraY=0;const foe=world.enemies.find(e=>e.role==="gunner");world.enemies=[foe];world.platforms=[{x:0,y:GROUND,w:world.width,h:150,ground:true}];foe.x=1250;foe.y=GROUND-foe.h;foe.dodge=0;const y=foe.y+20;const hp=foe.hp;bullets=[projectile("player",{x:1000,y},{x:1400,y},10,850,WEAPONS.gun)];updateBullets(1);');
  assert.equal(run('foe.hp'),run('hp'));assert.equal(run('bullets.length'),0);
  run('camera=200;bullets=[projectile("player",{x:1000,y},{x:1400,y},10,850,WEAPONS.gun)];updateBullets(1);');
  assert.ok(run('foe.hp<hp'),'same enemy is hittable after entering the visible area');
});

test('actual shotgun pellets cannot damage a target beyond shotgun range',async()=>{
  const {run}=await boot();
  run('expedition(1);camera=0;cameraY=0;const foe=world.enemies.find(e=>e.role==="gunner");world.enemies=[foe];world.platforms=[{x:0,y:GROUND,w:world.width,h:150,ground:true}];player.x=100;player.y=GROUND-player.h;foe.x=470;foe.y=GROUND-foe.h;foe.dodge=0;const hp=foe.hp;selectWeapon("shotgun");player.shotCooldown=0;shoot();updateBullets(1);');
  assert.equal(run('foe.hp'),run('hp'));assert.equal(run('bullets.length'),0);
});

test('katana has faster recovery and an extended but finite melee reach',async()=>{
  const {run}=await boot();
  run('expedition(1);player.x=400;player.y=GROUND-player.h;const close=world.enemies.find(e=>e.role==="gunner");const far=world.enemies.find(e=>e.role==="runner");world.enemies=[close,far];close.x=center(player).x+80-close.w/2;far.x=center(player).x+90-far.w/2;for(const e of world.enemies){e.y=GROUND-e.h;e.dodge=0;e.hp=1000;}player.facing=1;player.attack=0;player.cooldown=0;attack();slash();');
  assert.equal(run('player.attack'),.26);assert.equal(run('player.cooldown'),.38);
  assert.equal(run('close.hp'),970);assert.equal(run('far.hp'),1000);
});

test('katana hits touching and overlapping enemies even when their centre is behind the hero',async()=>{
  const {run}=await boot();
  run('expedition(1);player.x=400;player.y=GROUND-player.h;const foe=world.enemies.find(e=>e.role==="gunner");world.enemies=[foe];foe.w=28;foe.dodge=0;');
  for(const facing of [-1,1])for(const offset of [-24,-20,0,20,24]){
    run(`player.facing=${facing};foe.x=center(player).x+${offset}-foe.w/2;foe.y=player.y;foe.hp=1000;slash();`);
    assert.equal(run('foe.hp'),970,`contact offset ${offset}, facing ${facing}`);
  }
  run('player.facing=1;foe.x=player.x;foe.y=player.y+50;foe.hp=1000;slash();');
  assert.equal(run('foe.hp'),970,'body overlap counts even with vertically offset centres');
  run('foe.y=player.y;foe.x=player.x-60;foe.hp=1000;slash();');
  assert.equal(run('foe.hp'),1000,'separate enemies behind the hero remain outside the swing');
  run('foe.x=player.x;foe.dodge=.2;slash();');
  assert.equal(run('foe.hp'),1000,'contact does not cancel a genuine dodge');
});

test('rifle shots accumulate heat and switching weapons does not instantly clear it',async()=>{
  const {run}=await boot();
  run('selectWeapon("rifle");for(let i=0;i<3;i++){player.shotCooldown=0;shoot();}const heat=player.rifleHeat;selectWeapon("gun");');
  assert.ok(run('heat>.6'));assert.equal(run('player.rifleHeat'),run('heat'));
  run('update(.6);selectWeapon("rifle");player.shotCooldown=0;shoot();');
  assert.ok(Math.abs(run('player.rifleHeat')-.22)<1e-6);
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
  assert.equal((elements.get('overlay').innerHTML.match(/class="attribute-card"/g) || []).length, 5);
  click('branch:reflex');assert.equal(run('skillBranch'),'reflex');
  click('learn:blades'); assert.equal(run('stats(profile).damage'), 35);
  click('learn:blades'); assert.equal(run('stats(profile).damage'), 40); assert.equal(run('availablePoints(profile)'), 0);
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
    assert.ok(run('Math.abs(bullets[0].vx/WEAPONS.gun.speed-aimDirection(player,{x:mouse.x+camera,y:mouse.y+cameraY}).x)<1e-8'));
    assert.ok(run('Math.abs(bullets[0].vy/WEAPONS.gun.speed-aimDirection(player,{x:mouse.x+camera,y:mouse.y+cameraY}).y)<1e-8'));
  }
  run('mouse.active=false;player.shotCooldown=0;shoot();');
  assert.equal(run('bullets.at(-1).vy'),0,'keyboard-only fire remains horizontal');
});
