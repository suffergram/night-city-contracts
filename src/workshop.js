export const RESEARCH={
  duplex:{name:'Дуплет пистолета',cost:1,description:'Две расходящиеся пули за патрон, каждая наносит 60% урона. Интервал выстрелов больше на 25%.'},
  slug:{name:'Пуля дробовика',cost:2,description:'Один точный снаряд вместо дроби: тройной урон дробины, дальность 650. Интервал выстрелов больше на 25%.'},
  siphon:{name:'Биоконвертер катаны',cost:2,description:'Добивание живого противника катаной восстанавливает 12% максимального здоровья. Урон катаны снижен на 20%. Турели не лечат.'},
  projector:{name:'Тактическая голограмма',cost:3,gadget:true,requiresChapter:true,description:'После «Контура H10»: открывает приманку на G вместо ЭМИ. Отвлекает ближайшую охрану до 10 секунд, выдерживает 60 урона. Подготовка — 25 эдди.'},
};
export function workshopState(profile){
 const s=profile.workshop||={equipment:false,built:false,empReady:false,mod:'standard',operations:0,samples:0,researched:[]};
 s.samples??=s.operations||0;
 // Existing saves retain modules available before research was introduced.
 s.researched??=s.built?['duplex','slug']:[];
 s.gadget??='emp';s.decoyReady??=false;
 return s;
}
export function researchModule(profile,id){const s=workshopState(profile),r=RESEARCH[id];if(!Object.hasOwn(RESEARCH,id)||!s.built||(r.requiresChapter&&!profile.campaign?.finished)||s.researched.includes(id)||s.samples<r.cost)return false;s.samples-=r.cost;s.researched.push(id);return true;}
export function selectModule(profile,id){const s=workshopState(profile);if(!s.built||(id!=='standard'&&(!['duplex','slug','siphon'].includes(id)||!s.researched.includes(id))))return false;s.mod=id;return true;}
export function deliverPrototype(profile){const s=workshopState(profile);s.operations++;s.samples++;}
export function meleeModuleEffect(profile,ranged,turret=false){const s=workshopState(profile),active=s.built&&s.mod==='siphon'&&s.researched.includes('siphon')&&!ranged;return {damage:active?.8:1,heal:active&&!turret?.12:0};}
export function buildWorkshop(profile){const s=workshopState(profile);if(s.built||!s.equipment)return false;s.built=true;return true;}
export function prepareEmp(profile){const s=workshopState(profile);if(!s.built||s.empReady||profile.gold<25)return false;profile.gold-=25;s.empReady=true;return true;}
export function deployEmp(world,player){
  if(!world.empCharges)return false;
  world.empCharges--;world.empPulse={x:player.x,y:player.y,time:.5};
  for(const e of world.enemies)if(!e.dead&&Math.hypot(e.x-player.x,e.y-player.y)<320){e.disabledFor=e.turret?18:4;e.state='recover';e.timer=e.disabledFor;}
  return true;
}
export function addSecurityOperation(world){
  const building=world.decor.find(d=>d.kind==='industrialBuilding'),y=world.platforms[0].y,x=building.x+building.w*.6;
  world.powerSwitch={x:building.x+35,y,disabled:false};world.package={x:x+110,y,taken:false};
  world.enemies.push({turret:true,x,y:y-34,w:32,h:34,hp:140+world.depth*12,maxHp:140+world.depth*12,damage:12+world.depth*2,dead:false,cooldown:2,dodge:0,role:'gunner',speed:0,state:'patrol',vx:0,vy:0,facing:-1});
}
export function disconnectPower(world){if(!world.powerSwitch||world.powerSwitch.disabled)return false;world.powerSwitch.disabled=true;for(const e of world.enemies)if(e.turret)e.powerOff=true;return true;}
export function drawSecurity(ctx,world){
  for(const [o,label,color]of [[world.powerSwitch,'ПИТАНИЕ','#6ae5e0'],[world.package,world.package?.name||'ПРОТОТИП','#eed454']])if(o&&!o.taken){ctx.fillStyle='#19272e';ctx.fillRect(o.x-13,o.y-37,26,37);ctx.strokeStyle=color;ctx.strokeRect(o.x-13,o.y-37,26,37);ctx.fillStyle=color;ctx.font='8px monospace';ctx.textAlign='center';ctx.fillText(label,o.x,o.y-45);}
}
