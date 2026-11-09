import {locationSize} from './scenery-sizes.js';
import {MARKET_STALLS,marketStallSize,stallAdvance} from './market-stalls.js';
import {MARKET_HOTELS,hotelSize,hotelSink} from './market-hotels.js';
import {EXIT_STYLES,streetExit} from './exits.js';
export const LEVEL_KINDS={
  industrial:{name:'Промзона Уотсона',hint:'Технические площадки и переходы'},
  port:{name:'Грузовой порт',hint:'Контейнеры, краны и грузовые мостки'},
  market:{name:'Ночной рынок',hint:'Прилавки, навесы и верхние проходы'},
  megablock:{name:'Мегаблок',hint:'Жилые ярусы, лестничные марши и техэтажи'},
};
export function createLayout(rng,ground,forcedKind) {
  const pick=a=>a[Math.floor(rng()*a.length)],integer=(a,b)=>a+Math.floor(rng()*(b-a+1));
  const kind=forcedKind&&LEVEL_KINDS[forcedKind]?forcedKind:pick(Object.keys(LEVEL_KINDS));
  const width=kind==='megablock'?integer(23,31)*100:integer(24,39)*100;
  const layout={kind,width,platforms:[{id:0,x:0,y:ground,w:width,h:150,ground:true}],ladders:[],stairs:[],connections:[],decor:[],rooms:[],lamps:[],wallLights:[]};
  const surface=(x,y,w,extra={})=>{
    const native=['stall','hotelBalcony','hotelRoof'].includes(extra.art);
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
    const count=integer(3,5),rise=integer(180,200);layout.floorRise=rise;
    const levels=[[layout.platforms[0]]];
    for(let floor=1;floor<count;floor++){
      const gap=integer(75,105),cut=integer(Math.floor(width*.32),Math.floor(width*.68)),y=ground-floor*rise;
      levels.push([surface(35,y,cut-35,{deck:true}),surface(cut+gap,y,width-cut-gap-35,{deck:true})]);
    }
    for(let f=1;f<count;f++){
      const overlaps=[];
      for(const a of levels[f-1])for(const b of levels[f]){
        const left=Math.max(a.x,b.x),right=Math.min(a.x+a.w,b.x+b.w);
        if(right-left>90)overlaps.push({a,b,left,right});
      }
      const wide=overlaps.filter(o=>o.right-o.left>350),flight=pick(wide.length?wide:overlaps);
      stairs(flight.a,flight.b,flight.left,flight.right);
      const other=pick(overlaps.filter(o=>o!==flight).length?overlaps.filter(o=>o!==flight):overlaps);
      ladder(other.a,other.b,integer(Math.ceil(other.left+35),Math.floor(other.right-35)));
    }
    for(const [floor,platforms]of levels.entries())for(const p of platforms){
      for(let x=p.x+65;x<p.x+p.w-100;x+=integer(165,255)){
        const room={x,y:p.y,w:Math.min(integer(95,135),p.x+p.w-x-16),h:integer(110,130),variant:integer(0,5),floor};
        layout.rooms.push(room);layout.decor.push({...room,kind:rng()<.75?'apartment':'maintenance'});
      }
    }
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
    let x=integer(215,275),group=0,lastStyle=null,hotels=0;layout.marketGroups=[];
    while(x<width-350){
      const theme=group<3?themes[group]:pick(themes),count=integer(2,3),plan=[];
      for(let member=0;member<count;member++){
        const kind=member===0||rng()<.78?theme:pick(themes),choices=styles(kind).filter(id=>id!==lastStyle),style=pick(choices);
        plan.push({style,kind,...marketStallSize(style),gap:rng()<.6?0:integer(4,16)});lastStyle=style;
      }
      const length=()=>plan.reduce((sum,s,i)=>sum+(i?stallAdvance(plan[i-1],s,plan[i-1].gap):0),0)+plan.at(-1).w;
      const budget=group<3?(width-x-170-(2-group)*80)/(3-group):width-x-150;
      if(plan.length===3&&length()>budget)plan.pop();
      if(x+length()>width-150)break;
      const start=x;
      for(const [member,s]of plan.entries()){
        const p=surface(x,ground-s.h,s.w,{art:'stall'});
        layout.decor.push({kind:s.kind,style:s.style,x:p.x,y:p.y,w:s.w,h:s.h,platformId:p.id,group});
        if(member===0)ladder(layout.platforms[0],p,p.x+14);
        x=p.x+(member<plan.length-1?stallAdvance(s,plan[member+1],s.gap):s.w);
      }
      layout.marketGroups.push({id:group,x:start,w:x-start,count:plan.length,theme});
      x+=integer(75,185);group++;
      if(group===1||group===4&&hotels<2&&rng()<.55){
        const style=pick(Object.keys(MARKET_HOTELS)),def=MARKET_HOTELS[style],size=hotelSize(style);
        if(x+size.w<width-650){
          const y=ground-size.h+hotelSink(style);
          const balcony=surface(x+size.w*.04,y+size.h*def.balcony,size.w*.92,{art:'hotelBalcony'});
          const roof=surface(x+size.w*.04,y+size.h*def.roof,size.w*.92,{art:'hotelRoof'});
          layout.decor.push({kind:'marketHotel',style,x,y,...size,balconyId:balcony.id,roofId:roof.id});
          layout.connections.push({kind:'stairwell',id:hotels,lower:{x:x+size.w*def.entry,y:ground},upper:{x:x+size.w*def.exit,y:balcony.y}});
          ladder(balcony,roof,x+size.w*.93);
          x+=size.w+integer(85,170);hotels++;
        }
      }
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
    if(d.kind==='crane'||['container','foodStall','techStall','clothesStall','marketHotel'].includes(d.kind))return true;
    return d.y!==layout.portal.y||d.x+d.w<layout.portal.x-exitHalf-10||d.x>layout.portal.x+exitHalf+10;
  });
  layout.slots=[];
  for(const p of supports)for(let x=p.x+55;x<p.x+p.w-50;x+=integer(125,210)){
    if(p.holes?.some(h=>x+36>h.x&&x<h.x+h.w))continue;
    if(Math.hypot(x-layout.spawn.x,p.y-ground)<260||Math.abs(x-layout.portal.x)<70&&p.y===layout.portal.y)continue;
    layout.slots.push({x:Math.round(x),y:p.y,platformId:p.id,floor:p.floor});
  }
  layout.decor=layout.decor.filter(d=>!['apartment','maintenance'].includes(d.kind)||!supports.some(p=>p.y===d.y&&p.holes?.some(h=>d.x+d.w>h.x&&d.x<h.x+h.w)));
  if(kind==='megablock'){
    for(const p of supports)for(let x=p.x+100;x<p.x+p.w-80;x+=integer(440,650)){
      if(!p.holes?.some(h=>x>h.x-45&&x<h.x+h.w+45))layout.wallLights.push({x,y:p.y-150,floor:p.floor,colour:integer(0,3)===0?'#ffca8b':'#9bdedb'});
    }
  }else{
    for(let x=integer(150,250);x<width-90;x+=integer(420,600))layout.lamps.push({x,y:ground});
    if(kind==='market')layout.lamps=layout.lamps.filter(l=>!layout.decor.some(d=>d.kind==='marketHotel'&&l.x>d.x-15&&l.x<d.x+d.w+15));
    layout.lamps=layout.lamps.filter(l=>Math.abs(l.x-layout.portal.x)>exitHalf+18);
  }
  layout.name=LEVEL_KINDS[kind].name;layout.flavour=pick(['Северный сектор','Техническое крыло','Восточная линия','Закрытый периметр']);
  // Pick once for the contract; never reroll while scrolling or drawing.
  layout.backdrop=kind==='market'&&rng()<.5?'metropolis':'district';
  return layout;
}
