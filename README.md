# Farol — demonstração web para Android e iPhone

Landing interativa e protótipo visual do Farol. A leitura muda um mapa ilustrativo; o visitante pode comparar rotas, alternar horário, experimentar o Guardião e adicionar relatos fictícios. A demonstração completa abre em `/demo/`.

**Teste público:** https://rpnmind-blip.github.io/farol/

## Testar no celular

- **Android:** abra o link no Chrome. Para adicionar à tela inicial, use a opção “Instalar app” ou “Adicionar à tela inicial” no menu. Há também um APK Android 8.0+ em `docs/downloads/Farol-Prototipo.apk`.
- **iPhone:** abra o link no Safari, toque em Compartilhar e escolha “Adicionar à Tela de Início”. Esta é uma versão web; não há IPA nem aplicativo iOS nativo.
- Após a primeira visita online, o service worker guarda a landing, a demonstração e o APK para acesso offline. Dados da demonstração ficam somente no armazenamento local do navegador e podem ser apagados em Perfil → Reiniciar apresentação.

O mapa, scores, rotas, horários, localização, ocorrências, Guardião e SOS são simulados. Nenhuma mensagem é enviada e nenhum serviço de emergência é acionado. Não há GPS, backend ou alertas reais nesta versão.

## Estrutura e execução local

- `docs/`: site estático publicado pelo GitHub Pages a partir de `main`.
- `docs/index.html`, `site.js`, `style.css`, `journey.css`, `mobile.css`: landing e jornada ligada à rolagem.
- `docs/demo/`: telas navegáveis do protótipo, abertas diretamente no navegador.
- `docs/manifest.webmanifest`, `sw.js`, `pwa.js`: instalação na tela inicial e cache offline.
- `tests/smoke.cjs`: teste de fluxos, responsividade, WebKit, movimento reduzido, offline e APK.
- `screenshots/`: capturas da versão entregue.

Execute `python3 -m http.server 8787 --bind 127.0.0.1 --directory docs` e abra `http://127.0.0.1:8787/`. A página não precisa de build nem de dependências em produção.

Para repetir os testes, instale Playwright e os navegadores Chromium e WebKit, inicie o servidor e rode `node tests/smoke.cjs`. É possível configurar `PLAYWRIGHT_MODULE`, `CHROME_EXECUTABLE` e `BASE_URL` por variáveis de ambiente.

O APK incluído é a versão Android de demonstração já entregue, preservada byte a byte. SHA-256: `1464b65f0a6c026e1cf4e9356609a5239d8af56e902fbabd3d7f04f0d35ab6fb`.
