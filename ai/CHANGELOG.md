# CHANGELOG — rodcarvalho.com

## 2026-11-24 — Versão 1 (zine) criada localmente
- Projeto novo em `Craft Anything/rodcarvalho-com`, separado do clone do evanandkatelyn (que ficou intacto).
- Vibe escolhida pelo Rod: **colagem / zine**.
- Substack: decidido que o site é a vitrine e lista os posts via RSS (`areadetransferencia.substack.com/feed`). O Substack continua igual.
- Links confirmados pelo Rod: canal `@rodindica` (channel ID `UCMP1dOGN1Mt5PKOa4CebDrQ`), Rod Pod no YouTube Music, Spotify e Apple Podcasts, e o Substack.
- `scripts/build.mjs`: sem dependências; baixa os feeds do YouTube e do Substack, escapa HTML, decodifica entidades (`&#39;`, `&#227;`...) e gera `dist/index.html`. Teste local: 6 vídeos e 6 posts gerados, títulos com acentos corretos.
- `src/styles.css`: paleta vermelho/amarelo/rosa sobre papel creme, cards de papel rasgado, fita adesiva, botões com sombra dura, responsivo.
- `.github/workflows/deploy.yml`: build e deploy no GitHub Pages em todo push na `main` e a cada 3h.
- `CNAME` com `rodcarvalho.com`.
- Ainda NÃO feito: git inicializado, repositório no GitHub, DNS, visual revisado no navegador.

## 2026-11-24 — Canal sem Shorts e sem a playlist de episódios
- Pedido do Rod: o bloco Canal não deve mostrar Shorts nem os vídeos da playlist "todos os episódios".
- Playlist "todos os episódios": `PLTbG5pxygPvQAS__YHc7IBZLiMG2P7Agl` (20 vídeos). Não é a que estava no link do Rod Pod (`PLZg71_yYwRxo`, que tem só 1 episódio).
- Fonte do Canal mudou: o RSS só traz os 15 últimos envios (quase todos Shorts), então virou a aba "Vídeos" do canal (`@rodindica/videos`).
- Filtros no `build.mjs`: remove IDs da playlist de episódios; checa Short por `youtube.com/shorts/ID` (200 = Short, 303 = vídeo comum); título via oEmbed.
- Cookie de consentimento (`SOCS`/`CONSENT`) é enviado porque sem ele o YouTube devolve a tela de cookies.
- Build falha se a playlist ou a aba vierem vazias, pra não publicar um site sem vídeos.
- Resultado do teste: 6 vídeos no Canal, incluindo títulos "Episódio 06", "Episódio 5" etc. que estão no canal mas fora da playlist.
- Decisão do Rod: manter assim (só Shorts e a playlist saem). O link do YouTube Music do Rod Pod também fica como está.

## 2026-11-24 — Carrossel de vídeos e embed do Spotify
- Canal virou carrossel: 3 cards por vez no computador, 1 por vez no celular (84% da largura), com setas e arrastar com o dedo (scroll-snap, sem biblioteca).
- Todos os 20 vídeos continuam no HTML; o carrossel só mostra um pedaço.
- Rod Pod ganhou o embed oficial do Spotify (`open.spotify.com/embed/show/6tbW4A6KqD44Z6zqkJipN4`) acima dos botões.
- Pendente: "os links do blog" ainda não foi definido pelo Rod.

## 2026-11-24 — Canal mostra a playlist inteira, do 20 ao 1
- Rod pediu: nada de exclusão em cima da playlist. Mostrar os 20 itens.
- Verificado: nenhum dos 20 itens é Short. A página da playlist entrega a ordem embaralhada (13→1 e depois 14→20), por isso o teste anterior começou pelo 13.
- Removido o filtro de Short e o limite de 6. Agora `build.mjs` ordena pelo número do episódio no título (função `episodeNumber`).
- Resultado: 20 cards, do "episódio 20" ao "episódio 01".

## 2026-11-24 — Canal vem da playlist de vídeos (correção)
- Eu tinha lido errado: a playlist "todos os episódios" é a lista dos vídeos do canal (vlogs), não uma lista a excluir.
- Agora o Canal sai dela (`PLTbG5pxygPvQAS__YHc7IBZLiMG2P7Agl`), sem Shorts. Os 6 primeiros da playlist aparecem (episódios 13 a 8 no teste).
- Removida a fonte antiga (aba "Vídeos" do canal) e a checagem de episódios fora da playlist.
- YouTube Music do Rod Pod = podcast (1 episódio), mantido.
