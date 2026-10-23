'use strict';

const farolRoot = new URL('./', document.currentScript.src);
const farolApp = new URL('app/', farolRoot);
const farolInstall = new URL('install/', farolRoot);
const farolStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const farolIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const farolAndroid = /Android/.test(navigator.userAgent);

// Existing home-screen shortcuts may still point at the old root URL.
if (farolStandalone() && (location.pathname === farolRoot.pathname || location.pathname === farolInstall.pathname)) {
  location.replace(farolApp.href);
}

if ('serviceWorker' in navigator && (location.protocol === 'https:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname))) {
  navigator.serviceWorker.register(new URL('sw.js', farolRoot)).catch(() => {});
}

let farolInstallPrompt = null;
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  farolInstallPrompt = event;
  document.documentElement.classList.add('pwa-prompt-ready');
});

function farolInstalled() {
  document.documentElement.classList.toggle('pwa-installed', farolStandalone());
  const status = document.getElementById('install-status');
  if (status && farolStandalone()) status.textContent = 'O Farol já está aberto como aplicativo.';
}

window.addEventListener('appinstalled', () => {
  farolInstallPrompt = null;
  farolInstalled();
  const status = document.getElementById('install-status');
  if (status) status.textContent = 'Farol instalado! Abra o protótipo pelo novo ícone na tela inicial.';
});
matchMedia('(display-mode: standalone)').addEventListener?.('change', farolInstalled);

function selectPlatform(platform) {
  document.querySelectorAll('[data-platform]').forEach(button => {
    const selected = button.dataset.platform === platform;
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  document.querySelectorAll('[data-platform-panel]').forEach(panel => {
    panel.hidden = panel.dataset.platformPanel !== platform;
  });
}

document.addEventListener('click', async event => {
  const platform = event.target.closest('[data-platform]');
  if (platform) {
    selectPlatform(platform.dataset.platform);
    return;
  }

  if (event.target.closest('[data-install-app]')) {
    location.href = farolInstall.href;
    return;
  }

  if (!event.target.closest('[data-install-now]')) return;
  const status = document.getElementById('install-status');
  if (farolStandalone()) {
    location.href = farolApp.href;
    return;
  }
  if (farolInstallPrompt) {
    const prompt = farolInstallPrompt;
    farolInstallPrompt = null;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (status) status.textContent = choice.outcome === 'accepted'
      ? 'Instalação solicitada. Abra o Farol pelo ícone na tela inicial.'
      : 'Você pode instalar depois usando o menu do navegador.';
    return;
  }
  const selected = farolIOS ? 'ios' : 'android';
  selectPlatform(selected);
  if (status) status.textContent = farolIOS
    ? 'No iPhone, o Safari exige a ação manual: toque em Compartilhar e depois em Adicionar à Tela de Início.'
    : farolAndroid
      ? 'No Chrome, abra o menu ⋮ e toque em Instalar app ou Adicionar à tela inicial.'
      : 'Abra esta página no Chrome para Android ou no Safari para iPhone e siga as instruções abaixo.';
  document.querySelector('[data-platform-panel]:not([hidden])')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});
  status?.focus();
});

if (document.querySelector('[data-platform]')) selectPlatform(farolIOS ? 'ios' : 'android');
farolInstalled();
