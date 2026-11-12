import {locationSize} from './scenery-sizes.js';
import {MARKET_STALLS,marketStallSize,stallAdvance} from './market-stalls.js';
import {MARKET_HOTELS,hotelSize,hotelSink} from './market-hotels.js';
import {EXIT_STYLES,streetExit} from './exits.js';
import {MARKET_BUILDINGS,MARKET_BUILDING_WALLS,marketBuildingSize,marketBuildingSink} from './market-buildings.js';
import {TOWER_ARCH,TOWER_BAYS,towerStairGeometry} from './tower.js';
export const LEVEL_KINDS={
  industrial:{name:'Промзона Уотсона',hint:'Технические площадки и переходы'},
  port:{name:'Грузовой порт',hint:'Контейнеры, краны и грузовые мостки'},
  market:{name:'Нижний квартал',hint:'Магазины, жилые галереи и тесные переулки'},
  megablock:{name:'Мегабашня',hint:'Внутренний атриум, жилые галереи и технические ярусы'},
};
export function createLayout(rng,ground,forcedKind) {
  const pick=a=>a[Math.floor(rng()*a.length)],integer=(a,b)=>a+Math.floor(rng()*(b-a+1));
  const kind=forcedKind&&LEVEL_KINDS[forcedKind]?forcedKind:pick(Object.keys(LEVEL_KINDS));
  const width=kind==='megablock'?TOWER_ARCH.width:kind==='market'?integer(34,48)*100:integer(24,39)*100;
  const layout={kind,width,platforms:[{id:0,x:0,y:ground,w:width,h:150,ground:true}],ladders:[],stairs:[],connections:[],decor:[],rooms:[],lamps:[],wallLights:[]};
  const surface=(x,y,w,extra={})=>{
    const native=['stall','hotelBalcony','hotelRoof','buildingGallery','buildingRoof'].includes(extra.art);
    x=Math.max(24,native?x:Math.round(x));w=Math.min(native?w:Math.round(w),width-24-x);
    const p={id:layout.platforms.length,x,y:Math.round(y),w,h:18,...extra};layout.platforms.push(p);return p;
  };
  const ladder=(lower,upper,x)=>{
    const blocked=()=>[lower,upper].some(p=>p.holes?.some(h=>x>h.x-12&&x<h.x+h.w+12));
    for(let i=0;i<12&&blocked();i++)x=Math.max(lower.x,upper.x)+25+rng()*(Math.min(lower.x+lower.w,upper.x+upper.w)-Math.max(lower.x,upper.x)-50);
    if(blocked())return;
    const id=layout.ladders.length,l={id,x:Math.round(x),w:24,top:upper.y,bottom:lower.y};layout.ladders.push(l);
    layout.connections.push({kind:'ladder',id,lower:{x:l.x,y:lower.y},upper:{x:l.x,y:upper.y}});
  };
  const stairs=(lower,upper,left,right)=>{
    const rise=lower.y-upper.y,n=Math.ceil(rise/19),run=28,span=n*run;
    if(right-left<span+40)return false;
    const candidates=[];
    for(let x=Math.ceil(left+20);x<=right-span-20;x+=8)for(const dir of [1,-1]){
      const from=(dir>0?x:x+span)-dir*18,to=(dir>0?x+span:x)+dir*18;
      if(!lower.holes?.some(h=>from>h.x-14&&from<h.x+h.w+14)&&!upper.holes?.some(h=>to>h.x-14&&to<h.x+h.w+14))candidates.push({base:x,dir});
    }
    if(!candidates.length)return false;
    const {base,dir}=pick(candidates);
    const start=dir>0?base:base+span,end=start+dir*span;
    const connection={kind:'stairs',id:layout.stairs.length,dir,lower:{x:start-dir*18,y:lower.y},upper:{x:end+dir*18,y:upper.y}};
    layout.stairs.push(connection);layout.connections.push(connection);
    // A small opening above the upper steps allows walking down instead of dropping through a solid deck.
    (upper.holes||=[]).push({x:dir>0?end-112:end+8,w:104});
    for(let i=1;i<=n;i++)surface(dir>0?start+(i-1)*run:start-i*run,lower.y-i*rise/n,run+4,{stair:true,stairId:connection.id});
    return true;
  };
  if(kind==='megablock'){
    layout.towerArchitecture=true;layout.towerSection=10;layout.floorRise=TOWER_ARCH.rise;
    layout.playBounds={left:20,right:width-20};
    const levels=[layout.platforms[0]],geometry=towerStairGeometry(),floorCount=integer(9,12);
    for(let floor=1;floor<floorCount;floor++)levels.push(surface(20,ground-floor*TOWER_ARCH.rise,width-40,{art:'towerArchitecture'}));
    for(let floor=1;floor<levels.length;floor++){
      // Keep the two side zones, but vary the zone, orientation and landing position.
      const candidates=[];
      for(const zone of [.3,.7])for(const direction of [-1,1])for(const offset of [-32,0,32]){
        const center=width*zone+offset,low=center-direction*geometry.run/2;
        const a=Math.min(low-direction*25,low+direction*35),b=Math.max(low-direction*25,low+direction*35);
        if(!levels[floor-1].holes?.some(h=>b>h.x-12&&a<h.x+h.w+12))candidates.push({dir:direction,center});
      }
      const {dir,center}=pick(candidates);
      const low=center-dir*geometry.run/2,high=center+dir*geometry.run/2;
      const lower=levels[floor-1],upper=levels[floor];
      const flight={kind:'stairs',id:layout.stairs.length,dir,
        lower:{x:low-dir*12,y:lower.y},upper:{x:high+dir*12,y:upper.y},
        renderLower:{x:low,y:lower.y}};
      layout.stairs.push(flight);layout.connections.push(flight);
      (upper.holes||=[]).push({x:dir>0?high-70:high+8,w:62});
      for(let step=1;step<=TOWER_ARCH.steps;step++){
        const left=dir>0?low+(step-1)*geometry.run/TOWER_ARCH.steps:low-step*geometry.run/TOWER_ARCH.steps;
        surface(left,lower.y-step*TOWER_ARCH.rise/TOWER_ARCH.steps,geometry.run/TOWER_ARCH.steps+2,{stair:true,stairId:flight.id,art:'towerStair'});
      }
    }
    const residential=['grey','ochre','residential'];
    const commonRooms=new Map(),available=[];
    for(let floor=0;floor<levels.length;floor++)for(let column=0;column<4;column++){
      const x=column<2?column*TOWER_ARCH.bay:column*TOWER_ARCH.bay+TOWER_ARCH.stairBay;
      const flight=layout.stairs.find(s=>s.lower.y===levels[floor].y);
      if(!flight||x+TOWER_ARCH.bay<Math.min(flight.lower.x,flight.upper.x)-12||x>Math.max(flight.lower.x,flight.upper.x)+12)available.push(floor+':'+column);
    }
    for(const style of ['gunsmith','gym','canteen','alcove'])for(let n=integer(1,2);n>0;n--){
      const index=integer(0,available.length-1);commonRooms.set(available.splice(index,1)[0],style);
    }
    for(let floor=0;floor<levels.length;floor++){
      const y=levels[floor].y;
      for(let column=0;column<4;column++){
        const x=column<2?column*TOWER_ARCH.bay:column*TOWER_ARCH.bay+TOWER_ARCH.stairBay;
        const style=commonRooms.get(floor+':'+column)||(rng()<.14?'services':pick(residential));
        const room={kind:'towerBay',style,x,y,w:TOWER_ARCH.bay,h:112,floor,
          lightSeed:integer(0,2147483647),lightVariant:(floor+column)%4};
        layout.decor.push(room);layout.rooms.push(room);
      }
      layout.decor.push({kind:'towerBay',style:pick(['utility','grey','ochre']),x:TOWER_ARCH.bay*2,y,w:TOWER_ARCH.stairBay,h:118,floor,lightSeed:integer(0,2147483647),lightVariant:integer(0,3)});
    }
    const base=integer(20,30)*4;
    layout.towerDressing=levels.map((_,floor)=>{
      const rooms=layout.decor.filter(d=>d.kind==='towerBay'&&d.floor===floor&&residential.includes(d.style));
      const wall=rooms.length?pick(rooms):null,hasPier=floor>0&&rng()<.68;
      return {number:base+floor*4,pierX:pick([width*.12,width*.52]),hasPier,sign:hasPier&&rng()<.55,
        riserX:floor>0&&rng()<.3?pick([445,952]):null,
        electrical:rng()<.7?{x:pick([65,870]),index:integer(0,2)}:null,
        ac:wall&&rng()<.68?{x:wall.x+wall.w*.72,index:integer(0,1)}:null,
        laundry:rng()<.38?{x:pick([210,840,1130]),index:integer(2,3)}:null};
    });
  }else if(kind==='port'){
    let group=0;
    for(let x=300;x<width-260;x+=integer(310,430)){
      const tiers=integer(1,3),h=85,w=locationSize(0,h).w;let lower=layout.platforms[0];
      for(let tier=0;tier<tiers;tier++){
        const xx=x+tier*integer(8,16),p=surface(xx,ground-(tier+1)*h,w,{art:'container'});
        layout.decor.push({kind:'container',x:p.x,y:p.y,w,h,variant:integer(0,4)});
        ladder(lower,p,p.x+24);
        lower=p;
      }
      layout.decor.push({kind:'cargo',x:x-70,y:ground,w:integer(65,100),h:integer(40,65)});
      if(group++%2===0)layout.decor.push({kind:'crane',x:x-100,y:ground,w:260,h:300});
    }
  }else if(kind==='market'){
    const themes=['foodStall','techStall','clothesStall'];
    for(let i=themes.length-1;i>0;i--){const j=integer(0,i);[themes[i],themes[j]]=[themes[j],themes[i]];}
    const styles=kind=>Object.keys(MARKET_STALLS).filter(key=>MARKET_STALLS[key].kind===kind);
    const buildingKinds=['housing','minimarket','repair','laundry'];
    for(let i=buildingKinds.length-1;i>0;i--){const j=integer(0,i);[buildingKinds[i],buildingKinds[j]]=[buildingKinds[j],buildingKinds[i]];}
    const hotelGroup=integer(0,2);
    const singleGroups=new Set([hotelGroup,(hotelGroup+integer(1,2))%3]);
    let x=integer(215,255),group=0,lastStyle=null,buildings=0;layout.marketGroups=[];layout.marketBlocks=[];
    while(x<width-350){
      const hotel=group===hotelGroup,category=buildingKinds[buildings%buildingKinds.length];
      const anchorStyle=hotel?pick(Object.keys(MARKET_HOTELS)):pick(Object.keys(MARKET_BUILDINGS).filter(id=>MARKET_BUILDINGS[id].kind===category));
      const anchorSize=hotel?hotelSize(anchorStyle):marketBuildingSize(anchorStyle);
      const theme=group<3?themes[group]:pick(themes),count=integer(2,3),plan=[];
      for(let member=0;member<count;member++){
        const kind=member===0||rng()<.78?theme:pick(themes),choices=styles(kind).filter(id=>id!==lastStyle),style=pick(choices);
        plan.push({style,kind,...marketStallSize(style),gap:rng()<.6?0:integer(4,16)});lastStyle=style;
      }
      const length=()=>plan.reduce((sum,s,i)=>sum+(i?stallAdvance(plan[i-1],s,plan[i-1].gap):0),0)+plan.at(-1).w;
      const budget=group<3?(width-x-180-(2-group)*90)/(3-group):width-x-160;
      if(plan.length===3&&anchorSize.w+length()>budget)plan.pop();
      if(anchorSize.w+length()>budget){
        for(const s of plan){s.style=styles(s.kind).sort((a,b)=>marketStallSize(a).w-marketStallSize(b).w)[0];Object.assign(s,marketStallSize(s.style));}
        if(plan.length===2&&plan[0].style===plan[1].style){const other=styles(plan[1].kind).filter(id=>id!==plan[0].style).sort((a,b)=>marketStallSize(a).w-marketStallSize(b).w)[0];plan[1].style=other;Object.assign(plan[1],marketStallSize(other));}
      }
      if(x+anchorSize.w+length()>width-160)break;
      const blockStart=x,anchors=[{style:anchorStyle,hotel,size:anchorSize}];
      let frontage=anchorSize.w;
      const countBuildings=singleGroups.has(group)?1:integer(2,3);
      for(let i=1;i<countBuildings;i++){
        // Keep enough room for the following quarters and their shops.
        const available=Math.min(budget,width-blockStart-160)-frontage-length();
        const choices=Object.keys(MARKET_BUILDINGS).filter(id=>!anchors.some(a=>a.style===id)&&marketBuildingSize(id).w-2<=available);
        if(!choices.length)break;
        const preferred=choices.filter(id=>MARKET_BUILDINGS[id].kind!==MARKET_BUILDINGS[anchors.at(-1).style]?.kind);
        const style=pick(preferred.length?preferred:choices),size=marketBuildingSize(style);
        anchors.push({style,hotel:false,size});frontage+=size.w-2;
      }
      for(const [index,a]of anchors.entries()){
        const def=a.hotel?MARKET_HOTELS[a.style]:MARKET_BUILDINGS[a.style],size=a.size;
        const y=ground-size.h+(a.hotel?hotelSink(a.style):marketBuildingSink(a.style));
        const levels=a.hotel?[def.balcony]:def.landings;
        const galleries=levels.map(level=>surface(x+size.w*.04,y+size.h*level,size.w*.92,{art:a.hotel?'hotelBalcony':'buildingGallery'}));
        const roof=surface(x+size.w*.04,y+size.h*def.roof,size.w*.92,{art:a.hotel?'hotelRoof':'buildingRoof'});
        layout.decor.push({kind:a.hotel?'marketHotel':'marketBuilding',style:a.style,x,y,...size,balconyId:galleries[0].id,galleryIds:galleries.map(p=>p.id),roofId:roof.id,block:group});
        layout.connections.push({kind:'stairwell',id:layout.connections.filter(c=>c.kind==='stairwell').length,lower:{x:x+size.w*def.entry,y:ground},upper:{x:x+size.w*def.exit,y:galleries[0].y}});
        for(let i=1;i<galleries.length;i++)ladder(galleries[i-1],galleries[i],x+size.w*.94);
        ladder(galleries.at(-1),roof,x+size.w*.94);
        if(!a.hotel)buildings++;
        const next=anchors[index+1];
        if(next){
          // Match the walls, not the protruding foundations or transparent margins.
          const right=MARKET_BUILDING_WALLS[a.style]?.[1]??.988;
          const left=MARKET_BUILDING_WALLS[next.style][0];
          x+=size.w*right-next.size.w*left-2;
        }else x+=size.w;
      }
      x-=anchors.at(-1).size.w*.012+plan[0].w*MARKET_STALLS[plan[0].style].body[0];
      const start=x;
      for(const [member,s]of plan.entries()){
        const p=surface(x,ground-s.h,s.w,{art:'stall'});
        layout.decor.push({kind:s.kind,style:s.style,x:p.x,y:p.y,w:s.w,h:s.h,platformId:p.id,group});
        if(member===0)ladder(layout.platforms[0],p,p.x+14);
        x=p.x+(member<plan.length-1?stallAdvance(s,plan[member+1],s.gap):s.w);
      }
      layout.marketGroups.push({id:group,x:start,w:x-start,count:plan.length,theme});
      layout.marketBlocks.push({id:group,x:blockStart,w:x-blockStart,anchor:anchorStyle,buildings:anchors.map(a=>a.style)});
      x+=integer(85,155);group++;
    }
  }else{
    for(let x=300;x<width-280;x+=integer(220,340)){
      const p=surface(x,ground-pick([85,110,130]),integer(135,225),{deck:true});
      const vent=rng()<.5;
      layout.decor.push({kind:vent?'vent':'barrier',x:x-50,y:ground,w:vent?integer(75,100):integer(100,155),h:vent?integer(90,125):integer(40,60)});
      if(rng()<.4){const upper=surface(x+20,p.y-100,Math.max(110,p.w-30),{deck:true});ladder(p,upper,p.x+40);}
      if(rng()<.35)ladder(layout.platforms[0],p,p.x+20);
    }
  }
  const supports=layout.platforms.filter(p=>!p.stair);
  layout.floors=[...new Set(supports.map(p=>p.y))].sort((a,b)=>b-a);
  for(const p of supports)p.floor=layout.floors.indexOf(p.y);
  for(const c of layout.connections){c.from=layout.floors.indexOf(c.lower.y);c.to=layout.floors.indexOf(c.upper.y);}
  layout.top=Math.min(0,Math.min(...layout.floors)-170);layout.height=ground+130-layout.top;
  const rightStart=rng()<.5;layout.spawn={x:rightStart?width-115:95,y:ground};
  if(layout.towerArchitecture)layout.spawn.x=rightStart?width-130:130;
  const clearRanges=p=>{
    const ranges=[];let x=p.x;
    for(const hole of [...(p.holes||[])].sort((a,b)=>a.x-b.x)){if(hole.x>x)ranges.push({x,w:hole.x-x});x=Math.max(x,hole.x+hole.w);}
    if(x<p.x+p.w)ranges.push({x,w:p.x+p.w-x});return ranges;
  };
  let exits=supports.filter(p=>!p.ground).flatMap(p=>clearRanges(p).filter(r=>r.w>=110).map(r=>({...r,y:p.y})));
  if(kind==='megablock')exits=exits.filter(p=>p.y===Math.min(...layout.floors));
  else exits=exits.filter(p=>rightStart?p.x<width*.5:p.x+p.w>width*.5);
  const exit=kind==='megablock'&&exits.length?pick(exits):null;
  const exitHalf=EXIT_STYLES[kind].w/2;
  layout.portal=exit?{x:exit.x+exitHalf+rng()*Math.max(0,exit.w-exitHalf*2),y:exit.y}:streetExit(layout,ground,rightStart,rng);
  layout.decor=layout.decor.filter(d=>{
    if(d.kind==='towerBay')return true;
    if(d.kind==='crane'||['container','foodStall','techStall','clothesStall','marketHotel','marketBuilding'].includes(d.kind))return true;
    return d.y!==layout.portal.y||d.x+d.w<layout.portal.x-exitHalf-10||d.x>layout.portal.x+exitHalf+10;
  });
  layout.slots=[];
  for(const p of supports)for(let x=p.x+55;x<p.x+p.w-50;x+=integer(125,210)){
    if(layout.playBounds&&(x<layout.playBounds.left||x+36>layout.playBounds.right))continue;
    if(p.holes?.some(h=>x+36>h.x&&x<h.x+h.w))continue;
    if(Math.hypot(x-layout.spawn.x,p.y-ground)<260||Math.abs(x-layout.portal.x)<70&&p.y===layout.portal.y)continue;
    layout.slots.push({x:Math.round(x),y:p.y,platformId:p.id,floor:p.floor});
  }
  layout.decor=layout.decor.filter(d=>!['apartment','maintenance'].includes(d.kind)||!supports.some(p=>p.y===d.y&&p.holes?.some(h=>d.x+d.w>h.x&&d.x<h.x+h.w)));
  if(kind==='megablock'){
    // Shuffle once: 50% dark, 40% steady, 10% the existing subtle shimmer.
    const fixtures=[];
    for(const d of layout.decor)if(d.kind==='towerBay'){
      const count=TOWER_BAYS[d.style].lamps.length;d.towerLampModes=Array(count);
      for(let i=0;i<count;i++)fixtures.push([d,i]);
    }
    for(let i=fixtures.length-1;i>0;i--){const j=integer(0,i);[fixtures[i],fixtures[j]]=[fixtures[j],fixtures[i]];}
    const off=Math.round(fixtures.length*.5),steady=Math.round(fixtures.length*.4);
    fixtures.forEach(([d,i],index)=>{d.towerLampModes[i]=index<off?'off':index<off+steady?'steady':false;});
  }else{
    for(let x=integer(150,250);x<width-90;x+=integer(420,600))layout.lamps.push({x,y:ground});
    if(kind==='market')layout.lamps=layout.lamps.filter(l=>!layout.decor.some(d=>['marketHotel','marketBuilding'].includes(d.kind)&&l.x>d.x-15&&l.x<d.x+d.w+15));
    layout.lamps=layout.lamps.filter(l=>Math.abs(l.x-layout.portal.x)>exitHalf+18);
  }
  layout.name=LEVEL_KINDS[kind].name;layout.flavour=kind==='megablock'?`Секция H-${layout.towerSection}`:pick(['Северный сектор','Техническое крыло','Восточная линия','Закрытый периметр']);
  // Pick once for the contract; never reroll while scrolling or drawing.
  layout.backdrop=kind==='market'&&rng()<.5?'metropolis':'district';
  // Repeated facades cycle through different occupancy patterns, fixed for this level.
  const lightingVariants=new Map();
  for(const d of layout.decor)if(['marketBuilding','marketHotel'].includes(d.kind)){
    const key=d.kind+':'+d.style,variant=lightingVariants.get(key)??integer(0,3);
    d.lightVariant=variant;d.lightSeed=integer(0,2147483647);lightingVariants.set(key,(variant+1)%4);
  }
  return layout;
}
