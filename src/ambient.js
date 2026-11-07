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
