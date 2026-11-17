// Behavioural properties are independent of rarity and base item power.
export const GEAR_TRAITS={
 capacitor:{slot:'gun',name:'Конденсатор',description:'Последний патрон магазина наносит ×2,2 урона. Базовый урон −15%.',damage:.85},
 cooled:{slot:'rifle',name:'Термокожух',description:'Нагрев от выстрелов −55%: очередь дольше сохраняет точность. Базовый урон −15%.',damage:.85},
 repulsor:{slot:'shotgun',name:'Репульсор',description:'Попадания отбрасывают обычных врагов. Штурмовики и турели устойчивы. Базовый урон −15%.',damage:.85},
 flow:{slot:'weapon',name:'Поток',description:'Каждое попадание катаной возвращает 7 выносливости. Базовый урон −15%.',damage:.85},
 reactive:{slot:'torso',name:'Аварийная защита',description:'При здоровье не выше 35% входящий урон −30%. Броня этой куртки −30%.'},
 impulse:{slot:'feet',name:'Импульсные подошвы',description:'Перекат на 25% дальше, но расходует на 30% больше выносливости.'},
};
export function gearTrait(item){const t=GEAR_TRAITS[item?.trait];return t&&t.slot===item.type?t:null;}
export const gearDamage=item=>gearTrait(item)?.damage||1;
export const gearArmor=item=>Math.round((item?.power||0)*(gearTrait(item)===GEAR_TRAITS.reactive ? .7 : 1));
export function assignTrait(item,rng=Math.random,guaranteed=false){
 const candidates=Object.entries(GEAR_TRAITS).filter(([,t])=>t.slot===item.type);
 if(candidates.length&&(guaranteed||rng()<.4))item.trait=candidates[Math.floor(rng()*candidates.length)][0];
 return item;
}
export function gearShot(profile,slot,ammo){const t=gearTrait(profile.equipment[slot]);return {damage:t===GEAR_TRAITS.capacitor&&ammo===1?2.2:1,heat:t===GEAR_TRAITS.cooled ? .45 : 1};}
export function gearMeleeStamina(profile){return gearTrait(profile.equipment.weapon)===GEAR_TRAITS.flow?7:0;}
export function gearIncoming(profile,hp,maxHp){return gearTrait(profile.equipment.torso)===GEAR_TRAITS.reactive&&hp<=maxHp*.35?.7:1;}
export function gearRoll(profile){return gearTrait(profile.equipment.feet)===GEAR_TRAITS.impulse?{speed:1.25,cost:1.3}:{speed:1,cost:1};}
export function gearKnockback(profile,slot,enemy){return gearTrait(profile.equipment[slot])===GEAR_TRAITS.repulsor&&enemy.role!=='heavy'&&!enemy.turret?35:0;}
