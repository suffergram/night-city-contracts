import {campaignState,firstChapterStatus} from './campaign.js';
import {workshopState,RESEARCH} from './workshop.js';

const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn=(label,action,secondary=false,disabled=false)=>`<button class="button${secondary?' secondary':''}" data-action="${action}" ${disabled?'disabled':''}>${label}</button>`;
const tabs=(items,active,action)=>'<nav class="menu-tabs" aria-label="Разделы окна">'+items.map(([id,name])=>'<button class="button'+(active===id?'':' secondary')+'" aria-pressed="'+(active===id)+'" data-action="'+action+':'+id+'">'+name+'</button>').join('')+'</nav>';
const goals={sabotage:'Отключи два узла → вернись к транспорту.',sweep:'Устрани охрану → вернись к транспорту.',assault:'Зачисти грузовой порт → вернись к транспорту.',prototype:'Забери прототип → вернись к транспорту.',blackout:'Сними два замка → забери архив → вернись.',signal:'Удержи терминал 75 секунд → вернись.',relay:'Взломай узел → победи надзирателя → забери ключ.'};
const place={industrial:'Промзона',port:'Порт',market:'Нижний квартал',megablock:'Мегабашня'};
const reward=c=>`<div class="reward-chips"><span>${c.reward} эдди</span><span>${c.xp} XP</span>${c.id==='prototype'?'<span>1 образец</span>':c.samples?`<span>${c.samples} образца</span>`:c.id==='blackout'?'<span>3 образца + улучшение хаба</span>':c.id==='relay'?'<span>4 образца + медкомплект</span>':''}</div>`;
function contractDetails(c){const hints={sabotage:'Первый узел вызывает подкрепление.',prototype:'Турель можно обесточить или подавить ЭМИ.',blackout:'Разведка убирает снайпера; перехват груза отключает турели.',signal:'Вне зоны прогресс стоит. Три волны охраны.',relay:'Взлом 60 с. Ключ доступен после победы над надзирателем.'};return hints[c.id]?'<p class="mission-note">'+hints[c.id]+'</p>':'';}
export function boardUI(profile,offers,view='story'){
 const s=campaignState(profile),ws=workshopState(profile),status=firstChapterStatus(profile);
 let next=status.next,chapter='Глава 01 · Контур H10',steps=[['Саботаж',s.sabotage],['Мастерская',ws.built],['Прототип',s.prototype],['Архив',s.finished]];
 if(s.finished){
  chapter=s.relayFinished?'Свободные операции':'Глава 02 · Разрыв канала';
  next=!s.relaySignal?{label:'Перехватить сигнал',action:'contract:signal'}:!s.relayFinished?{label:'К портовому узлу',action:'contract:relay'}:{label:'Выбрать перехват',action:'contract:signal'};
  steps=[['Перехват',s.relaySignal],['Портовый узел',s.relayFinished]];
 }
 const id=next.action.split(':')[1],c=offers.find(o=>o.id===id),pending=steps.findIndex(([,done])=>!done);
 const progress=`<ol class="mission-steps" aria-label="Этапы главы">${steps.map(([name,done],i)=>`<li class="${done?'done':i===pending?'current':''}" ${i===pending?'aria-current="step"':''}><span>${done?'✓':i+1}</span>${name}</li>`).join('')}</ol>`;
 const main=`<section class="mission-focus" data-finale-status="${status.ready?'ready':'locked'}"><div class="menu-kicker">${chapter}</div>${progress}<h3>${c?esc(c.name):'Запуск мастерской'}</h3><p class="mission-goal">${c?goals[c.id]:'Оборудование доставлено. Запусти мастерскую бесплатно.'}</p>${c?`<div class="mission-meta">${place[c.kind]} <span>Угроза ${c.depth}</span></div>${reward(c)}`:''}<div class="mission-action">${btn(next.label,next.action)}<small>${next.action==='workshop'?'Затем доставь 1 прототип для открытия финала.':'Контракт закрывается у транспорта.'}</small></div>${c?contractDetails(c):''}</section>`;
 let prep='';
 if(!s.finished){prep=`<p>Эти задания облегчают финал, но не обязательны.</p><div class="prep-options">${btn((s.intel?'✓ ':'')+'Разведка · убрать снайпера','contract:sweep',true)}${btn((s.supply?'✓ ':'')+'Перехват груза · отключить турели','contract:assault',true)}</div>`;}
 else if(!s.relayFinished){prep=`<p>Перехват груза убирает снайпера и последнюю волну.</p>${btn((s.relaySupply?'✓ ':'')+'Подготовить портовый узел','contract:assault',true)}`;}
 const navigation=tabs([['story','Текущая цель'],...(!s.relayFinished?[['prep','Подготовка']]:[]),['all','Все контракты']],view,'board-tab');
 const content=view==='all'?'<div class="contract-options">'+offers.map(o=>'<article class="contract-option"><div class="mission-meta">'+place[o.kind]+' · Угроза '+o.depth+'</div><h4>'+esc(o.name)+'</h4><p>'+goals[o.id]+'</p>'+reward(o)+contractDetails(o)+btn('Взять контракт','contract:'+o.id,true)+'</article>').join('')+'</div>':view==='prep'?'<section class="mission-focus"><h3>Подготовка финала</h3>'+prep+'</section>':main;
 return '<div class="board-ui">'+navigation+content+'<p class="menu-footnote">При гибели: −20% денег. Опыт и вещи сохраняются.</p></div>';

}
const shortEffects={duplex:'Две пули за один патрон',slug:'Точный снаряд вместо дроби',siphon:'Лечение за добивание катаной',projector:'Отвлекает охрану на 10 секунд'};
export function workshopUI(profile,capacity,view='gadgets'){
 const s=workshopState(profile),chapter=campaignState(profile);
 if(!s.built)return `<section class="mission-focus"><div class="menu-kicker">Развитие хаба</div><h3>Запустить мастерскую</h3><p>${s.equipment?'Оборудование доставлено. Запуск бесплатный.':'Сначала доставь оборудование из саботажа.'}</p>${btn(s.equipment?'Запустить бесплатно':'Пройти саботаж',s.equipment?'build-workshop':'contract:sabotage')}<small class="next-hint">Затем доставь 1 прототип, чтобы открыть финал H10.</small></section>`;
 const project=(id,r)=>{
  const unlocked=s.researched.includes(id),selected=r.gadget?s.gadget==='decoy':s.mod===id,locked=r.requiresChapter&&!chapter.finished;
  const state=selected?'Установлено':unlocked?'Открыто':locked?'После главы H10':r.cost+' образца';
  return `<article class="project-card ${selected?'selected':''}"><div class="project-state">${state}</div><h4>${r.name}</h4><p>${shortEffects[id]}</p>${btn(selected?'Установлено':unlocked?'Выбрать':locked?'Недоступно':'Исследовать · '+r.cost,unlocked?(r.gadget?'gadget:decoy':'weapon-mod:'+id):'research:'+id,unlocked,selected||locked||!unlocked&&s.samples<r.cost)}${'<p class="project-tradeoff">'+esc(({duplex:'Каждая пуля: 60% урона. Интервал выстрелов +25%.',slug:'Урон ×3 одной дробины. Дальность 650. Интервал +25%.',siphon:'Добивание: +12% HP. Урон катаны −20%.',projector:'60 HP. Вместо ЭМИ. Подготовка — 25 эдди.'})[id])+'</p>'}</article>`;
 };
 const gadget=(id,name,ready,available,description)=>`<article class="project-card ${s.gadget===id?'selected':''}"><div class="project-state">${ready?'● Готов к выезду':'Не подготовлен'}${s.gadget===id?' · Выбран':''}</div><h4>${name}</h4><p>${description}</p><div class="gadget-actions">${btn(ready?'Подготовлен':'Подготовить · 25 эдди',id==='emp'?'prepare-emp':'prepare-decoy',false,ready||!available||profile.gold<25)}${btn(s.gadget===id?'Выбран':'Выбрать','gadget:'+id,true,s.gadget===id||!available)}</div></article>`;
 const navigation=tabs([['gadgets','Гаджеты'],['modules','Модули']],view,'workshop-tab');
 return `<div class="workshop-ui"><div class="menu-resources"><span><b>${s.samples}</b> образцов</span><span><b>${profile.gold}</b> эдди</span></div>${!chapter.prototype?'<div class="next-step"><span>Далее: доставь 1 прототип.</span>'+btn('К контракту','contract:prototype',true)+'</div>':''}${navigation}${view==='modules'?`<h3>Оружейный модуль <small>Один на выбор</small></h3><div class="project-grid"><article class="project-card ${s.mod==='standard'?'selected':''}"><div class="project-state">${s.mod==='standard'?'Установлено':'Доступно'}</div><h4>Стандарт</h4><p>Обычные характеристики оружия</p>${btn(s.mod==='standard'?'Установлено':'Выбрать','weapon-mod:standard',true,s.mod==='standard')}</article>${Object.entries(RESEARCH).filter(([,r])=>!r.gadget).map(([id,r])=>project(id,r)).join('')}</div>`:`<h3>Гаджет <kbd>G</kbd> <small>Подготовь и выбери перед выездом</small></h3><div class="project-grid gadget-grid">${gadget('emp','ЭМИ',s.empReady,true,capacity+' зар. · подавляет электронику')}${s.researched.includes('projector')?gadget('decoy','Голограмма',s.decoyReady,true,'1 зар. · отвлекает ближайшую охрану'):project('projector',RESEARCH.projector)}</div>`}<p class="menu-footnote">Образцы: прототип +1, перехват +2. Исследования сохраняются навсегда.</p></div>`;

}
