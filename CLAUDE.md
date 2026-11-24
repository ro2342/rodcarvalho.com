# CLAUDE.md — rodcarvalho.com

Site pessoal do Rod (Rod Carvalho). Leia o `PROGRESS.md` antes de mexer: ele diz o que já foi feito e o que falta.

## Escopo
Uma página só (`index.html` gerada) com três blocos:
1. **Canal** — todos os vídeos (vlogs) da playlist "todos os episódios" (`PLTbG5pxygPvQAS__YHc7IBZLiMG2P7Agl`), sem filtro, ordenados do episódio 20 pro 1 (pelo número no título). Sem exclusões em cima da playlist.
2. **Rod Pod** — links do podcast: YouTube Music, Spotify, Apple Podcasts.
3. **Área de Transferência** — últimos posts do Substack (feed RSS), com botão de assinatura.

## Links oficiais (fonte da verdade)
- Canal YouTube: https://www.youtube.com/@rodindica (channel ID `UCMP1dOGN1Mt5PKOa4CebDrQ`)
- Rod Pod YouTube Music: https://music.youtube.com/playlist?list=PLZg71_yYwRxo
- Rod Pod Spotify: https://open.spotify.com/show/6tbW4A6KqD44Z6zqkJipN4
- Rod Pod Apple: https://podcasts.apple.com/de/podcast/rod-pod/id6838877566
- Substack: https://areadetransferencia.substack.com/ (feed: `/feed`)
- Domínio: rodcarvalho.com (arquivo `CNAME`)
- Repositório GitHub: a confirmar (provavelmente `ro2342/rodcarvalho.com`).

## Tecnologia
- Site estático. Sem framework, sem dependências npm.
- `scripts/build.mjs`: Node 18+ puxa os dois feeds e gera `dist/` (`index.html`, `styles.css`, `CNAME`).
- `npm run build` gera o site localmente.
- `.github/workflows/deploy.yml`: build + deploy no GitHub Pages em todo push na `main` e a cada 3h (cron), pra atualizar vídeos e posts sozinhos.
- Fontes (Google Fonts): **Archivo Black** (títulos), **Permanent Marker** (marcador/destaques), **Special Elite** (texto corrido, máquina de escrever).

## Design: zine / colagem
- Cores: vermelho `#ff3d2e` (hero), amarelo `#ffe14d` (destaques, posts), rosa `#ff9ec7` (bloco do podcast), papel `#fffdf6`, fundo creme `#f1e6cc` com pontinhos, tinta `#161616`.
- Elementos: cards como recortes de papel (borda rasgada via `clip-path`), fita adesiva (`.tape`), sombra dura (`6px 6px 0`), rotações leves, adesivos "ctrl + c" / "ctrl + v".
- Botões: caixa com borda grossa e sombra dura; no hover sobem um pouco.
- Não usar: gradientes suaves, sombras difusas, cantos arredondados, emojis como decoração.
- Responsivo: mobile em `max-width: 600px`. Respeita `prefers-reduced-motion`.

## Textos
- Tudo em português do Brasil.
- Texto de apresentação vem do próprio Substack ("ctrl+c / ctrl+v do que eu tenho visto, lido e ouvido").

## Como trabalhar aqui
- Mudança de visual: editar `src/styles.css`.
- Mudança de texto/links fixos: editar `scripts/build.mjs` (objeto `LINKS` e `renderPage`).
- Nunca editar `dist/` na mão — é gerado.
- Toda mudança: atualizar `PROGRESS.md` (índice curto) e `ai/CHANGELOG.md` (detalhe), no mesmo commit.
