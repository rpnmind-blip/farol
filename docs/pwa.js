'use strict';
const siteRoot=new URL('./',document.currentScript.src);
if('serviceWorker' in navigator && (location.protocol==='https:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname))){
  navigator.serviceWorker.register(new URL('sw.js',siteRoot)).catch(()=>{});
}
