// Opaque artwork sizes and gallery levels are shared by generation and rendering.
export const MARKET_BUILDINGS={
  'housing-a':{asset:'buildingHousingA',kind:'housing',name:'Жилой дом с бакалеей',size:[942,1263],landings:[.624,.342],roof:.083,entry:.79,exit:.86},
  'housing-b':{asset:'buildingHousingB',kind:'housing',name:'Жилой дом с магазинами',size:[1215,1122],landings:[.670,.378],roof:.095,entry:.90,exit:.90},
  'minimarket-a':{asset:'buildingMinimarketA',kind:'minimarket',name:'Минимаркет',size:[1256,1090],landings:[.491],roof:.103,entry:.84,exit:.86},
  'minimarket-b':{asset:'buildingMinimarketB',kind:'minimarket',name:'Универсам',size:[1442,963],landings:[.493],roof:.122,entry:.82,exit:.86},
  'repair-a':{asset:'buildingRepairA',kind:'repair',name:'Мастерская имплантов',size:[1113,1201],landings:[.496],roof:.098,entry:.82,exit:.85},
  'repair-b':{asset:'buildingRepairB',kind:'repair',name:'Ломбард электроники',size:[1351,987],landings:[.492],roof:.105,entry:.83,exit:.87},
  'laundry-a':{asset:'buildingLaundryA',kind:'laundry',name:'Прачечная',size:[1181,1139],landings:[.490],roof:.116,entry:.81,exit:.86},
  'laundry-b':{asset:'buildingLaundryB',kind:'laundry',name:'Прачечная с жилой галереей',size:[1398,963],landings:[.495],roof:.113,entry:.87,exit:.90},
};
export function marketBuildingSize(style){
  const def=MARKET_BUILDINGS[style],h=130/(1-def.landings[0]);
  return {w:h*def.size[0]/def.size[1],h};
}
export const marketBuildingSink=style=>marketBuildingSize(style).h*.009;
// Main sidewalls inside opaque bounds; the plinth extends beyond these edges.
export const MARKET_BUILDING_WALLS={
  'housing-a':[.012,.988], 'housing-b':[.008,.990],
  'minimarket-a':[.012,.987], 'minimarket-b':[.010,.990],
  'repair-a':[.012,.987], 'repair-b':[.010,.987],
  'laundry-a':[.010,.988], 'laundry-b':[.009,.989],
};
