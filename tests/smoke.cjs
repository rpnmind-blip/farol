'use strict';
const {chromium,webkit,devices}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const base=process.env.BASE_URL||'http://127.0.0.1:8787/';
const shot=name=>path.join(root,'screenshots',name);
const assert=(value,message)=>{if(!value)throw Error(message)};
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const jump=async(page,id)=>{await page.locator(id).evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));await page.waitForTimeout(300)};
const stage=page=>page.locator('.desktop-scene .experience-stage');
async function browserCheck(engine,name,full){
 const browser=await engine.launch(full?{executablePath:process.env.CHROME_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{headless:true});
 const errors=[];
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,acceptDownloads:true,userAgent:devices[full?'Pixel 5':'iPhone 13'].userAgent});
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
 await page.goto(base,{waitUntil:'networkidle'});
 await stage(page).waitFor();
 assert(await page.locator('h1').count()===1,`${name}: heading missing`);
 assert(await page.locator('.experience-stage').count()===1,`${name}: repeated mobile maps`);
 assert(await page.locator('img').evaluateAll(list=>list.every(img=>img.complete&&img.naturalWidth)),`${name}: broken image`);
 assert((await page.locator('.hero-actions a[href="demo/"]').count())===1,`${name}: demo shortcut missing`);
 assert(await page.locator('a[href$=".apk"]').count()===0,`${name}: APK download still promoted`);
 assert(await page.locator('button[data-install-app]').count()===1,`${name}: install action missing`);
 const manifest=await page.evaluate(async()=>await(await fetch(document.querySelector('link[rel="manifest"]').href)).json());
 assert(manifest.start_url==='./demo/'&&manifest.display==='standalone',`${name}: installed app does not open demo`);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${name}: horizontal overflow`);
 if(full)await page.screenshot({path:shot('02-mobile-hero.png')});
 const scenes=new Set();
 const y0=await page.locator('#jornada').evaluate(el=>el.offsetTop),y1=await page.locator('.journey-finale').evaluate(el=>el.offsetTop);
 for(let y=y0;y<=y1;y+=110){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(35);scenes.add(await stage(page).getAttribute('data-scene'))}
 assert([...['0','1','2','3']].every(v=>scenes.has(v)),`${name}: scroll did not reveal every chapter: ${[...scenes]}`);
 await jump(page,'#proposta');await page.locator('button[data-period="night"]').tap();await page.waitForTimeout(400);
 assert(await stage(page).getAttribute('data-period')==='night',`${name}: night selection failed`);
 if(full)await page.screenshot({path:shot('04-mobile-noite.png')});
 await jump(page,'#rotas');assert(await stage(page).getAttribute('data-scene')==='1',`${name}: map did not follow routes`);
 await page.locator('button[data-route="fast"]').tap();await page.waitForFunction(()=>document.querySelector('.experience-stage .scene-score')?.textContent==='61');
 assert(await stage(page).locator('.map-path-fast').evaluate(el=>el.classList.contains('is-selected')),`${name}: fast route not drawn`);
 assert((await stage(page).locator('.scene-time-value').textContent())==='18 min',`${name}: route time missing`);
 assert((await stage(page).locator('.scene-score').textContent())==='61',`${name}: route score wrong`);
 if(full)await page.screenshot({path:shot('03-mobile-jornada.png')});
 await jump(page,'#guardiao');assert(await stage(page).getAttribute('data-scene')==='2',`${name}: Guardian scene missing`);
 await page.locator('.activate-guardian').tap();await page.waitForFunction(()=>Number(document.querySelector('.experience-stage .guardian-progress')?.getAttribute('aria-valuenow'))>3,null,{timeout:4000});
 const progress=async()=>Number(await stage(page).locator('.guardian-progress').getAttribute('aria-valuenow'));
 assert((await progress())>3,`${name}: Guardian did not start`);
 await jump(page,'#comunidade');const paused=await progress();await wait(900);
 assert(Math.abs(await progress()-paused)<=1,`${name}: Guardian did not pause off chapter`);
 await jump(page,'#guardiao');await page.waitForFunction(()=>document.querySelector('.experience-stage').dataset.guardianStatus==='complete',null,{timeout:10000});
 assert(await progress()===100,`${name}: Guardian did not arrive`);
 assert((await stage(page).locator('.scene-score').textContent())==='100',`${name}: Guardian score not synchronized`);
 await page.locator('.activate-guardian').tap();await page.waitForTimeout(300);assert(await progress()<20,`${name}: Guardian replay failed`);
 await jump(page,'#comunidade');await page.locator('[data-report="flood"]').tap();await page.waitForTimeout(250);
 assert(await stage(page).locator('.user-report-marker').evaluate(el=>el.classList.contains('is-present')),`${name}: report marker missing`);
 assert((await stage(page).locator('.scene-report-title').textContent())==='Alagamento',`${name}: report title wrong`);
 if(full)await page.screenshot({path:shot('05-mobile-relato.png')});
 await jump(page,'#rotas');assert(await page.locator('button[data-route="fast"]').getAttribute('aria-pressed')==='true',`${name}: route choice lost after backscroll`);
 await jump(page,'#comunidade');await page.locator('[data-action="report-remove"]').tap();await page.waitForTimeout(150);
 assert(!await stage(page).locator('.user-report-marker').evaluate(el=>el.classList.contains('is-present')),`${name}: report removal failed`);
 await page.locator('.menu-toggle').tap();assert(await page.locator('.menu-toggle').getAttribute('aria-expanded')==='true',`${name}: menu did not open`);
 await page.keyboard.press('Escape');assert(await page.locator('.menu-toggle').getAttribute('aria-expanded')==='false',`${name}: menu Escape failed`);
 await page.goto(new URL('demo/',base).href,{waitUntil:'networkidle'});
 assert(await page.locator('iframe').count()===0,`${name}: demo still in iframe`);
 assert(await page.locator('main[data-screen="home"]').count()===1,`${name}: demo home missing`);
 await page.locator('[data-action="search"]').tap();await page.locator('[data-action="destination"][data-id="park"]').tap();
 assert(await page.locator('main[data-screen="routes"]').count()===1,`${name}: demo route flow failed`);
 await page.locator('[data-action="select-route"][data-id="fast"]').tap();
 assert(await page.locator('[data-action="select-route"][data-id="fast"]').count()===1,`${name}: demo route selection failed`);
 if(full){
  await page.screenshot({path:shot('06-demo-mobile.png')});
  await page.locator('[data-action="start-route"]').tap();
  assert(await page.locator('main[data-screen="guardian"]').count()===1,'Demo Guardian navigation failed');
  await page.locator('#sos').scrollIntoViewIfNeeded();const box=await page.locator('#sos').boundingBox();
  const session=await context.newCDPSession(page),x=box.x+box.width/2,y=box.y+box.height/2;
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
  await page.waitForTimeout(3200);
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert((await page.locator('#modal-root').innerText()).includes('Nenhuma mensagem foi enviada'),'Demo SOS confirmation missing');
  await page.locator('[data-action="close"]').last().tap();
  await page.locator('[data-action="finish-guardian"]').tap();await page.locator('[data-action="confirm-finish"]').tap();
  assert((await page.locator('#guard-status').textContent())==='Percurso concluído','Demo Guardian finish failed');
  await page.locator('[data-action="nav"][data-screen="home"]').tap();
  await page.locator('[data-action="report"]').first().tap();
  await page.locator('[data-action="category"][data-id="light"]').tap();
  await page.locator('#report-description').fill('Poste apagado na apresentação');
  await page.locator('#report-form button[type="submit"]').tap();
  assert(await page.locator('main[data-screen="alerts"]').count()===1,'Demo report flow failed');
  assert(await page.locator('.alert-card').filter({hasText:'seu relato'}).count()===1,'Demo report absent from alerts');
  await page.locator('[data-action="nav"][data-screen="profile"]').tap();
  await page.locator('[data-action="reset"]').tap();await page.locator('[data-action="confirm-reset"]').tap();
  assert(await page.locator('main[data-screen="home"]').count()===1,'Demo reset failed');
 }
 await page.locator('.demo-return a').tap();await page.waitForURL(url=>!url.pathname.includes('/demo/'));assert(!page.url().includes('/demo/'),`${name}: return from demo failed`);
 if(!full){
  await page.locator('button[data-install-app]').tap();await page.waitForURL(url=>url.pathname.endsWith('/demo/'));
  assert(await page.locator('#install-dialog').isVisible(),`${name}: install action did not open guidance`);
 }
 await page.goto(new URL('demo/?instalar=1',base).href,{waitUntil:'networkidle'});
 assert(await page.locator('#install-dialog').isVisible(),`${name}: install guidance missing`);
 assert((await page.locator('#install-title').textContent()).includes(full?'Android':'iPhone'),`${name}: wrong install instructions`);
 assert(!page.url().includes('instalar='),`${name}: installation link did not clean URL`);
 if(full)await page.screenshot({path:shot('11-install-android.png')});else await page.screenshot({path:shot('12-install-iphone.png')});
 await page.locator('.install-dialog-close').tap();
 await page.locator('.demo-return [data-install-app]').tap();
 assert(await page.locator('#install-dialog').isVisible(),`${name}: demo install button failed`);
 await page.keyboard.press('Escape');assert(!await page.locator('#install-dialog').isVisible(),`${name}: install dialog Escape failed`);
 await page.locator('.demo-return a').tap();await page.waitForURL(url=>!url.pathname.includes('/demo/'));
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload({waitUntil:'networkidle'});
 assert(await page.locator('html').evaluate(el=>el.classList.contains('motion-reduced')),`${name}: reduced motion ignored`);
 await jump(page,'#rotas');await page.locator('button[data-route="fast"]').tap();await page.waitForTimeout(80);
 assert((await stage(page).locator('.scene-time-value').textContent())==='18 min',`${name}: reduced motion controls failed`);
 assert(await page.locator('#rotas .chapter-content').evaluate(el=>getComputedStyle(el).opacity)==='1',`${name}: reduced motion hid text`);
 if(full){
  for(const [width,height] of [[320,568],[390,844],[768,900],[900,900],[1024,900],[1440,900]]){
   await page.setViewportSize({width,height});await page.goto(base,{waitUntil:'networkidle'});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow at ${width}`);
   if(width===320){await jump(page,'#rotas');assert(await stage(page).getAttribute('data-scene')==='1','Small screen scene stuck');await page.screenshot({path:shot('08-mobile-320.png')})}
   if(width===1440){await page.screenshot({path:shot('01-desktop.png')});await jump(page,'#rotas');assert(await stage(page).getAttribute('data-scene')==='1','Desktop scene stuck')}
  }
  const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});const staticPage=await nojs.newPage();await staticPage.goto(base);
  assert(await staticPage.locator('#proposta h2').isVisible(),'No-JS content hidden');await nojs.close();
 }
 assert(!errors.length,`${name} browser errors: ${errors.join(' | ')}`);
 await context.close();await browser.close();return `${name}: scroll scenes 0-3; choices, Guardian pause/replay, reports, web install, reduced motion${full?', responsiveness':''}`;
}
async function offlineCheck(){
 const browser=await chromium.launch({executablePath:process.env.CHROME_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
 await page.goto(base,{waitUntil:'networkidle'});
 await page.waitForFunction(()=>navigator.serviceWorker?.controller!==null,{timeout:12000});
 const registration=await page.evaluate(async()=>{const reg=await navigator.serviceWorker.ready;return {scope:reg.scope,cache:await caches.keys()}});
 assert(registration.scope===new URL('./',base).href,'Service worker scope wrong');
 assert(registration.cache.some(k=>k.startsWith('farol-web-')),'Offline cache missing');
 await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});
 assert(await page.locator('h1').count()===1,'Offline landing failed');
 await page.goto(new URL('demo/',base).href,{waitUntil:'domcontentloaded'});
 assert(await page.locator('main[data-screen="home"]').count()===1,'Offline demo failed');
 await page.goto(base,{waitUntil:'domcontentloaded'});
 assert(await page.locator('button[data-install-app]').count()===1,'Offline install instructions missing');
 await browser.close();return 'Offline: landing and demo after first visit';
}
(async()=>{
 const results=[];results.push(await browserCheck(chromium,'Chromium Android emulation',true));
 results.push(await browserCheck(webkit,'WebKit iPhone emulation',false));
 results.push(await offlineCheck());
 fs.writeFileSync(path.join(root,'tests','last-result.txt'),results.join('\n')+'\n');
 console.log(results.join('\n'));
})().catch(error=>{console.error(error);process.exit(1)});
