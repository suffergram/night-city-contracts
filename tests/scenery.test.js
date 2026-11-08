import test from 'node:test';
import assert from 'node:assert/strict';
import {LOCATION_SOURCE_SIZES,fitScenery,sceneryContactInset} from '../src/scenery-sizes.js';
import {generateLevel,GROUND} from '../src/world.js';
import {marketMerchandise,createDressing} from '../src/dressing.js';
import {MARKET_STALLS,marketStyle,isMarketStall,stallBody} from '../src/market-stalls.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);

test('all scenery sprites use one scale factor and remain anchored to the box bottom',()=>{
  for(const [w,h]of LOCATION_SOURCE_SIZES)for(const [bw,bh]of [[40,200],[300,50],[120,105],[200,85]]){
    const r=fitScenery(w,h,20,30,bw,bh);
    close(r.w/w,r.h/h);close(r.y+r.h,30+bh);
    assert.ok(r.x>=20-1e-7&&r.x+r.w<=20+bw+1e-7&&r.y>=30-1e-7);
  }
});

test('market stalls and port containers are generated with their artwork proportions',()=>{
  for(let seed=1;seed<=60;seed++)for(const kind of ['market','port']){
    const w=generateLevel(1,seed,kind);
    for(const d of w.decor){
      if(!isMarketStall(d.kind)&&d.kind!=='container')continue;
      const [sw,sh]=isMarketStall(d.kind)?marketStyle(d).size:LOCATION_SOURCE_SIZES[0];close(d.w/d.h,sw/sh);
    }
  }
});

test('market uses varied clusters of two or three stalls, distinct storefronts and irregular passages',()=>{
  const seen=new Set(),passages=new Set(),sizes=new Set();let triples=0,touching=0,separated=0;
  for(let seed=1;seed<=100;seed++){
    const world=generateLevel(1,seed,'market'),stalls=world.decor.filter(d=>isMarketStall(d.kind));
    const groups=Map.groupBy(stalls,d=>d.group),kinds=new Set(stalls.map(d=>d.kind));
    assert.equal(kinds.size,3,`missing market category for seed ${seed}`);
    assert.ok(groups.size>=3);
    let previous=null;
    for(const members of groups.values()){
      assert.ok(members.length===2||members.length===3);triples+=members.length===3;
      if(previous){const gap=members[0].x-previous.x-previous.w,hotel=world.decor.find(d=>d.kind==='marketHotel'&&d.x>previous.x&&d.x<members[0].x);assert.ok(gap>=74&&(hotel||gap<=186));passages.add(Math.round(gap));}
      for(let i=0;i<members.length;i++){
        const d=members[i];seen.add(d.style);sizes.add(Math.round(d.w));
        if(i){const last=members[i-1],gap=stallBody(d).left-stallBody(last).right;if(Math.abs(gap)<1e-7){touching++;assert.ok(d.x<last.x+last.w,'protruding canopies overlap while walls meet');}else{assert.ok(gap>=4-1e-7&&gap<=16+1e-7);separated++;}assert.notEqual(d.style,last.style);}
      }
      previous=members.at(-1);
    }
    for(const d of world.details.filter(d=>d.sprite==='clothesRack'))assert.ok(stalls.some(s=>s.kind==='clothesStall'&&s.x===d.ownerX));
  }
  assert.equal(seen.size,Object.keys(MARKET_STALLS).length);assert.ok(triples>30&&passages.size>30&&sizes.size>=8);
  assert.ok(touching>100&&separated>50);
});

test('scenery rests on its solid base rather than isolated transparent-edge pixels',()=>{
  const w=100,h=100,pixels=new Uint8ClampedArray(w*h*4);
  for(let x=20;x<80;x++)pixels[(96*w+x)*4+3]=255;
  pixels[(99*w+40)*4+3]=90;
  close(sceneryContactInset(pixels,w,h,{left:20,right:79,top:0,bottom:99}),3);
  close(sceneryContactInset(pixels,w,h,{left:20,right:79,top:0,bottom:96}),0);
});

test('produce is a small consistently sized extension of food stalls rather than filler between electronics stalls',()=>{
  let seen=0;
  for(let seed=1;seed<=80;seed++){
    const world=generateLevel(1,seed,'market'),produce=world.decor.filter(d=>d.kind==='produce');
    assert.ok(produce.length<=2);
    for(const d of produce){
      seen++;const owner=world.decor.find(s=>s.kind==='foodStall'&&s.x===d.ownerX);assert.ok(owner);
      close(d.w/d.h,293/139);close(d.h,26);close(d.y,GROUND);
      const gap=Math.min(Math.abs(d.x-owner.x-owner.w),Math.abs(owner.x-d.x-d.w));close(gap,1);
    }
    for(const d of world.details.filter(d=>['grill','spiceCart'].includes(d.sprite))){
      const owner=world.decor.find(s=>s.kind==='foodStall'&&s.x===d.ownerX);assert.ok(owner);
      const gap=Math.min(Math.abs(d.x-owner.x-owner.w),Math.abs(owner.x-d.x-d.w));close(gap,2);
    }
  }
  assert.ok(seen>30);
  const techOnly={kind:'market',seed:5,width:1600,platforms:[{id:0,x:0,y:GROUND,w:1600,ground:true}],decor:[300,600,900].map(x=>({kind:'techStall',x,y:GROUND-105,w:130,h:105})),floors:[GROUND]};
  assert.deepEqual(marketMerchandise(techOnly,GROUND),[]);
  assert.ok(createDressing(techOnly,5,GROUND).every(d=>!['grill','spiceCart'].includes(d.sprite)));
});
