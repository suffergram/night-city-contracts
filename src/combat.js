import { GROUND } from './world.js';
import {useStairwell} from './stairwells.js';

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
  actor.stairwellCooldown=Math.max(0,(actor.stairwellCooldown||0)-dt);
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
    if(connection.kind==='stairwell'&&Math.abs(dx)<18&&actor.grounded&&Math.abs(actor.y+actor.h-start.y)<12)r.phase='traverse';
  }
  if(r.phase==='traverse'){
    if(connection.kind==='stairwell'){actor.vx=0;useStairwell(actor,connection,up);}
    else if(connection.kind==='ladder'){actor.vx=0;actor.climbIntent=up?-1:1;actor.ladderTarget=connection.id;actor.state='climb';}
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
export function projectile(owner, from, to, damage, speed,ballistics={}) {
  const dx = to.x - from.x, dy = to.y - from.y, length = Math.hypot(dx, dy) || 1;
  return { owner, x: from.x, y: from.y, vx: dx / length * speed, vy: dy / length * speed, damage, life: 2.2,range:ballistics.range??680,traveled:0,falloffStart:ballistics.falloffStart??680,minMultiplier:ballistics.minMultiplier??1 };
}
export function projectileDamage(b,distance=b.traveled||0){
  if(distance>b.range)return 0;
  const falloff=Math.max(0,Math.min(1,(distance-b.falloffStart)/Math.max(1,b.range-b.falloffStart)));
  return Math.max(1,Math.round(b.damage*(1-falloff*(1-b.minMultiplier))));
}
export function projectileStep(b,dt,bounds=null){
  const speed=Math.hypot(b.vx,b.vy),ux=b.vx/speed||0,uy=b.vy/speed||0;
  let distance=Math.max(0,Math.min(speed*dt,speed*b.life,(b.range??680)-(b.traveled||0)));
  if(bounds){
    if(b.x<bounds.left||b.x>bounds.right||b.y<bounds.top||b.y>bounds.bottom)distance=0;
    else for(const [position,direction,lo,hi]of [[b.x,ux,bounds.left,bounds.right],[b.y,uy,bounds.top,bounds.bottom]]){
      if(direction)distance=Math.min(distance,Math.max(0,((direction>0?hi:lo)-position)/direction));
    }
  }
  return {x:b.x+ux*distance,y:b.y+uy*distance,distance,expired:distance<speed*dt-1e-6||(b.traveled||0)+distance>=(b.range??680)-1e-6||b.life<=dt};
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
export const ENEMY_TACTICS = {
  heavy: { reach:84,hitReach:98,windup:.65,recover:.75,cooldown:.8 },
  gunner: { windup:.22,recover:.24,cooldown:.85,dodgeCooldown:1.2,dodgeSpeed:340,dodgeTime:.24 },
  runner: { reach:68,hitReach:80,windup:.3,recover:.32,cooldown:.55,dodgeCooldown:.95,dodgeSpeed:360,dodgeTime:.26,dashCooldown:1.65,dashSpeed:440 },
};
function incomingBullet(actor,bullets){
  return bullets.some(b=>b.owner==='player'&&b.life>0&&segmentHit(b.x,b.y,b.x+b.vx*Math.min(.28,b.life),b.y+b.vy*Math.min(.28,b.life),actor,8)!==null);
}
// Commit to a dodge only when its whole path stays on the current walkway.
function safeDodge(world,actor,direction,speed,duration){
  const feet=actor.y+actor.h,cx=center(actor).x,end=cx+direction*speed*duration;
  if(end<actor.w/2+20||end>world.width-actor.w/2-20)return false;
  for(let t=0;t<=1;t+=1/12){
    const x=cx+(end-cx)*t;
    if(!world.platforms.some(p=>!p.stair&&Math.abs(p.y-feet)<3&&x>p.x+actor.w/2&&x<p.x+p.w-actor.w/2&&!p.holes?.some(h=>x>h.x-actor.w/2&&x<h.x+h.w+actor.w/2)))return false;
  }
  return true;
}
export function updateEnemies(world, player, bullets, dt, damagePlayer) {
  const pc = center(player);
  for (const e of world.enemies) {
    if (e.dead) continue;
    const tactics=ENEMY_TACTICS[e.role];
    for (const field of ['cooldown', 'flash', 'dodge', 'dodgeCooldown', 'dashCooldown', 'jumpCooldown', 'drop','routeCooldown']) e[field] = Math.max(0, (e[field]||0) - dt);
    const ec = center(e), dx = pc.x - ec.x, dy = pc.y - ec.y, distance = Math.abs(dx);
    const aggro = distance < (e.role==='gunner'?740:650) && Math.abs(dy) < 430;
    const bulletDanger=e.role!=='heavy'&&incomingBullet(e,bullets);
    const slashDanger=distance<120&&Math.abs(dy)<65&&player.attack>.18&&dx*player.facing<12;
    const tooClose=e.role==='gunner'&&distance<175&&Math.abs(dy)<65;
    if(aggro&&e.role!=='heavy'&&e.grounded&&e.climbing==null&&e.dodge<=0&&e.dodgeCooldown<=0&&(bulletDanger||slashDanger||tooClose)){
      const away=-Math.sign(dx)||e.facing;
      const forwardHop=e.role==='runner'&&bulletDanger;
      const preferred=forwardHop?-away:away;
      const direction=safeDodge(world,e,preferred,tactics.dodgeSpeed,tactics.dodgeTime)?preferred:
        !forwardHop&&bulletDanger&&!tooClose&&safeDodge(world,e,-preferred,tactics.dodgeSpeed,tactics.dodgeTime)?-preferred:0;
      if(direction){
        e.dodge=tactics.dodgeTime;e.dodgeCooldown=tactics.dodgeCooldown;e.vx=direction*tactics.dodgeSpeed;e.state='evade';e.evadeKind='retreat';e.timer=0;
        // Bullet evasion closes on the hero; blade evasion remains defensive.
        if(e.role==='runner'&&bulletDanger){e.vy=-330;e.grounded=false;e.evadeKind='hop';}
      }
    }
    if((aggro||e.route)&&!['windup','recover'].includes(e.state)&&!(e.dodge>0)&&followConnection(e,player,world,dt)){
      physics(e,world,dt,e.route?.connection.kind==='stairs'&&e.route.phase==='traverse'?e.route.connection.id:null);continue;
    }
    e.climbIntent=0;
    if (e.dodge > 0) {
      e.state='evade';
    } else if (e.state === 'windup') {
      e.vx = 0; e.timer -= dt;
      if(e.role==='gunner'&&e.timer>.09){e.facing=Math.sign(dx)||e.facing;e.aimX=pc.x+player.vx*.1;e.aimY=pc.y;}
      if (e.timer <= 0) {
        if (e.role === 'gunner') bullets.push(projectile('enemy', { x: ec.x + e.facing * 20, y: ec.y - 4 }, { x: e.aimX, y: e.aimY }, e.damage, 430 + Math.min(world.depth, 20) * 5));
        else if (distance < tactics.hitReach && Math.abs(dy) < 55 && dx * e.facing > -10) damagePlayer(e.damage, ec.x);
        e.state = 'recover'; e.timer = tactics.recover; e.cooldown = tactics.cooldown;
      }
    } else if (e.state === 'recover') {
      e.vx = 0; e.timer -= dt; if (e.timer <= 0) e.state = 'chase';
    } else {
      e.state = aggro ? 'chase' : 'patrol';
      if (aggro) {
        e.facing = Math.sign(dx) || e.facing;
        e.vx = e.facing * e.speed;
        if (e.role === 'gunner') e.vx = distance < 280 ? -e.facing * e.speed : distance < 460 ? 0 : e.vx;
        const trapped=e.role==='gunner'&&e.grounded&&e.vx*e.facing<0&&!safeDodge(world,e,-e.facing,e.speed,.2);
        if(trapped)e.vx=0;
        {
          const canShoot = e.role === 'gunner' && distance < 680 && distance > (trapped?65:175) && lineOfSight(world, { x: ec.x, y: ec.y - 4 }, pc);
          const canSlash = e.role !== 'gunner' && distance < tactics.reach && Math.abs(dy) < 48;
          if (e.cooldown <= 0 && (canShoot || canSlash)) {
            e.state = 'windup'; e.timer = tactics.windup; e.vx = 0;
            e.aimX = pc.x + player.vx * .12; e.aimY = pc.y;
          }
        }
        if(e.role==='runner'&&e.state==='chase'&&e.grounded&&Math.abs(dy)<40&&distance>140&&distance<390&&e.dashCooldown<=0&&e.dodgeCooldown<=0&&!bulletDanger){
          const duration=Math.min(.28,(distance-70)/tactics.dashSpeed);
          if(safeDodge(world,e,e.facing,tactics.dashSpeed,duration)){
            e.dodge=duration;e.dashCooldown=tactics.dashCooldown;e.dodgeCooldown=.5;e.vx=e.facing*tactics.dashSpeed;e.state='evade';e.evadeKind='advance';
          }
        }
        if (e.state === 'chase' && e.grounded && e.jumpCooldown <= 0) {
          const step = world.platforms.find(p => !p.ground && !p.stair && p.y < e.y + e.h - 10 && e.y + e.h - p.y < 140 && ec.x > p.x - 100 && ec.x < p.x + p.w + 100 && pc.x > p.x - 80 && pc.x < p.x + p.w + 80);
          if (dy < -45 && distance < 240 && step) {
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
