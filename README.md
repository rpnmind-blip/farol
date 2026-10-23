# Farol — landing e protótipo instalável

O endereço [rpnmind-blip.github.io/farol](https://rpnmind-blip.github.io/farol/) abre a **landing interativa** no navegador. O botão **Instalar Farol** leva à [página de instalação](https://rpnmind-blip.github.io/farol/install/), com instruções para Android e iPhone. O ícone instalado abre diretamente o [protótipo](https://rpnmind-blip.github.io/farol/app/).

No Android, o botão da página de instalação abre a janela nativa de PWA quando o Chrome a disponibiliza. Se ela não aparecer, use o menu ⋮ → **Instalar app** ou **Adicionar à tela inicial**. No iPhone, abra a página de instalação no Safari e use **Compartilhar → Adicionar à Tela de Início**; o Safari exige essa ação manual. Se aparecer, ative **Abrir como App**.

O aplicativo funciona em ambos os sistemas sem APK ou IPA. Após a primeira visita online, a landing, a página de instalação e o protótipo ficam disponíveis offline. Quem já instalou a versão antiga com a URL da raiz é direcionado ao protótipo ao abrir pelo ícone. O antigo atalho `/demo/` também leva ao protótipo.

Mapa, rotas, scores, localização, alertas, Guardião, SOS e relatos são simulados. Nenhuma mensagem é enviada e nenhum serviço de emergência é acionado. Relatos e preferências ficam apenas no navegador e podem ser apagados em Perfil → Reiniciar apresentação.

## Estrutura

- `docs/index.html`, `style.css`, `journey.css`, `site.js`: landing interativa.
- `docs/install/index.html`, `install-page.css`: página de instalação e instruções.
- `docs/app/index.html`, `app.js`, `app.css`, `presentation.css`: protótipo e apresentação dentro do app.
- `docs/manifest.webmanifest`, `sw.js`, `pwa.js`: entrada instalada, instalação e cache offline.
- `docs/demo/index.html`: redirecionamento do atalho anterior.
- `tests/smoke.cjs`: fluxo da landing, instalação, app, responsividade e offline.

Para abrir localmente, execute `python3 -m http.server 8787 --bind 127.0.0.1 --directory docs` e visite `http://127.0.0.1:8787/`. O site é estático, sem build ou dependências em produção.

O APK Android anterior continua no projeto Android original, fora deste repositório web.
