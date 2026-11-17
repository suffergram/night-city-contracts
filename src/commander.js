export function attachCommander(world){
 const e=world.enemies.find(e=>e.role==='heavy');
 Object.assign(e,{commander:true,variant:'shield',bossPhase:1,sequence:0,x:world.signal.x+160,y:world.signal.y-e.h,hp:340+world.depth*25,maxHp:340+world.depth*25,cooldown:1.5,state:'patrol',timer:0,vx:0,vy:0,grounded:true});
}
export const commanderAlive=world=>world.enemies.some(e=>e.commander&&!e.dead);
export function tickCommander(e,target,dt){
 const result={shots:[],hit:false};
 const from={x:e.x+e.w/2,y:e.y+e.h/2},to={x:target.x+target.w/2,y:target.y+target.h/2},dx=to.x-from.x,dy=to.y-from.y;
 e.shieldDown=Math.max(0,(e.shieldDown||0)-dt);e.flash=Math.max(0,(e.flash||0)-dt);e.cooldown=Math.max(0,(e.cooldown||0)-dt);
 if(e.hp<=e.maxHp*.5&&e.bossPhase!==2){e.bossPhase=2;e.state='recover';e.timer=1.2;e.shieldDown=1.2;e.cooldown=1.2;}
 if(e.state==='recover'){e.vx=0;e.timer-=dt;if(e.timer<=0)e.state='chase';return result;}
 const recover=()=>{e.state='recover';e.timer=e.bossPhase===2?1:1.3;e.shieldDown=Math.max(e.shieldDown,e.timer);e.cooldown=e.bossPhase===2?1.4:2;e.vx=0;};
 if(e.state==='charge'){
  e.timer-=dt;e.vx=e.facing*500;
  if(!e.chargeHit&&Math.abs(dx)<65&&Math.abs(dy)<55){result.hit=true;e.chargeHit=true;}
  if(e.timer<=0)recover();return result;
 }
 if(e.state==='windup'){
  e.vx=0;e.timer-=dt;
  if(e.bossMove==='burst'&&e.timer>.35){e.aimX=to.x;e.aimY=to.y;e.facing=Math.sign(dx)||e.facing;}
  if(e.timer<=0){
   if(e.bossMove==='charge'){e.state='charge';e.timer=.36;e.chargeHit=false;}
   else{
    const origin={x:from.x+e.facing*23,y:from.y-6},angle=Math.atan2(e.aimY-origin.y,e.aimX-origin.x),count=e.bossPhase===2?5:3;
    for(let i=0;i<count;i++){const a=angle+(i-(count-1)/2)*.14;result.shots.push({from:origin,to:{x:origin.x+Math.cos(a)*620,y:origin.y+Math.sin(a)*620},damage:e.damage*.7,speed:e.bossPhase===2?380:340});}
    recover();
   }
  }
  return result;
 }
 if(Math.abs(dx)>760||Math.abs(dy)>260){e.vx=0;e.state='patrol';return result;}
 e.facing=Math.sign(dx)||e.facing;e.state='chase';e.vx=Math.abs(dx)>420?e.facing*115:0;
 if(e.cooldown<=0){e.bossMove=e.sequence%2===1&&Math.abs(dx)<300&&Math.abs(dy)<55?'charge':'burst';e.sequence++;e.state='windup';e.timer=e.bossMove==='charge' ? .85 : 1.2;e.aimX=to.x;e.aimY=to.y;e.vx=0;}
 return result;
}
export function drawCommander(ctx,e){
 if(!e.commander||e.dead)return;ctx.save();const x=e.x+e.w/2,color=e.bossPhase===2?'#ff8564':'#f1cf78';
 ctx.fillStyle='#10131cdd';ctx.fillRect(x-85,e.y-72,170,43);
 ctx.font='bold 9px monospace';ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText('ПОРТОВЫЙ НАДЗИРАТЕЛЬ',x,e.y-58);
 ctx.fillStyle='#242832';ctx.fillRect(x-70,e.y-51,140,5);ctx.fillStyle=color;ctx.fillRect(x-70,e.y-51,140*Math.max(0,e.hp/e.maxHp),5);
 ctx.font='8px monospace';ctx.fillText('ФАЗА '+e.bossPhase+' · '+Math.ceil(e.hp)+' / '+e.maxHp,x,e.y-35);
 ctx.strokeStyle=color;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x+e.facing*10,e.y+24);ctx.lineTo(x+e.facing*28,e.y+24);ctx.stroke();
 if(e.state==='windup'){
  ctx.lineWidth=1.5;ctx.setLineDash([5,5]);ctx.strokeStyle=e.timer<=.35?'#ff725f':'#e8bb7199';ctx.beginPath();
  if(e.bossMove==='charge'){ctx.moveTo(x,e.y+e.h-3);ctx.lineTo(x+e.facing*180,e.y+e.h-3);ctx.stroke();ctx.fillStyle=color;ctx.fillText('РЫВОК',x,e.y-18);}
  else{const ox=x+e.facing*23,oy=e.y+e.h/2-6,a=Math.atan2(e.aimY-oy,e.aimX-ox),spread=e.bossPhase===2?.28:.14;for(const offset of [-spread,0,spread]){ctx.moveTo(ox,oy);ctx.lineTo(ox+Math.cos(a+offset)*330,oy+Math.sin(a+offset)*330);}ctx.stroke();ctx.fillStyle=color;ctx.fillText('ЗАЛП',x,e.y-18);}
 }
 ctx.restore();
}
