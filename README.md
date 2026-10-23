# Farol — protótipo web instalável

O endereço [rpnmind-blip.github.io/farol](https://rpnmind-blip.github.io/farol/) abre diretamente o protótipo do Farol. A aba **Projeto** traz a apresentação dentro do aplicativo. O ícone instalado na tela inicial também abre o protótipo, sem uma landing separada.

## Instalação no celular

- **Android:** abra o link no Chrome e toque em **Instalar** na tela inicial do Farol ou em **Instalar Farol** na aba Projeto. Quando o navegador oferecer a janela de instalação, confirme. Caso contrário, use “Instalar app” ou “Adicionar à tela inicial” no menu ⋮.
- **iPhone:** abra o link no Safari e toque em **Instalar** para ver as instruções. Use Compartilhar → “Adicionar à Tela de Início” e, se aparecer, ative “Abrir como App”.

É um PWA: o mesmo endereço funciona nos dois sistemas, sem APK ou IPA. Depois da primeira visita online, as telas principais ficam disponíveis offline. O atalho antigo `/demo/` redireciona ao endereço principal.

Mapa, rotas, scores, localização, alertas, Guardião, SOS e relatos são simulados. Nenhuma mensagem é enviada e nenhum serviço de emergência é acionado. Relatos e preferências são salvos apenas no navegador e podem ser apagados em Perfil → Reiniciar apresentação.

## Estrutura

- `docs/index.html`, `app.js`, `app.css`, `presentation.css`: protótipo e apresentação integrada.
- `docs/manifest.webmanifest`, `sw.js`, `pwa.js`, `install.css`: instalação e uso offline.
- `docs/demo/index.html`: redirecionamento do link antigo.
- `tests/smoke.cjs`: fluxos, responsividade, WebKit, instalação, movimento reduzido e offline.
- `screenshots/`: capturas da versão entregue.

Para abrir localmente, execute `python3 -m http.server 8787 --bind 127.0.0.1 --directory docs` e visite `http://127.0.0.1:8787/`. Não há build nem dependências em produção. Para repetir os testes, instale Playwright e os navegadores Chromium e WebKit, inicie o servidor e rode `node tests/smoke.cjs`. As variáveis `PLAYWRIGHT_MODULE`, `CHROME_EXECUTABLE` e `BASE_URL` são opcionais.

O APK Android anterior continua no projeto Android original, fora deste repositório web.
