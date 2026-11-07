import test from 'node:test';
import assert from 'node:assert/strict';
import { GROUND, generateLevel } from '../src/world.js';
import { center, incomingDamage, physics, segmentHit, projectile, updateEnemies,findLadder,lineOfSight } from '../src/combat.js';

test('ladders support ascent, hanging in place and descent between real generated floors',()=>{
  const w=generateLevel(1,23,'megablock'),l=w.ladders[0],a={...player(),x:l.x-13.5,y:l.bottom-74,climbing:null,climbIntent:-1};
  assert.equal(findLadder(a,w,-1).id,l.id);
  for(let i=0;i<35;i++)physics(a,w,1/120);
  assert.ok(a.y<l.bottom-a.h);a.climbIntent=0;const y=a.y;
  for(let i=0;i<30;i++)physics(a,w,1/120);assert.equal(a.y,y);
  a.climbIntent=-1;for(let i=0;i<300;i++)physics(a,w,1/120);
  assert.equal(a.y+a.h,l.top);assert.ok(a.grounded);
  a.climbIntent=1;for(let i=0;i<300;i++)physics(a,w,1/120);
  assert.equal(a.y+a.h,l.bottom);assert.ok(a.grounded);
});
test('generated stair flights can be walked up and down through their deck openings',()=>{
  for(let seed=1;seed<=20;seed++){
    const w=generateLevel(1,seed,'megablock'),s=w.stairs[0];
    const a={...player(),x:s.lower.x-13.5,y:s.lower.y-74,vx:s.dir*100,grounded:true};
    for(let i=0;i<800&&Math.abs(a.y+a.h-s.upper.y)>1;i++)physics(a,w,1/120);
    assert.equal(a.y+a.h,s.upper.y,'ascent '+seed);
    a.x=s.upper.x-13.5;a.y=s.upper.y-a.h;a.vx=-s.dir*85;a.grounded=true;
    for(let i=0;i<900&&Math.abs(a.y+a.h-s.lower.y)>.01;i++)physics(a,w,1/120);
    assert.equal(a.y+a.h,s.lower.y,'descent '+seed);
  }
});
test('enemies use a ladder route to pursue a player on another floor',()=>{
  const w=generateLevel(1,17,'megablock'),l=w.ladders[0],e=enemy('runner',l.x-10),p=player();
  e.x=l.x-e.w/2;e.y=l.bottom-e.h;e.cooldown=10;e.jumpCooldown=10;e.grounded=true;
  p.x=l.x-p.w/2;p.y=l.top-p.h;w.enemies=[e];let climbed=false;
  for(let i=0;i<700&&!(e.grounded&&e.y+e.h===l.top);i++){updateEnemies(w,p,[],1/120,()=>{});climbed||=e.climbing!=null;}
  assert.ok(climbed);assert.equal(e.y+e.h,l.top);assert.equal(e.climbing,null);assert.ok(e.grounded);
});

test('enemy navigation completes entire diagonal stair flights in both directions',()=>{
  for(let seed=1;seed<=8;seed++)for(const up of [true,false]){
    const w=generateLevel(1,seed,'megablock'),s=w.stairs[0],start=up?s.lower:s.upper,end=up?s.upper:s.lower;
    const e=enemy('heavy',start.x),p=player();
    Object.assign(e,{x:start.x-e.w/2,y:start.y-e.h,grounded:true,cooldown:999,jumpCooldown:999});
    Object.assign(p,{x:end.x+(up?s.dir:-s.dir)*55-p.w/2,y:end.y-p.h,grounded:true});w.enemies=[e];
    for(let i=0;i<1800&&!(e.grounded&&Math.abs(e.y+e.h-end.y)<1&&Math.abs(center(e).x-end.x)<40);i++)updateEnemies(w,p,[],1/120,()=>{});
    assert.ok(e.grounded&&Math.abs(e.y+e.h-end.y)<1&&Math.abs(center(e).x-end.x)<40,'stair seed '+seed+' up '+up+' '+JSON.stringify({x:e.x,y:e.y,route:e.route}));
  }
});
test('player jumps on the same floor do not send nearby enemies onto ladders',()=>{
  const w=flat();w.floors=[GROUND,GROUND-105];w.platforms.push({x:400,y:GROUND-105,w:600,h:18});
  w.ladders=[{id:0,x:500,top:GROUND-105,bottom:GROUND,w:24}];w.connections=[{kind:'ladder',id:0,from:0,to:1,lower:{x:500,y:GROUND},upper:{x:500,y:GROUND-105}}];
  const e=enemy('heavy',490),p=player();e.cooldown=999;e.jumpCooldown=999;w.enemies=[e];let climbs=0;
  for(let i=0;i<1000;i++){
    const airborne=i%120<70;p.grounded=!airborne;p.y=GROUND-p.h-(airborne?110:0);
    updateEnemies(w,p,[],1/120,()=>{});if(e.climbing!=null)climbs++;
  }
  assert.equal(climbs,0);
});

test('enemies pass underneath stair flights when pursuing on the same floor',()=>{
  for(let seed=1;seed<=8;seed++)for(const direction of [1,-1]){
    const w=generateLevel(1,seed,'megablock'),s=w.stairs[0],left=Math.min(s.lower.x,s.upper.x)-55,right=Math.max(s.lower.x,s.upper.x)+55;
    const e=enemy('heavy'),p=player();
    Object.assign(e,{x:(direction>0?left:right)-e.w/2,y:s.lower.y-e.h,grounded:true,cooldown:999,jumpCooldown:999});
    Object.assign(p,{x:(direction>0?right:left)-p.w/2,y:s.lower.y-p.h,grounded:true});w.enemies=[e];
    for(let i=0;i<900;i++){
      updateEnemies(w,p,[],1/120,()=>{});
      assert.equal(e.y+e.h,s.lower.y,'unwanted stair ascent seed '+seed+' direction '+direction);
      assert.equal(e.route??null,null);
    }
    assert.ok(Math.abs(center(e).x-center(p).x)<35,'crossed the entire flight');
  }
});

test('open stair treads do not block enemy sight but solid decks do',()=>{
  const w={platforms:[{x:50,y:10,w:30,h:18,stair:true}]},a={x:0,y:20},b={x:100,y:20};
  assert.equal(lineOfSight(w,a,b),true);
  w.platforms.push({x:90,y:10,w:5,h:30});assert.equal(lineOfSight(w,a,b),false);
});

const player = () => ({ x: 700, y: GROUND - 74, w: 27, h: 74, vx: 0, vy: 0, hp: 100, facing: 1, stamina: 100, blocking: false, invuln: 0, dodge: 0, attack: 0 });
const flat = () => ({ depth: 1, width: 2000, platforms: [{ x: 0, y: GROUND, w: 2000, h: 150, ground: true }], enemies: [] });
function enemy(role, x = 900) { const e = generateLevel(1, 41).enemies.find(e => e.role === role); return { ...e, x, y: GROUND - e.h, cooldown: 0, dodgeCooldown: 0, jumpCooldown: 0 }; }
test('front block spends stamina; rear hits, broken guards, armour and dodge behave differently', () => {
  const p = player(), raw = incomingDamage(p, 30, 900, 4).damage;
  p.blocking = true; const blocked = incomingDamage(p, 30, 900, 4);
  assert.ok(blocked.blocked); assert.ok(blocked.damage < raw); assert.ok(p.stamina < 100);
  assert.equal(incomingDamage(p, 30, 500, 4).damage, raw);
  p.stamina = 1; const broken = incomingDamage(p, 30, 900, 4);
  assert.equal(broken.damage, raw); assert.ok(p.guardBreak > 0); assert.equal(p.blocking, false);
  p.dodge = .32; assert.equal(incomingDamage(p, 100, 900, 0).damage, 0);
  p.dodge = .05; assert.ok(incomingDamage(p, 100, 900, 0).damage > 0);
});
test('swept bullets hit thin objects and respect cover', () => {
  const box = { x: 50, y: 10, w: 2, h: 30 };
  assert.equal(segmentHit(0, 20, 100, 20, box), .5);
  assert.equal(segmentHit(0, 50, 100, 50, box), null);
  assert.equal(segmentHit(0, 20, 0, 30, box), null);
  const b = projectile('player', { x: 0, y: 0 }, { x: 3, y: 4 }, 10, 100); assert.equal(Math.hypot(b.vx, b.vy), 100);
});
test('gunners retreat at close range, telegraph and fire aimed projectiles', () => {
  const w = flat(), p = player(), e = enemy('gunner', 950), bullets = []; w.enemies = [e];
  updateEnemies(w, p, bullets, .01, () => {}); assert.equal(e.state, 'windup'); assert.equal(bullets.length, 0);
  assert.ok(e.aimX < e.x);
  for (let i = 0; i < 90; i++) updateEnemies(w, p, bullets, .01, () => {});
  assert.equal(bullets.length, 1); assert.ok(bullets[0].vx < 0);
  e.state = 'chase'; e.cooldown = 1; e.x = p.x + 90; updateEnemies(w, p, bullets, .01, () => {}); assert.ok(e.vx > 0, 'retreat away from nearby player');
});
test('runners evade a telegraphed slash but cannot evade repeatedly', () => {
  const w = flat(), p = player(), e = enemy('runner', 775); w.enemies = [e]; p.attack = .3;
  updateEnemies(w, p, [], .01, () => {}); assert.equal(e.state, 'evade'); assert.ok(e.dodge > 0); assert.ok(e.vx > 0);
  e.dodge = 0; e.x = 775; updateEnemies(w, p, [], .01, () => {}); assert.equal(e.dodge, 0);
});
test('enemies jump to pursue elevated players, descend and land on one-way platforms', () => {
  const w = flat(), e = enemy('runner', 620), p = player();
  w.platforms.push({ x: 600, y: GROUND - 110, w: 260, h: 24 }); w.enemies = [e]; p.y -= 110;
  updateEnemies(w, p, [], .01, () => {}); assert.ok(e.vy < 0, 'enemy starts a jump');
  e.vx = 0; for (let i = 0; i < 120; i++) physics(e, w, 1 / 120);
  assert.equal(e.y + e.h, GROUND - 110); assert.ok(e.grounded);
  p.y = GROUND - p.h; e.state = 'chase'; e.cooldown = 1; e.jumpCooldown = 0;
  updateEnemies(w, p, [], .01, () => {}); assert.ok(e.drop > 0);
  e.vx = 0; for (let i = 0; i < 120; i++) { e.drop = Math.max(0, e.drop - 1 / 120); physics(e, w, 1 / 120); }
  assert.equal(e.y + e.h, GROUND);
});
test('heavy melee has a readable windup and can be evaded before impact', () => {
  const w = flat(), e = enemy('heavy', 760), p = player(); w.enemies = [e]; let damage = 0;
  updateEnemies(w, p, [], .01, raw => damage += raw); assert.equal(e.state, 'windup'); assert.equal(damage, 0);
  p.x -= 180; for (let i = 0; i < 70; i++) updateEnemies(w, p, [], .01, raw => damage += raw);
  assert.equal(damage, 0); assert.equal(e.state, 'recover');
});
