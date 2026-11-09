// Regions follow the trimmed artwork, preserving alignment at every hotel scale.
const corridor=(xs,y)=>xs.map((x,i)=>({rect:[x,y,.055,.018],colour:'#ffd296',mode:i===1?'blink':i===2?'strong':false}));
const windows=rects=>rects.map(rect=>({rect,colour:'#ffc382',window:true}));
export const HOTEL_ATMOSPHERE={
  hourly:{
    lights:[
      {rect:[.002,.19,.052,.31],colour:'#4ce5e9',mode:'strong',sign:true},
      ...corridor([.18,.40,.62,.84],.195),
      {rect:[.42,.64,.13,.022],colour:'#4ce9e3'},
      {rect:[.62,.69,.014,.12],colour:'#ff4ba9',mode:'blink'},
      ...windows([[.115,.30,.055,.10],[.34,.30,.055,.10],[.56,.30,.055,.10],[.14,.69,.14,.12],[.39,.70,.15,.10]]),
    ],lamps:[[.45,.72,.98]],vents:[[.77,.015],[.88,.015]],
  },
  love:{
    lights:[
      ...corridor([.16,.37,.58,.79],.20),
      {rect:[.61,.64,.034,.065],colour:'#ff54b8',mode:'blink',sign:true},
      {rect:[.62,.735,.013,.047],colour:'#ff70bf',mode:'strong',sign:true},
      {rect:[.43,.64,.07,.019],colour:'#ffd08a'},
      ...windows([[.04,.67,.29,.17],[.65,.67,.28,.17]]),
    ],lamps:[[.465,.66,.97]],vents:[[.15,.005]],
  },
  business:{
    lights:[
      {rect:[.39,.15,.20,.055],colour:'#ffc175',mode:'strong',sign:true},
      {rect:[.10,.225,.10,.017],colour:'#56e8e8'},
      {rect:[.84,.225,.08,.017],colour:'#56e8e8',mode:'blink'},
      ...[.165,.34,.515,.69,.865].map((x,i)=>({rect:[x,.36,.014,.045],colour:'#ffd19a',mode:i===2?'strong':false})),
      {rect:[.43,.635,.13,.018],colour:'#58e8ed'},
      {rect:[.84,.635,.08,.018],colour:'#58e8ed'},
      ...windows([[.10,.30,.045,.024],[.28,.30,.045,.024],[.45,.30,.045,.024],[.63,.30,.045,.024],[.065,.67,.235,.16]]),
    ],lamps:[[.32,.73,.97]],vents:[[.19,.075],[.85,.025]],
  },
};
