// Source-cell coordinates, not screen bands. Legs and footwear follow each limb.
// A pose stores head centre, hip centre, then knee/ankle/toe for both legs.
const pose = (head, hip, a, b) => ({ head, hip, legs: [a,b] });
const idle = pose([.53,.115],[.44,.55],[[.34,.72],[.31,.89],[.37,.97]],[[.55,.72],[.59,.90],[.69,.97]]);
const stance = pose([.57,.14],[.44,.55],[[.29,.74],[.22,.91],[.29,.98]],[[.60,.73],[.64,.92],[.75,.98]]);
const run = [
  pose([.63,.15],[.44,.53],[[.27,.70],[.15,.85],[.20,.92]],[[.57,.69],[.43,.85],[.51,.91]]),
  pose([.65,.15],[.46,.53],[[.32,.72],[.28,.88],[.35,.95]],[[.62,.61],[.49,.77],[.57,.84]]),
  pose([.65,.14],[.47,.51],[[.36,.74],[.30,.91],[.38,.98]],[[.64,.60],[.51,.76],[.59,.82]]),
  pose([.64,.14],[.44,.53],[[.25,.71],[.14,.79],[.19,.85]],[[.64,.70],[.72,.87],[.82,.89]]),
  pose([.65,.17],[.45,.54],[[.29,.76],[.30,.87],[.38,.93]],[[.59,.76],[.58,.94],[.69,.98]]),
  pose([.64,.18],[.45,.54],[[.31,.75],[.27,.92],[.35,.98]],[[.59,.76],[.50,.90],[.59,.95]]),
];
const back = [
  pose([.55,.14],[.44,.53],[[.31,.73],[.27,.91],[.34,.98]],[[.56,.73],[.59,.91],[.69,.98]]),
  pose([.57,.15],[.45,.53],[[.32,.74],[.31,.92],[.38,.99]],[[.58,.65],[.51,.85],[.61,.93]]),
  pose([.57,.15],[.46,.53],[[.37,.76],[.28,.91],[.35,.98]],[[.59,.77],[.62,.93],[.73,.99]]),
  pose([.58,.15],[.47,.54],[[.31,.68],[.28,.80],[.36,.87]],[[.56,.75],[.60,.94],[.71,.99]]),
  pose([.58,.17],[.46,.54],[[.35,.72],[.33,.86],[.43,.93]],[[.60,.68],[.53,.84],[.63,.91]]),
  pose([.59,.17],[.47,.55],[[.36,.74],[.30,.89],[.37,.96]],[[.59,.78],[.54,.93],[.65,.99]]),
];
const jump = [
  pose([.66,.41],[.39,.73],[[.28,.84],[.17,.94],[.24,.99]],[[.55,.77],[.40,.88],[.47,.96]]),
  pose([.66,.27],[.40,.60],[[.37,.77],[.24,.85],[.30,.91]],[[.60,.63],[.44,.79],[.51,.86]]),
  pose([.65,.15],[.42,.50],[[.34,.66],[.24,.73],[.31,.80]],[[.64,.52],[.52,.68],[.60,.75]]),
  pose([.64,.12],[.42,.47],[[.36,.65],[.24,.73],[.31,.80]],[[.67,.53],[.56,.69],[.64,.76]]),
  pose([.64,.24],[.43,.59],[[.33,.75],[.23,.85],[.31,.92]],[[.60,.68],[.50,.83],[.60,.90]]),
  pose([.65,.42],[.40,.75],[[.28,.85],[.18,.94],[.26,.99]],[[.60,.79],[.47,.91],[.57,.97]]),
];
const roll = [
  pose([.69,.19],[.33,.69],[[.18,.82],[.12,.92],[.20,.98]],[[.43,.82],[.38,.92],[.47,.99]]),
  pose([.66,.54],[.31,.40],[[.45,.27],[.61,.31],[.70,.36]],[[.48,.50],[.38,.67],[.46,.75]]),
  pose([.35,.74],[.62,.36],[[.46,.22],[.33,.36],[.28,.30]],[[.70,.24],[.78,.40],[.85,.40]]),
  pose([.28,.54],[.63,.55],[[.72,.33],[.55,.26],[.44,.32]],[[.70,.68],[.54,.83],[.62,.89]]),
  pose([.66,.33],[.36,.60],[[.25,.75],[.16,.89],[.24,.95]],[[.58,.69],[.45,.86],[.53,.93]]),
  pose([.68,.20],[.34,.69],[[.18,.82],[.12,.92],[.20,.98]],[[.44,.82],[.39,.92],[.48,.99]]),
];
const rows = (...groups) => groups.flat();
const repeat = p => Array(6).fill(p);
const POSES = {
  hero: rows(repeat(idle),run,jump,roll,repeat(stance),repeat(stance)),
  actions: rows(back,run,run,back,jump,jump),
  utility: rows(back,repeat(idle),run,back,jump,jump),
  longgunUtility: rows([idle,idle,idle,...run.slice(0,3)],[...back.slice(0,3),jump[1],jump[3],jump[4]],
    [idle,idle,idle,...run.slice(0,3)],[...back.slice(0,3),jump[1],jump[3],jump[4]],jump,jump),
  aimRig: rows(repeat(idle),run,back,jump,Array(12).fill(null)),
};

// Blades are protected even where their silhouettes cross trouser fabric.
const lowBlade = [[.28,.55,.86,.74,.035]];
const rearBlade = [[.29,.31,.02,.82,.035]];
const attackBlades = [rearBlade,[[.17,.25,.75,.03,.04]],[[.20,.02,.56,.31,.04]],
  [[.48,.34,1,.29,.035]],[[.53,.48,.99,.45,.035]],[[.48,.58,.99,.77,.04]]];
const movingBlades = [rearBlade,rearBlade,[[.08,.23,.58,.01,.04]],[[.09,.15,.57,.01,.04]],
  [[.03,.30,.77,.18,.04]],[[.49,.50,.99,.69,.04]]];

export function segmentDistanceSquared(x,y,a,b) {
  const dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy;
  const t=length?Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/length)):0;
  return (x-a[0]-t*dx)**2+(y-a[1]-t*dy)**2;
}
const capsule = (x,y,a,b,r) => segmentDistanceSquared(x,y,a,b) <= r*r;
const ellipse = (x,y,c,rx,ry) => ((x-c[0])/rx)**2+((y-c[1])/ry)**2 <= 1;

export function materialPose(sheet,frame) {
  const armsOnly = sheet==='aimExtremes'||sheet==='aimRig'&&frame>=24;
  let blades=[];
  if(sheet==='hero') blades=frame<6?lowBlade:frame<18?rearBlade:frame>=24&&frame<30?attackBlades[frame-24]:[];
  if(sheet==='actions') blades=frame<6?lowBlade:frame<12?movingBlades[frame-6]:frame>=24&&frame<30?movingBlades[frame-24]:[];
  if(sheet==='utility'&&frame<6) blades=[[[.25,.46,.80,.74,.035]],[[.25,.46,.80,.74,.035]],
    [[.29,.43,.86,.71,.035]],[[.30,.04,.90,.02,.04]],[[.45,.39,.99,.68,.04]],[[.53,.62,.99,.85,.04]]][frame];
  const body=POSES[sheet]?.[frame];
  const forearm=body===idle?[[.315,.38],[.295,.565]]:body&&!(sheet==='hero'&&frame>=18&&frame<24)?[
    [body.head[0]-.30,body.head[1]+.25],[body.hip[0]-.15,body.hip[1]],
  ]:null;
  return { ...(body||{}), armsOnly, armCap:sheet==='aimExtremes'?[.30,.50]:[.20,.36], blades, forearm, exactForearm:body===idle,
    torsoRadius:sheet==='hero'&&frame>=18&&frame<24?.26:.17 };
}

// Material IDs: 0 protected/source, 1 jacket, 2 trousers, 3 footwear, 4 eye implant.
export function materialAt(pose,x,y,r,g,b) {
  const {head,hip,legs,armsOnly,armCap,blades,forearm,exactForearm,torsoRadius}=pose;
  const red=r>35&&r>g*1.25&&r>b*1.1&&Math.abs(g-b)<r*.22;
  if(armsOnly) return red&&ellipse(x,y,armCap,.23,.26)?1:0;
  if(!head) return 0;
  // Never let head gear recolour the cyan collar or reflected light on steel.
  if(g>r*1.3&&b>r*1.3&&ellipse(x,y,[head[0]+.025,head[1]+.015],.045,.035)) return 4;
  if(ellipse(x,y,head,.09,.115)) return 0;
  if(blades.some(([ax,ay,bx,by,radius])=>capsule(x,y,[ax,ay],[bx,by],radius))) return 0;
  if(forearm&&(exactForearm||!red)&&capsule(x,y,forearm[0],forearm[1],.045)) return 0;
  // Warm skin is protected independently of the pose's material bounds.
  if(r>60&&r>g*1.06&&g>b*1.13) return 0;
  const shoulder=[head[0]*.65+hip[0]*.35-.09,head[1]*.65+hip[1]*.35];
  const axisX=hip[0]-head[0],axisY=hip[1]-head[1],axisLength=Math.hypot(axisX,axisY);
  const aboveWaist=(x-hip[0])*axisX+(y-hip[1])*axisY < -.015*axisLength;
  if(red&&aboveWaist&&capsule(x,y,shoulder,hip,torsoRadius)) return 1;
  const light=(r+g+b)/3;
  // Preserve metal edges, studs, rim lighting and bright boot hardware.
  if(light<16||light>108||Math.max(r,g,b)-Math.min(r,g,b)>28) return 0;
  for(const [knee,ankle,toe] of legs) {
    if(capsule(x,y,ankle,toe,.052)) return 3;
  }
  for(const [knee,ankle] of legs) {
    if(capsule(x,y,hip,knee,.09)||capsule(x,y,knee,ankle,.065)) return 2;
  }
  return 0;
}

export function tintLeather(r,g,b,tone) {
  const light=r*.2126+g*.7152+b*.0722;
  const targetLight=tone[0]*.2126+tone[1]*.7152+tone[2]*.0722;
  // Blend chroma while retaining exposure; bright highlights remain original.
  const strength=.72*Math.max(0,Math.min(1,(112-light)/36));
  return [r,g,b].map((v,i)=>Math.round(Math.max(0,Math.min(255,v*(1-strength)+tone[i]*light/Math.max(1,targetLight)*strength))));
}
