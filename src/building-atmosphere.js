import {ambientGlow,controlledLight,lightLevel,drawVentSteam,drawLampAtmosphere} from './ambient.js';

// Coordinates are normalized to each facade's opaque bounds, never its PNG padding.
export const BUILDING_EFFECTS={
  'housing-a':{
    lights:[
      {"rect":[0.23,0.67,0.31,0.05],"colour":"#68e2cd","mode":"strong","kind":"sign"},
      {"rect":[0.1,0.18,0.15,0.06],"colour":"#ffc789","mode":false,"kind":"window"},
      {"rect":[0.46,0.17,0.16,0.07],"colour":"#ffc789","mode":false,"kind":"window"},
      {"rect":[0.1,0.45,0.15,0.07],"colour":"#ffc789","mode":false,"kind":"window"},
      {"rect":[0.46,0.44,0.16,0.08],"colour":"#ffc789","mode":false,"kind":"window"},
      {"rect":[0.1,0.75,0.55,0.17],"colour":"#ffc789","mode":false,"kind":"window"}
    ],
    vents:[[0.83,0.028]],
    lamps:[[0.35,0.145,0.34],[0.35,0.42,0.62],[0.81,0.68,0.98]]
  },
  'housing-b':{
    lights:[
      {"rect":[0.07,0.725,0.24,0.045],"colour":"#70dfcb","mode":false,"kind":"sign"},
      {"rect":[0.39,0.725,0.22,0.045],"colour":"#f3a4bd","mode":"blink","kind":"sign"},
      {"rect":[0.08,0.17,0.12,0.1],"colour":"#ffc789","mode":false,"kind":"window"},
      {"rect":[0.32,0.17,0.15,0.1],"colour":"#ffc789","mode":false,"kind":"window"},
      {"rect":[0.66,0.17,0.14,0.1],"colour":"#ffc789","mode":false,"kind":"window"},
      {"rect":[0.08,0.47,0.12,0.1],"colour":"#ffc789","mode":false,"kind":"window"},
      {"rect":[0.32,0.47,0.15,0.1],"colour":"#ffc789","mode":false,"kind":"window"},
      {"rect":[0.66,0.47,0.14,0.1],"colour":"#ffc789","mode":false,"kind":"window"},
      {"rect":[0.07,0.8,0.24,0.13],"colour":"#ffc789","mode":false,"kind":"window"},
      {"rect":[0.39,0.8,0.21,0.13],"colour":"#ffc789","mode":false,"kind":"window"}
    ],
    vents:[[0.61,0.018]],
    lamps:[[0.833,0.187,0.38]]
  },
  'minimarket-a':{
    lights:[
      {"rect":[0.1,0.52,0.8,0.065],"colour":"#58e5d6","mode":"strong","kind":"sign"},
      {"rect":[0.12,0.23,0.28,0.13],"colour":"#ffc789","mode":false,"kind":"window"},
      {"rect":[0.47,0.23,0.25,0.13],"colour":"#ffc789","mode":false,"kind":"window"},
      {"rect":[0.1,0.69,0.36,0.2],"colour":"#ffc789","mode":false,"kind":"window"},
      {"rect":[0.49,0.69,0.2,0.2],"colour":"#ffc789","mode":false,"kind":"window"}
    ],
    vents:[[0.22,0.015]],
    lamps:[[0.775,0.23,0.49]],
    label:"24 / MART"
  },
  'minimarket-b':{
    lights:[
      {"rect":[0.33,0.54,0.35,0.065],"colour":"#f7d47d","mode":"blink","kind":"sign"},
      {"rect":[0.23,0.23,0.17,0.1],"colour":"#ffc789","mode":false,"kind":"window"},
      {"rect":[0.55,0.23,0.17,0.1],"colour":"#ffc789","mode":false,"kind":"window"},
      {"rect":[0.25,0.7,0.48,0.18],"colour":"#ffc789","mode":false,"kind":"window"}
    ],
    vents:[[0.85,0.026]],
    lamps:[[0.772,0.21,0.48],[0.935,0.65,0.98]]
  },
  'repair-a':{
    lights:[
      {"rect":[0.13,0.575,0.56,0.05],"colour":"#db93ee","mode":"strong","kind":"sign"},
      {"rect":[0.1,0.25,0.18,0.13],"colour":"#ffc789","mode":false,"kind":"window"},
      {"rect":[0.31,0.25,0.13,0.13],"colour":"#ffc789","mode":false,"kind":"window"},
      {"rect":[0.47,0.25,0.14,0.13],"colour":"#ffc789","mode":false,"kind":"window"},
      {"rect":[0.11,0.68,0.58,0.2],"colour":"#77cbd1","mode":false,"kind":"window"}
    ],
    vents:[[0.16,0.018]],
    lamps:[[0.84,0.2,0.5],[0.805,0.594,0.98]],
    signals:[[0.57,0.77],[0.62,0.83]]
  },
  'repair-b':{
    lights:[
      {"rect":[0.13,0.55,0.58,0.06],"colour":"#6adce4","mode":"blink","kind":"sign"},
      {"rect":[0.14,0.25,0.27,0.12],"colour":"#ffc789","mode":false,"kind":"window"},
      {"rect":[0.49,0.25,0.26,0.12],"colour":"#ffc789","mode":false,"kind":"window"},
      {"rect":[0.3,0.7,0.42,0.18],"colour":"#77cbd1","mode":false,"kind":"window"}
    ],
    vents:[[0.69,0.043]],
    lamps:[[0.805,0.22,0.5],[0.925,0.67,0.98]],
    signals:[[0.51,0.76],[0.66,0.82]]
  },
  'laundry-a':{
    lights:[
      {"rect":[0.18,0.555,0.6,0.06],"colour":"#ed8ba9","mode":"strong","kind":"sign"},
      {"rect":[0.15,0.23,0.19,0.1],"colour":"#ffc789","mode":false,"kind":"window"},
      {"rect":[0.51,0.23,0.17,0.1],"colour":"#ffc789","mode":false,"kind":"window"},
      {"rect":[0.23,0.68,0.46,0.18],"colour":"#b6dcd6","mode":false,"kind":"window"}
    ],
    vents:[[0.2,0.027]],
    lamps:[[0.76,0.22,0.48],[0.92,0.68,0.98]],
    washers:[[0.28,0.825,0.032],[0.38,0.825,0.032],[0.48,0.825,0.032],[0.58,0.825,0.032]]
  },
  'laundry-b':{
    lights:[
      {"rect":[0.36,0.54,0.48,0.045],"colour":"#e4cf8b","mode":false,"kind":"sign"},
      {"rect":[0.11,0.26,0.1,0.07],"colour":"#ffc789","mode":false,"kind":"window"},
      {"rect":[0.39,0.26,0.1,0.07],"colour":"#ffc789","mode":false,"kind":"window"},
      {"rect":[0.68,0.26,0.1,0.07],"colour":"#ffc789","mode":false,"kind":"window"},
      {"rect":[0.25,0.68,0.5,0.2],"colour":"#b6dcd6","mode":false,"kind":"window"}
    ],
    vents:[[0.205,0.03]],
    lamps:[[0.28,0.193,0.48],[0.56,0.193,0.48]],
    washers:[[0.32,0.82,0.025],[0.38,0.82,0.025],[0.44,0.82,0.025],[0.5,0.82,0.025],[0.56,0.82,0.025],[0.62,0.82,0.025],[0.68,0.82,0.025]]
  },
};
const masks=new WeakMap();
// Lens sizes inside the painted fixture housing (width/height of facade).
const LAMP_LENSES={
  'housing-a':[.060,.014], 'housing-b':[.012,.030],
  'minimarket-a':[.014,.034], 'minimarket-b':[.014,.038],
  'repair-a':[.064,.018], 'repair-b':[.012,.038],
  'laundry-a':[.014,.046], 'laundry-b':[.042,.014],
};
const clamp=n=>Math.max(0,Math.min(1,n));
function emitter(source,light){
  let cache=masks.get(source);if(!cache){cache=new Map();masks.set(source,cache);}
  const key=light.kind+':'+light.colour+':'+light.rect.join(',');if(cache.has(key))return cache.get(key);
  const [x,y,w,h]=light.rect,c=document.createElement('canvas');c.width=Math.max(1,Math.round(source.w*w));c.height=Math.max(1,Math.round(source.h*h));
  const a=c.getContext('2d',{willReadFrequently:true});a.drawImage(source.image,source.x+x*source.w,source.y+y*source.h,w*source.w,h*source.h,0,0,c.width,c.height);
  const pixels=a.getImageData(0,0,c.width,c.height),d=pixels.data,colour=light.colour.match(/[a-f\d]{2}/gi).map(n=>parseInt(n,16));
  for(let yy=0;yy<c.height;yy++)for(let xx=0;xx<c.width;xx++){
    const i=(yy*c.width+xx)*4,lum=d[i]*.2126+d[i+1]*.7152+d[i+2]*.0722;
    const detail=light.kind==='window'?clamp((145-lum)/105)*.56:light.kind==='lamp'?clamp((lum-25)/80)*.95:clamp((lum-30)/85);
    const edge=clamp(Math.min(xx+1,yy+1,c.width-xx,c.height-yy)/2);
    d[i]=colour[0];d[i+1]=colour[1];d[i+2]=colour[2];d[i+3]*=detail*edge;
  }
  a.putImageData(pixels,0,0);cache.set(key,c);return c;
}
export function drawBuildingAtmosphere(ctx,d,source,time){
  const profile=BUILDING_EFFECTS[d.style];if(!profile||!source)return;
  const seed=d.x*11+d.w*3,x=d.x,y=d.y+1+source.contactInset*d.h/source.h;
  for(const [i,light]of profile.lights.entries()){
    let level=lightLevel(time,seed+i*37,light.mode);
    if(light.kind==='window'){
      const phase=((time+seed*.03+i*7)%47+47)%47,dark=clamp(Math.min((phase-31)/2,(42-phase)/2));
      level=controlledLight((1-dark*.88)*(.88+.08*Math.sin(time*.35+i)));
    }
    const [lx,ly,lw,lh]=light.rect,px=x+lx*d.w,py=y+ly*d.h;
    ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha*=level;ctx.drawImage(emitter(source,light),px,py,lw*d.w,lh*d.h);ctx.restore();
    ambientGlow(ctx,px+lw*d.w/2,py+lh*d.h/2,Math.max(lw*d.w,lh*d.h)*.9,light.colour,(light.kind==='window' ? .12 : .24)*level);
    if(profile.label&&light.kind==='sign'){
      ctx.save();ctx.globalAlpha*=level*.85;ctx.fillStyle=light.colour;ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.font=`600 ${Math.max(7,lh*d.h*.68)}px monospace`;ctx.fillText(profile.label,px+lw*d.w/2,py+lh*d.h/2,lw*d.w*.9);ctx.restore();
    }
  }
  for(const [i,[vx,vy]]of profile.vents.entries()){
    const phase=((time+seed*.02+i*5)%23+23)%23,strength=clamp(Math.min(phase/2,(18-phase)/3));
    if(strength){ctx.save();ctx.globalAlpha*=strength;drawVentSteam(ctx,x+vx*d.w,y+vy*d.h,54,time,seed+i,1.5);ctx.restore();}
  }
  for(const [i,[lx,ly,floor]]of profile.lamps.entries()){
    const px=x+lx*d.w,py=y+ly*d.h;
    const level=lightLevel(time,seed+i,i%3===1?'strong':false),colour='#ffda9c';
    const [lw,lh]=LAMP_LENSES[d.style];
    const lens={kind:'lamp',colour,rect:[lx-lw/2,ly-lh/2,lw,lh]};
    // Illuminate the original lens pixels, retaining the painted housing and grille.
    ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha*=level;
    ctx.drawImage(emitter(source,lens),px-lw*d.w/2,py-lh*d.h/2,lw*d.w,lh*d.h);ctx.restore();
    ambientGlow(ctx,px,py,Math.max(16,lw*d.w*1.8),colour,.90*level);
    // A soft wash on the concrete immediately below the fixture.
    ctx.save();ctx.translate(px,py+13);ctx.scale(.8,1.25);
    ambientGlow(ctx,0,0,32,colour,.44*level);ctx.restore();
    drawLampAtmosphere(ctx,px,py,(floor-ly)*d.h,time,seed+i,level);
  }
  for(const [i,[wx,wy,wr]]of (profile.washers||[]).entries()){
    const px=x+wx*d.w,py=y+wy*d.h,r=wr*d.w,angle=time*(i%2?-.75:.9)+i*2;
    ctx.save();ctx.beginPath();ctx.arc(px,py,r,0,Math.PI*2);ctx.clip();
    ctx.globalAlpha*=controlledLight(.55);ctx.strokeStyle='#bfebe8';ctx.lineWidth=.9;
    ctx.beginPath();ctx.arc(px,py,r*.65,angle,angle+Math.PI*.72);ctx.stroke();ctx.beginPath();ctx.arc(px,py,r*.32,angle+Math.PI,angle+Math.PI*1.65);ctx.stroke();ctx.restore();
  }
  for(const [i,[sx,sy]]of (profile.signals||[]).entries()){
    const level=lightLevel(time,seed+i*23,i?'blink':'strong'),colour=i?'#e897c8':'#75e3d9';
    const px=x+sx*d.w,py=y+sy*d.h;
    ambientGlow(ctx,px+1,py+.75,7,colour,.48*level);
    ctx.save();ctx.globalAlpha*=level;ctx.fillStyle=colour;ctx.fillRect(px,py,2,1.5);ctx.restore();
  }
}
