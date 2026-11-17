import {SLOTS,BAG_LIMIT,BALANCE,stats,itemValue,buyPrice} from './world.js';
import {gearTrait,gearArmor} from './gear.js';
import {weaponSlots} from './weapons.js';
import {previewMarkup} from './raster.js';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={weapon:'⚔',gun:'⌐',rifle:'⌁',shotgun:'═',head:'▱',torso:'◈',legs:'Ⅱ',feet:'⌁'};
const damageKeys={weapon:'damage',gun:'gunDamage',rifle:'rifleDamage',shotgun:'shotgunDamage'};
const btn=(label,action,disabled=false,secondary=false)=>`<button class="button${secondary?' secondary':''}" data-action="${action}" ${disabled?'disabled':''}>${label}</button>`;
export function resolveGear(profile,stock,selection){
 const [source,key]=selection.split('-');
 const item=source==='equipment'?profile.equipment[key]:source==='bag'?profile.bag[Number(key)]:source==='stock'?stock?.[Number(key)]:null;
 return {source,key,item};
}
function power(profile,item){return weaponSlots.includes(item.type)?stats({...profile,equipment:{...profile.equipment,[item.type]:item}})[damageKeys[item.type]]:gearArmor(item);}
function tile(item,source,key,label,selected,canBuy=true,mode='hub',full=false){
 const id=source+'-'+key,slot=item?.type||key,weapon=weaponSlots.includes(slot);
 const action=source==='stock'?'buy:'+key:source==='equipment'?'unequip:'+key:'equip:'+key;
 const disabled=!item||(source==='stock'&&!canBuy)||(source==='equipment'&&full);
 const cell=`<button class="gear-tile ${item?'rarity-'+item.rarity:'empty'} ${selected===id?'chosen':''}" data-action="${action}" ${disabled?'disabled':''} ${source==='equipment'?`data-equipment-slot="${key}"`:''} data-item-slot="${slot}" aria-label="${esc(item?.name||label||'Пусто')}" aria-pressed="${selected===id}"><span class="${weapon?'gear-weapon-art '+slot:'gear-symbol'}" aria-hidden="true">${weapon?'':icons[slot]||'+'}</span><small>${esc(label||SLOTS[slot]||'')}</small>${item?.trait?'<i class="trait-dot" aria-label="Особое свойство"></i>':''}</button>`;
 const quick=source==='stock'?`<button class="quick-buy" data-action="buy:${key}" aria-label="Купить ${esc(item.name)} за ${buyPrice(item)} эдди" ${canBuy?'':'disabled'}>Купить · ${buyPrice(item)}</button>`:source==='bag'&&mode==='hub'?`<button class="quick-buy quick-sell" data-action="sell:${key}" aria-label="Продать ${esc(item.name)}">Продать · ${itemValue(item)}</button>`:'';
 return `<div class="gear-sale ${quick?'has-quick':''} ${selected===id?'chosen':''}" data-inspect="${id}" data-item-slot="${slot}">${cell}${quick}</div>`;

}
export function gearInspector(profile,stock,selection,mode){
 if(selection==='potion-0')return `<div class="inspector-kind">Расходник</div><h3>Медгель</h3><div class="inspector-stat">+${stats(profile).healing} HP</div><p>Применение: Q. В запасе: ${profile.potions}.</p>${btn('Купить · '+BALANCE.potionCost+' эдди','potion',profile.gold<BALANCE.potionCost)}`;
 const {source,key,item}=resolveGear(profile,stock,selection);
 if(!item)return `<div class="inspector-kind">${SLOTS[key]||'Предмет'}</div><h3>Пустой слот</h3><p>Выбери вещь в рюкзаке, чтобы надеть её.</p>`;
 const weapon=weaponSlots.includes(item.type),value=power(profile,item),worn=profile.equipment[item.type],delta=value-(worn?power(profile,worn):0),trait=gearTrait(item),full=profile.bag.length>=BAG_LIMIT;
 const compare=source==='equipment'?'':`<span class="item-delta ${delta>0?'positive':delta<0?'negative':'unchanged'}" data-compare-slot="${item.type}" data-delta="${delta}">${delta>0?'+':''}${delta} к надетому</span>`;
 const actions=source==='equipment'?btn('Снять','unequip:'+key,full,true):source==='stock'?btn('Купить · '+buyPrice(item)+' эдди','buy:'+key,profile.gold<buyPrice(item)||full):btn('Надеть','equip:'+key)+(mode==='hub'?btn('Продать · '+itemValue(item)+' эдди','sell:'+key,false,true):'');
 return `<div class="inspector-kind">${SLOTS[item.type]} · ${['Стандарт','Редкий','Легендарный'][item.rarity]}</div><h3>${esc(item.name)}</h3><div class="inspector-stat">${value}${item.type==='shotgun'?' × 5':''}<small>${weapon?'урона':'брони'}</small></div>${compare}<div class="inspector-effect"><h4>${esc(trait?.name||'Без особого свойства')}</h4><p>${esc(trait?.description||'Стандартные характеристики.')}</p></div><div class="inspector-actions">${actions}</div>${full?'<p class="negative">Рюкзак заполнен. Продай вещь, чтобы освободить место.</p>':''}`;
}
export function gearScreen(profile,{hp,stock=null,filter='all',selected='equipment-weapon',mode='hub',pinned=false}){
 const s=stats(profile),trade=stock!==null;
 if(/^(bag|stock)-/.test(selected)&&!resolveGear(profile,stock,selected).item)selected='equipment-weapon';
 const equipped=Object.entries(SLOTS).map(([slot,label])=>tile(profile.equipment[slot],'equipment',slot,label,selected,true,mode,profile.bag.length>=BAG_LIMIT)).join('');
 const bag=profile.bag.map((item,i)=>filter==='weapons'&&!weaponSlots.includes(item.type)||filter==='clothes'&&weaponSlots.includes(item.type)?'':tile(item,'bag',i,'',selected,true,mode)).join('');
 const visible=profile.bag.filter(item=>filter==='all'||(filter==='weapons'?weaponSlots.includes(item.type):!weaponSlots.includes(item.type))).length;
 const empty=Math.max(0,BAG_LIMIT-visible);
 const bagPanel=`<section class="gear-panel bag-panel"><h3>Рюкзак <small>${profile.bag.length} / ${BAG_LIMIT}</small></h3><div class="bag-filters">${['all','weapons','clothes'].map((f,i)=>btn(['Всё','Оружие','Одежда'][i],'filter:'+f,false,filter!==f)).join('')}</div><div class="gear-grid bag-grid">${bag}${'<span class="gear-tile empty" aria-hidden="true"></span>'.repeat(empty)}</div></section>`;
 const loadout=`<section class="gear-panel loadout"><h3>Экипировка</h3><div class="gear-avatar">${previewMarkup(profile.equipment)}</div><div class="gear-grid equipped-grid">${equipped}</div></section>`;
 const catalog=trade?`<section class="gear-panel merchant-stock"><h3>Товары</h3><div class="gear-grid stock-grid"><div class="gear-sale has-quick" data-inspect="potion-0"><button class="gear-tile ${selected==='potion-0'?'chosen':''}" data-action="potion" aria-label="Медгель"><span class="gear-symbol">✚</span><small>${BALANCE.potionCost} эдди</small></button><button class="quick-buy" data-action="potion" ${profile.gold<BALANCE.potionCost?'disabled':''}>Купить · ${BALANCE.potionCost}</button></div>${stock.map((item,i)=>tile(item,'stock',i,buyPrice(item)+' эдди',selected,profile.gold>=buyPrice(item)&&profile.bag.length<BAG_LIMIT)).join('')}</div></section>`:'';
 return `<div class="character-stats compact-stats"><span>HP<b>${Math.ceil(hp)}/${s.maxHp}</b></span><span>Броня<b>${s.armor}</b></span><span>Выносливость<b>${s.maxStamina}</b></span><span>Эдди<b>${profile.gold}</b></span></div><div class="equipment-screen ${trade?'trade-screen':''}">${trade?'<div class="trade-goods">'+catalog+bagPanel+'</div>'+loadout:loadout+bagPanel}<aside class="gear-panel gear-inspector" data-pinned="${pinned}" aria-label="Характеристики предмета">${gearInspector(profile,stock,selected,mode)}</aside></div><small class="gear-hint">Наведение — характеристики. Клик: надетое — снять, товар — купить, рюкзак — надеть. Продажа — кнопкой в ячейке.</small>`;
}
