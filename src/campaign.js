export function validateCampaign(value,fallback={}){
 const v=value&&typeof value==='object'?value:fallback;
 return {sabotage:v.sabotage===true||fallback.sabotage===true,prototype:v.prototype===true||fallback.prototype===true,intel:v.intel===true,supply:v.supply===true,finished:v.finished===true,relaySignal:v.relaySignal===true,relaySupply:v.relaySupply===true,relayFinished:v.relayFinished===true};
}
export function campaignState(profile){
 const s=profile.campaign||=validateCampaign(null);
 s.sabotage=s.sabotage===true||profile.workshop?.equipment===true;
 s.prototype=s.prototype===true||(profile.workshop?.operations||0)>0;
 return s;
}
export function firstChapterStatus(profile){
 const s=campaignState(profile),missing=[];
 if(!s.sabotage)missing.push('Сдать «Остановить конвейер» у транспорта');
 if(!profile.workshop?.built)missing.push('Запустить мастерскую на доске контрактов');
 if(!s.prototype)missing.push('Доставить 1 прототип: сдать «Кражу прототипа» у транспорта');
 const next=!s.sabotage?{label:'Пройти саботаж',action:'contract:sabotage'}:!profile.workshop?.built?{label:'Запустить мастерскую',action:'workshop'}:!s.prototype?{label:'Доставить 1 прототип',action:'contract:prototype'}:{label:'Начать финал',action:'contract:blackout'};
 return {finished:s.finished===true,ready:!s.finished&&missing.length===0,missing,next};
}
export function campaignOffer(profile,depth){
 const s=campaignState(profile);if(!firstChapterStatus(profile).ready)return null;
 return {id:'blackout',name:'Контур H10 / Изъятие архива',kind:'industrial',depth:depth+2,reward:180+depth*12,xp:90,
  prep:{intel:s.intel,supply:s.supply},
  description:'Финал главы: отключи два замка у терминалов, забери архив и вернись к транспорту. Зачистка не обязательна. '+(s.intel?'Разведка: снайперы выведены из сектора. ':'Без разведки: снайперская поддержка. ')+(s.supply?'Перехват груза: турели обесточены.':'Без перехвата груза: две активные турели. Щиток питания доступен.')};
}
export function advanceCampaign(profile,world){
 const c=world.contract;if(!c?.paid||c.campaignRecorded)return '';
 c.campaignRecorded=true;const s=campaignState(profile);
 if(c.id==='sabotage')s.sabotage=true;
 if(c.id==='prototype')s.prototype=true;
 if(c.id==='sweep')s.intel=true;
 if(c.id==='assault')s.supply=true;
 if(s.finished&&c.id==='signal')s.relaySignal=true;
 if(s.finished&&c.id==='assault')s.relaySupply=true;
 if(c.id==='relay'&&s.finished&&s.relaySignal&&!s.relayFinished){s.relayFinished=true;profile.workshop.samples=(profile.workshop.samples||0)+4;return 'Разрыв канала завершён. Получено 4 образца. На следующих вылазках доступен полевой медкомплект: H, один раз за выезд.';}
 if(c.id==='blackout'&&!s.finished){s.finished=true;profile.workshop.samples=(profile.workshop.samples||0)+3;return 'Контур H10 закрыт. Получено 3 образца. Мастерская теперь готовит два ЭМИ за одну покупку.';}
 return '';
}
export const empCapacity=profile=>campaignState(profile).finished?2:1;
export function relayOffer(profile,depth){
 const s=campaignState(profile);if(!s.finished||!s.relaySignal||s.relayFinished)return null;
 return {id:'relay',name:'Разрыв канала / Портовый узел',kind:'port',depth:depth+2,reward:230+depth*12,xp:110,prep:{supply:s.relaySupply},description:'Финал второй главы: запусти терминал, удерживай его зону 60 секунд, затем победи портового надзирателя, забери ключ маршрутизации и вернись к транспорту. Остальную охрану можно обойти. Щит надзирателя сбивается катаной и открывается после атак; на половине HP начинается вторая фаза. '+(s.relaySupply?'Перехват груза: две волны вместо трёх, снайперская поддержка снята.':'Без подготовки: три волны и снайперская поддержка. Щитоносец охраняет терминал.')};
}
export function relayBrief(profile){const s=campaignState(profile);if(!s.finished)return '';const mark=v=>v?'✓':'○';return '<div class="shop-row"><div class="item-copy"><strong>Глава 02 / Разрыв канала'+(s.relayFinished?' · ЗАВЕРШЕНА':'')+'</strong><p>Архив H10 привёл к портовому узлу слежки. Разорви маршрут и забери ключ.</p><small>'+mark(s.relaySignal)+' Разведка: сдай «Перехват сигнала» после первой главы.</small><p>'+mark(s.relaySupply)+' Необязательная подготовка: сдай «Опасный груз» после первой главы — меньше подкреплений, без снайпера.</p><small>'+(s.relayFinished?'Открыт полевой медкомплект: H, один раз на каждой новой вылазке.':'Награда финала: 4 образца и полевой медкомплект на каждой вылазке. Взлом прерывается вне зоны, накопленный прогресс сохраняется.')+'</small></div></div>';}
export function useFieldKit(world,player,maxHp){if(!world.fieldKits||player.hp<=0||player.hp>=maxHp)return false;world.fieldKits--;player.hp=Math.min(maxHp,player.hp+Math.round(maxHp*.35));return true;}
export function campaignBrief(profile){
 const s=campaignState(profile),mark=done=>done?'✓':'○';
 return '<div class="shop-row"><div class="item-copy"><strong>Операция / Контур H10'+(s.finished?' · ЗАВЕРШЕНА':'')+'</strong><p>Перекрой канал поставок и забери архив слежки за убежищем.</p><small>'+mark(s.sabotage)+' Саботаж: доступ к замкам · '+mark(s.prototype)+' Прототип: ключ к архиву</small><p>'+mark(s.intel)+' Разведка: «Зачистка квартала» убирает снайперов в финале.<br>'+mark(s.supply)+' Подготовка: «Опасный груз» обесточивает турели в финале.</p><small>'+(s.finished?'Награда открыта: подготовка двух зарядов ЭМИ. Свободные контракты остаются доступны.':'Для финала нужны саботаж, прототип и запущенная мастерская. Дополнительные подготовки необязательны. Награда: 3 образца и подготовка двух ЭМИ.')+'</small></div></div>';
}
