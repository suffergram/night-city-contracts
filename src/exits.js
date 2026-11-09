// Retained doorway artwork for future dense, connected building layouts.
export const BUILDING_EXIT_STYLES={
  hub:{asset:'exitGarage',w:260,h:142,door:[.127,.328,.690,.662],screen:[.857,.496,.091,.118],camera:[.12,.21],vent:[.87,.18],header:[.257,.162,.47,.09],shutter:true,title:'КОНТРАКТЫ / ТРАНСПОРТ'},
  industrial:{asset:'exitIndustrial',w:108,h:132,door:[.144,.301,.595,.644],screen:[.852,.462,.079,.089],camera:[.204,.187],vent:[.886,.845],fixtures:[[.40,.18,.16,.035]],title:'Служебный выход'},
  market:{asset:'exitMarket',w:112,h:132,door:[.161,.359,.613,.616],screen:[.856,.515,.092,.078],camera:[.895,.337],title:'Выход к транспорту'},
  port:{asset:'exitPort',w:132,h:142,door:[.222,.317,.533,.645],screen:[.832,.516,.112,.077],camera:[.831,.367],vent:[.78,.12],fixtures:[[.079,.228,.054,.071],[.88,.228,.054,.071]],title:'Грузовой подъёмник'},
  megablock:{asset:'exitMegablock',w:108,h:132,door:[.218,.254,.554,.719],screen:[.859,.457,.087,.112],camera:[.862,.146],fixtures:[[.289,.083,.437,.024]],floorDisplay:[.413,.159,.187,.029],title:'Лифт эвакуации'},
};
const car={asset:'exitCar',w:174.8,h:69.92,vehicle:true,headlights:[[.94,.50,.035,.05]],tail:[.02,.38,.032,.055],screen:[.465,.245,.016,.055],exhaust:[.025,.87],title:'Автомобиль / Контракты'};
export const EXIT_STYLES={
  hub:car,
  industrial:car,
  market:car,
  port:{asset:'exitVan',w:200.56,h:99.36,vehicle:true,headlights:[[.944,.52,.035,.064]],tail:[.018,.437,.017,.14],screen:[.59,.45,.022,.05],exhaust:[.02,.87],title:'Транспортный фургон'},
  megablock:BUILDING_EXIT_STYLES.megablock,
};
export const exitStyle=world=>EXIT_STYLES[world.kind]||EXIT_STYLES.hub;
export function exitBounds(world){
  const style=exitStyle(world),scale=world.portal.scale||1,w=style.w*scale,h=style.h*scale;
  return {x:world.portal.x-w/2,y:(world.portal.y??538)-h,w,h};
}

// Park vehicles in street openings; keep their scale even in a narrow frontage.
export function streetExit(layout,ground,rightStart,rng){
  const style=EXIT_STYLES[layout.kind],blocked=layout.platforms.filter(p=>!p.ground&&!p.stair&&p.y<ground&&p.y+p.h>ground-style.h).map(p=>({x:p.x-6,w:p.w+12}));
  for(const d of layout.decor)if(['container','foodStall','techStall','clothesStall','marketHotel'].includes(d.kind))blocked.push({x:d.x-6,w:d.w+12});
  blocked.sort((a,b)=>a.x-b.x);
  const gaps=[];let x=52;
  for(const b of blocked){if(b.x>x)gaps.push({x,w:b.x-x});x=Math.max(x,b.x+b.w);}
  if(x<layout.width-52)gaps.push({x,w:layout.width-52-x});
  const full=gaps.filter(g=>g.w>=style.w+16),smaller=gaps.filter(g=>g.w>=100);
  let choices=full.length?full:smaller.length?smaller:gaps;
  const opposite=choices.filter(g=>rightStart?g.x+g.w/2<layout.width*.5:g.x+g.w/2>layout.width*.5);
  if(opposite.length)choices=opposite;
  const room=choices[Math.floor(rng()*choices.length)]||{x:52,w:150};
  if(style.vehicle)return {x:Math.max(style.w/2+24,Math.min(layout.width-style.w/2-24,room.x+room.w/2)),y:ground,scale:1};
  const scale=Math.min(1,Math.max(.6,(room.w-12)/style.w)),w=style.w*scale;
  return {x:room.x+w/2+6+rng()*Math.max(0,room.w-w-12),y:ground,scale};
}
