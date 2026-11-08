export function findStairwell(actor,world){
  if(!actor.grounded||actor.stairwellCooldown>0)return null;
  const x=actor.x+actor.w/2,feet=actor.y+actor.h;
  return (world.connections||[]).filter(c=>c.kind==='stairwell').flatMap(connection=>[true,false].map(up=>({connection,up,start:up?connection.lower:connection.upper})))
    .filter(r=>Math.abs(r.start.y-feet)<12&&Math.abs(r.start.x-x)<38).sort((a,b)=>Math.abs(a.start.x-x)-Math.abs(b.start.x-x))[0]||null;
}
export function useStairwell(actor,connection,up){
  const start=up?connection.lower:connection.upper,end=up?connection.upper:connection.lower;
  if(connection.kind!=='stairwell'||!actor.grounded||actor.stairwellCooldown>0||Math.abs(actor.x+actor.w/2-start.x)>40||Math.abs(actor.y+actor.h-start.y)>12)return false;
  Object.assign(actor,{x:end.x-actor.w/2,y:end.y-actor.h,vx:0,vy:0,grounded:true,climbing:null,climbIntent:0,drop:0,stairwellCooldown:.4});
  return true;
}
