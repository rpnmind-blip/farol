# Farol — demonstração web para Android e iPhone

Landing interativa e aplicativo web instalável (PWA) do Farol. A leitura muda um mapa ilustrativo; o visitante pode comparar rotas, alternar horário, experimentar o Guardião e adicionar relatos fictícios. A demonstração completa abre em `/demo/`, inclusive pelo ícone instalado na tela inicial.

**Teste público:** https://rpnmind-blip.github.io/farol/

## Testar no celular

- **Android:** abra a landing no Chrome e toque em “Instalar o Farol”. Se o navegador não oferecer uma janela de instalação, siga as instruções exibidas e use “Instalar app” ou “Adicionar à tela inicial” no menu ⋮.
- **iPhone:** abra a landing no Safari e toque em “Instalar o Farol” para ver o passo a passo. No Safari, use Compartilhar → “Adicionar à Tela de Início” e, se aparecer, ative “Abrir como App”.
- O mesmo endereço funciona nos dois sistemas, sem baixar APK ou IPA. Após a primeira visita online, o service worker guarda a landing e a demonstração para acesso offline. Dados da demonstração ficam somente no armazenamento local do navegador e podem ser apagados em Perfil → Reiniciar apresentação.

O mapa, scores, rotas, horários, localização, ocorrências, Guardião e SOS são simulados. Nenhuma mensagem é enviada e nenhum serviço de emergência é acionado. Não há GPS, backend ou alertas reais nesta versão.

## Estrutura e execução local

- `docs/`: site estático publicado pelo GitHub Pages a partir de `main`.
- `docs/index.html`, `site.js`, `style.css`, `journey.css`, `mobile.css`: landing e jornada ligada à rolagem.
- `docs/demo/`: telas navegáveis do protótipo, abertas diretamente no navegador.
- `docs/manifest.webmanifest`, `sw.js`, `pwa.js`, `install.css`: instalação na tela inicial e cache offline.
- `tests/smoke.cjs`: teste de fluxos, responsividade, WebKit, movimento reduzido, instruções de instalação e offline.
- `screenshots/`: capturas da versão entregue.

Execute `python3 -m http.server 8787 --bind 127.0.0.1 --directory docs` e abra `http://127.0.0.1:8787/`. A página não precisa de build nem de dependências em produção.

Para repetir os testes, instale Playwright e os navegadores Chromium e WebKit, inicie o servidor e rode `node tests/smoke.cjs`. É possível configurar `PLAYWRIGHT_MODULE`, `CHROME_EXECUTABLE` e `BASE_URL` por variáveis de ambiente.

O APK Android anterior permanece no projeto Android original, fora deste repositório web. A distribuição pública desta versão usa somente o aplicativo web instalável.
