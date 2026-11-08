// Opaque sprite bounds measured from the final 4x4 atlases at alpha > 160.
// Recheck with: node scripts/browser-check.mjs --detail-metadata
export const DETAIL_SOURCE_SIZES = {
  life:[[291,181],[183,291],[258,204],[289,180],[257,261],[269,279],[288,252],[201,279],[287,211],[272,253],[264,288],[279,250],[282,228],[309,220],[265,205],[284,207]],
  worksite:[[281,258],[275,210],[272,282],[276,252],[301,252],[276,242],[303,184],[232,274],[209,293],[287,234],[305,163],[294,252],[291,258],[284,196],[288,285],[287,229]],
};
export function detailSize(def){
  const [width,height]=DETAIL_SOURCE_SIZES[def.atlas][def.frame],scale=Math.min(def.w/width,def.h/height);
  return {w:width*scale,h:height*scale};
}
