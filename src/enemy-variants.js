export const ENEMY_VARIANTS={
 sniper:{name:'Снайпер',hint:'Длинный прицел, затем фиксация выстрела. Смени позицию после захвата.'},
 shield:{name:'Щитоносец',hint:'Щит держит пули спереди. Обойди или сбей катаной; ЭМИ подавляет защиту.'},
};
export function applySecurityVariants(world,offer){
 const shooter=world.enemies.find(e=>e.role==='gunner'&&!e.turret);
 const heavy=world.enemies.find(e=>e.role==='heavy');
 if(shooter&&['sweep','assault','prototype'].includes(offer.id))shooter.variant='sniper';
 if(heavy&&(['assault','prototype'].includes(offer.id)||(offer.id==='sabotage'&&offer.depth>=3)))heavy.variant='shield';
}
export function securityIntel(offer){
 const ids=['assault','prototype'].includes(offer.id)?['sniper','shield']:offer.id==='sweep'?['sniper']:offer.id==='sabotage'&&offer.depth>=3?['shield']:[];
 return ids.map(id=>ENEMY_VARIANTS[id].name+': '+ENEMY_VARIANTS[id].hint).join(' ');
}
export function shieldActive(enemy){return enemy.variant==='shield'&&!enemy.dead&&!(enemy.disabledFor>0)&&!(enemy.shieldDown>0);}
export function variantHit(enemy,sourceX,ranged){
 if(enemy.variant!=='shield')return 1;
 if(!ranged){enemy.shieldDown=3;return 1;}
 const front=(sourceX-(enemy.x+enemy.w/2))*enemy.facing>0;
 return shieldActive(enemy)&&front ? .2 : 1;
}
