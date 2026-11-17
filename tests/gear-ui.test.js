import test from 'node:test';
import assert from 'node:assert/strict';
import {loadProfile,makeItem} from '../src/world.js';
import {assignTrait} from '../src/gear.js';
import {gearScreen,gearInspector,resolveGear} from '../src/gear-ui.js';
test('full bag and catalog render as slots while effects stay in the inspector',()=>{
 const p=loadProfile(null);p.bag=Array.from({length:24},()=>assignTrait(makeItem(1,Math.random,'gun'),Math.random,true));
 const stock=Array.from({length:8},()=>makeItem(1));
 const html=gearScreen(p,{hp:100,stock,selected:'bag-0'});
 assert.equal((html.match(/data-inspect="bag-/g)||[]).length,24);assert.equal((html.match(/data-inspect="stock-/g)||[]).length,8);
 assert.equal((html.match(/data-equipment-slot=/g)||[]).length,8);assert.ok(!html.includes('<details'));
 assert.ok(html.includes('Конденсатор'));assert.ok(html.includes('Последний патрон'));
 assert.equal(resolveGear(p,stock,'bag-0').item,p.bag[0]);
 const detail=gearInspector(p,stock,'stock-0','hub');assert.ok(detail.includes('disabled'));assert.ok(detail.includes('Рюкзак заполнен'));
 p.equipment.gun=null;assert.ok(gearInspector(p,stock,'equipment-gun','hub').includes('Пустой слот'));
});
test('direct actions remain adjacent and filtered bags retain all 24 cells',()=>{
 const p=loadProfile(null);p.bag=[makeItem(1,Math.random,'gun'),makeItem(1,Math.random,'torso')];
 for(const filter of ['all','weapons','clothes']){
  const html=gearScreen(p,{hp:100,stock:[makeItem(1)],filter});
  const bag=html.split('<div class="gear-grid bag-grid">')[1].split('</section>')[0];
  const occupied=(bag.match(/data-inspect="bag-/g)||[]).length,empty=(bag.match(/class="gear-tile empty" aria-hidden="true"><\/span>/g)||[]).length;
  assert.equal(occupied+empty,24);
  assert.ok(html.includes('data-action="unequip:weapon"'));assert.ok(html.includes('data-action="buy:0"'));assert.ok(html.includes('data-action="sell:'+(filter==='clothes'?1:0)+'"'));
 }
});
