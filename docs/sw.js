'use strict';
const CACHE='farol-web-v2';
const FILES=[
  './','index.html','style.css','journey.css','mobile.css','install.css','site.js','pwa.js','manifest.webmanifest',
  'assets/logo.svg','assets/icon-192.png','assets/icon-512.png','assets/apple-touch-icon.png',
  'assets/tela-inicio.png','assets/tela-mapa.png','assets/farol-capa.png',
  'demo/','demo/index.html','demo/app.html','demo/style.css','demo/app.js'
];
const root=new URL('./',self.location.href);
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES.map(file=>new URL(file,root)))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('farol-web-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==root.origin||!url.pathname.startsWith(root.pathname))return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));}return response;}).catch(async()=>await caches.match(request)||await caches.match(new URL('./',root))));
    return;
  }
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));}return response;})));
});
