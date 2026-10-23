'use strict';
const siteRoot=new URL('./',document.currentScript.src);
if('serviceWorker' in navigator && (location.protocol==='https:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname))){
  navigator.serviceWorker.register(new URL('sw.js',siteRoot)).catch(()=>{});
}

let installPrompt=null;
const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const isAndroid=/Android/.test(navigator.userAgent);
const installed=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;

function installGuide(){
  const dialog=document.createElement('dialog');
  dialog.id='install-dialog';
  dialog.setAttribute('aria-labelledby','install-title');
  dialog.setAttribute('aria-describedby','install-description');
  dialog.innerHTML='<div class="install-dialog-content"><span class="install-dialog-badge">FAROL · APP WEB</span><h2 id="install-title"></h2><p id="install-description"></p><ol id="install-steps"></ol><p class="install-dialog-note">O Farol é um protótipo com dados simulados. Após a primeira visita online, você pode abrir a demonstração sem internet.</p><form method="dialog"><button type="submit" class="install-dialog-close">Entendi</button></form></div>';
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  document.body.append(dialog);
  return dialog;
}
const guide=installGuide();
function showGuide(){
  const title=guide.querySelector('#install-title'),description=guide.querySelector('#install-description'),steps=guide.querySelector('#install-steps');
  if(isIOS){
    title.textContent='Adicione o Farol no iPhone';
    description.textContent='No Safari, você pode adicionar este protótipo à Tela de Início.';
    steps.replaceChildren(...['Abra esta página no Safari. Se estiver em outro aplicativo, use a opção para abrir no navegador.','Toque em Compartilhar e escolha “Adicionar à Tela de Início”.','Se aparecer, ative “Abrir como App” e toque em Adicionar.'].map(step=>{const li=document.createElement('li');li.textContent=step;return li;}));
  }else if(isAndroid){
    title.textContent='Instale o Farol no Android';
    description.textContent='O Chrome pode adicionar o Farol à sua tela inicial.';
    steps.replaceChildren(...['Abra esta página no Chrome.','Toque no menu ⋮ e escolha “Instalar app” ou “Adicionar à tela inicial”.','Confirme para abrir o Farol pelo novo ícone.'].map(step=>{const li=document.createElement('li');li.textContent=step;return li;}));
  }else{
    title.textContent='Use o Farol como app web';
    description.textContent='Abra a demonstração no navegador ou use a opção de instalar no menu, quando disponível.';
    steps.replaceChildren(...['No Android, abra no Chrome e use “Instalar app” no menu.','No iPhone, abra no Safari e use Compartilhar → “Adicionar à Tela de Início”.'].map(step=>{const li=document.createElement('li');li.textContent=step;return li;}));
  }
  if(typeof guide.showModal==='function')guide.showModal();else guide.setAttribute('open','');
}

function updateInstalled(){
  document.documentElement.classList.toggle('pwa-installed',installed());
}
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;});
window.addEventListener('appinstalled',()=>{installPrompt=null;updateInstalled();});
matchMedia('(display-mode: standalone)').addEventListener?.('change',updateInstalled);
document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-install-app]');
  if(!button)return;
  if(installPrompt){
    const prompt=installPrompt;installPrompt=null;
    await prompt.prompt();
    await prompt.userChoice;
    updateInstalled();
    return;
  }
  showGuide();
});
updateInstalled();
