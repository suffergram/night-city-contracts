import test from 'node:test';
import assert from 'node:assert/strict';
import { AIM_STEP, AIM_GUNS, aimAngle, aimOrigin, aimGeometry, aimedMuzzle, aimDirection, canAim, aimBodyFrame,aimBodySheet } from '../src/aim.js';

const hero = () => ({ x: 120, y: 200, w: 20, h: 54, facing: 1, activeWeapon: 'gun', grounded: true, vx: 0, vy: 0, aimAngle: 0 });
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} ≈ ${b}`);

test('forward aim uses whole redrawn bodies; idle, backward and airborne use their original bodies',()=>{
  const actor={...hero(),vx:245};
  for(let phase=0;phase<6;phase++){
    actor.strideTime=(phase+.1)/13;assert.equal(aimBodySheet(actor),phase===4?'aimRunContact':phase===5?'aimRunFix':'aimRun');assert.equal(aimBodyFrame(actor),12+phase);
  }
  for(const state of [{vx:0},{vx:-196},{grounded:false}])assert.equal(aimBodySheet({...actor,...state}),'aimRig');
});

test('cursor aim is continuous and mirrored left without flipping up/down', () => {
  for (const facing of [-1, 1]) for (let sector = -6; sector <= 6; sector++) {
    const actor = { ...hero(), facing }, pivot = aimOrigin(actor), angle = sector * AIM_STEP;
    actor.aimAngle = aimAngle(actor, { x: pivot.x + facing * Math.cos(angle) * 400, y: pivot.y + Math.sin(angle) * 400 });
    close(actor.aimAngle, angle);
    const dir = aimGeometry(actor).direction;
    close(dir.x, facing * Math.cos(angle)); close(dir.y, Math.sin(angle));
  }
  const actor = hero(), pivot = aimOrigin(actor);
  close(aimAngle(actor, { x: pivot.x + 400, y: pivot.y + 20 }), Math.atan2(20,400));
  close(aimAngle(actor, { x: pivot.x + 400, y: pivot.y + 80 }), Math.atan2(80,400));
  close(aimAngle(actor, null), 0);
});

test('fractional elevations retain authored poses while every shot direction intersects the cursor',()=>{
  for(const slot of ['gun','rifle','shotgun'])for(const facing of [-1,1])for(const degrees of [-89.7,-63.4,-7.3,2.7,14.2,37.8,72.1,89.2]){
    const actor={...hero(),activeWeapon:slot,facing},pivot=aimOrigin(actor),angle=degrees*Math.PI/180;
    const target={x:pivot.x+facing*Math.cos(angle)*340,y:pivot.y+Math.sin(angle)*340};
    actor.aimAngle=aimAngle(actor,target);close(actor.aimAngle,angle);
    const rig=aimGeometry(actor),snapped=aimGeometry({...actor,aimAngle:Math.round(angle/AIM_STEP)*AIM_STEP});
    assert.equal(rig.sheet,snapped.sheet);assert.equal(rig.frame,snapped.frame);
    const muzzle=aimedMuzzle(actor),direction=aimDirection(actor,target),distance=Math.hypot(target.x-muzzle.x,target.y-muzzle.y);
    close(muzzle.x+direction.x*distance,target.x);close(muzzle.y+direction.y*distance,target.y);
  }
});

test('world muzzle follows the registered pose and shot direction at every elevation and weapon', () => {
  for (const slot of ['gun', 'rifle', 'shotgun']) for (const facing of [-1, 1]) for (let sector = -6; sector <= 6; sector++) {
    const actor = { ...hero(), activeWeapon: slot, facing, aimAngle: sector * AIM_STEP };
    const pivot = aimOrigin(actor), muzzle = aimedMuzzle(actor), rig = aimGeometry(actor), dir = rig.direction;
    const gun = AIM_GUNS[slot], tipX = rig.weapon.x + rig.weapon.w * gun.muzzle[0], tipY = rig.weapon.y + rig.weapon.h * gun.muzzle[1];
    close(muzzle.x, actor.x + actor.w / 2 + (rig.weapon.grip.x + tipX * Math.cos(rig.angle) - tipY * Math.sin(rig.angle)) * facing);
    close(muzzle.y, actor.y + actor.h + rig.weapon.grip.y + tipX * Math.sin(rig.angle) + tipY * Math.cos(rig.angle));
    assert.ok((muzzle.x - pivot.x) * dir.x + (muzzle.y - pivot.y) * dir.y > 5);
    assert.ok(Number.isFinite(muzzle.x) && Number.isFinite(muzzle.y));
  }
});

test('firearm dimensions stay constant across arm poses, direction, locomotion and recoil', () => {
  for (const slot of ['gun','rifle','shotgun']) {
    const reference = aimGeometry({...hero(),activeWeapon:slot}).weapon;
    for(let sector=-6;sector<=6;sector++)for(const facing of [-1,1])for(const fireVisual of [0,.18]){
      const rig=aimGeometry({...hero(),activeWeapon:slot,aimAngle:sector*AIM_STEP,facing,fireVisual,vx:-200,grounded:false,vy:200});
      close(rig.weapon.w,reference.w);close(rig.weapon.h,reference.h);
    }
  }
});

test('steep and downward aiming use bent-elbow poses with small rotation corrections', () => {
  for (const slot of ['gun', 'rifle', 'shotgun']) for (let sector = -6; sector <= 6; sector++) {
    const actor = { ...hero(), activeWeapon: slot, aimAngle: sector * AIM_STEP };
    const rig = aimGeometry(actor);
    if (sector >= -3 && sector <= 0) {
      assert.equal(rig.sheet,'aimRig'); close(rig.rotation,actor.aimAngle);
    } else {
      assert.equal(rig.sheet,'aimExtremes');
      assert.ok(Math.abs(rig.rotation) <= Math.PI/6, 'shoulder cap stays within 30 degrees of its authored orientation');
      const frame = rig.frame; actor.fireVisual=.18;
      assert.equal(aimGeometry(actor).frame,frame+6,'recoil keeps the same anatomical pose family');
    }
  }
});

test('aim rig combines locomotion with hands and yields to reloads, katana, blocking and dodge', () => {
  const actor = hero();
  assert.ok(canAim(actor)); assert.ok(aimBodyFrame(actor) < 6);
  actor.vx = 200; assert.equal(aimBodyFrame(actor), 12);
  actor.vx = -200; assert.equal(aimBodyFrame(actor), 12);
  actor.grounded = false; actor.vy = -400; assert.equal(aimBodyFrame(actor), 19);
  actor.vy = 300; assert.equal(aimBodyFrame(actor), 22);
  for (const override of [{ reload: 1 }, { dodge: .2 }, { blocking: true }, { attack: .2 }, { activeWeapon: 'weapon' }]) assert.equal(canAim({ ...actor, ...override }), false);
});
