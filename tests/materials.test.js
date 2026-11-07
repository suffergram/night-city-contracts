import test from 'node:test';
import assert from 'node:assert/strict';
import { materialAt, materialPose, tintLeather } from '../src/material-masks.js';

test('equipment masks protect katana, face, collar and chrome in the inventory pose',()=>{
  const pose=materialPose('hero',0);
  assert.equal(materialAt(pose,.70,.69,70,70,70),0,'dark blade pixels stay neutral too');
  assert.equal(materialAt(pose,.53,.12,140,90,80),0,'skin cannot inherit jacket colours');
  assert.equal(materialAt(pose,.49,.25,30,130,150),0,'head gear does not tint the collar');
  assert.equal(materialAt(pose,.28,.46,60,60,60),0,'dark cyberarm stays protected');
  assert.equal(materialAt(pose,.55,.13,30,140,160),4,'only eye implant can inherit head accent');
  assert.equal(materialAt(pose,.35,.25,90,42,42),1);
  assert.equal(materialAt(pose,.35,.73,60,60,60),2);
  assert.equal(materialAt(pose,.33,.94,60,60,60),3);
  assert.equal(materialAt(pose,.33,.94,160,160,160),0,'bright boot hardware retains its metal shading');
  assert.equal(materialAt(pose,.39,.64,90,42,42),0,'red trouser trim does not inherit jacket dye');
});

test('protected blade geometry remains protected in every authored katana pose',()=>{
  for(const sheet of ['hero','actions','utility'])for(let frame=0;frame<36;frame++){
    const pose=materialPose(sheet,frame);
    for(const [ax,ay,bx,by]of pose.blades)for(const t of [0,.25,.5,.75,1]){
      assert.equal(materialAt(pose,ax+(bx-ax)*t,ay+(by-ay)*t,60,60,60),0,`${sheet}/${frame}`);
    }
  }
});

test('leg and footwear regions follow jump and roll limbs instead of image height',()=>{
  const jump=materialPose('hero',14),roll=materialPose('hero',20);
  assert.equal(materialAt(jump,.58,.59,60,60,60),2,'raised thigh remains trousers');
  assert.equal(materialAt(jump,.57,.73,60,60,60),3,'airborne boot is above the old bottom band');
  assert.equal(materialAt(roll,.82,.40,60,60,60),3,'upside-down boot remains footwear');
  for(const sheet of ['hero','actions','utility','longgunUtility','aimRig','aimExtremes'])for(let f=0;f<36;f++)assert.doesNotThrow(()=>materialAt(materialPose(sheet,f),.5,.5,60,60,60));
});

test('fabric tint preserves luminance and leaves metal highlights unchanged',()=>{
  const tone=[38,57,76],tinted=tintLeather(55,55,55,tone);
  const light=rgb=>rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
  assert.ok(Math.abs(light(tinted)-55)<1);
  assert.ok(tinted[2]>tinted[0]);
  assert.deepEqual(tintLeather(165,170,175,tone),[165,170,175]);
});
