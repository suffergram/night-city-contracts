// Opaque bounds of locations-v1.png (alpha > 75); no per-axis scaling of props.
export const LOCATION_SOURCE_SIZES=[[292,139],[297,156],[294,299],[293,214],[298,259],[300,241],[293,139],[304,235],[285,287],[296,264],[310,53],[90,297],[275,259],[299,143],[285,276],[286,276]];
export function locationSize(frame,height){
  const [w,h]=LOCATION_SOURCE_SIZES[frame];return {w:height*w/h,h:height};
}
export function fitScenery(sourceW,sourceH,x,y,w,h){
  const scale=Math.min(w/sourceW,h/sourceH),width=sourceW*scale,height=sourceH*scale;
  return {x:x+(w-width)/2,y:y+h-height,w:width,h:height};
}
// Ignore isolated antialiasing pixels below the actual feet/base.
export function sceneryContactInset(pixels,width,height,{left,top,right,bottom}){
  const minimum=Math.max(3,(right-left+1)*.08);
  for(let y=bottom;y>=top;y--){
    let solid=0;for(let x=left;x<=right;x++)solid+=pixels[(y*width+x)*4+3]>160;
    if(solid>=minimum)return Math.min(bottom-y,height*.03);
  }
  return 0;
}
