export const signalOffer=depth=>({id:'signal',name:'Перехват сигнала',kind:'industrial',depth:depth+1,reward:120+depth*10,xp:60,samples:2,description:'Запусти взлом через E и удерживай зону терминала суммарно 75 секунд. Вне зоны прогресс стоит. Три волны охраны с предупреждением; после перехвата вернись к транспорту, зачистка не нужна.'});
export function attachSignal(world){
 const buildings=world.decor.filter(d=>d.kind==='industrialBuilding'),b=buildings[Math.floor(buildings.length/2)];
 const y=world.platforms[0].y,x=b?b.x+b.w*.5:world.width*.5;
 const templates=Object.fromEntries(['runner','gunner','heavy'].map(role=>[role,structuredClone(world.enemies.find(e=>e.role===role))]));
 world.enemies=world.enemies.slice(0,5);
 world.signal={x,y,radius:240,duration:75,progress:0,started:false,done:false,wave:0,spawned:0,templates,inside:false,
   entrances:[Math.max(35,x-330),Math.min(world.width-65,x+330)]};
}
export function startSignal(world){const h=world.signal;if(!h||h.started)return false;h.started=true;return true;}
const thresholds=[15,35,55],roles=[['runner','runner'],['gunner','runner'],['heavy','runner']];
export function signalWarning(h){return h.started&&!h.done&&h.wave<(h.waveLimit??3)&&h.progress>=thresholds[h.wave]-4;}
export function updateSignal(world,player,dt){
 const h=world.signal;if(!h?.started||h.done)return null;
 h.inside=Math.abs(player.x+player.w/2-h.x)<=h.radius&&Math.abs(player.y+player.h-h.y)<=180;
 if(h.inside)h.progress=Math.min(h.duration,h.progress+dt);
 if(h.progress>=h.duration){h.done=true;return 'complete';}
 if(h.wave>=(h.waveLimit??3)||h.progress<thresholds[h.wave])return null;
 let added=0;const room=9-world.enemies.filter(e=>!e.dead).length;
 while(h.spawned<2&&added<room){
  const i=h.spawned,t=h.templates[roles[h.wave][i]],x=h.entrances[i];
  world.enemies.push({...structuredClone(t),x,y:h.y-t.h,home:x,hp:t.maxHp,dead:false,vx:0,vy:0,grounded:true,state:'patrol',timer:0,cooldown:1.5,dodge:0,route:null,climbing:null});h.spawned++;added++;
 }
 if(h.spawned===2){h.wave++;h.spawned=0;}
 return added?'wave':null;
}
export function signalObjective(world){
 const h=world.signal;if(h.done)return world.package&&!world.package.taken?'Взлом завершён. Забери ключ · E у груза':world.package?.taken?'Ключ получен. Вернись к транспорту':'Сигнал перехвачен. Вернись к транспорту';
 if(!h.started)return 'Запусти перехват · E у терминала';
 return `Перехват: ${Math.floor(h.progress)} / ${h.duration} с · ${h.inside?'В зоне':'Вне зоны — пауза'}${signalWarning(h)?' · Подкрепление на подходе!':''}`;
}
export function drawSignal(ctx,world,time){
 const h=world.signal;if(!h)return;ctx.save();
 const color=h.done?'#73e8b4':h.started?'#f6d66d':'#6ae5ef';
 ctx.strokeStyle=color;ctx.lineWidth=1;ctx.setLineDash([8,7]);ctx.beginPath();ctx.moveTo(h.x-h.radius,h.y-2);ctx.lineTo(h.x+h.radius,h.y-2);ctx.stroke();ctx.setLineDash([]);
 ctx.fillStyle='#1c2a31';ctx.fillRect(h.x-17,h.y-47,34,47);ctx.strokeRect(h.x-17,h.y-47,34,47);ctx.fillStyle=color;ctx.fillRect(h.x-11,h.y-40,22,13);
 ctx.fillStyle='#38434b';ctx.fillRect(h.x-20,h.y-61,40,4);ctx.fillStyle=color;ctx.fillRect(h.x-20,h.y-61,40*h.progress/h.duration,4);
 ctx.font='bold 9px monospace';ctx.textAlign='center';ctx.fillText(h.done?'ПЕРЕХВАЧЕНО':h.started?Math.floor(h.progress/h.duration*100)+'%':'ПЕРЕХВАТ / E',h.x,h.y-70);
 if(signalWarning(h)){ctx.fillStyle='#ff916b';for(const x of h.entrances){ctx.globalAlpha=.6+.4*Math.sin(time*8)**2;ctx.fillText('⚠ ПОДКРЕПЛЕНИЕ',x,h.y-75);ctx.strokeRect(x-25,h.y-60,50,60);}}
 ctx.restore();
}
