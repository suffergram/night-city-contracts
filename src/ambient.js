const stamps=new Map();
const noise=n=>{const value=Math.sin(n*127.1+311.7)*43758.5453;return value-Math.floor(value);};

// Absolute game time keeps lights and motes stable across camera movement, pauses and frame rates.
export function lightLevel(time,seed,unstable=false) {
  const phase=noise(seed)*31;
  const shimmer=.86+.075*Math.sin(time*2.3+phase)+.035*Math.sin(time*11.7+phase*2);
  const cycle=((time+phase)%11+11)%11;
  return unstable&&(cycle<.13||cycle>.25&&cycle<.34||cycle>.49&&cycle<.55)?shimmer*.06:shimmer;
}
function stamp(colour) {
  if(stamps.has(colour))return stamps.get(colour);
  const c=document.createElement('canvas');c.width=c.height=96;
  const x=c.getContext('2d'),g=x.createRadialGradient(48,48,0,48,48,48);
  g.addColorStop(0,colour);g.addColorStop(.25,colour+'80');g.addColorStop(1,colour+'00');
  x.fillStyle=g;x.fillRect(0,0,96,96);stamps.set(colour,c);return c;
}
export function ambientGlow(ctx,x,y,radius,colour,alpha) {
  ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha*=alpha;
  ctx.drawImage(stamp(colour),x-radius,y-radius,radius*2,radius*2);ctx.restore();
}
export function lampMotes(time,seed,x,y,radius) {
  return Array.from({length:6},(_,i)=>{
    const p=noise(seed+i*17),speed=.45+noise(seed+i*31)*.7;
    return {x:x+Math.sin(time*speed+p*19)*radius*(.3+p),
      y:y+4+Math.cos(time*speed*.73+p*33)*radius*.65,
      alpha:.22+.48*(.5+.5*Math.sin(time*1.7+p*41)),size:.45+noise(seed+i*7)*.65};
  });
}
export function drawLampAtmosphere(ctx,x,y,height,time,seed,level) {
  // A faint cone through dry airborne dust, with a soft pool of light on the ground.
  ctx.save();ctx.globalCompositeOperation='screen';
  const cone=ctx.createLinearGradient(0,y,0,y+height);
  cone.addColorStop(0,'#ffce8315');cone.addColorStop(1,'#ffce8300');
  ctx.globalAlpha*=level;ctx.fillStyle=cone;ctx.beginPath();ctx.moveTo(x-3,y);ctx.lineTo(x+3,y);ctx.lineTo(x+height*.36,y+height);ctx.lineTo(x-height*.36,y+height);ctx.fill();
  ctx.restore();
  ctx.save();ctx.translate(x,y+height);ctx.scale(1,.18);ambientGlow(ctx,0,0,height*.46,'#ffc77f',.14*level);ctx.restore();
  for(const p of lampMotes(time,seed,x,y,height*.13)){
    ambientGlow(ctx,p.x,p.y,3,'#ffd897',p.alpha*.25*level);
    ctx.save();ctx.globalAlpha*=p.alpha*level;ctx.fillStyle='#ffe4aa';ctx.fillRect(p.x,p.y,p.size,p.size);ctx.restore();
  }
}
export function drawVentSteam(ctx,x,y,size,time,seed) {
  for(let i=0;i<4;i++){
    const phase=((time*.13+i/4+noise(seed))%1+1)%1;
    const drift=Math.sin(phase*4+seed)*size*.15;
    ambientGlow(ctx,x+drift+phase*size*.3,y-phase*size,size*(.15+phase*.4),'#9aa6b5',Math.sin(phase*Math.PI)*.075);
  }
}

const wrap=(value,span)=>((value%span)+span)%span;
export function dustMotes(time,seed,x,y,w,h){
  return Array.from({length:6},(_,i)=>{
    const n=seed+i*37;
    return {x:x+wrap(noise(n)*w+time*(2+noise(n+1)*5),w),
      y:y+wrap(noise(n+2)*h-time*(.8+noise(n+3)*2),h),
      alpha:.06+noise(n+4)*.12,size:.5+noise(n+5)*.6};
  });
}
export function cityTraffic(time,camera,width,density=1){
  const vehicles=[],span=1700;
  for(let lane=0;lane<Math.round(4*density);lane++){
    const direction=lane%2?1:-1,speed=12+noise(lane+9)*21,scroll=.08+lane*.018;
    const position=wrap(direction*time*speed+noise(lane+4)*span,span)-camera*scroll;
    const first=Math.floor((-position-30)/span),last=Math.ceil((width-position+30)/span);
    for(let tile=first;tile<=last;tile++){
      const x=position+tile*span;if(x< -30||x>width+30)continue;
      vehicles.push({x,y:75+lane*36+Math.sin(time*.3+lane)*2,direction,size:7+noise(lane+6)*5,colour:lane%2?'#74d9e0':'#ffa47b'});
    }
  }
  return vehicles;
}
export function drawCityTraffic(ctx,time,camera,width,metropolis){
  for(const v of cityTraffic(time,camera,width,metropolis?1.5:1)){
    ctx.save();ctx.globalAlpha*=.7;ctx.fillStyle='#172431';ctx.fillRect(v.x,v.y,v.size,3);
    const front=v.direction>0?v.x+v.size:v.x;
    ctx.strokeStyle=v.colour+'40';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(front-v.direction*15,v.y+2);ctx.lineTo(front,v.y+2);ctx.stroke();
    ctx.fillStyle=v.colour;ctx.fillRect(front,v.y+1,2,1);ambientGlow(ctx,front,v.y+1,6,v.colour,.18);ctx.restore();
  }
}
export function drawHologram(ctx,x,y,w,h,time,seed,colour='#58dfe5'){
  const phase=wrap(time*.22+noise(seed),1);
  ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.globalCompositeOperation='screen';
  ctx.globalAlpha*=.08+.04*Math.sin(time*1.3+seed);ctx.fillStyle=colour;ctx.fillRect(x,y,w,h);
  ctx.globalAlpha*=2;ctx.fillRect(x,y+phase*h,w,Math.max(1,h*.018));
  for(let row=0;row<3;row++){
    const yy=y+wrap(phase*h+row*h/3,h);ctx.fillRect(x+w*.08,yy,w*.84,.5);
  }
  ctx.restore();
}
export function screenEmission(r,g,b){
  const cyan=b>90&&g>90&&Math.min(g,b)>r*1.2;
  const red=r>140&&r>g*1.35&&b>g*.65;
  if(!cyan&&!red)return 0;
  const high=Math.max(r,g,b),low=Math.min(r,g,b);
  return Math.min(1,Math.max(0,(high-80)/140))*Math.min(1,Math.max(0,(high-low-25)/100));
}
const screenMasks=new Map();
export function drawScreenAnimation(ctx,source,rect,x,y,w,h,time,seed,key){
  if(!source)return;
  const cacheKey=key+':'+rect.join(',');
  if(!screenMasks.has(cacheKey)){
    const mask=document.createElement('canvas');mask.width=Math.max(1,Math.round(source.w*rect[2]));mask.height=Math.max(1,Math.round(source.h*rect[3]));
    const a=mask.getContext('2d');
    a.drawImage(source.image,source.x+source.w*rect[0],source.y+source.h*rect[1],source.w*rect[2],source.h*rect[3],0,0,mask.width,mask.height);
    const pixels=a.getImageData(0,0,mask.width,mask.height),d=pixels.data;
    for(let i=0;i<d.length;i+=4)d[i+3]*=screenEmission(d[i],d[i+1],d[i+2]);
    a.putImageData(pixels,0,0);screenMasks.set(cacheKey,mask);
  }
  const mask=screenMasks.get(cacheKey),band=Math.max(2,mask.height*.07),top=wrap(time*.22+noise(seed),1)*(mask.height+band)-band;
  ctx.save();const alpha=ctx.globalAlpha;ctx.globalCompositeOperation='screen';ctx.globalAlpha*=.10+.04*Math.sin(time*1.3+seed);ctx.drawImage(mask,x,y,w,h);
  const from=Math.max(0,top),to=Math.min(mask.height,top+band);
  if(to>from){ctx.globalAlpha=alpha*.42;ctx.drawImage(mask,0,from,mask.width,to-from,x,y+from/mask.height*h,w,(to-from)/mask.height*h);}
  ctx.restore();
}
export function drawCookingSteam(ctx,x,y,size,time,seed){
  const texture=stamp('#d6ddd8');
  ctx.save();
  for(let i=0;i<9;i++){
    const phase=wrap(time*.3+i/9+noise(seed),1),radius=size*(.10+phase*.22);
    const drift=Math.sin(phase*7+seed+i*.2)*size*.07+phase*size*.08;
    ctx.globalAlpha=.26*Math.sin(phase*Math.PI);
    ctx.drawImage(texture,x+drift-radius*.65,y-phase*size-radius,radius*1.3,radius*2);
  }
  ctx.restore();
}
export function drawStallLights(ctx,x,y,width,time,seed){
  ctx.save();ctx.strokeStyle='#302a21';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+width/2,y+5,x+width,y);ctx.stroke();
  for(let i=0;i<5;i++){
    const xx=x+width*(i+.5)/5,yy=y+Math.sin((i+.5)/5*Math.PI)*2,level=lightLevel(time,seed+i*13);
    ctx.fillStyle='#563924';ctx.fillRect(xx-1.5,yy-2,3,3);
    ctx.fillStyle='#ffdc9b';ctx.globalAlpha=level;ctx.fillRect(xx-1,yy,2,3);
    ambientGlow(ctx,xx,yy+1,13,'#ffb66c',.48*level);
  }
  ctx.restore();
}
export function drawHarbourHaze(ctx,camera,width,time,ground){
  ctx.save();ctx.beginPath();ctx.rect(camera,ground-130,width,130);ctx.clip();
  const texture=stamp('#c1cdd2');
  for(let x=Math.floor((camera-400)/350)*350;x<camera+width+350;x+=350){
    const drift=Math.sin(time*.11+x*.01)*60,y=ground-42+Math.sin(time*.16+x)*9;
    ctx.globalAlpha=.34;ctx.drawImage(texture,x+drift-200,y-55,600,125);
    ctx.globalAlpha=.20;ctx.drawImage(texture,x-drift-140,y-90,500,105);
  }
  ctx.restore();
}
export function electricalSparks(time,seed,x,y){
  const age=wrap(time+noise(seed)*13,8+noise(seed+3)*5);
  if(age>.55)return [];
  return Array.from({length:5},(_,i)=>{
    const t=age-i*.025,life=.28+noise(seed+i)*.16;
    return {x:x+(noise(seed+i*7)-.5)*110*t,y:y-(20+noise(seed+i*11)*45)*t+150*t*t,
      alpha:t>=0&&t<life?1-t/life:0};
  }).filter(p=>p.alpha>0);
}
export function drawElectricalFault(ctx,x,y,time,seed){
  for(const p of electricalSparks(time,seed,x,y)){
    ctx.save();ctx.globalAlpha*=p.alpha;ctx.fillStyle='#ffd887';ctx.fillRect(p.x,p.y,1.5,1.5);
    ambientGlow(ctx,p.x,p.y,4,'#ffc96b',.35);ctx.restore();
  }
}
export function drawSceneDust(ctx,camera,width,time,world,ground){
  const floors=world?.kind==='megablock'?world.floors:[ground];
  ctx.save();ctx.fillStyle='#c7d1cc';
  for(const y of floors)for(let x=Math.floor(camera/280)*280;x<camera+width;x+=280){
    for(const p of dustMotes(time,Math.floor(x/280)+y,x,y-155,280,145)){
      ctx.globalAlpha=p.alpha;ctx.fillRect(p.x,p.y,p.size,p.size);
    }
  }
  ctx.restore();
}
export function drawWarningBeacon(ctx,x,y,time,seed){
  const pulse=.2+.8*Math.max(0,Math.cos(time*2.1+seed))**8;
  ctx.save();ctx.fillStyle='#a75c2b';ctx.fillRect(x-3,y-2,6,4);
  ctx.fillStyle='#ffd38a';ctx.globalAlpha*=pulse;ctx.fillRect(x-2,y-2,4,2);
  ambientGlow(ctx,x,y,16,'#ffb75d',pulse*.25);ctx.restore();
}
