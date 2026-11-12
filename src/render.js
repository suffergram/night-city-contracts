import { GROUND } from './world.js';
import { drawMercenary } from './character.js';
import { skillEffects } from './skills.js';
import { drawRasterActor } from './raster.js';
import { drawRasterBackdrop, drawRasterEnvironment, drawRasterForeground, HUMAN_SCALE } from './environment.js';
import { ACTOR_HEIGHT, spriteHeight, WEAPONS } from './weapons.js';
import { animationInfo } from './animation.js';
import { canAim, aimedMuzzle, aimDirection } from './aim.js';
import {findLadder} from './combat.js';

export function drawWorld(ctx, canvas, state) {
  const { mode, world, player: p, profile, camera,cameraY=0, time, particles, floats, bullets, shake, mouse } = state;
  const W = canvas.width, H = canvas.height;
  const rect = (x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };
  const line = (x1, y1, x2, y2, color, width = 1) => { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
  const ellipse = (x, y, rx, ry, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); };
  const text = (value, x, y, size = 12, color = '#4ce3e6') => { ctx.fillStyle = color; ctx.font = `bold ${size}px Consolas,monospace`; ctx.textAlign = 'center'; ctx.fillText(value, x, y); };
  const glow = (x, y, radius, color) => { const g = ctx.createRadialGradient(x, y, 0, x, y, radius); g.addColorStop(0, color); g.addColorStop(1, 'transparent'); ctx.fillStyle = g; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2); };
  ctx.clearRect(0, 0, W, H);
  if (!drawRasterBackdrop(ctx, canvas, camera,time,world,cameraY)) rect(0, 0, W, H, '#101528');
  ctx.save(); ctx.translate(-Math.round(camera) + (shake > 0 ? Math.sin(time * 90) * 3 : 0), -Math.round(cameraY));
  if (!drawRasterEnvironment(ctx, canvas, world, mode, camera,time,cameraY)) {
    rect(camera, GROUND, W, H - GROUND, '#151b29');
    for (const platform of world.platforms) if (!platform.ground) rect(platform.x, platform.y, platform.w, platform.h, '#343d50');
  }
  if (mode === 'hub') {
    actor(312, GROUND - ACTOR_HEIGHT, 1, 'merchant', { h: ACTOR_HEIGHT, grounded: true });
    actor(800, GROUND - ACTOR_HEIGHT, -1, 'trainer', { h: ACTOR_HEIGHT, grounded: true });
    text('МИРА / ОРУЖЕЙНИК', 340, GROUND - HUMAN_SCALE.arms.height - 12, 9, '#f8bed7');
    text('ОРИН / РИПЕР', 800, GROUND - HUMAN_SCALE.clinic.height - 12, 9, '#a0f6ef');
    glow(565, GROUND - 50, 80, '#29e6cd18');
  }
  for (const c of world.chests) if (!c.open) glow(c.x + 18, c.y + 10, 27, '#f2e35b20');
  const scanner = skillEffects(profile).scanner;
  for (const e of world.enemies) {
    if (e.dead || e.x < camera - 100 || e.x > camera + W + 100||e.y<cameraY-120||e.y>cameraY+H+100) continue;
    if (e.state === 'windup' && e.role === 'gunner') { ctx.setLineDash([5, 5]); line(e.x + e.w / 2, e.y + 20, e.aimX, e.aimY, '#ff486a99'); ctx.setLineDash([]); }
    actor(e.x, e.y, e.facing, e.role, e);
    if (scanner) text(`${({ gunner: 'СТРЕЛОК', runner: 'САМУРАЙ', heavy: 'ШТУРМ' })[e.role]} ${Math.ceil(e.hp)}/${e.maxHp} / ${e.state === 'recover' ? 'УЯЗВИМ' : e.state === 'windup' ? 'АТАКА' : 'ПОИСК'}`, e.x + e.w / 2, e.y - 26, 8, '#6aefec');
    if (e.state === 'windup') text(e.role === 'gunner' ? 'ПРИЦЕЛ' : '!', e.x + e.w / 2, e.y - 14, 11, '#ff5d68');
    if (e.hp < e.maxHp) { rect(e.x - 3, e.y - 6, e.w + 6, 3, '#232b44'); rect(e.x - 3, e.y - 6, (e.w + 6) * Math.max(0, e.hp / e.maxHp), 3, '#ff6976'); }
  }
  actor(p.x, p.y, p.facing, 'hero', p);
  if(mode!=='hub'&&(p.climbing!=null||findLadder(p,world)))text('W / S · ЛЕСТНИЦА',p.x+p.w/2,p.y-16,8,'#a5f4e4');
  if (mouse.active && canAim(p)) {
    const tip = aimedMuzzle(p), direction = aimDirection(p,{x:mouse.x+camera,y:mouse.y+cameraY});
    const distance = Math.min(WEAPONS[p.activeWeapon].range,Math.hypot(mouse.x + camera - tip.x, mouse.y+cameraY - tip.y));
    const end = { x: tip.x + direction.x * distance, y: tip.y + direction.y * distance };
    line(tip.x + direction.x * 5, tip.y + direction.y * 5, end.x, end.y, '#f7ef5525');
    ellipse(end.x, end.y, 1.8, 1.8, '#f7ef55');
  }
  for (const b of bullets) line(b.x - b.vx * .012, b.y - b.vy * .012, b.x, b.y, b.owner === 'player' ? '#f5f16c' : '#ff6386', 1.8);
  for (const particle of particles) { ctx.globalAlpha = Math.min(1, particle.life * 2); rect(particle.x, particle.y, 2, 2, particle.color); } ctx.globalAlpha = 1;
  drawRasterForeground(ctx,canvas,world,camera,cameraY,time);
  for (const f of floats) { ctx.globalAlpha = Math.min(1, f.life * 2); text(f.text, f.x, f.y, 10, f.color); } ctx.globalAlpha = 1;
  ctx.restore();
  // Navigation is rendered separately inside the biomonitor HUD.
  // Weather is intentionally absent; combat feedback is independent of scenery.
  if(!world.towerScene){const vignette = ctx.createRadialGradient(W / 2, 320, 200, W / 2, 320, W * .8); vignette.addColorStop(0, '#02031200'); vignette.addColorStop(1, '#02031277'); ctx.fillStyle = vignette; ctx.fillRect(0, 0, W, H);}
  if (mouse.active) { const x = mouse.x, y = mouse.y; line(x - 8, y, x - 3, y, '#f7ef55'); line(x + 3, y, x + 8, y, '#f7ef55'); line(x, y - 8, x, y - 3, '#f7ef55'); line(x, y + 3, x, y + 8, '#f7ef55'); }

  function actor(x, y, facing, type, actorState = {}) {
    const hero = type === 'hero', feet = y + (actorState.h || ACTOR_HEIGHT), height = spriteHeight(actorState);
    ctx.save(); ctx.translate(x + (actorState.w || 24) / 2, feet); ctx.scale(facing, 1);
    if (hero && p.invuln > 0 && Math.floor(time * 20) % 2) ctx.globalAlpha = .45;
    const body = { ...actorState, vx: actorState.vx || 0, grounded: actorState.grounded ?? true };
    if (body.grounded) ellipse(0, 1, 15, 2.5, '#02071877');
    if (actorState.flash > 0) ctx.filter = 'brightness(1.7)';
    if (!drawRasterActor(ctx, body, type, hero ? profile.equipment : null, { height })) drawMercenary(ctx, -height * .28, -height, height * 260 / 440, height, hero ? profile.equipment : null, { role: type, pose: 'idle' });
    if (hero && p.blocking) line(22, -43, 26, -14, '#6de8e6a0', 2);
    if (hero && p.attack > 0 && p.attack < WEAPONS.weapon.duration - animationInfo(p).contactAt && WEAPONS[p.activeWeapon]?.kind === 'melee' && profile.equipment.weapon) { ctx.strokeStyle = '#c3eaf188'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(7, -32, WEAPONS.weapon.reach*.8, -.8, 1); ctx.stroke(); }
    ctx.restore();
  }
}

export function drawMinimap(ctx, canvas, world, player) {
  const {width:w,height:h}=canvas,top=world.top||0,bottom=GROUND+20;
  const px=x=>8+x/world.width*(w-16),py=y=>8+(y-top)/(bottom-top)*(h-16);
  ctx.clearRect(0,0,w,h);ctx.save();ctx.strokeStyle='#67828c';ctx.lineWidth=1;
  for(const p of world.platforms){ctx.beginPath();ctx.moveTo(px(p.x),py(p.y));ctx.lineTo(px(p.x+p.w),py(p.y));ctx.stroke();}
  ctx.strokeStyle='#b4a563';for(const l of world.ladders||[]){ctx.beginPath();ctx.moveTo(px(l.x),py(l.top));ctx.lineTo(px(l.x),py(l.bottom));ctx.stroke();}
  ctx.strokeStyle='#99aa8f';for(const c of world.connections||[])if(c.kind==='stairwell'){ctx.beginPath();ctx.moveTo(px(c.lower.x),py(c.lower.y));ctx.lineTo(px(c.upper.x),py(c.upper.y));ctx.stroke();}
  ctx.fillStyle=world.kills===world.enemies.length?'#65f5bb':'#f65b80';ctx.fillRect(px(world.portal.x)-2,py(world.portal.y??GROUND)-3,4,4);
  ctx.fillStyle='#75eef2';ctx.fillRect(px(player.x+player.w/2)-2,py(player.y+player.h)-3,4,4);ctx.restore();
}
