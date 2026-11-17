export function selectGadget(profile,id){
 const s=profile.workshop;if(!s?.built||!['emp','decoy'].includes(id)||(id==='decoy'&&!s.researched.includes('projector')))return false;s.gadget=id;return true;
}
export function prepareDecoy(profile){const s=profile.workshop;if(!s?.built||!s.researched.includes('projector')||s.decoyReady||profile.gold<25)return false;profile.gold-=25;s.decoyReady=true;return true;}
export function equipGadget(world,profile,empCapacity=1){
 const s=profile.workshop;world.gadget=s?.gadget==='decoy'&&s.researched?.includes('projector')?'decoy':'emp';world.empCharges=0;world.decoyCharges=0;
 if(!s?.built)return;
 if(world.gadget==='decoy'){world.decoyCharges=s.decoyReady?1:0;s.decoyReady=false;}
 else{world.empCharges=s.empReady?empCapacity:0;s.empReady=false;}
}
export function deployDecoy(world,player){
 if(!world.decoyCharges||world.decoy?.life>0)return false;
 world.decoyCharges--;world.decoy={decoy:true,x:Math.max(world.playBounds?.left??20,Math.min((world.playBounds?.right??world.width)-40,player.x+player.facing*80)),y:player.y,w:20,h:player.h,vx:0,vy:0,grounded:false,facing:player.facing,attack:0,life:10,hp:60};return true;
}
export function hitDecoy(world,damage){if(!world.decoy)return;world.decoy.hp-=damage;if(world.decoy.hp<=0)world.decoy=null;}
export function decoyTarget(world,hero,enemy){
 const d=world.decoy;if(!d||d.life<=0||d.hp<=0)return hero;
 const distance=t=>Math.hypot(enemy.x-t.x,enemy.y-t.y);
 return Math.abs(enemy.y-d.y)<150&&distance(d)<560&&distance(d)<distance(hero)+80?d:hero;
}
export function gadgetStatus(world){return world.gadget==='decoy'?`Голограмма: ${world.decoyCharges||0}`:`ЭМИ: ${world.empCharges||0}`;}
export function drawDecoy(ctx,world,time){
 const d=world.decoy;if(!d)return;ctx.save();ctx.globalAlpha=.45+.12*Math.sin(time*25);ctx.fillStyle='#60e7f0';ctx.strokeStyle='#a7faff';ctx.lineWidth=1.5;
 ctx.beginPath();ctx.ellipse(d.x+10,d.y+8,6,7,0,0,Math.PI*2);ctx.fill();
 ctx.fillRect(d.x+3,d.y+17,14,19);ctx.fillRect(d.x+2,d.y+36,5,d.h-36);ctx.fillRect(d.x+13,d.y+36,5,d.h-36);
 ctx.beginPath();ctx.moveTo(d.x+10,d.y+21);ctx.lineTo(d.x+10+d.facing*20,d.y+28);ctx.stroke();
 ctx.setLineDash([3,3]);ctx.strokeRect(d.x-5,d.y-3,30,d.h+5);ctx.setLineDash([]);ctx.font='8px monospace';ctx.textAlign='center';ctx.fillText('ПРИМАНКА / '+Math.ceil(d.life)+'с',d.x+10,d.y-10);ctx.restore();
}
