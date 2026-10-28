// Construit le site avant publication :
// 1. empreinte de version dans index.html (voir stamp-version.mjs) ;
// 2. une page par usage, générée depuis index.html (même machine, autres textes) ;
// 3. sitemap.xml.
// Usage : node scripts/build-pages.mjs   (npm run build)
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { HOME, PAGES, PUBLIC_PAGES } from "./pages.mjs";
import { SITE, absolute, pagePath, markdownPath } from "./site.mjs";
import { generatedAiFiles } from "./ai-pages.mjs";
import { ROOT, computeVersion, localModules, stamp } from "./stamp-version.mjs";
import { offlineWorker } from "./offline.mjs";

const escapeHtml = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function replaceOnce(html, pattern, replacement) {
  const matches = html.match(new RegExp(pattern.source, "g")) ?? [];
  if (matches.length !== 1) throw new Error(`index.html : ${matches.length} correspondance(s) pour ${pattern}`);
  return html.replace(pattern, () => replacement);
}

function faqJsonLd(faq) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })),
  };
  return `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n  </script>`;
}

function faqSection(faq) {
  const items = faq.map(([question, answer]) => `    <details>
      <summary>${escapeHtml(question)}</summary>
      <p class="answer">${escapeHtml(answer)}</p>
    </details>`).join("\n");
  return `<section class="faq" id="faq" aria-labelledby="faq-title">
    <h2 id="faq-title">Avant d’appuyer sur lecture</h2>
${items}
  </section>`;
}

function examplesSection(examples) {
  const items = examples.map(([label, text]) => `    <article class="example">
      <h3>${escapeHtml(label)}</h3>
      <blockquote>${escapeHtml(text)}</blockquote>
      <button type="button" data-sample="${escapeHtml(text)}">Essayer ce texte</button>
    </article>`).join("\n");
  return `<section class="examples" aria-labelledby="examples-title">
    <h2 id="examples-title">Exemples de textes</h2>
${items}
  </section>

  `;
}

function guideSection(guide) {
  return `<section class="guide" aria-labelledby="guide-title">
    <h2 id="guide-title">${escapeHtml(guide.title)}</h2>
    <ol class="steps">
${guide.steps.map((step) => `      <li>${escapeHtml(step)}</li>`).join("\n")}
    </ol>
    <h3>${escapeHtml(guide.whyTitle)}</h3>
    <p>${escapeHtml(guide.why)}</p>
  </section>`;
}

export function renderPage(home, page) {
  const url = absolute(pagePath(page));
  let html = home.replace(/<section class="examples"[\s\S]*?<\/section>\s*/g, "");
  html = replaceOnce(html, /<title>[^<]*<\/title>/, `<title>${escapeHtml(page.title)}</title>`);
  html = replaceOnce(html, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${escapeHtml(page.description)}">`);
  html = replaceOnce(html, /<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${escapeHtml(page.description)}">`);
  html = replaceOnce(html, /<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${escapeHtml(page.title)}">`);
  html = replaceOnce(html, /<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`);
  html = replaceOnce(html, /<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
  html = replaceOnce(html, /<h1 class="model" id="model">[^<]*<\/h1>/, `<h1 class="model" id="model">${escapeHtml(page.h1)}</h1>`);
  html = replaceOnce(html, /<script type="application\/ld\+json">\s*\{\s*"@context": "https:\/\/schema\.org",\s*"@type": "FAQPage"[\s\S]*?<\/script>/, faqJsonLd(page.faq));
  html = replaceOnce(html, /<section class="guide"[\s\S]*?<\/section>/, (page.examples ? examplesSection(page.examples) : "") + guideSection(page.guide));
  html = replaceOnce(html, /<section class="faq"[\s\S]*?<\/section>/, faqSection(page.faq));
  html = replaceOnce(html, /<nav class="usages"[\s\S]*?<\/nav>/, `<nav class="usages" aria-label="Autres usages">\n${PUBLIC_PAGES.map((other) => `      <a href="${pagePath(other)}"${other.slug === page.slug ? ' aria-current="page"' : ""}>${escapeHtml(other.h1)}</a>`).join("\n")}\n    </nav>`);
  html = replaceOnce(html, /<meta property="og:site_name" content="[^"]*">/, `<meta property="og:site_name" content="${escapeHtml(SITE.name)}">`);
  html = html.replace(/href="https:\/\/github\.com\/[^"/]+\/[^"/]+\/issues"/, `href="${escapeHtml(SITE.contact)}"`);
  // Regénérés, jamais accumulés lors d’un second build.
  html = html.replace(/^  <(?:meta name="ai-summary"|link rel="(?:alternate|describedby)")[^>]*>\n/gm, "");
  const signals = [
    `<meta name="ai-summary" content="${escapeHtml(page.description)}">`,
    `<link rel="alternate" type="text/markdown" href="${absolute(markdownPath(page))}">`,
    ...["llms.txt", "llms-full.txt", "ai.txt"].map((name) => `<link rel="describedby" type="text/plain" href="${absolute(name)}">`),
  ].map((line) => `  ${line}`).join("\n");
  html = html.replace("</head>", `${signals}\n</head>`);
  html = html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (block, json) => {
    const data = JSON.parse(json);
    if (!["WebSite", "WebApplication"].includes(data["@type"])) return block;
    data.name = SITE.name;
    data.url = SITE.url;
    data.description = HOME.description;
    if (data["@type"] === "WebSite") {
      data.alternateName = SITE.alternateName;
      data.image = SITE.logo;
    }
    return `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n  </script>`;
  });
  return html;
}

export function sitemap(date) {
  const urls = PUBLIC_PAGES.map((page) => absolute(pagePath(page)));
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>\n    <loc>${u}</loc>\n    <lastmod>${date}</lastmod>\n  </url>`).join("\n")}
</urlset>
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const index = path.join(ROOT, "index.html");
  const version = await computeVersion();
  const home = stamp(renderPage(await readFile(index, "utf8"), HOME), version, await localModules());
  await writeFile(index, home);
  for (const page of PAGES) {
    await mkdir(path.join(ROOT, page.slug), { recursive: true });
    await writeFile(path.join(ROOT, page.slug, "index.html"), renderPage(home, page));
  }
  const date = new Date().toISOString().slice(0, 10);
  await writeFile(path.join(ROOT, "sitemap.xml"), sitemap(date));
  for (const [filename, content] of generatedAiFiles(date)) await writeFile(path.join(ROOT, filename), content);
  await writeFile(path.join(ROOT, "sw.js"), await offlineWorker(ROOT, version));
  console.log(`version ${version} · accueil + ${PAGES.length} pages · sitemap · Markdown et découverte IA`);
}
