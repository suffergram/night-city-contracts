import test from 'node:test';
import assert from 'node:assert/strict';
import {loadProfile} from '../src/world.js';
import {skillScreen} from '../src/skill-ui.js';
test('skills start at direction overview then render actual prerequisites and selected effect',()=>{
 const p=loadProfile(null),overview=skillScreen(p);
 assert.equal((overview.match(/class="attribute-card"/g)||[]).length,5);assert.ok(!overview.includes('perk-graph'));
 const tree=skillScreen(p,'body','endurance');assert.equal((tree.match(/class="perk-node /g)||[]).length,4);
 assert.equal((tree.match(/<path /g)||[]).length,3);assert.ok(tree.includes('Второе дыхание'));assert.ok(tree.includes('data-action="skill-overview"'));
 assert.ok(tree.includes('data-action="learn:endurance" disabled'));assert.ok(tree.includes('Железное тело 2'));
});
