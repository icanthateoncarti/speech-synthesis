import { test } from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { HOME, PAGES, PUBLIC_PAGES } from "../../scripts/pages.mjs";
import { SITE, SEARCH_BOTS, TRAINING_BOTS, BLOCKED_BOTS, EXCLUDED_PATHS, absolute, pagePath, markdownPath } from "../../scripts/site.mjs";
import { generatedAiFiles, listMarkdownRoutes, renderMarkdown, renderRobots, escapeMarkdown } from "../../scripts/ai-pages.mjs";
import { renderPage } from "../../scripts/build-pages.mjs";
import { ROOT } from "../../scripts/stamp-version.mjs";

const read = (file) => readFile(path.join(ROOT, file), "utf8");
const SKIPPED_HTML = new Map([
  ["google47078ed0a8b5dade.html", "Fichier de vérification Google, pas une page éditoriale"],
  ["tests/e2e/fixtures/player.html", "Banc de test du lecteur audio"],
  ["tests/e2e/fixtures/tts.html", "Banc de test de la synthèse vocale"],
]);

async function htmlFiles(dir = ROOT) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    // Local reports and auditions under logs/ are ignored by Git, never published.
    if (entry.name.startsWith(".") || entry.name === "node_modules" || (dir === ROOT && entry.name === "logs")) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await htmlFiles(file));
    else if (entry.name.endsWith(".html")) out.push(path.relative(ROOT, file));
  }
  return out;
}

test("chaque page HTML a une version Markdown, sauf les exclusions documentées", async () => {
  const registered = PUBLIC_PAGES.map((page) => page.slug ? `${page.slug}/index.html` : "index.html");
  const actual = await htmlFiles();
  assert.deepEqual(actual.filter((file) => !SKIPPED_HTML.has(file)).sort(), registered.sort());
  const sitemap = await read("sitemap.xml");
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  assert.deepEqual(urls, listMarkdownRoutes().map((route) => absolute(route.html)));
  assert.ok(!sitemap.includes(".md"));
  for (const file of SKIPPED_HTML.keys()) assert.ok(actual.includes(file));
});

test("Markdown, catalogue, politique et robots sont à jour et le build est idempotent", async () => {
  const full = await read("llms-full.txt");
  const date = /^Generated: (\d{4}-\d{2}-\d{2})$/m.exec(full)?.[1];
  assert.ok(date);
  for (const [filename, content] of generatedAiFiles(date)) assert.equal(await read(filename), content, filename);
  const home = await read("index.html");
  assert.equal(renderPage(home, HOME), home, "accueil généré depuis HOME");
  for (const page of PAGES) {
    const rendered = renderPage(home, page);
    assert.equal(renderPage(rendered, page), rendered, "ne pas accumuler les exemples ou les liens IA");
  }
});

test("le même contenu source alimente le Markdown, le recueil et les données structurées", async () => {
  const files = generatedAiFiles("2026-10-26");
  const template = await read("index.html");
  for (const page of PUBLIC_PAGES) {
    const md = files.get(markdownPath(page).slice(1));
    assert.ok(files.get("llms-full.txt").includes(md));
    assert.ok(md.startsWith(`# ${page.title}\n`));
    assert.ok(md.includes(`Canonical: ${absolute(pagePath(page))}`));
    for (const text of [page.description, ...page.guide.steps, page.guide.why, ...page.faq.flat(), ...(page.manual ?? []).flat(), ...(page.examples ?? []).flat()]) assert.ok(md.includes(escapeMarkdown(text)), text);
    const html = renderPage(template, page);
    const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    assert.deepEqual(ld.find((data) => data["@type"] === "FAQPage").mainEntity.map((q) => [q.name, q.acceptedAnswer.text]), page.faq);
    const website = ld.find((data) => data["@type"] === "WebSite");
    assert.equal(website.name, SITE.name);
    assert.equal(website.url, SITE.url);
    assert.equal(website.description, HOME.description);
    assert.equal((html.match(/name="ai-summary"/g) ?? []).length, 1);
    assert.ok(html.includes(`href="${absolute(markdownPath(page))}"`));
    for (const [, url] of md.matchAll(/\]\(([^)]+)\)/g)) assert.ok(url.startsWith("https://"));
    assert.ok(!md.includes("<script"));
    assert.ok(!md.includes("Signaler un bug sur GitHub"), "footer exclu");
  }
  // Modifier les données suffit ; aucune copie Markdown à éditer.
  const modified = { ...HOME, guide: { ...HOME.guide, why: "Une explication nouvelle." } };
  assert.ok(renderMarkdown(modified, "2026-10-26").includes("Une explication nouvelle."));
  assert.ok(renderPage(template, modified).includes("Une explication nouvelle."));
});

test("politique des robots : décisions explicites et exclusions répétées dans chaque groupe", () => {
  const robots = renderRobots();
  const groups = new Map([...robots.matchAll(/User-agent: ([^\n]+)\n([\s\S]*?)(?=\n\n|$)/g)].map((m) => [m[1], m[2]]));
  for (const bot of ["*", ...SEARCH_BOTS, ...TRAINING_BOTS]) {
    assert.ok(groups.get(bot).includes("Allow: /"), bot);
    for (const pathname of EXCLUDED_PATHS) assert.ok(groups.get(bot).includes(`Disallow: ${pathname}`), `${bot} ${pathname}`);
    assert.ok(!/^Disallow: \/$/m.test(groups.get(bot)), bot);
  }
  for (const bot of BLOCKED_BOTS) assert.equal(groups.get(bot).trim(), "Disallow: /");
  const files = generatedAiFiles("2026-10-26");
  const catalog = JSON.parse(files.get("markdown-catalog.json"));
  assert.deepEqual(catalog.map((entry) => entry.canonical), PUBLIC_PAGES.map((page) => absolute(pagePath(page))));
  for (const filename of files.keys()) assert.ok(!EXCLUDED_PATHS.some((prefix) => `/${filename}`.startsWith(prefix)));
  assert.ok(files.get("ai.txt").includes(SITE.contact));
  assert.ok(files.get("ai.txt").includes("documents importés"));
});
