// Gera o site estático em dist/: perfil + links (estilo link tree), Rod Pod, vídeos e posts.
// Sem dependências: só Node 18+ (fetch nativo).
import { mkdir, copyFile, writeFile, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const SNAPSHOT = join(ROOT, "data", "snapshot.json"); // fallback quando a busca ao vivo falha

const SUBSTACK_FEED = "https://areadetransferencia.substack.com/feed";
const UA = "Mozilla/5.0 (compatible; site-build)";
const LIMIT = 6; // posts do Substack
const VIDEOS_PLAYLIST_ID = "PLTbG5pxygPvQAS__YHc7IBZLiMG2P7Agl"; // "todos os episódios" = vlogs do canal
// Cookie de consentimento: sem ele o YouTube responde com a tela de cookies em alguns IPs.
const YT_HEADERS = {
  "User-Agent": UA,
  Cookie: "SOCS=CAISNQgDEitib3FfaWRlbnRpdHlmcm9udGVuZHVpc2VydmVyXzIwMjUwNzI5LjA1X3AwGgJkZSACGgYIgJ-pxQY; CONSENT=YES+1",
};

const LINKS = {
  canal: "https://www.youtube.com/@rodindica",
  podcastYouTube: "https://music.youtube.com/playlist?list=PLZg71_yYwRxo",
  podcastSpotify: "https://open.spotify.com/show/6tbW4A6KqD44Z6zqkJipN4",
  podcastApple: "https://podcasts.apple.com/de/podcast/rod-pod/id6838877566",
  substack: "https://areadetransferencia.substack.com/",
};

async function getText(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${url} respondeu ${res.status}`);
  return res.text();
}

function decode(s = "") {
  return s
    .replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, "$1")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1]) : "";
};

function parseSubstack(xml) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, LIMIT).map(([, i]) => ({
    title: tag(i, "title"),
    url: tag(i, "link"),
    date: tag(i, "pubDate"),
  }));
}

// IDs dos vídeos da playlist, na ordem em que a página entrega.
async function playlistVideoIds(listId) {
  const res = await fetch(`https://www.youtube.com/playlist?list=${listId}`, { headers: YT_HEADERS });
  if (!res.ok) throw new Error(`playlist ${listId} respondeu ${res.status}`);
  const html = await res.text();
  const ids = [...html.matchAll(/"videoId":"([A-Za-z0-9_-]{11})"/g)].map((m) => m[1]);
  if (!ids.length) throw new Error(`playlist ${listId} sem vídeos: a página mudou?`);
  return new Set(ids);
}

// Número do episódio no título ("... | episódio 20" -> 20). Sem número, vai pro fim.
function episodeNumber(title = "") {
  const m = title.match(/epis[óo]dio\s*(\d+)/i);
  return m ? Number(m[1]) : -1;
}

// Título oficial do vídeo via oEmbed (não precisa de chave de API).
async function videoInfo(id) {
  const oembed = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`;
  const res = await fetch(oembed, { headers: YT_HEADERS });
  const data = res.ok ? await res.json() : {};
  return {
    url: `https://www.youtube.com/watch?v=${id}`,
    thumb: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`, // 320x180, 16:9
    title: data.title || id,
  };
}

const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const fmtDate = (d) => {
  const t = new Date(d);
  return isNaN(t) ? "" : t.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
};

// Ícones desenhados em SVG (formas simples, não são os logos oficiais). Herdam a cor do texto.
const ICONS = {
  youtube: `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="4" fill="currentColor"/><path d="M10 9.2v5.6l4.8-2.8z" fill="#fffdf6"/></svg>`,
  spotify: `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M6.8 9.4c3.4-1 7.2-.7 10 1M7.2 12.8c2.9-.8 5.8-.5 8 .9M7.8 16c2.2-.6 4.4-.4 6.1.7" stroke="#fffdf6" stroke-width="1.7" fill="none" stroke-linecap="round"/></svg>`,
  apple: `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="9.5" r="2.8" fill="currentColor"/><path d="M12 12.3V19M9.5 19.5h5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M7.4 9.5a4.6 4.6 0 0 0 9.2 0M5.2 9.5a6.8 6.8 0 0 0 13.6 0" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`,
  substack: `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="4" rx="1" fill="currentColor"/><path d="M4 9h16v12l-8-4.5L4 21z" fill="currentColor"/></svg>`,
};

function renderPage({ videos, posts, builtAt }) {
  const videoCards = videos
    .map(
      (v, i) => `
          <a class="vcard rot-${i % 3}" href="${esc(v.url)}" target="_blank" rel="noopener">
            <img src="${esc(v.thumb)}" alt="" loading="lazy" width="320" height="180">
            <span class="vcard__title">${esc(v.title)}</span>
          </a>`
    )
    .join("");

  const postRows = posts
    .map(
      (p) => `
          <a class="prow" href="${esc(p.url)}" target="_blank" rel="noopener">
            <span class="prow__title">${esc(p.title)}</span>
            <small>${esc(fmtDate(p.date))}</small>
          </a>`
    )
    .join("");

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Rod Carvalho</title>
  <meta name="description" content="Canal @rodindica, Rod Pod e Área de Transferência, a newsletter do Rod.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Permanent+Marker&family=Special+Elite&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <main class="page">
    <header class="profile">
      <h1 class="profile__name">ROD<br><span>CARVALHO</span></h1>
      <p class="profile__bio">ctrl+c / ctrl+v do que eu vejo, leio e ouço.</p>
    </header>

    <nav class="links" aria-label="Plataformas">
      <a class="link link--red" href="${LINKS.canal}" target="_blank" rel="noopener">${ICONS.youtube}<span>YouTube</span></a>
      <a class="link link--pink" href="${LINKS.podcastSpotify}" target="_blank" rel="noopener">${ICONS.spotify}<span>Spotify</span></a>
      <a class="link link--yellow" href="${LINKS.substack}" target="_blank" rel="noopener">${ICONS.substack}<span>Substack</span></a>
    </nav>

    <section id="podcast" class="block">
      <h2 class="tag">ROD POD - O podcast do Rod!</h2>
      <div class="paper">
        <iframe class="podcast__embed" title="Rod Pod no Spotify" src="https://open.spotify.com/embed/show/6tbW4A6KqD44Z6zqkJipN4?utm_source=generator" width="100%" height="232" frameborder="0" allowfullscreen allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" style="border-radius:12px"></iframe>
        <div class="platforms">
          <a class="pill" href="${LINKS.podcastYouTube}" target="_blank" rel="noopener">${ICONS.youtube} YouTube Music</a>
          <a class="pill" href="${LINKS.podcastSpotify}" target="_blank" rel="noopener">${ICONS.spotify} Spotify</a>
          <a class="pill" href="${LINKS.podcastApple}" target="_blank" rel="noopener">${ICONS.apple} Apple Podcasts</a>
        </div>
      </div>
    </section>

    <section id="videos" class="block">
      <h2 class="tag">Vídeos</h2>
      <div class="carousel" data-carousel>
        <button class="carousel__btn" data-prev aria-label="Vídeo anterior">&#8249;</button>
        <div class="carousel__track">${videoCards}
        </div>
        <button class="carousel__btn" data-next aria-label="Próximo vídeo">&#8250;</button>
      </div>
      <p class="center"><a class="pill" href="${LINKS.canal}" target="_blank" rel="noopener">Ver todos no canal</a></p>
    </section>

    <section id="posts" class="block">
      <h2 class="tag">Área de Transferência</h2>
      <div class="prows">${postRows}
      </div>
      <p class="center"><a class="pill" href="${LINKS.substack}" target="_blank" rel="noopener">Assinar a newsletter</a></p>
    </section>

    <footer class="footer">
      <p>Atualizado em ${esc(builtAt)}</p>
    </footer>
  </main>
  <script>
    // Carrossel: anda um card por clique. No celular, o arrastar com o dedo já funciona pelo CSS.
    document.querySelectorAll("[data-carousel]").forEach(function (box) {
      var track = box.querySelector(".carousel__track");
      function step() {
        var item = track.querySelector(".vcard");
        return item ? item.offsetWidth + 14 : 200;
      }
      box.querySelector("[data-prev]").addEventListener("click", function () {
        track.scrollBy({ left: -step(), behavior: "smooth" });
      });
      box.querySelector("[data-next]").addEventListener("click", function () {
        track.scrollBy({ left: step(), behavior: "smooth" });
      });
    });
  </script>
</body>
</html>
`;
}

async function fetchLive() {
  const [subXml, playlistIds] = await Promise.all([
    getText(SUBSTACK_FEED),
    playlistVideoIds(VIDEOS_PLAYLIST_ID),
  ]);
  // Todos os itens da playlist, sem filtro, do episódio 20 pro 1.
  const videos = await Promise.all([...playlistIds].map((id) => videoInfo(id)));
  videos.sort((a, b) => episodeNumber(b.title) - episodeNumber(a.title));
  return { videos, posts: parseSubstack(subXml) };
}

async function main() {
  let data;
  try {
    data = await fetchLive();
  } catch (err) {
    console.warn(`AVISO: busca ao vivo falhou (${err.message}). Usando data/snapshot.json.`);
    data = JSON.parse(await readFile(SNAPSHOT, "utf8"));
  }
  const { videos, posts } = data;
  if (process.argv.includes("--save-snapshot")) {
    await mkdir(dirname(SNAPSHOT), { recursive: true });
    await writeFile(SNAPSHOT, JSON.stringify({ savedAt: new Date().toISOString(), videos, posts }, null, 2), "utf8");
    console.log("Snapshot salvo em data/snapshot.json");
  }
  if (!videos.length || !posts.length) throw new Error("Feed veio vazio: não publiquei nada.");

  const builtAt = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  await mkdir(DIST, { recursive: true });
  await writeFile(join(DIST, "index.html"), renderPage({ videos, posts, builtAt }), "utf8");
  await copyFile(join(ROOT, "src", "styles.css"), join(DIST, "styles.css"));
  await copyFile(join(ROOT, "CNAME"), join(DIST, "CNAME")).catch(() => {});
  console.log(`OK: ${videos.length} vídeos, ${posts.length} posts -> dist/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
