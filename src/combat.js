import { GROUND } from './world.js';

export const center = actor => ({ x: actor.x + actor.w / 2, y: actor.y + actor.h / 2 });
export function findLadder(actor,world,direction=0,id=null) {
  const feet=actor.y+actor.h,cx=actor.x+actor.w/2;
  return (world.ladders||[]).filter(l=>(id==null||l.id===id)&&Math.abs(cx-l.x)<25&&feet>=l.top-4&&feet<=l.bottom+8
    &&(direction>=0||feet>l.top+2)&&(direction<=0||feet<l.bottom-2)).sort((a,b)=>Math.abs(a.x-cx)-Math.abs(b.x-cx))[0];
}
// Undefined keeps player auto-stepping; enemies pass a selected flight ID or null.
export function physics(actor, world, dt, stairId=undefined) {
  const acceptsStair=p=>!p.stair||stairId===undefined||p.stairId===stairId;
  actor.ladderCooldown=Math.max(0,(actor.ladderCooldown||0)-dt);
  if(actor.climbing!=null&&!actor.climbIntent&&Math.abs(actor.vx)>1){actor.climbing=null;actor.ladderCooldown=.15;}
  const ladder=actor.climbing!=null?(world.ladders||[]).find(l=>l.id===actor.climbing):actor.climbIntent&&actor.ladderCooldown<=0?findLadder(actor,world,actor.climbIntent,actor.ladderTarget):null;
  if(ladder){
    actor.climbing=ladder.id;actor.x=ladder.x-actor.w/2;actor.vx=0;actor.vy=(actor.climbIntent||0)*145;
    actor.y=Math.max(ladder.top-actor.h,Math.min(ladder.bottom-actor.h,actor.y+actor.vy*dt));actor.grounded=false;
    if(actor.climbIntent<0&&actor.y+actor.h<=ladder.top+.01||actor.climbIntent>0&&actor.y+actor.h>=ladder.bottom-.01){actor.climbing=null;actor.vy=0;actor.grounded=true;}
    return;
  }
  actor.climbing=null;
  const oldBottom = actor.y + actor.h,wasGrounded=actor.grounded;
  actor.x = Math.max(20, Math.min(world.width - actor.w - 20, actor.x + actor.vx * dt));
  if(wasGrounded&&Math.abs(actor.vx)>0){
    const step=world.platforms.filter(p=>p.stair&&acceptsStair(p)&&p.y<oldBottom-.1&&oldBottom-p.y<=21&&actor.x+actor.w>p.x&&actor.x<p.x+p.w).sort((a,b)=>a.y-b.y)[0];
    if(step){actor.y=step.y-actor.h;actor.vy=0;actor.grounded=true;return;}
  }
  actor.vy += 1330 * dt; actor.y += actor.vy * dt; actor.grounded = false;
  let landing = Infinity;
  for (const p of world.platforms) {
    if(!acceptsStair(p))continue;
    if (actor.vy >= 0 && (!(actor.drop > 0) || p.ground) && !p.holes?.some(h=>actor.x+actor.w/2>h.x&&actor.x+actor.w/2<h.x+h.w) && actor.x + actor.w > p.x && actor.x < p.x + p.w && oldBottom <= p.y + 2 && actor.y + actor.h >= p.y) landing = Math.min(landing, p.y);
  }
  if (landing !== Infinity) { actor.y = landing - actor.h; actor.vy = 0; actor.grounded = true; }
  if (actor.y > GROUND+260) { actor.y = GROUND - actor.h; actor.vy = 0; }
}

function supportOf(actor,world) {
  const x=center(actor).x,y=actor.y+actor.h;
  return world.platforms.find(p=>Math.abs(p.y-y)<3&&x>=p.x&&x<=p.x+p.w&&!p.holes?.some(h=>x>h.x&&x<h.x+h.w));
}
function floorOf(actor,world,support=supportOf(actor,world)) {
  const feet=support?.y??actor.y+actor.h;
  return world.floors.reduce((best,y,i)=>Math.abs(y-feet)<Math.abs(world.floors[best]-feet)?i:best,0);
}
function followConnection(actor,player,world,dt) {
  if(!world.connections?.length||!world.floors?.length)return false;
  const standing=supportOf(actor,world),targetSupport=player.grounded!==false?supportOf(player,world):null;
  const targetGrounded=!!targetSupport,from=floorOf(actor,world,standing),targetFlight=targetSupport?.stair?world.stairs?.find(s=>s.id===targetSupport.stairId):null;
  const targetFloor=targetFlight?(player.vx*targetFlight.dir>0?targetFlight.to:player.vx*targetFlight.dir<0?targetFlight.from:floorOf(player,world,targetSupport)):floorOf(player,world,targetSupport);
  const ownFlight=standing?.stair?world.stairs?.find(s=>s.id===standing.stairId):null;
  actor.climbIntent=0;actor.ladderTarget=null;
  if(targetGrounded){
    if(actor.navFloor===targetFloor)actor.navStable=(actor.navStable||0)+dt;
    else{actor.navFloor=targetFloor;actor.navStable=0;}
  }else actor.navStable=0;
  const clearRoute=()=>{actor.route=null;actor.climbIntent=0;actor.ladderTarget=null;};
  if(actor.route){
    const r=actor.route,end=r.up?r.connection.upper:r.connection.lower;
    r.phase ||= actor.climbing!=null?'traverse':'approach';
    const exitDirection=r.up?r.connection.dir:-r.connection.dir;
    const reached=r.connection.kind==='stairs'?(center(actor).x-end.x)*exitDirection>=-2&&Math.abs(center(actor).x-end.x)<60:Math.abs(center(actor).x-end.x)<14;
    if(actor.climbing==null&&actor.grounded&&Math.abs(actor.y+actor.h-end.y)<3&&reached){
      actor.lastRoute={key:r.connection.kind+':'+r.connection.id,up:r.up};actor.routeCooldown=.8;clearRoute();
    }else if(r.phase==='approach'&&(!targetGrounded||targetFloor===from&& !ownFlight || standing&&from!==(r.up?r.connection.from:r.connection.to))){
      clearRoute();
    }
  }
  if(actor.grounded&&targetGrounded&&Math.abs(center(actor).y-center(player).y)<48&&Math.abs(center(actor).x-center(player).x)<120)return false;
  if(!actor.route&&targetGrounded&&actor.grounded&&actor.navStable>=.22){
    if(ownFlight&&Math.abs(actor.y+actor.h-targetSupport.y)>45){
      actor.route={connection:ownFlight,up:targetSupport.y<actor.y+actor.h,phase:'traverse'};
    }else if(from!==targetFloor){
      const queue=[{floor:from,path:[]}],seen=new Set([from]);let path;
      while(queue.length){
        const node=queue.shift();if(node.floor===targetFloor){path=node.path;break;}
        const options=world.connections.filter(c=>c.from===node.floor||c.to===node.floor).filter(c=>{
          const up=c.from===node.floor;return !(actor.routeCooldown>0&&actor.lastRoute?.key===c.kind+':'+c.id&&actor.lastRoute.up!==up);
        }).sort((a,b)=>{
          const cost=c=>{const up=c.from===node.floor,start=up?c.lower:c.upper,end=up?c.upper:c.lower;
            return Math.abs(start.x-center(actor).x)+Math.abs(end.x-center(player).x)*.45+(targetFlight&&c!==targetFlight?300:0);};
          return cost(a)-cost(b);
        });
        for(const connection of options){const up=connection.from===node.floor,next=up?connection.to:connection.from;
          if(!seen.has(next)){seen.add(next);queue.push({floor:next,path:[...node.path,{connection,up,phase:'approach'}]});}
        }
      }
      if(path?.length)actor.route=path[0];
    }
  }
  if(!actor.route)return false;
  const r=actor.route,{connection,up}=r,start=up?connection.lower:connection.upper,end=up?connection.upper:connection.lower;
  actor.state='chase';
  if(r.phase==='approach'){
    const dx=start.x-center(actor).x;
    actor.vx=Math.sign(dx)*Math.min(actor.speed,Math.abs(dx)/dt);
    if(connection.kind==='stairs'&&(ownFlight?.id===connection.id||Math.abs(dx)<22&&Math.abs(actor.y+actor.h-start.y)<24))r.phase='traverse';
    if(connection.kind==='ladder'&&targetGrounded&&Math.abs(dx)<18&&findLadder(actor,world,up?-1:1,connection.id))r.phase='traverse';
  }
  if(r.phase==='traverse'){
    if(connection.kind==='ladder'){actor.vx=0;actor.climbIntent=up?-1:1;actor.ladderTarget=connection.id;actor.state='climb';}
    else{
      const exitX=end.x+(up?connection.dir:-connection.dir)*(actor.w/2+6),dx=exitX-center(actor).x;
      actor.vx=Math.sign(dx)*Math.min(actor.speed,Math.abs(dx)/dt);
    }
  }
  actor.facing=Math.sign(actor.vx)||actor.facing;return true;
}
// Swept collision prevents fast bullets passing through narrow actors or platforms.
export function segmentHit(x1, y1, x2, y2, box, padding = 0) {
  let near = 0, far = 1;
  for (const [start, delta, min, max] of [[x1, x2 - x1, box.x - padding, box.x + box.w + padding], [y1, y2 - y1, box.y - padding, box.y + box.h + padding]]) {
    if (Math.abs(delta) < 1e-8) { if (start < min || start > max) return null; continue; }
    let a = (min - start) / delta, b = (max - start) / delta;
    if (a > b) [a, b] = [b, a]; near = Math.max(near, a); far = Math.min(far, b);
    if (near > far) return null;
  }
  return near;
}
export function lineOfSight(world, from, to) {
  return !world.platforms.some(p => !p.stair && segmentHit(from.x, from.y, to.x, to.y, p) !== null);
}
export function projectile(owner, from, to, damage, speed) {
  const dx = to.x - from.x, dy = to.y - from.y, length = Math.hypot(dx, dy) || 1;
  return { owner, x: from.x, y: from.y, vx: dx / length * speed, vy: dy / length * speed, damage, life: 2.2 };
}
export function incomingDamage(player, raw, sourceX, armor) {
  if (player.invuln > 0 || player.dodge > .1) return { damage: 0, blocked: false };
  const base = Math.max(2, raw * 100 / (100 + armor * 4));
  const front = (sourceX - center(player).x) * player.facing >= 0;
  if (player.blocking && front) {
    const cost = (12 + raw * .65) * (player.blockCostMultiplier ?? 1);
    if (player.stamina >= cost) { player.stamina -= cost; return { damage: Math.max(1, Math.round(base * .18)), blocked: true }; }
    player.stamina = 0; player.guardBreak = 1.2; player.blocking = false;
  }
  return { damage: Math.round(base), blocked: false };
}
export function updateEnemies(world, player, bullets, dt, damagePlayer) {
  const pc = center(player);
  for (const e of world.enemies) {
    if (e.dead) continue;
    for (const field of ['cooldown', 'flash', 'dodge', 'dodgeCooldown', 'jumpCooldown', 'drop','routeCooldown']) e[field] = Math.max(0, (e[field]||0) - dt);
    const ec = center(e), dx = pc.x - ec.x, dy = pc.y - ec.y, distance = Math.abs(dx);
    const aggro = distance < 600 && Math.abs(dy) < 430;
    if((aggro||e.route)&&!['windup','recover'].includes(e.state)&&!(e.dodge>0)&&followConnection(e,player,world,dt)){
      physics(e,world,dt,e.route?.connection.kind==='stairs'&&e.route.phase==='traverse'?e.route.connection.id:null);continue;
    }
    e.climbIntent=0;
    if (e.state === 'windup') {
      e.vx = 0; e.timer -= dt;
      if (e.timer <= 0) {
        if (e.role === 'gunner') bullets.push(projectile('enemy', { x: ec.x + e.facing * 20, y: ec.y - 4 }, { x: e.aimX, y: e.aimY }, e.damage, 430 + Math.min(world.depth, 20) * 5));
        else if (distance < (e.role === 'heavy' ? 82 : 64) && Math.abs(dy) < 55 && dx * e.facing > -10) damagePlayer(e.damage, ec.x);
        e.state = 'recover'; e.timer = e.role === 'heavy' ? .85 : .5; e.cooldown = e.role === 'gunner' ? 1.3 : .7;
      }
    } else if (e.state === 'recover') {
      e.vx = 0; e.timer -= dt; if (e.timer <= 0) e.state = 'chase';
    } else if (e.dodge > 0) {
      e.state = 'evade';
    } else {
      e.state = aggro ? 'chase' : 'patrol';
      if (aggro) {
        e.facing = Math.sign(dx) || e.facing;
        e.vx = e.facing * e.speed;
        if (e.role === 'gunner') e.vx = distance < 185 ? -e.facing * e.speed : distance < 300 ? 0 : e.vx;
        const danger = e.role !== 'heavy' && e.dodgeCooldown <= 0 && e.grounded &&
          ((distance < 110 && player.attack > .18) || bullets.some(b => b.owner === 'player' && Math.abs(b.x - ec.x) < 135 && Math.abs(b.y - ec.y) < 35 && (ec.x - b.x) * b.vx > 0));
        if (danger) {
          e.dodge = .24; e.dodgeCooldown = e.role === 'runner' ? 3 : 4.5; e.vx = -e.facing * 370; e.state = 'evade';
        } else {
          const canShoot = e.role === 'gunner' && distance < 530 && distance > 80 && lineOfSight(world, { x: ec.x, y: ec.y - 4 }, pc);
          const canSlash = e.role !== 'gunner' && distance < (e.role === 'heavy' ? 70 : 55) && Math.abs(dy) < 48;
          if (e.cooldown <= 0 && (canShoot || canSlash)) {
            e.state = 'windup'; e.timer = e.role === 'heavy' ? .65 : e.role === 'gunner' ? .72 : .36; e.vx = 0;
            e.aimX = pc.x + player.vx * .12; e.aimY = pc.y;
          }
        }
        if (e.state === 'chase' && e.grounded && e.jumpCooldown <= 0) {
          const step = world.platforms.find(p => !p.ground && !p.stair && p.y < e.y + e.h - 10 && e.y + e.h - p.y < 140 && ec.x > p.x - 100 && ec.x < p.x + p.w + 100 && pc.x > p.x - 80 && pc.x < p.x + p.w + 80);
          if ((dy < -45 && distance < 240 && step) || (e.role === 'runner' && distance > 95 && distance < 185)) {
            e.vy = -620; e.grounded = false; e.jumpCooldown = e.role === 'runner' ? 2.3 : 3;
            if (step && dy < -45) e.vx = Math.sign(step.x + step.w / 2 - ec.x) * e.speed;
          }
          if (dy > 70 && e.y + e.h < GROUND - 10 && (e.role !== 'gunner' || distance > 320)) { e.drop = .25; e.y += 5; }
        }
      } else {
        if (Math.abs(e.x - e.home) > 75) e.facing = e.x > e.home ? -1 : 1;
        e.vx = e.facing * e.speed * .25;
        const support=world.platforms.find(p=>Math.abs(p.y-e.y-e.h)<3&&center(e).x>=p.x&&center(e).x<=p.x+p.w);
        if(support&&!support.ground&&(e.x+e.vx*.3<support.x+6||e.x+e.w+e.vx*.3>support.x+support.w-6||support.holes?.some(h=>center(e).x+e.vx*.4>h.x-10&&center(e).x+e.vx*.4<h.x+h.w+10))){e.facing*=-1;e.vx=e.facing*e.speed*.25;}
      }
    }
    // Local separation keeps a group from occupying a single point.
    if (e.state === 'chase') for (const other of world.enemies) if (other !== e && !other.dead && Math.abs(other.x - e.x) < 30 && Math.abs(other.y - e.y) < 20) e.vx += Math.sign(e.x - other.x || 1) * 30;
    physics(e, world, dt,e.route?.connection.kind==='stairs'&&e.route.phase==='traverse'?e.route.connection.id:null);
  }
}
