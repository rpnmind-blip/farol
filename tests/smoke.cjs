'use strict';
const {chromium,webkit,devices}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const base=process.env.BASE_URL||'http://127.0.0.1:8787/';
const shot=name=>path.join(root,'screenshots',name);
const assert=(condition,message)=>{if(!condition)throw Error(message)};

async function checkBrowser(engine,name,android){
 const browser=await engine.launch(android?{executablePath:process.env.CHROME_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{headless:true});
 const device=devices[android?'Pixel 5':'iPhone 13'];
 const context=await browser.newContext({...device,viewport:{width:390,height:844},acceptDownloads:true});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`)});
 await page.goto(base,{waitUntil:'networkidle'});
 assert(await page.locator('main[data-screen="home"]').count()===1,`${name}: root did not open prototype`);
 assert(await page.locator('.nav button').count()===5,`${name}: project tab missing`);
 assert(await page.locator('[data-install-app]').count()===1,`${name}: install button missing`);
 assert(await page.locator('.hero-actions').count()===0,`${name}: landing still opens at root`);
 const manifest=await(await page.request.get(new URL('manifest.webmanifest',base).href)).json();
 assert(manifest.start_url==='./'&&manifest.display==='standalone',`${name}: installed icon does not start at prototype root`);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${name}: horizontal overflow on home`);
 if(android)await page.screenshot({path:shot('01-app-inicio.png')});
 else await page.screenshot({path:shot('06-app-inicio-iphone.png')});

 await page.locator('[data-action="nav"][data-screen="presentation"]').tap();
 assert(await page.locator('main[data-screen="presentation"]').count()===1,`${name}: presentation tab did not open`);
 assert((await page.locator('.project-lead h2').innerText()).includes('Seu caminho'),`${name}: presentation content missing`);
 assert(await page.locator('.project-links button').count()===4,`${name}: presentation flow links missing`);
 await page.waitForTimeout(250);
 if(android){await page.screenshot({path:shot('02-app-projeto.png')});await page.screenshot({path:shot('05-app-projeto-completo.png'),fullPage:true});}
 const projectUrl=page.url();
 if(android){
  await page.evaluate(()=>{const event=new Event('beforeinstallprompt',{cancelable:true});event.prompt=async()=>{window.__installPromptCalled=true};event.userChoice=Promise.resolve({outcome:'accepted'});dispatchEvent(event)});
  await page.locator('.project-install [data-install-app]').tap();
  assert(await page.evaluate(()=>window.__installPromptCalled===true),`${name}: native PWA prompt was not invoked`);
  assert(await page.locator('#install-dialog').isVisible()===false,`${name}: fallback guide covered native prompt`);
 }else{
  await page.locator('.project-install [data-install-app]').tap();
  assert(await page.locator('#install-dialog').isVisible(),`${name}: iPhone install guide missing`);
  assert((await page.locator('#install-title').innerText()).includes('iPhone'),`${name}: iPhone guide text missing`);
  assert(page.url()===projectUrl,`${name}: install button left prototype`);
  await page.screenshot({path:shot('03-app-instalar-iphone.png')});
  await page.keyboard.press('Escape');
  assert(!await page.locator('#install-dialog').isVisible(),`${name}: install guide did not close`);
 }
 await page.locator('.project-links button[data-screen="map"]').tap();
 assert(await page.locator('main[data-screen="map"]').count()===1,`${name}: project link did not open map`);
 await page.locator('[data-action="nav"][data-screen="profile"]').tap();
 await page.locator('[data-action="presentation"]').tap();
 assert(await page.locator('main[data-screen="presentation"]').count()===1,`${name}: profile did not open presentation`);

 await page.locator('[data-action="nav"][data-screen="home"]').tap();
 await page.locator('[data-action="search"]').tap();
 await page.locator('[data-action="destination"][data-id="park"]').tap();
 assert(await page.locator('main[data-screen="routes"]').count()===1,`${name}: route flow failed`);
 await page.locator('[data-action="select-route"][data-id="fast"]').tap();
 assert(await page.locator('[data-action="select-route"][data-id="fast"]').getAttribute('aria-pressed')==='true',`${name}: route choice failed`);
 if(android)await page.screenshot({path:shot('04-app-rotas.png')});
 await page.locator('[data-action="start-route"]').tap();
 assert(await page.locator('main[data-screen="guardian"]').count()===1,`${name}: Guardian did not open`);
 if(android){
  await page.locator('#sos').scrollIntoViewIfNeeded();
  const box=await page.locator('#sos').boundingBox(),session=await context.newCDPSession(page);
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2,id:1}]});
  await page.waitForTimeout(3200);
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert((await page.locator('#modal-root').innerText()).includes('Nenhuma mensagem foi enviada'),`${name}: SOS simulation missing`);
  await page.locator('[data-action="close"]').last().tap();
  await page.locator('[data-action="finish-guardian"]').tap();
  await page.locator('[data-action="confirm-finish"]').tap();
  assert((await page.locator('#guard-status').textContent())==='Percurso concluído',`${name}: Guardian completion missing`);
  await page.locator('[data-action="nav"][data-screen="home"]').tap();
  await page.locator('[data-action="report"]').first().tap();
  await page.locator('[data-action="category"][data-id="light"]').tap();
  await page.locator('#report-description').fill('Poste apagado na apresentação');
  await page.locator('#report-form button[type="submit"]').tap();
  assert(await page.locator('.alert-card').filter({hasText:'seu relato'}).count()===1,`${name}: report missing from alerts`);
  await page.locator('[data-action="nav"][data-screen="profile"]').tap();
  await page.locator('[data-action="reset"]').tap();
  await page.locator('[data-action="confirm-reset"]').tap();
  assert(await page.locator('main[data-screen="home"]').count()===1,`${name}: reset failed`);
 }

 await page.locator('[data-action="nav"][data-screen="presentation"]').focus();
 await page.keyboard.press('Enter');
 assert(await page.locator('main[data-screen="presentation"]').count()===1,`${name}: keyboard navigation failed`);
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.reload({waitUntil:'networkidle'});
 assert(await page.locator('main[data-screen="home"]').isVisible(),`${name}: reduced motion hid app`);
 assert(await page.locator('.project-install').count()===0,`${name}: root unexpectedly opens presentation`);
 if(android){
  for(const [width,height] of [[320,568],[390,844],[768,900],[1024,900]]){
   await page.setViewportSize({width,height});
   await page.locator('[data-action="nav"][data-screen="presentation"]').click();
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Horizontal overflow at ${width}`);
   assert(await page.locator('.nav button').count()===5,`Tabs lost at ${width}`);
   await page.locator('[data-action="nav"][data-screen="home"]').click();
  }
 }
 await page.goto(new URL('demo/',base).href,{waitUntil:'domcontentloaded'});
 await page.waitForURL(url=>url.href===base,{timeout:10000});
 assert(await page.locator('main[data-screen="home"]').count()===1,`${name}: old demo link did not return to prototype`);
 assert(!errors.length,`${name}: browser errors: ${errors.join(' | ')}`);
 await browser.close();
 return `${name}: prototype root, Project tab, installation, routes, Guardian, keyboard, reduced motion${android?', SOS, reports, reset, responsiveness':''}`;
}

async function checkOffline(){
 const browser=await chromium.launch({executablePath:process.env.CHROME_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
 await page.goto(base,{waitUntil:'networkidle'});
 await page.waitForFunction(()=>navigator.serviceWorker?.controller!==null,{timeout:12000});
 const registration=await page.evaluate(async()=>({scope:(await navigator.serviceWorker.ready).scope,keys:await caches.keys()}));
 assert(registration.scope===base,'Service worker scope wrong');
 assert(registration.keys.includes('farol-web-v4'),'Current offline cache missing');
 await context.setOffline(true);
 await page.reload({waitUntil:'domcontentloaded'});
 assert(await page.locator('main[data-screen="home"]').count()===1,'Offline prototype did not open');
 await page.locator('[data-action="nav"][data-screen="presentation"]').click();
 assert(await page.locator('main[data-screen="presentation"]').count()===1,'Offline project section did not open');
 await page.locator('.project-links button[data-screen="map"]').click();
 assert(await page.locator('main[data-screen="map"]').count()===1,'Offline map did not open');
 await browser.close();
 return 'Offline: prototype, presentation and map after first visit';
}

(async()=>{
 const results=[];
 results.push(await checkBrowser(chromium,'Chromium Android emulation',true));
 results.push(await checkBrowser(webkit,'WebKit iPhone emulation',false));
 results.push(await checkOffline());
 fs.writeFileSync(path.join(root,'tests','last-result.txt'),results.join('\n')+'\n');
 console.log(results.join('\n'));
})().catch(error=>{console.error(error);process.exit(1)});
