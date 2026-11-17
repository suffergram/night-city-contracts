import {addSecurityOperation} from './workshop.js';
import {applySecurityVariants,securityIntel} from './enemy-variants.js';
import {attachSignal,signalObjective} from './signal.js';
import {attachCommander,commanderAlive} from './commander.js';
export function contractOffers(depth){
  return [
    {id:'sabotage',name:'Остановить конвейер',kind:'industrial',depth,reward:45+depth*8,xp:30,description:'Отключи два узла оборудования и вернись к транспорту. После первого отключения прибудет подкрепление. Зачистка не обязательна.'},
    {id:'sweep',name:'Зачистка квартала',kind:'market',depth,reward:30+depth*6,xp:24,description:'Нейтрализуй охрану Нижнего квартала и доберись до транспорта.'},
    {id:'assault',name:'Опасный груз',kind:'port',depth:depth+2,reward:65+depth*10,xp:40,description:'Зачистка грузового порта повышенной угрозы. Охрана сильнее; фиксированная награда выше.'},
  ];
}
export const securityOffer=depth=>({id:'prototype',name:'Кража прототипа',kind:'industrial',depth:depth+1,reward:95+depth*10,xp:45,description:'Забери прототип и вернись к транспорту. Охрана использует турель: отключи питание у щитка, примени ЭМИ (G) или уничтожь установку. Зачистка не обязательна.'});
export function attachContract(world,offer){
  world.contract={...offer,paid:false};
  world.contract.description+=' '+securityIntel(offer);
  applySecurityVariants(world,offer);
  if(offer.id==='relay'){
    attachSignal(world);world.signal.duration=60;world.signal.waveLimit=offer.prep?.supply?2:3;
    applySecurityVariants(world,{id:'prototype'});
    if(offer.prep?.supply)for(const e of world.enemies)if(e.variant==='sniper')delete e.variant;
    attachCommander(world);
    world.package={x:world.signal.x+75,y:world.signal.y,name:'Ключ маршрутизации',taken:false};return;
  }
  if(offer.id==='signal'){attachSignal(world);return;}
  if(offer.id==='prototype'){addSecurityOperation(world);return;}
  if(offer.id==='blackout'){
    addSecurityOperation(world);applySecurityVariants(world,{id:'prototype'});
    const last=world.decor.filter(d=>d.kind==='industrialBuilding').at(-1),turret=world.enemies.find(e=>e.turret);
    world.package.x=last.x+last.w*.5;world.package.name='Архив';
    world.enemies.push({...turret,x:Math.min(world.width-60,world.package.x+90)});
    for(const e of world.enemies){if(offer.prep?.intel&&e.variant==='sniper')delete e.variant;if(offer.prep?.supply&&e.turret)e.powerOff=true;}
  }
  if(!['sabotage','blackout'].includes(offer.id))return;
  const buildings=world.decor.filter(d=>d.kind==='industrialBuilding');
  world.sabotageNodes=[buildings[0],buildings.at(-1)].map((d,i)=>({id:i,x:d.x+d.w*.5,y:d.y+d.h,disabled:false}));
}
export const contractReady=world=>world.signal?world.signal.done&&(!world.package||world.package.taken)&&!commanderAlive(world):world.contract?.id==='blackout'?world.package.taken&&world.sabotageNodes.every(n=>n.disabled):world.package?world.package.taken:world.sabotageNodes?world.sabotageNodes.every(n=>n.disabled):world.kills===world.enemies.length;
export function disableNode(world,id){
  const node=world.sabotageNodes?.find(n=>n.id===id);if(!node||node.disabled)return false;
  node.disabled=true;
  if(world.sabotageNodes.filter(n=>n.disabled).length===1){
    const template=world.enemies.find(e=>!e.dead&&!e.variant&&!e.turret)||world.enemies.find(e=>!e.variant&&!e.turret)||world.enemies[0];
    for(let i=0;i<2;i++)world.enemies.push({...template,x:Math.max(30,Math.min(world.width-60,node.x+(i?170:-170))),y:node.y-template.h,hp:template.maxHp,dead:false,vx:0,vy:0,state:'patrol',timer:0,route:null,cooldown:1.5,grounded:true});
  }
  return true;
}
export function contractObjective(world){
  if(world.signal?.done&&commanderAlive(world))return 'Устрани портового надзирателя, чтобы забрать ключ';
  if(world.signal)return signalObjective(world);
  if(world.contract?.id==='blackout')return !world.sabotageNodes.every(n=>n.disabled)?`Сними замки: ${world.sabotageNodes.filter(n=>n.disabled).length} / 2 · E у терминала`:world.package.taken?'Архив получен. Вернись к транспорту':'Забери архив · E у груза';
  if(world.package)return world.package.taken?'Прототип получен. Вернись к транспорту':'Забери прототип · E у груза. Турель: питание / ЭМИ G / бой';
  if(world.sabotageNodes)return contractReady(world)?'Узлы отключены. Доберись до транспорта':`Отключи оборудование: ${world.sabotageNodes.filter(n=>n.disabled).length} / 2 · E у терминала`;
  return contractReady(world)?'Сектор чист. Доберись до транспорта':`Нейтрализуй противников: ${world.kills} / ${world.enemies.length}`;
}
export function drawContractNodes(ctx,world,time){
  for(const n of world.sabotageNodes||[]){
    ctx.save();ctx.fillStyle='#17252a';ctx.fillRect(n.x-13,n.y-43,26,43);ctx.strokeStyle='#6e8582';ctx.strokeRect(n.x-13,n.y-43,26,43);
    ctx.fillStyle=n.disabled?'#455958':'#f1c84f';ctx.fillRect(n.x-9,n.y-36,18,12);
    ctx.fillStyle=n.disabled?'#88b0a0':'#ffe076';ctx.font='bold 9px monospace';ctx.textAlign='center';ctx.fillText(n.disabled?'ОТКЛ.':`УЗЕЛ ${n.id+1}`,n.x,n.y-54);ctx.restore();
  }
}
