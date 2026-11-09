import {lightLevel,controlledLight} from './ambient.js';

const clamp=n=>Math.max(0,Math.min(1,n));
const layers=new WeakMap();
const interiorLayers=new WeakMap();

// Register a painted lighting state to the existing unlit sprite, preserving geometry.
export function withInteriorLight(source,litImage,windows){
  if(!litImage)return null;
  const cached=interiorLayers.get(source);if(cached?.litImage===litImage)return cached.source;
  const sample=document.createElement('canvas');sample.width=litImage.width;sample.height=litImage.height;
  const s=sample.getContext('2d',{willReadFrequently:true});s.drawImage(litImage,0,0);
  const raw=s.getImageData(0,0,sample.width,sample.height).data;
  let left=sample.width,top=sample.height,right=0,bottom=0;
  for(let y=2;y<sample.height-2;y++)for(let x=2;x<sample.width-2;x++)if(raw[(y*sample.width+x)*4+3]>75){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  if(right<left||bottom<top)return null;
  const on=document.createElement('canvas');on.width=source.w;on.height=source.h;
  const a=on.getContext('2d',{willReadFrequently:true});a.drawImage(sample,left,top,right-left+1,bottom-top+1,0,0,on.width,on.height);
  const lit=a.getImageData(0,0,on.width,on.height);
  a.clearRect(0,0,on.width,on.height);a.drawImage(source.image,source.x,source.y,source.w,source.h,0,0,on.width,on.height);
  const dark=a.getImageData(0,0,on.width,on.height).data,e=lit.data;
  for(let y=0;y<on.height;y++)for(let x=0;x<on.width;x++){
    const i=(y*on.width+x)*4,nx=(x+.5)/on.width,ny=(y+.5)/on.height;
    let feather=0;
    for(const {rect:[wx,wy,ww,wh]}of windows){
      if(nx<wx||nx>wx+ww||ny<wy||ny>wy+wh)continue;
      feather=Math.max(feather,clamp(Math.min((nx-wx)*on.width,(wx+ww-nx)*on.width,(ny-wy)*on.height,(wy+wh-ny)*on.height)/3));
    }
    const gain=clamp((Math.max(e[i],e[i+1],e[i+2])-Math.max(dark[i],dark[i+1],dark[i+2])-8)/42);
    for(let c=0;c<3;c++)e[i+c]=Math.max(0,e[i+c]-dark[i+c]);
    e[i+3]=Math.min(e[i+3],dark[i+3])*gain*feather;
  }
  a.putImageData(lit,0,0);
  const result={...source,emission:on};interiorLayers.set(source,{litImage,source:result});return result;
}

// Geometry stays registered to the original sprite. Only its material is replaced.
export function withUnlitBase(source,offImage,cell,threshold=75){
  if(!offImage)return source;
  const original=source.image,sx=offImage.width/original.width,sy=offImage.height/original.height;
  const sample=document.createElement('canvas');sample.width=Math.max(1,Math.round(cell.w*sx));sample.height=Math.max(1,Math.round(cell.h*sy));
  const ctx=sample.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(offImage,cell.x*sx,cell.y*sy,cell.w*sx,cell.h*sy,0,0,sample.width,sample.height);
  const pixels=ctx.getImageData(0,0,sample.width,sample.height).data;
  let left=sample.width,top=sample.height,right=-1,bottom=-1;
  for(let y=2;y<sample.height-2;y++)for(let x=2;x<sample.width-2;x++)if(pixels[(y*sample.width+x)*4+3]>threshold){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
  if(right<left||bottom<top)return source;
  const base=document.createElement('canvas');base.width=source.w;base.height=source.h;
  const b=base.getContext('2d',{willReadFrequently:true});
  b.drawImage(sample,left,top,right-left+1,bottom-top+1,0,0,base.width,base.height);
  b.globalCompositeOperation='destination-in';b.drawImage(original,source.x,source.y,source.w,source.h,0,0,base.width,base.height);b.globalCompositeOperation='source-over';
  const on=document.createElement('canvas');on.width=source.w;on.height=source.h;
  const a=on.getContext('2d',{willReadFrequently:true});a.drawImage(original,source.x,source.y,source.w,source.h,0,0,on.width,on.height);
  const lit=a.getImageData(0,0,on.width,on.height).data,dark=b.getImageData(0,0,base.width,base.height).data;
  const emission=a.createImageData(on.width,on.height),e=emission.data;
  for(let i=0;i<e.length;i+=4){
    const high=Math.max(lit[i],lit[i+1],lit[i+2]),off=Math.max(dark[i],dark[i+1],dark[i+2]);
    const gain=clamp((high-off-8)/42)*clamp((high-75)/90);
    for(let c=0;c<3;c++)e[i+c]=Math.max(0,lit[i+c]-dark[i+c]);
    e[i+3]=lit[i+3]*gain;
  }
  a.putImageData(emission,0,0);
  return {...source,image:base,x:0,y:0,litSource:source,emission:on};
}

function splitEmission(source,lights){
  const w=source.w,h=source.h,all=source.emission.getContext('2d').getImageData(0,0,w,h);
  const regions=lights.map(light=>{
    const [x,y,rw,rh]=light.rect,px=light.window ? .008 : .025,py=light.window ? .012 : .065;
    const left=Math.max(0,Math.floor((x-px)*w)),top=Math.max(0,Math.floor((y-py)*h));
    const right=Math.min(w,Math.ceil((x+rw+px)*w)),bottom=Math.min(h,Math.ceil((y+rh+py)*h));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,right-left);canvas.height=Math.max(1,bottom-top);
    const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(canvas.width,canvas.height);
    return {canvas,ctx,pixels,left,top,right,bottom,rect:light.rect};
  });
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const n=(y*w+x)*4;if(!all.data[n+3])continue;
    let selected=-1,best=Infinity;
    for(let i=0;i<regions.length;i++){
      const r=regions[i];if(x<r.left||x>=r.right||y<r.top||y>=r.bottom)continue;
      const [lx,ly,lw,lh]=r.rect;
      const distance=Math.hypot(Math.max(lx*w-x,0,x-(lx+lw)*w)/w,Math.max(ly*h-y,0,y-(ly+lh)*h)/h);
      if(distance<best){selected=i;best=distance;}
    }
    if(selected<0)continue;
    const r=regions[selected],to=((y-r.top)*r.canvas.width+x-r.left)*4;
    r.pixels.data.set(all.data.subarray(n,n+4),to);all.data[n+3]=0;
  }
  const steady=document.createElement('canvas');steady.width=w;steady.height=h;steady.getContext('2d').putImageData(all,0,0);
  for(const r of regions)r.ctx.putImageData(r.pixels,0,0);
  return {steady,regions};
}

export function drawSpriteEmission(ctx,source,lights,x,y,w,h,time,seed){
  if(!source.emission)return;
  let data=layers.get(source);
  if(!data){data=splitEmission(source,lights);layers.set(source,data);}
  ctx.save();ctx.globalCompositeOperation='lighter';const alpha=ctx.globalAlpha;
  ctx.globalAlpha=alpha*lightLevel(time,seed,false);ctx.drawImage(data.steady,x,y,w,h);
  for(const [i,r]of data.regions.entries()){
    const light=lights[i];ctx.globalAlpha=alpha*controlledLight(light.level??lightLevel(time,seed+i*23,light.mode??light.unstable));
    ctx.drawImage(r.canvas,x+r.left/source.w*w,y+r.top/source.h*h,r.canvas.width/source.w*w,r.canvas.height/source.h*h);
  }
  ctx.restore();
}
