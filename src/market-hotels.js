// Match door scale across facades, keeping the business hotel as the reference.
export const MARKET_HOTELS={
  hourly:{asset:'hotelHourly',size:[1612,871],doorHeight:220,plinth:30,balcony:.553,roof:.095,entry:.82,exit:.86},
  love:{asset:'hotelLove',size:[1488,778],doorHeight:220,plinth:25,balcony:.52,roof:.075,entry:.50,exit:.82},
  business:{asset:'hotelBusiness',size:[1641,853],doorHeight:200,plinth:30,balcony:.565,roof:.15,entry:.20,exit:.87},
};
const minimumGroundStorey=125;
const reference=MARKET_HOTELS.business;
const referenceScale=minimumGroundStorey/(reference.size[1]*(1-reference.balcony));
export function hotelSize(style){
  const def=MARKET_HOTELS[style],scale=referenceScale*reference.doorHeight/def.doorHeight*(style==='love'?1.11:style==='hourly'?1.05:1.02);
  return {w:def.size[0]*scale,h:def.size[1]*scale};
}
export function hotelSink(style){const def=MARKET_HOTELS[style];return def.plinth*.5*hotelSize(style).w/def.size[0];}
