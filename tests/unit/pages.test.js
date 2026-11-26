import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PAGES, PUBLIC_PAGES } from "../../scripts/pages.mjs";
import { renderPage, sitemap } from "../../scripts/build-pages.mjs";

test("pages par usage à jour : régénérées depuis index.html actuel (npm run build)", async () => {
  const home = await readFile(new URL("../../index.html", import.meta.url), "utf8");
  for (const page of PUBLIC_PAGES.filter(page => page.slug)) {
    const file = await readFile(new URL(`../../${page.slug}/index.html`, import.meta.url), "utf8");
    assert.ok(file === renderPage(home, page), `${page.slug}/index.html périmé : lance npm run build`);
  }
});

test("touche EXEMPLE : sur l'accueil et les pages sans exemples de textes seulement", async () => {
  const home = await readFile(new URL("../../index.html", import.meta.url), "utf8");
  assert.match(home, /id="key-example"[^\n]*data-example="\/assets\/guides\/cours-exemple-moyenne-mediane\.pdf"/);
  for (const page of PUBLIC_PAGES.filter(page => page.slug && page.kind !== "article")) {
    assert.equal(renderPage(home, page).includes('id="key-example"'), !page.examples, page.slug);
  }
});

test("sitemap : accueil et toutes les pages", async () => {
  const file = await readFile(new URL("../../sitemap.xml", import.meta.url), "utf8");
  const date = /<lastmod>([^<]+)<\/lastmod>/.exec(file)[1];
  assert.equal(file, sitemap(date));
  assert.equal((file.match(/<loc>/g) ?? []).length, PUBLIC_PAGES.length);
});

test("sitemap : un guide garde sa date de mise à jour, pas celle du build", () => {
  const file = sitemap("2099-01-01");
  for (const page of PUBLIC_PAGES.filter((page) => page.kind === "article")) {
    assert.match(file, new RegExp(`/${page.slug}/</loc>\\n    <lastmod>${page.updated}</lastmod>`), page.slug);
  }
  assert.match(file, /speechsynthe\.si\/<\/loc>\n    <lastmod>2099-01-01<\/lastmod>/);
});

test("contenu des pages : titres courts, réponses de 1 à 4 phrases, exemples sans balise", () => {
  for (const page of PAGES) {
    assert.ok(page.title.length <= 65, `${page.slug} : titre de ${page.title.length} caractères`);
    assert.ok(page.description.length <= 200, `${page.slug} : description trop longue`);
    for (const [question, answer] of page.faq) {
      const sentences = answer.split(/(?<=[.!?])\s+/).length;
      assert.ok(sentences >= 1 && sentences <= 4, `${page.slug} « ${question} » : ${sentences} phrases`);
    }
    for (const [, text] of page.examples ?? []) assert.ok(!/[<>"]/.test(text));
    assert.equal(page.guide.steps.length, 3, `${page.slug} : guide en 3 étapes`);
    const sentences = page.guide.why.split(/(?<=[.!?])\s+/).length;
    assert.ok(sentences >= 1 && sentences <= 4, `${page.slug} : « ${page.guide.whyTitle} » en ${sentences} phrases`);
  }
});

test("guide texte anglais : le tableau des exemples dit ce que fait vraiment la détection de langue", async () => {
  const { ARTICLES } = await import("../../scripts/articles.mjs");
  const { detectLanguage } = await import("../../src/text.js");
  const guide = ARTICLES.find((page) => page.slug === "texte-anglais-voix-haute");
  const rows = guide.sections.find((section) => section.table).table.rows;
  assert.ok(rows.length >= 4);
  for (const [phrase, voice] of rows) assert.equal(detectLanguage(phrase), voice === "Anglaise" ? "en" : "fr", phrase);
});

// /pdf-en-audio/ reprenait la FAQ et le mode d’emploi de l’accueil mot pour mot (87 % du texte en commun) :
// Google l’a explorée sans l’indexer. Ses réponses doivent rester propres au PDF.
test("pdf-en-audio : aucune réponse ni étape recopiée de l’accueil", async () => {
  const { HOME } = await import("../../scripts/pages.mjs");
  const page = PAGES.find((p) => p.slug === "pdf-en-audio");
  const home = new Set([...HOME.faq, ...HOME.manual].map(([, text]) => text));
  for (const [title, text] of [...page.faq, ...page.manual]) assert.ok(!home.has(text), title);
  const homeTitles = new Set([...HOME.faq, ...HOME.manual].map(([title]) => title));
  assert.ok([...page.faq, ...page.manual].filter(([title]) => homeTitles.has(title)).length <= 1);
});

test("guide dyslexie : les sources sont citées avec leur lien, en HTML comme en Markdown", async () => {
  const { ARTICLES } = await import("../../scripts/articles.mjs");
  const { renderArticle } = await import("../../scripts/article-page.mjs");
  const { renderMarkdown } = await import("../../scripts/ai-pages.mjs");
  const guide = ARTICLES.find((page) => page.slug === "outil-lecture-dyslexie");
  assert.ok(guide.sources.length >= 3);
  const html = renderArticle(guide, "test"), markdown = renderMarkdown(guide, "2026-11-21");
  for (const source of guide.sources) {
    assert.match(source.href, /^https:\/\//);
    assert.ok(html.includes(`<a href="${source.href}" rel="noopener">`), source.href);
    assert.ok(markdown.includes(`](${source.href})`), source.href);
  }
  // Les guides sans sources n'affichent pas de bloc vide.
  assert.ok(!renderArticle(ARTICLES.find((page) => !page.sources), "test").includes('aria-label="Sources"'));
});

test("liens dans les phrases : un vrai <a> vers une page publique, texte brut dans le Markdown", async () => {
  const { renderArticle } = await import("../../scripts/article-page.mjs");
  const { renderMarkdown } = await import("../../scripts/ai-pages.mjs");
  const { pagePath } = await import("../../scripts/site.mjs");
  const home = await readFile(new URL("../../index.html", import.meta.url), "utf8");
  const paths = new Set(PUBLIC_PAGES.map(pagePath));
  const linkPattern = /\[([^\]]+)\]\((\/[^)]*)\)/g;
  let count = 0;
  for (const page of PUBLIC_PAGES.filter(page => page.slug)) {
    // Seuls les paragraphes des guides et les réponses du mode d'emploi savent afficher un lien.
    const linkable = page.kind === "article" ? page.sections.flatMap(s => s.paragraphs) : (page.manual ?? []).map(([, text]) => text);
    const other = page.kind === "article" ? [page.title, page.description, page.intro, page.premise, ...page.sections.map(s => s.title)] : [page.title, page.description, ...page.guide.steps, page.guide.why, ...page.faq.flat(), ...(page.manual ?? []).map(([title]) => title)];
    for (const text of other) assert.ok(!linkPattern.test(text), `lien non rendu ici : ${text}`), linkPattern.lastIndex = 0;
    const html = page.kind === "article" ? renderArticle(page, "test") : renderPage(home, page);
    const markdown = renderMarkdown(page, "2026-11-26");
    for (const text of linkable) for (const [source, label, href] of text.matchAll(linkPattern)) {
      count++;
      assert.ok(paths.has(href), `${page.slug} : ${href} n'est pas une page publique`);
      assert.ok(html.includes(`<a href="${href}">${label}</a>`), `${page.slug} : ${href}`);
      assert.ok(!html.includes(source) && !markdown.includes(`](${href})`), `${page.slug} : syntaxe visible`);
    }
  }
  assert.ok(count >= 3);
});
