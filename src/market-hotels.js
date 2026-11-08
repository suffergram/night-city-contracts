// Scale the complete facade so every ground storey clears the 105px stall roofs.
export const MARKET_HOTELS={
  hourly:{asset:'hotelHourly',size:[1612,871],plinth:30,balcony:.553,roof:.095,entry:.82,exit:.86},
  love:{asset:'hotelLove',size:[1488,778],plinth:25,balcony:.52,roof:.075,entry:.50,exit:.82},
  business:{asset:'hotelBusiness',size:[1641,853],plinth:30,balcony:.565,roof:.15,entry:.20,exit:.87},
};
const minimumGroundStorey=125;
const width=Math.max(...Object.values(MARKET_HOTELS).map(({size:[w,h],balcony})=>minimumGroundStorey*w/(h*(1-balcony))));
export function hotelSize(style){const [w,h]=MARKET_HOTELS[style].size;return {w:width,h:width*h/w};}
export function hotelSink(style){const def=MARKET_HOTELS[style];return def.plinth*.5*width/def.size[0];}
