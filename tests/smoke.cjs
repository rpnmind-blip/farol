'use strict';
const {chromium, webkit, devices} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..');
const base = process.env.BASE_URL || 'http://127.0.0.1:8787/';
const url = part => new URL(part, base).href;
const shot = name => path.join(root, 'screenshots', name);
const assert = (ok, message) => { if (!ok) throw Error(message); };

async function checkBrowser(engine, name, android) {
  const browser = await engine.launch(android ? {executablePath: process.env.CHROME_EXECUTABLE || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'} : {headless: true});
  const context = await browser.newContext({...devices[android ? 'Pixel 5' : 'iPhone 13'], viewport: {width: 390, height: 844}});
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });

  await page.goto(base, {waitUntil: 'networkidle'});
  assert(await page.locator('.hero #hero-title').count() === 1, `${name}: root must show landing`);
  assert(await page.locator('main[data-screen="home"]').count() === 0, `${name}: prototype appeared at root`);
  assert(await page.locator('.hero-actions a[href="install/"]').count() === 1, `${name}: landing install link missing`);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name}: landing overflow`);
  if (android) await page.screenshot({path: shot('07-landing-mobile.png')});
  await page.locator('[data-period="night"]').click();
  assert(await page.locator('[data-period="night"]').getAttribute('aria-pressed') === 'true', `${name}: landing day/night choice failed`);
  await page.locator('[data-route="fast"]').click();
  assert(await page.locator('[data-route="fast"]').getAttribute('aria-pressed') === 'true', `${name}: landing route choice failed`);

  await page.locator('.hero-actions a[href="install/"]').click();
  await page.waitForURL(url('install/'));
  assert(await page.locator('h1').innerText().then(text => text.includes('tela inicial')), `${name}: installation page missing`);
  assert(await page.locator('[data-install-now]').isVisible(), `${name}: main install button missing`);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name}: install page overflow`);
  const manifest = await (await page.request.get(url('manifest.webmanifest'))).json();
  assert(new URL(manifest.start_url, url('manifest.webmanifest')).href === url('app/'), `${name}: installed icon must open prototype`);
  assert(manifest.display === 'standalone', `${name}: app display mode wrong`);

  if (android) {
    await page.screenshot({path: shot('08-instalar-android.png')});
    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt', {cancelable: true});
      event.prompt = async () => { window.__promptCalled = true; };
      event.userChoice = Promise.resolve({outcome: 'accepted'});
      dispatchEvent(event);
    });
    await page.locator('[data-install-now]').click();
    assert(await page.evaluate(() => window.__promptCalled === true), `${name}: native PWA prompt not used`);
    assert((await page.locator('#install-status').innerText()).includes('Instalação solicitada'), `${name}: confirmation missing`);
    await page.locator('[data-install-now]').click();
    assert((await page.locator('#install-status').innerText()).includes('menu ⋮'), `${name}: Android fallback missing`);
  } else {
    assert(await page.locator('[data-platform="ios"]').getAttribute('aria-pressed') === 'true', `${name}: iOS instructions not selected`);
    await page.locator('[data-install-now]').tap();
    assert((await page.locator('#install-status').innerText()).includes('Compartilhar'), `${name}: iPhone manual installation not explained`);
    await page.screenshot({path: shot('09-instalar-iphone.png')});
  }

  await page.locator('[data-platform="android"]').click();
  assert(await page.locator('[data-platform-panel="android"]').isVisible(), `${name}: Android steps hidden`);
  await page.locator('[data-platform="ios"]').click();
  assert(await page.locator('[data-platform-panel="ios"]').isVisible(), `${name}: iOS steps hidden`);
  await page.locator('.try-link').click();
  await page.waitForURL(url('app/'));
  assert(await page.locator('main[data-screen="home"]').count() === 1, `${name}: prototype did not open`);
  assert(await page.locator('.nav button').count() === 5, `${name}: app tabs missing`);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name}: app overflow`);
  await page.locator('[data-action="nav"][data-screen="presentation"]').click();
  assert(await page.locator('main[data-screen="presentation"]').count() === 1, `${name}: presentation missing`);
  await page.locator('.project-install [data-install-app]').click();
  await page.waitForURL(url('install/'));
  await page.goto(url('app/'));
  await page.locator('[data-action="nav"][data-screen="home"]').click();
  await page.locator('[data-action="search"]').click();
  await page.locator('[data-action="destination"][data-id="park"]').click();
  assert(await page.locator('main[data-screen="routes"]').count() === 1, `${name}: route flow failed`);
  await page.locator('[data-action="select-route"][data-id="fast"]').click();
  assert(await page.locator('[data-action="select-route"][data-id="fast"]').getAttribute('aria-pressed') === 'true', `${name}: route choice failed`);
  await page.locator('[data-action="start-route"]').click();
  assert(await page.locator('main[data-screen="guardian"]').count() === 1, `${name}: Guardian failed`);
  await page.goto(url('demo/'), {waitUntil: 'domcontentloaded'});
  await page.waitForURL(url('app/'));
  assert(await page.locator('main[data-screen="home"]').count() === 1, `${name}: old demo link failed`);

  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto(base);
  assert(await page.locator('.hero #hero-title').isVisible(), `${name}: landing hidden with reduced motion`);
  if (android) {
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({width, height: 850});
      await page.goto(base);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `landing overflow at ${width}`);
      await page.goto(url('install/'));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `installation overflow at ${width}`);
    }
    await page.setViewportSize({width: 1440, height: 900});
    await page.goto(base);
    await page.screenshot({path: shot('10-landing-desktop.png')});
    await page.goto(url('install/'));
    await page.screenshot({path: shot('11-instalar-desktop.png')});
  }
  assert(!errors.length, `${name}: browser errors: ${errors.join(' | ')}`);
  const shortcut = await context.newPage();
  await shortcut.addInitScript(() => Object.defineProperty(navigator, 'standalone', {value: true, configurable: true}));
  await shortcut.goto(base);
  await shortcut.waitForURL(url('app/'));
  assert(await shortcut.locator('main[data-screen="home"]').count() === 1, `${name}: existing home-screen shortcut did not open app`);
  await browser.close();
  return `${name}: landing, install, manifest, app, routes, Guardian, redirects, responsive and reduced motion`;
}

async function checkOffline() {
  const browser = await chromium.launch({executablePath: process.env.CHROME_EXECUTABLE || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  const context = await browser.newContext({viewport: {width: 390, height: 844}}), page = await context.newPage();
  await page.goto(base, {waitUntil: 'networkidle'});
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, {timeout: 12000});
  const keys = await page.evaluate(() => caches.keys());
  assert(keys.includes('farol-web-v5'), 'Current offline cache missing');
  await context.setOffline(true);
  await page.reload({waitUntil: 'domcontentloaded'});
  assert(await page.locator('#hero-title').count() === 1, 'Landing unavailable offline');
  await page.goto(url('install/'), {waitUntil: 'domcontentloaded'});
  assert(await page.locator('[data-install-now]').count() === 1, 'Install page unavailable offline');
  await page.goto(url('app/'), {waitUntil: 'domcontentloaded'});
  assert(await page.locator('main[data-screen="home"]').count() === 1, 'App unavailable offline');
  await browser.close();
  return 'Offline: landing, installation and prototype after first visit';
}

(async () => {
  const results = [];
  results.push(await checkBrowser(chromium, 'Chromium Android emulation', true));
  results.push(await checkBrowser(webkit, 'WebKit iPhone emulation', false));
  results.push(await checkOffline());
  fs.writeFileSync(path.join(root, 'tests', 'last-result.txt'), results.join('\n') + '\n');
  console.log(results.join('\n'));
})().catch(error => {console.error(error); process.exit(1);});
