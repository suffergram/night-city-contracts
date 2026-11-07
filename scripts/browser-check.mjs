import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import net from 'node:net';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const browserPath = process.env.EDGE_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(fn, timeout = 15000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { const value = await fn(); if (value) return value; await delay(100); }
  throw new Error('Timed out waiting for browser state');
}
const port = await new Promise(resolve => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const port = s.address().port; s.close(() => resolve(port)); }); });
const server = spawn(process.execPath, ['server.mjs'], { cwd: root, env: { ...process.env, PORT: String(port) }, windowsHide: true, stdio: 'ignore' });
let browser, socket;
try {
  await until(async () => { try { return (await fetch(`http://127.0.0.1:${port}`)).ok; } catch { return false; } });
  const userData = await mkdtemp(path.join(tmpdir(), 'neon-browser-'));
  browser = spawn(browserPath, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1', `--user-data-dir=${userData}`, '--window-size=1440,1100', 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = '', launchError;
  browser.on('error', error => { launchError = error; });
  browser.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-16000); });
  const endpoint = await until(() => { if (launchError) throw launchError; return stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/)?.[1]; });
  const devtools = new URL(endpoint);
  const pages = await (await fetch(`http://${devtools.host}/json/list`)).json();
  socket = new WebSocket(pages.find(p => p.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let nextId = 1; const pending = new Map(), errors = [];
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id) { const p = pending.get(message.id); if (p) { clearTimeout(p.timer); pending.delete(message.id); message.error ? p.reject(new Error(JSON.stringify(message.error))) : p.resolve(message.result); } }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++; const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 15000);
    pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    if(errors.length) throw new Error('Browser runtime exception: '+errors.join('\n'));
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result?.value;
  };
  const key = (code, type) => evaluate(`window.dispatchEvent(new KeyboardEvent('${type}',{code:'${code}',bubbles:true}))`);
  const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  const screenshot = async name => {
    const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(path.join(root, 'artifacts', name), Buffer.from(result.data, 'base64'));
  };
  await mkdir(path.join(root, 'artifacts'), { recursive: true });
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `http://127.0.0.1:${port}` });
  await until(() => evaluate("document.getElementById('scene-title')?.textContent.includes('Убежище') && document.getElementById('equipment')?.children.length===3"));
  await evaluate("import('/src/raster.js').then(m=>m.preloadSprites())");
  if(process.argv.includes('--environment-review')){
    await send('Page.navigate',{url:`http://127.0.0.1:${port}/scripts/environment-preview.html`});
    await until(()=>evaluate('window.environmentPreviewReady===true'));
    await evaluate('environmentPreview.setTime(0)');
    const still=await evaluate('document.querySelector("canvas").toDataURL()');
    await evaluate('environmentPreview.setTime(0)');assert.equal(await evaluate('document.querySelector("canvas").toDataURL()'),still);
    await screenshot('night-city-environment-hub.png');
    const road=await evaluate('Array.from(document.querySelector("canvas").getContext("2d").getImageData(0,610,1200,1).data)');
    await evaluate('environmentPreview.setTime(1.7)');
    assert.notEqual(await evaluate('document.querySelector("canvas").toDataURL()'),still,'lighting and motes animate');
    assert.deepEqual(await evaluate('Array.from(document.querySelector("canvas").getContext("2d").getImageData(0,610,1200,1).data)'),road,'asphalt stays still while lights animate');
    await evaluate('environmentPreview.setScene("sector");environmentPreview.setCamera(1024);environmentPreview.setTime(4)');
    await screenshot('night-city-environment-sector.png');
    assert.ok(await evaluate(`(async()=>{const {drawRasterEnvironment}=await import('/src/environment.js');const c=document.createElement('canvas');c.width=1500;c.height=660;const x=c.getContext('2d');for(const camera of [-30,0,1019,1024,1487,1493,3000]){x.clearRect(0,0,1500,660);x.save();x.translate(-camera,0);drawRasterEnvironment(x,c,{width:5000,platforms:[],chests:[],portal:{x:4800}},'hub',camera,0);x.restore();const d=x.getImageData(0,545,1500,115).data;for(let i=3;i<d.length;i+=4)if(d[i]!==255)return false;}return true;})()`),'road remains opaque across tile edges and camera positions');
    assert.deepEqual(errors,[]);console.log('Environment checks passed: animated lights, paused particles, stationary asphalt and gap-free road coverage.');
  }else{
  if(!process.argv.includes('--run-review')){
  assert.ok(await evaluate("(async()=>{const {drawRasterActor}=await import('/src/raster.js');const {DEFAULT_PROFILE}=await import('/src/world.js');const paint=gear=>{const c=document.createElement('canvas');c.width=240;c.height=240;const x=c.getContext('2d');x.translate(120,235);drawRasterActor(x,{},'hero',gear,{sheet:'hero',frame:0,height:220});return x.getImageData(0,0,240,240).data;};const base=structuredClone(DEFAULT_PROFILE.equipment),a=paint(base);const same=(b,rect)=>{const [left,top,w,h]=rect;for(let y=top;y<top+h;y++)for(let x=left;x<left+w;x++)for(let k=0;k<4;k++){const i=(y*240+x)*4+k;if(a[i]!==b[i])return false;}return true;};for(const slot of ['torso','legs','feet','head']){const gear=structuredClone(base);gear[slot]={id:'material-regression-'+slot,name:'test',rarity:2};const b=paint(gear);if(!same(b,[168,140,70,55]))throw Error(slot+' blade');if(slot!=='head'&&!same(b,[113,8,38,35]))throw Error(slot+' face');if(!same(b,[65,104,17,22]))throw Error(slot+' arm');if(slot==='head'&&!same(b,[114,54,37,26]))throw Error(slot+' collar');if(!a.some((v,i)=>v!==b[i]))throw Error(slot+' unchanged');}return true;})()"), 'equipment changes preserve katana, face, cyberarm and collar pixels in the inventory preview');
  assert.ok(await evaluate("(async()=>{const {drawRasterActor}=await import('/src/raster.js');const {DEFAULT_PROFILE}=await import('/src/world.js');const base=structuredClone(DEFAULT_PROFILE.equipment),changed=structuredClone(base);for(const slot of ['head','legs','feet'])changed[slot]={id:'different-'+slot,name:'test',rarity:2};const paint=(sheet,frame,gear)=>{const c=document.createElement('canvas');c.width=240;c.height=240;const x=c.getContext('2d');x.translate(120,235);drawRasterActor(x,{},'hero',gear,{sheet,frame,height:220});return x.getImageData(0,0,240,240).data;};for(const [sheet,frames]of [['aimExtremes',[0,12,24]],['aimRig',[24,26,28]]])for(const frame of frames){const a=paint(sheet,frame,base),b=paint(sheet,frame,changed);if(a.some((v,i)=>v!==b[i]))return false;const jacket=structuredClone(base);jacket.torso=null;const d=paint(sheet,frame,jacket);if(!a.some((v,i)=>v!==d[i]))return false;}return true;})()"), 'arm materials follow the jacket and are unaffected by helmet, trousers or boots');
  assert.ok(await evaluate("import('/src/raster.js').then(m=>Object.values(m.spriteDiagnostics()).every(s=>s.loaded&&s.width>=1000))"));
  await evaluate("import('/src/environment.js').then(m=>m.preloadEnvironment())");
  assert.ok(await evaluate("(async()=>{const {SPRITES}=await import('/src/raster.js'); for(const url of Object.values(SPRITES)){const i=new Image();i.src=url;await i.decode();const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const x=c.getContext('2d');x.drawImage(i,0,0);if(x.getImageData(0,0,1,1).data[3]>10)return false;}return true;})()"), 'atlases have transparent backgrounds');
  await delay(300); await screenshot('neon-hub.png');
  assert.ok(await evaluate("(async()=>{const {drawRasterActor}=await import('/src/raster.js');const {DEFAULT_PROFILE}=await import('/src/world.js');const samples=[];for(const [sheet,frame] of [['aimRig',0],['aimRig',24],['aimRig',26],['aimExtremes',0],['aimExtremes',12],['aimExtremes',24]]){const c=document.createElement('canvas');c.width=240;c.height=240;const x=c.getContext('2d');x.translate(120,235);drawRasterActor(x,{},'hero',DEFAULT_PROFILE.equipment,{sheet,frame,height:220});const p=x.getImageData(0,0,240,240).data,red=[];for(let i=0;i<p.length;i+=4)if(p[i+3]>240&&p[i]>30&&p[i]>p[i+1]*1.6&&p[i]>p[i+2]*1.6&&Math.abs(p[i+1]-p[i+2])<5)red.push(p[i]);red.sort((a,b)=>a-b);if(!red.length)return false;samples.push(red[Math.floor(red.length/2)]);}return Math.max(...samples)-Math.min(...samples)<=12;})()"), 'body and sleeve cloth midtones match across aim atlases');
  await evaluate("import('/src/environment.js').then(m=>m.preloadEnvironment())");
  assert.ok(await evaluate("import('/src/environment.js').then(m=>Object.values(m.environmentDiagnostics()).every(Boolean))"));
  assert.ok(await evaluate("(async()=>{const {ENVIRONMENT_ASSETS}=await import('/src/environment.js');for(const key of ['midCity','nearCity']){const i=new Image();i.src=ENVIRONMENT_ASSETS[key];await i.decode();const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const x=c.getContext('2d');x.drawImage(i,0,0);if(x.getImageData(i.width/2,0,1,1).data[3]>10)return false;}return true;})()"),'middle and near layers have a transparent sky');
  assert.ok(await evaluate("document.getElementById('world-info').textContent.includes('Сухая ночь')"));
  const fitsViewport = async () => assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight && document.body.scrollHeight<=innerHeight && window.scrollY===0'), 'document has no horizontal or vertical scrolling');
  await fitsViewport();
  assert.ok(await evaluate('(()=>{const r=document.getElementById("game").getBoundingClientRect();return r.width===innerWidth&&r.height===innerHeight;})()'), 'game fills the viewport');
  await click('#inventory-button'); assert.equal(await evaluate("document.querySelectorAll('.slot-row').length"), 8);
  assert.equal(await evaluate("document.getElementById('overlay').classList.contains('character-overlay')"), true);
  assert.equal(await evaluate("document.querySelectorAll('.body-schematic [data-slot]').length"), 6);
  assert.equal(await evaluate("document.querySelectorAll('.body-schematic canvas.raster-avatar').length"), 1);
  await delay(200);
  assert.ok(await evaluate("(()=>{const c=document.querySelector('.body-schematic canvas');const p=c.getContext('2d').getImageData(0,0,c.width,c.height).data;return p.some((v,i)=>i%4===3&&v>100)})()"), 'raster preview is painted, not a fallback');
  await screenshot('neon-character.png');
  await click('[data-action="unequip:head"]');
  assert.equal(await evaluate("document.querySelectorAll('.slot-row [data-action^=\"unequip:\"]').length"), 7);
  assert.equal(await evaluate("document.querySelectorAll('.body-schematic [data-slot=\"head\"]').length"), 0);
  await click('[data-action="equip:0"]');
  assert.equal(await evaluate("document.querySelectorAll('.slot-row [data-action^=\"unequip:\"]').length"), 8);
  assert.equal(await evaluate("document.querySelectorAll('.body-schematic [data-slot=\"head\"]').length"), 1);
  await click('[data-action="skills"]');
  assert.equal(await evaluate("document.querySelectorAll('.skill-branch').length"), 5);
  assert.equal(await evaluate("document.querySelectorAll('.skill-node').length"), 20);
  assert.equal(await evaluate("document.querySelector('[data-action=\"learn:airDash\"]').disabled"), true);
  await screenshot('neon-skills.png');
  await click('[data-action="learn:constitution"]');
  assert.equal(await evaluate("JSON.parse(localStorage.getItem('emberfall-save-v1')).skills.constitution"), 1);
  await click('[data-action="inventory"]');
  await click('[data-action="close"]');
  // Start a real reload, then keep it running through forward/back movement and a jump.
  await key('Digit2','keydown');await key('Digit2','keyup');
  await evaluate("(()=>{const c=document.getElementById('game'),r=c.getBoundingClientRect();c.dispatchEvent(new PointerEvent('pointerdown',{button:0,pointerType:'mouse',clientX:r.left+r.width*.95,clientY:r.top+r.height*.55,bubbles:true}));window.dispatchEvent(new PointerEvent('pointerup',{button:0}));})()");
  await key('KeyR','keydown');await key('KeyR','keyup');
  await until(()=>evaluate("document.getElementById('ammo-label').textContent.includes('ПЕРЕЗАРЯДКА')"));
  await key('KeyD','keydown');await delay(140);await key('KeyD','keyup');
  assert.ok(await evaluate("document.getElementById('ammo-label').textContent.includes('ПЕРЕЗАРЯДКА')"));
  await key('KeyA','keydown');await delay(140);await key('KeyW','keydown');await key('KeyW','keyup');
  await delay(100);await key('KeyA','keyup');
  assert.ok(await evaluate("document.getElementById('ammo-label').textContent.includes('ПЕРЕЗАРЯДКА')"));
  await until(()=>evaluate("document.getElementById('ammo-label').textContent.startsWith('10 / 10')"));
  // Exercise the actual cursor/shot path at opposing elevations, including flash rendering.
  for (const [name,px,py,ammo] of [['up',.95,.1,9],['down',.05,.9,8]]) {
    await evaluate(`(()=>{const c=document.getElementById('game'),r=c.getBoundingClientRect();c.dispatchEvent(new PointerEvent('pointerdown',{button:0,pointerType:'mouse',clientX:r.left+r.width*${px},clientY:r.top+r.height*${py},bubbles:true}));window.dispatchEvent(new PointerEvent('pointerup',{button:0}));})()`);
    await delay(40);await screenshot('night-city-aim-'+name+'.png');
    await until(()=>evaluate(`document.getElementById('ammo-label').textContent.startsWith('${ammo} / 10')`));
    await delay(300);
  }
  await key('Digit1','keydown');await key('Digit1','keyup');
  await key('KeyD', 'keydown');
  await until(() => evaluate("!document.getElementById('interaction').classList.contains('hidden') && document.getElementById('interaction').textContent.includes('Контракт')"), 10000);
  await key('KeyD', 'keyup'); await key('KeyE', 'keydown'); await key('KeyE', 'keyup');
  assert.ok(await evaluate("document.querySelector('.modal h2').textContent.includes('Угроза 1')"));
  await click('[data-action="start"]');
  await until(() => evaluate("document.getElementById('scene-title').textContent.includes('Промзона')"));
  // Exercise real pointer listeners and a firearm shot.
  await evaluate("const c=document.getElementById('game'), r=c.getBoundingClientRect(); c.dispatchEvent(new PointerEvent('pointermove',{clientX:r.left+r.width*.7,clientY:r.top+r.height*.7,pointerType:'mouse',bubbles:true})); c.dispatchEvent(new PointerEvent('pointerdown',{button:0,clientX:r.left+r.width*.7,clientY:r.top+r.height*.7,pointerType:'mouse',bubbles:true}));");
  await delay(200); await evaluate("window.dispatchEvent(new PointerEvent('pointerup',{button:0}))");
  await key('Digit2', 'keydown'); await key('Digit2', 'keyup');
  assert.equal(await evaluate("document.querySelector('.weapon-slot.selected').dataset.weapon"), 'gun');
  await evaluate("c.dispatchEvent(new PointerEvent('pointerdown',{button:0,clientX:r.left+r.width*.7,clientY:r.top+r.height*.7,pointerType:'mouse',bubbles:true}))");
  await delay(300); await evaluate("window.dispatchEvent(new PointerEvent('pointerup',{button:0}))");
  assert.ok(!await evaluate("document.getElementById('ammo-label').textContent.startsWith('10 /')"));
  for (const [code,slot,capacity] of [['Digit3','rifle',24],['Digit4','shotgun',6]]) {
    await delay(300); await key(code,'keydown');await key(code,'keyup');
    assert.equal(await evaluate("document.querySelector('.weapon-slot.selected').dataset.weapon"),slot);
    await evaluate("c.dispatchEvent(new PointerEvent('pointerdown',{button:0,clientX:r.left+r.width*.7,clientY:r.top+r.height*.7,pointerType:'mouse',bubbles:true}))");
    await delay(170);await evaluate("window.dispatchEvent(new PointerEvent('pointerup',{button:0}))");
    assert.ok(await evaluate(`parseInt(document.getElementById('hot-ammo-${slot}').textContent)<${capacity}`),slot+' fires with left click');
  }
  await screenshot('neon-sector.png');
  for (const [width,height] of [[1920,1080],[1366,768],[844,390]]) {
    await send('Emulation.setDeviceMetricsOverride', { width,height,deviceScaleFactor:1,mobile:false });
    await delay(50); await fitsViewport();
  }
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await click('#inventory-button'); await delay(100); await screenshot('neon-mobile-character.png');
  await fitsViewport();
  assert.ok(await evaluate('Array.from(document.querySelectorAll(".top-actions button")).every(b=>{const r=b.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;})'), 'mobile menu buttons remain visible');
  await click('[data-action="close"]'); await screenshot('neon-mobile.png');
  await click('#skills-button'); await screenshot('neon-mobile-skills.png');
  await fitsViewport();
  assert.ok(await evaluate('(()=>{const m=document.querySelector(".modal");m.scrollTop=120;return m.scrollTop>0;})()'), 'long skill menus can scroll internally');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
  // Render a reviewable contact sheet with the exact same renderer used in the game.
  const gallery = await evaluate("(async()=>{const {drawRasterActor}=await import('/src/raster.js');const {HERO_CLIPS}=await import('/src/animation.js');const {DEFAULT_PROFILE}=await import('/src/world.js');const c=document.createElement('canvas');c.width=1200;c.height=1050;const x=c.getContext('2d');x.fillStyle='#10121e';x.fillRect(0,0,c.width,c.height);const names=['idle','run','jump','roll','attack','shoot'];for(let row=0;row<6;row++){x.fillStyle='#e997aa';x.font='15px monospace';x.fillText(names[row].toUpperCase(),16,row*175+20);for(let col=0;col<6;col++){x.save();x.translate(110+col*195,row*175+166);drawRasterActor(x,{grounded:true},'hero',DEFAULT_PROFILE.equipment,{frame:row*6+col,height:140});x.restore();}}return c.toDataURL('image/png').split(',')[1];})()");
  await writeFile(path.join(root, 'artifacts', 'neon-animation-gallery.png'), Buffer.from(gallery, 'base64'));
  const combatGallery = await evaluate("(async()=>{const {drawRasterActor}=await import('/src/raster.js');const {DEFAULT_PROFILE}=await import('/src/world.js');const c=document.createElement('canvas');c.width=1500;c.height=1500;const x=c.getContext('2d');x.fillStyle='#10121e';x.fillRect(0,0,c.width,c.height);const names=['BACKPEDAL','RUN + KATANA','RUN + FIRE','BACKPEDAL + FIRE','JUMP + KATANA','JUMP + FIRE'];for(let row=0;row<6;row++){x.fillStyle='#e997aa';x.font='15px monospace';x.fillText(names[row],16,row*250+20);for(let col=0;col<6;col++){x.save();x.translate(120+col*245,row*250+240);drawRasterActor(x,{grounded:true},'hero',DEFAULT_PROFILE.equipment,{frame:row*6+col,sheet:'actions',height:210});x.restore();}}return c.toDataURL('image/png').split(',')[1];})()");
  await writeFile(path.join(root, 'artifacts', 'neon-combat-animation-gallery.png'), Buffer.from(combatGallery, 'base64'));
  const muzzleGallery = await evaluate("(async()=>{const {drawRasterActor,muzzleAnchor}=await import('/src/raster.js');const {DEFAULT_PROFILE}=await import('/src/world.js');const {spriteGeometry}=await import('/src/weapons.js');const c=document.createElement('canvas');c.width=1500;c.height=1100;const x=c.getContext('2d');x.fillStyle='#10121e';x.fillRect(0,0,c.width,c.height);const rows=[{name:'STAND',sheet:'hero',start:30},{name:'RUN',sheet:'actions',start:12},{name:'BACK',sheet:'actions',start:18},{name:'AIR',sheet:'actions',start:30}];rows.forEach((row,r)=>{for(let i=0;i<6;i++){x.save();x.translate(120+i*245,r*275+265);const actor={grounded:true};drawRasterActor(x,actor,'hero',DEFAULT_PROFILE.equipment,{frame:row.start+i,sheet:row.sheet,height:220});const b=spriteGeometry(220),a=muzzleAnchor(actor,row.sheet,row.start+i);x.strokeStyle='#50ff69';x.lineWidth=2;x.beginPath();x.arc(b.x+b.w*a[0],b.y+b.h*a[1],4,0,Math.PI*2);x.stroke();x.fillStyle='#fff';x.font='12px monospace';x.fillText(row.name+' '+i,-100,-235);x.restore();}});return c.toDataURL('image/png').split(',')[1];})()");
  await writeFile(path.join(root, 'artifacts', 'neon-muzzle-alignment.png'), Buffer.from(muzzleGallery, 'base64'));
  const loadout = await evaluate("(async()=>{const {drawRasterActor}=await import('/src/raster.js');const {DEFAULT_PROFILE}=await import('/src/world.js');const c=document.createElement('canvas');c.width=1000;c.height=330;const x=c.getContext('2d');x.fillStyle='#10121e';x.fillRect(0,0,c.width,c.height);['weapon','gun','rifle','shotgun'].forEach((slot,i)=>{x.save();x.translate(120+i*250,320);x.fillStyle='#e997aa';x.font='14px monospace';x.fillText((i+1)+' / '+slot.toUpperCase(),-100,-285);const actor={activeWeapon:slot,grounded:true,shotCooldown:slot==='weapon'?0:.2,animation:{name:slot==='weapon'?'idle':'shoot',time:0}};drawRasterActor(x,actor,'hero',DEFAULT_PROFILE.equipment,{height:260});x.restore();});return c.toDataURL('image/png').split(',')[1];})()");
  await writeFile(path.join(root,'artifacts','neon-weapons.png'),Buffer.from(loadout,'base64'));
  const parallax = await evaluate("(async()=>{const {drawRasterBackdrop,drawRasterEnvironment}=await import('/src/environment.js');const {GROUND}=await import('/src/world.js');const c=document.createElement('canvas');c.width=1200;c.height=1320;const x=c.getContext('2d');for(let row=0;row<2;row++){const camera=row*300;x.save();x.beginPath();x.rect(0,row*660,1200,660);x.clip();x.translate(0,row*660);drawRasterBackdrop(x,{width:1200,height:660},camera);x.save();x.translate(-camera,0);drawRasterEnvironment(x,{width:1200,height:660},{width:2400,platforms:[],chests:[],portal:{x:1150}},'hub',camera);x.restore();x.fillStyle='#ffb4c2';x.font='16px monospace';x.fillText('CAMERA '+camera+' / SKY 0.06 / DISTRICT 0.24 / WALLS 0.52 / STREET 1.0',20,28);x.restore();}return c.toDataURL('image/png').split(',')[1];})()");
  await writeFile(path.join(root,'artifacts','neon-parallax-comparison.png'),Buffer.from(parallax,'base64'));
  const fixes = await evaluate("(async()=>{const {drawRasterActor}=await import('/src/raster.js');const {DEFAULT_PROFILE}=await import('/src/world.js');const c=document.createElement('canvas');c.width=1500;c.height=1500;const x=c.getContext('2d');x.fillStyle='#10121e';x.fillRect(0,0,c.width,c.height);const names=['BACKWARD KATANA','PISTOL / RELOAD','FORWARD / RELOAD','BACKWARD / RELOAD','AIR / RELOAD','AIR / NO SHOT'];for(let row=0;row<6;row++){x.fillStyle='#efacbc';x.font='15px monospace';x.fillText(names[row],16,row*250+20);for(let col=0;col<6;col++){x.save();x.translate(120+245*col,row*250+240);drawRasterActor(x,{grounded:true},'hero',DEFAULT_PROFILE.equipment,{sheet:'utility',frame:row*6+col,height:210});x.restore();}}return c.toDataURL('image/png').split(',')[1];})()");
  await writeFile(path.join(root,'artifacts','neon-animation-fixes.png'),Buffer.from(fixes,'base64'));
  const reloads = await evaluate("(async()=>{const {drawRasterActor}=await import('/src/raster.js');const {DEFAULT_PROFILE}=await import('/src/world.js');const c=document.createElement('canvas');c.width=1500;c.height=1000;const x=c.getContext('2d');x.fillStyle='#10121e';x.fillRect(0,0,c.width,c.height);const states=['STANDING','FORWARD RUN','BACKPEDAL','AIR'];const ranges=[[0,1,2,12,13,14],[3,4,5,15,16,17],[6,7,8,18,19,20],[9,10,11,21,22,23]];for(let row=0;row<4;row++){x.fillStyle='#efacbc';x.font='15px monospace';x.fillText(states[row]+' / RIFLE - SHOTGUN',16,row*250+20);for(let col=0;col<6;col++){x.save();x.translate(120+245*col,row*250+240);const actor={activeWeapon:col<3?'rifle':'shotgun',reload:1,reloadDuration:2,grounded:row!==3,vx:row===1?200:row===2?-200:0,facing:1,vy:0};drawRasterActor(x,actor,'hero',DEFAULT_PROFILE.equipment,{sheet:'longgunUtility',frame:ranges[row][col],height:210});x.restore();}}return c.toDataURL('image/png').split(',')[1];})()");
  await writeFile(path.join(root,'artifacts','neon-longgun-reloads.png'),Buffer.from(reloads,'base64'));
  const aimGallery = await evaluate("(async()=>{const {drawRasterActor}=await import('/src/raster.js');const {aimGeometry}=await import('/src/aim.js');const {DEFAULT_PROFILE}=await import('/src/world.js');const c=document.createElement('canvas');c.width=2600;c.height=1200;const x=c.getContext('2d');x.fillStyle='#10121e';x.fillRect(0,0,c.width,c.height);const rows=[['STAND / PISTOL','gun',0,true,1],['RUN / RIFLE','rifle',200,true,1],['BACK / SHOTGUN','shotgun',-200,true,1],['AIR / PISTOL','gun',100,false,1],['LEFT / RIFLE','rifle',0,true,-1]];rows.forEach(([label,slot,vx,grounded,facing],row)=>{x.fillStyle='#f3b0c0';x.font='14px monospace';x.fillText(label,12,row*240+18);for(let col=0;col<13;col++){const a={activeWeapon:slot,aimAngle:(col-6)*Math.PI/12,vx,vy:0,grounded,facing,strideTime:col*.035,fireVisual:0,animation:{name:'idle',time:0}};x.save();x.translate(100+col*200,row*240+225);x.scale(facing,1);drawRasterActor(x,a,'hero',DEFAULT_PROFILE.equipment,{height:180});const r=aimGeometry(a,180);x.strokeStyle='#65f995';x.lineWidth=1;x.beginPath();x.arc(r.muzzle.x,r.muzzle.y,3,0,Math.PI*2);x.stroke();x.restore();x.fillStyle='#a4aabc';x.font='12px monospace';x.fillText(((col-6)*15)+' deg',75+col*200,row*240+36);}});return c.toDataURL('image/png').split(',')[1];})()");
  await writeFile(path.join(root,'artifacts','night-city-aim-gallery.png'),Buffer.from(aimGallery,'base64'));
  const outfitGallery = await evaluate("(async()=>{const {drawRasterActor}=await import('/src/raster.js');const {DEFAULT_PROFILE}=await import('/src/world.js');const {appearance}=await import('/src/character.js');const c=document.createElement('canvas');c.width=1400;c.height=720;const x=c.getContext('2d');x.fillStyle='#10121e';x.fillRect(0,0,c.width,c.height);const angles=[-90,-60,-45,0,15,45,90];for(let row=0;row<3;row++){const gear=structuredClone(DEFAULT_PROFILE.equipment);if(row){for(let n=0;n<100;n++){const t={id:'palette-'+n,name:'jacket',rarity:1};if(appearance(t,'torso').color===(row===1?'#456575':'#5c5277')){gear.torso=t;break;}}}x.fillStyle='#e8b4c4';x.font='14px monospace';x.fillText(['ORIGINAL JACKET','BLUE JACKET','VIOLET JACKET'][row],12,row*240+18);angles.forEach((deg,col)=>{x.save();x.translate(100+col*200,row*240+225);drawRasterActor(x,{activeWeapon:'rifle',aimAngle:deg*Math.PI/180,grounded:true,vx:0,facing:1,animation:{name:'idle',time:0}},'hero',gear,{height:180});x.restore();});}return c.toDataURL('image/png').split(',')[1];})()");
  await writeFile(path.join(root,'artifacts','night-city-equipment-aim.png'),Buffer.from(outfitGallery,'base64'));
  const clothingGallery = await evaluate("(async()=>{const {drawRasterActor}=await import('/src/raster.js');const {DEFAULT_PROFILE}=await import('/src/world.js');const c=document.createElement('canvas');c.width=1440;c.height=1440;const x=c.getContext('2d');x.fillStyle='#10121e';x.fillRect(0,0,c.width,c.height);const cols=['DEFAULT','JACKET','TROUSERS','BOOTS','HEAD','ALL'];const states=[['IDLE','hero',0],['RUN','hero',8],['AIR','hero',14],['ROLL','hero',20],['KATANA','hero',27],['RELOAD','utility',6]];states.forEach(([label,sheet,frame],row)=>{x.fillStyle='#f4aabc';x.font='14px monospace';x.fillText(label,10,row*240+20);cols.forEach((name,col)=>{const gear=structuredClone(DEFAULT_PROFILE.equipment);for(const [i,slot]of ['torso','legs','feet','head'].entries())if(col===i+1||col===5)gear[slot]={id:'material-regression-'+slot,name:'test',rarity:2};x.save();x.translate(120+col*240,row*240+230);drawRasterActor(x,{},'hero',gear,{sheet,frame,height:180});x.restore();x.fillStyle='#a6adbc';x.font='12px monospace';x.fillText(name,col*240+70,row*240+38);});});return c.toDataURL('image/png').split(',')[1];})()");
  await writeFile(path.join(root,'artifacts','night-city-clothing-masks.png'),Buffer.from(clothingGallery,'base64'));
  }
  const runReview=await evaluate(`(async()=>{
    const {drawRasterActor,SPRITES}=await import('/src/raster.js');
    const {DEFAULT_PROFILE}=await import('/src/world.js');
    const {spriteGeometry}=await import('/src/weapons.js');
    const {aimBodyFrame,aimBodySheet}=await import('/src/aim.js');
    const image=new Image();image.src=SPRITES.actions;await image.decode();
    const bodies={};for(const key of ['aimRun','aimRunFix','aimRunContact','aimRig']){bodies[key]=new Image();bodies[key].src=SPRITES[key];await bodies[key].decode();}
    const cell=image.width/6,canvas=document.createElement('canvas');canvas.width=1440;canvas.height=1440;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#10121e';ctx.fillRect(0,0,1440,1440);
    let compared=0;const mismatches=[];
    for(let row=0;row<6;row++)for(let phase=0;phase<6;phase++){
      const back=row>=3,kind=row%3,slot=kind===2?'weapon':'gun',sourceFrame=(back?18:12)+phase;
      const a={grounded:true,vx:back?-196:245,facing:1,activeWeapon:slot,aimAngle:0,fireVisual:0,strideTime:(phase+.01)/(back?12:13)};
      ctx.fillStyle='#f5afc1';ctx.font='12px monospace';ctx.fillText((back?'BACK':'RUN')+' / '+['SOURCE','AIMED','KATANA'][kind]+' / '+phase,phase*240+10,row*240+18);
      ctx.save();ctx.translate(phase*240+120,row*240+230);
      const box=spriteGeometry(185);
      if(kind===0)ctx.drawImage(image,phase*cell,(back?3:2)*cell,cell,cell,box.x,box.y,box.w,box.h);
      else drawRasterActor(ctx,a,'hero',DEFAULT_PROFILE.equipment,{height:185});
      ctx.restore();
      if(kind===1){
        // The rendered torso/pelvis/legs must come from one whole body frame, without a waist splice.
        const actual=document.createElement('canvas'),expected=document.createElement('canvas');
        actual.width=expected.width=cell;actual.height=expected.height=cell;
        const x=actual.getContext('2d'),e=expected.getContext('2d'),b=spriteGeometry(cell*.94);
        x.translate(-b.x,-b.y);drawRasterActor(x,a,'hero',undefined,{height:cell*.94,bodyOnly:true});
        const body=bodies[aimBodySheet(a)],single=aimBodySheet(a)==='aimRunContact';
        const frame=single?0:aimBodyFrame(a),cw=body.width/(single?1:6),ch=body.height/(single?1:6);
        const width=['aimRun','aimRunFix'].includes(aimBodySheet(a))?.90:1;
        if(single){e.translate(cell*.44*.07,cell*.98*.07);e.scale(.93,.93);}
        e.imageSmoothingQuality='high';e.drawImage(body,frame%6*cw,Math.floor(frame/6)*ch,cw*width,ch,0,0,cell*width,cell);
        const p=x.getImageData(0,0,cell,cell).data,q=e.getImageData(0,0,cell,cell).data;
        for(let y=0;y<cell;y++)for(let xx=0;xx<cell;xx++){
          const i=(y*cell+xx)*4;
          // Canvas rounds premultiplied edge colours on each intermediate draw.
          if((Math.abs(p[i+3]-q[i+3])>1||[0,1,2].some(k=>Math.abs(p[i+k]*p[i+3]-q[i+k]*q[i+3])/255>3))&&mismatches.length<10)mismatches.push({sourceFrame,xx,y});
          compared++;
        }
      }
    }
    return {png:canvas.toDataURL('image/png').split(',')[1],compared,mismatches};
  })()`);
  assert.ok(runReview.compared>100000);
  await writeFile(path.join(root,'artifacts','night-city-source-run-comparison.png'),Buffer.from(runReview.png,'base64'));
  assert.deepEqual(runReview.mismatches,[]);
  const pistolReview=await evaluate(`(async()=>{
    const {drawRasterActor}=await import('/src/raster.js');const {DEFAULT_PROFILE}=await import('/src/world.js');
    const c=document.createElement('canvas');c.width=2200;c.height=600;const x=c.getContext('2d');
    x.fillStyle='#10121e';x.fillRect(0,0,c.width,c.height);
    const angles=[-90,-60,-45,-30,-15,0,15,30,45,60,90];
    for(let row=0;row<2;row++)angles.forEach((deg,col)=>{
      x.fillStyle='#efb0c2';x.font='13px monospace';x.fillText((row?'RUN':'STAND')+' PISTOL '+deg+' deg',col*200+12,row*300+20);
      x.save();x.translate(col*200+100,row*300+285);
      drawRasterActor(x,{grounded:true,vx:row?245:0,facing:1,activeWeapon:'gun',aimAngle:deg*Math.PI/180,strideTime:.1,fireVisual:0},'hero',DEFAULT_PROFILE.equipment,{height:210});
      x.restore();
    });return c.toDataURL('image/png').split(',')[1];
  })()`);
  await writeFile(path.join(root,'artifacts','night-city-pistol-arm-scale.png'),Buffer.from(pistolReview,'base64'));
  assert.deepEqual(errors, []);
  console.log(process.argv.includes('--run-review')?'Run review passed: whole body frames rendered without a waist splice.':'Browser checks passed: raster atlases, equipment, skills, portal, combat, mobile layout and whole run frames; no runtime exceptions.');
  console.log('Screenshots: artifacts/neon-*.png');
  }
} finally {
  socket?.close(); browser?.kill(); server.kill();
}
