import {exitStyle,exitBounds} from './exits.js';
import {fitScenery} from './scenery-sizes.js';
import {ambientGlow,lightLevel,controlledLight,drawVentSteam} from './ambient.js';

const doors=new WeakMap();
const clamp=n=>Math.max(0,Math.min(1,n));
let headlightTexture,exhaustTexture;
function softHeadlight(){
  if(headlightTexture)return headlightTexture;
  const c=document.createElement('canvas');c.width=320;c.height=96;
  const ctx=c.getContext('2d'),pixels=ctx.createImageData(c.width,c.height);
  for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
    const t=x/(c.width-1),v=(y-c.height/2)/(c.height/2),spread=.065+t*.40;
    const alpha=Math.exp(-2*(v/spread)**2)*Math.min(1,t*18)*(1-t)**1.6;
    const i=(y*c.width+x)*4;pixels.data[i]=250;pixels.data[i+1]=226;pixels.data[i+2]=184;pixels.data[i+3]=alpha*90;
  }
  ctx.putImageData(pixels,0,0);return headlightTexture=c;
}
function drawVehicleExhaust(ctx,x,y,time,seed,size){
  if(!exhaustTexture){
    const c=document.createElement('canvas');c.width=c.height=96;
    const a=c.getContext('2d'),g=a.createRadialGradient(48,48,0,48,48,48);
    g.addColorStop(0,'#cdd4d9b0');g.addColorStop(.4,'#cdd4d96b');g.addColorStop(1,'#cdd4d900');
    a.fillStyle=g;a.fillRect(0,0,96,96);exhaustTexture=c;
  }
  ctx.save();const alpha=ctx.globalAlpha;ctx.globalCompositeOperation='source-over';
  for(let i=0;i<4;i++){
    const age=((time*.32+i/4+seed*.017)%1+1)%1,radius=(3+age*8)*size;
    const px=x-age*(11+Math.sin(seed+i)*3)*size+Math.sin(age*5+i)*age*2;
    const py=y-age*age*13*size+Math.sin(age*4+i)*age*2;
    ctx.globalAlpha=alpha*.34*Math.sin(age*Math.PI);
    ctx.drawImage(exhaustTexture,px-radius,py-radius,radius*2,radius*2);
  }
  ctx.restore();
}
function drawParkedVehicle(ctx,world,mode,time,source,style,fit){
  const {x,y,w,h}=fit,ready=mode==='hub'||world.enemies&&world.kills===world.enemies.length;
  const level=lightLevel(time,world.portal.x),colour=ready?'#6fe2c7':'#e76b58';
  ctx.save();
  // Source vehicles face right; mirror the full vehicle and its effects at left exits.
  if(world.portal.x<world.width/2){ctx.translate(x*2+w,0);ctx.scale(-1,1);}
  ctx.fillStyle='#03070b66';ctx.beginPath();ctx.ellipse(x+w*.5,y+h-1,w*.40,2.2,0,0,Math.PI*2);ctx.fill();
  if(source)ctx.drawImage(source.image,source.x,source.y,source.w,source.h,x,y+1+source.contactInset*h/source.h,w,h);
  else{ctx.fillStyle='#30383e';ctx.fillRect(x,y+h*.3,w,h*.6);}
  for(const [hx,hy,hw,hh]of style.headlights){
    const lx=x+(hx+hw/2)*w,ly=y+(hy+hh/2)*h;
    ctx.save();ctx.globalAlpha*=level;ctx.globalCompositeOperation='screen';ctx.fillStyle='#fff1ce';ctx.fillRect(x+hx*w,y+hy*h,hw*w,hh*h);ctx.restore();
    ambientGlow(ctx,lx,ly,20,'#ffdc9f',.32*level);
    ctx.save();ctx.globalAlpha*=level;ctx.globalCompositeOperation='screen';
    const length=w*.60,height=Math.max(34,h*.65),road=y+h+3;
    ctx.drawImage(softHeadlight(),lx-2,ly-height/2,length,height);
    ctx.translate(lx+length*.55,road);ctx.scale(1,.13);ambientGlow(ctx,0,0,length*.55,'#ffe1a4',.20*level);ctx.restore();
  }
  const [tx,ty,tw,th]=style.tail;
  ctx.save();ctx.globalAlpha*=controlledLight(.7);ctx.fillStyle='#db5b48';ctx.fillRect(x+tx*w,y+ty*h,tw*w,th*h);ctx.restore();
  ambientGlow(ctx,x+(tx+tw/2)*w,y+(ty+th/2)*h,12,'#ee6a52',.25*level);
  const [sx,sy,sw,sh]=style.screen;
  ctx.fillStyle='#0a1215';ctx.fillRect(x+sx*w,y+sy*h,sw*w,sh*h);
  const access=controlledLight(ready ? .85+.15*Math.sin(time*1.8)**2 : .45+.55*Math.max(0,Math.sin(time*2.4)));
  const readerW=Math.max(3,sw*w),readerH=Math.max(5,sh*h),readerX=x+(sx+sw/2)*w-readerW/2,readerY=y+(sy+sh/2)*h-readerH/2;
  ctx.save();ctx.globalAlpha*=access;ctx.fillStyle=colour;ctx.fillRect(readerX,readerY,readerW,readerH);
  ctx.fillStyle=ready?'#caffee':'#ffd1b9';ctx.fillRect(readerX+.75,readerY+.75,Math.max(1,readerW-1.5),1);ctx.restore();
  ambientGlow(ctx,readerX+readerW/2,readerY+readerH/2,15,colour,.48*access);
  const [ex,ey]=style.exhaust;
  drawVehicleExhaust(ctx,x+ex*w,y+ey*h,time,world.portal.x,Math.min(1.3,h/70));
  ctx.restore();
}
function doorProgress(world,ready,time){
  let state=doors.get(world);
  if(!state){state={ready,from:0,to:ready ? .94 : 0,at:time};doors.set(world,state);}
  const sample=()=>{const t=clamp((time-state.at)/1.3),ease=t*t*(3-2*t);return state.from+(state.to-state.from)*ease;};
  const value=sample();
  if(state.ready!==ready){state.from=value;state.to=ready ? .94 : 0;state.at=time;state.ready=ready;}
  return sample();
}

export function drawTransportExit(ctx,world,mode,time,source){
  const style=exitStyle(world),bounds=exitBounds(world);
  const fit=source?fitScenery(source.w,source.h,bounds.x,bounds.y,bounds.w,bounds.h):bounds;
  const {x,w,h}=fit,y=fit.y+(source?1+source.contactInset*h/source.h:0);
  if(style.vehicle){drawParkedVehicle(ctx,world,mode,time,source,style,fit);return;}
  const ready=mode==='hub'||world.enemies&&world.kills===world.enemies.length;
  const progress=doorProgress(world,!!ready,time),[ux,uy,uw,uh]=style.door;
  const dx=x+ux*w,dy=y+uy*h,dw=uw*w,dh=uh*h;
  ctx.save();
  // The dark interior is revealed by moving actual door pixels, not an energy effect.
  const interior=ctx.createLinearGradient(dx,dy,dx+dw,dy+dh);
  interior.addColorStop(0,'#04070b');interior.addColorStop(.7,'#10151a');interior.addColorStop(1,'#28292a');
  ctx.fillStyle=interior;ctx.fillRect(dx,dy,dw,dh);
  if(source){
    ctx.save();ctx.beginPath();ctx.rect(x-1,y-1,w+2,h+2);ctx.rect(dx,dy,dw,dh);ctx.clip('evenodd');
    ctx.drawImage(source.image,source.x,source.y,source.w,source.h,x,y,w,h);ctx.restore();
    ctx.save();ctx.beginPath();ctx.rect(dx,dy,dw,dh);ctx.clip();
    const sx=source.x+ux*source.w,sy=source.y+uy*source.h,sw=uw*source.w,sh=uh*source.h;
    if(style.shutter)ctx.drawImage(source.image,sx,sy,sw,sh,dx,dy-progress*dh,dw,dh);
    else{
      ctx.drawImage(source.image,sx,sy,sw/2,sh,dx-progress*dw/2,dy,dw/2,dh);
      ctx.drawImage(source.image,sx+sw/2,sy,sw/2,sh,dx+dw/2+progress*dw/2,dy,dw/2,dh);
    }
    ctx.restore();
  }else{
    ctx.strokeStyle='#58646a';ctx.lineWidth=6;ctx.strokeRect(dx-3,dy-3,dw+6,dh+6);
  }
  const [tx,ty,tw,th]=style.screen,sx=x+tx*w,sy=y+ty*h,sw=tw*w,sh=th*h;
  const colour=ready?(mode==='hub'?'#f2cb72':'#68e5c5'):'#ed685d';
  const level=lightLevel(time,world.portal.x+7);
  if(style.header){
    const [hx,hy,hw,hh]=style.header;ctx.fillStyle='#aab5b5';ctx.textAlign='center';ctx.font=`bold ${Math.max(4,Math.min(7,hh*h*.65))}px Consolas,monospace`;
    ctx.fillText(style.title,x+(hx+hw/2)*w,y+(hy+hh*.65)*h);
  }
  ctx.fillStyle='#071014';ctx.fillRect(sx,sy,sw,sh);
  ctx.save();ctx.beginPath();ctx.rect(sx,sy,sw,sh);ctx.clip();ctx.globalAlpha*=level;
  const screen=ctx.createLinearGradient(sx,sy,sx,sy+sh);screen.addColorStop(0,ready?'#123d39':'#3c191e');screen.addColorStop(1,'#081215');
  ctx.fillStyle=screen;ctx.fillRect(sx,sy,sw,sh);
  ctx.fillStyle=colour;ctx.font=`bold ${Math.max(3,Math.min(6,sw/4))}px Consolas,monospace`;ctx.textAlign='center';
  ctx.fillText(mode==='hub'?'JOB':ready?'EXIT':'LOCK',sx+sw/2,sy+sh*.4);
  ctx.fillText(ready?'OK':'!',sx+sw/2,sy+sh*.76);
  ctx.globalAlpha*=.2;ctx.fillRect(sx,sy+(time*8%Math.max(1,sh)),sw,1);ctx.restore();
  ambientGlow(ctx,sx+sw/2,sy+sh/2,sw*1.8,colour,.19*level);
  // Small physical status bar and camera lens, all registered to the frame.
  const reader=ready?(progress<.9?(Math.floor(time*8)%2?.35:1):.9):.4+.5*Math.max(0,Math.sin(time*2.6+world.portal.x));
  ctx.save();ctx.globalAlpha*=controlledLight(reader);
  ctx.fillStyle=colour;ctx.fillRect(sx,sy-4,sw,1.5);ctx.restore();
  const camera=style.camera||[.82,.18],cx=x+camera[0]*w,cy=y+camera[1]*h;
  ctx.save();ctx.globalAlpha*=controlledLight(.55+.4*Math.sin(time*1.6+world.portal.x)**2);ctx.fillStyle='#8bd7d1';ctx.fillRect(cx+Math.sin(time*.4)*1.2,cy,1,1);ctx.restore();
  for(const [i,[fx,fy,fw,fh]]of (style.fixtures||[]).entries()){
    const glow=lightLevel(time,world.portal.x+i*19,i===1?'strong':false),lx=x+(fx+fw/2)*w,ly=y+(fy+fh/2)*h;
    ctx.save();ctx.globalAlpha*=glow*.75;ctx.globalCompositeOperation='screen';ctx.fillStyle='#f5d8a0';ctx.beginPath();ctx.ellipse(lx,ly,fw*w*.45,fh*h*.38,0,0,Math.PI*2);ctx.fill();ctx.restore();
    ambientGlow(ctx,lx,ly,Math.max(fw*w,fh*h)*1.7,'#ffd49a',glow*.16);
  }
  if(style.floorDisplay){
    const [fx,fy,fw,fh]=style.floorDisplay;ctx.save();ctx.globalAlpha*=level;ctx.fillStyle=colour;ctx.textAlign='center';ctx.font=`${Math.max(3,fh*h*.8)}px Consolas,monospace`;ctx.fillText(ready?'OUT':'H10',x+(fx+fw/2)*w,y+(fy+fh*.8)*h);ctx.restore();
  }
  if(style.vent){const [vx,vy]=style.vent;drawVentSteam(ctx,x+vx*w,y+vy*h,h*.25,time,world.portal.x);}
  ctx.restore();
}
