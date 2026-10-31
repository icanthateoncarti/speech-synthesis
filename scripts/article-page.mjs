import { SITE, absolute, pagePath, markdownPath } from "./site.mjs";
import { contentSecurityPolicy } from "./stamp-version.mjs";
const esc = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const json = (data) => JSON.stringify(data, null, 2).replace(/</g, "\\u003c");
export function renderArticle(page, version) {
  const url = absolute(pagePath(page));
  const displayDate = new Intl.DateTimeFormat("fr-BE", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(page.updated));
  const figure = (f) => `<figure><a href="${f.src}" aria-label="Agrandir la capture"><img src="${f.src}" width="${f.width}" height="${f.height}" alt="${esc(f.alt)}" loading="lazy" decoding="async"></a><figcaption>${esc(f.caption)}</figcaption></figure>`;
  const images = page.sections.filter(s => s.figure).map(s => absolute(s.figure.src));
  const schema = { "@context": "https://schema.org", "@type": "Article", headline: page.h1, description: page.description, mainEntityOfPage: url, datePublished: page.published, dateModified: page.updated, inLanguage: "fr", author: { "@type": "Organization", name: SITE.name, url: SITE.url }, image: images };
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="${esc(contentSecurityPolicy())}">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(page.title)}</title>
  <meta name="description" content="${esc(page.description)}">
  <meta name="ai-summary" content="${esc(page.description)}">
  <link rel="canonical" href="${url}">
  <link rel="alternate" type="text/markdown" href="${absolute(markdownPath(page))}">
${["llms.txt", "llms-full.txt", "ai.txt"].map(name => `  <link rel="describedby" type="text/plain" href="${absolute(name)}">`).join("\n")}
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="${SITE.name}">
  <meta property="og:title" content="${esc(page.title)}">
  <meta property="og:description" content="${esc(page.description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${images[0] ?? absolute("/assets/guides/radio-cours.jpg")}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/styles/machine.css?v=${version}">
  <link rel="stylesheet" href="/styles/article.css?v=${version}">
  <script type="module" src="/src/article.js?v=${version}"></script>
  <script type="application/ld+json">
${json(schema)}
  </script>
</head>
<body class="editorial">
  <a class="article-skip" href="#article">Aller au guide</a>
  <header class="article-top"><a href="/" class="article-brand">speechsynthe.si</a><a href="/" class="article-home">Ouvrir la radio <span aria-hidden="true">↗</span></a></header>
  <main id="article" class="article-body">
    <article>
      <header class="article-heading"><p class="article-kicker">LE GUIDE ÉTUDIANT</p><h1>${esc(page.h1)}</h1><p class="article-date">Par speechsynthe.si · <time datetime="${page.updated}">${displayDate}</time></p><p class="article-intro">${esc(page.intro)}</p></header>
      <p>${esc(page.premise)}</p>
${page.sample ? `      <aside class="article-sample"><h2>Essaie avec un petit cours</h2><p>${esc(page.sample.description)}</p><a href="${page.sample.href}" download>${esc(page.sample.label)} <span aria-hidden="true">↓</span></a></aside>\n` : ""}      <nav class="article-toc" aria-label="Dans ce guide"><h2>Du fichier au MP3</h2><ol>${page.sections.map(s => `<li><a href="#${s.id}">${esc(s.title.replace(/^\d+\. /, ""))}</a></li>`).join("")}</ol></nav>
${page.sections.map(s => `      <section id="${s.id}"><h2>${esc(s.title)}</h2>${s.paragraphs.map(p => `<p>${esc(p)}</p>`).join("")}${s.figure ? figure(s.figure) : ""}</section>`).join("\n")}
${page.related?.length ? `      <nav class="article-related" aria-label="À lire aussi"><h2>À lire aussi</h2><ul>${page.related.map(r => `<li><a href="${r.href}">${esc(r.label)}</a> : ${esc(r.text)}</li>`).join("")}</ul></nav>\n` : ""}      <aside class="article-cta"><h2>Commence par quelques pages</h2><p>Importe un passage, écoute le résultat et garde les réglages qui te conviennent.</p><a class="article-button" href="/">Écouter mon cours <span aria-hidden="true">→</span></a><a href="/#mode-emploi">Consulter le mode d’emploi</a></aside>
    </article>
  </main>
  <footer class="article-footer"><a href="/pdf-en-audio/">Lire un PDF à voix haute</a><a href="/#faq">Questions fréquentes</a><a href="${SITE.contact}">Signaler un problème</a></footer>
</body>
</html>
`;
}
