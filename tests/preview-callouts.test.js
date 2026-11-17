import test from 'node:test';
import assert from 'node:assert/strict';
import {previewCalloutAnchors,previewMarkup} from '../src/raster.js';
import {DEFAULT_PROFILE} from '../src/world.js';
test('preview callouts share canvas coordinates and follow anatomical pose landmarks',()=>{
 const p=previewCalloutAnchors();
 for(const [x,y]of Object.values(p)){assert.ok(x>=0&&x<=600);assert.ok(y>=0&&y<=900);}
 assert.ok(p.head[1]<p.torso[1]&&p.torso[1]<p.legs[1]&&p.legs[1]<p.feet[1]);
 assert.ok(p.weapon[0]>p.torso[0]);
 const html=previewMarkup(DEFAULT_PROFILE.equipment);assert.ok(html.includes('viewBox="0 0 600 900"'));assert.ok(html.includes('callout-shadow'));
});
