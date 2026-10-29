import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startServer, launch } from "./harness.mjs";

const QUESTIONS = [
  "Est-ce gratuit, même pour télécharger le MP3 ?",
  "Est-ce que mon cours est résumé ?",
  "Mon document reste-t-il privé ?",
  "Est-ce que ça fonctionne avec un PDF scanné ?",
  "Pourquoi la préparation de l’audio prend-elle du temps ?",
  "Puis-je écouter mon cours sans connexion ?"
];

let server, browser, page;
before(async () => {
  server = await startServer();
  ({ browser, page } = await launch({ viewport: { width: 1340, height: 900 } }));
  await page.goto(`${server.url}/`, { waitUntil: "load" });
});
after(async () => { await browser?.close(); await server?.close(); });

test("FAQ hors du premier écran", async () => {
  const faq = await page.evaluate(() => {
    const s = document.querySelector("#faq");
    if (!s) return null;
    return { top: s.getBoundingClientRect().top + scrollY, items: [...s.querySelectorAll("details")].length };
  });
  assert.ok(faq, "section #faq absente");
  assert.ok(faq.top >= 900, `FAQ trop haute : ${faq.top}`);
  assert.equal(faq.items, QUESTIONS.length);
});

test("JSON-LD FAQPage valide, questions identiques au HTML", async () => {
  const ld = await page.$$eval('script[type="application/ld+json"]', (els) => els.map((e) => e.textContent));
  assert.ok(ld.length >= 1, "pas de JSON-LD");
  const data = ld.map((t) => JSON.parse(t)).find((d) => d["@type"] === "FAQPage");
  assert.ok(data, "pas de FAQPage");
  assert.equal(data["@context"], "https://schema.org");
  assert.equal(data.mainEntity.length, QUESTIONS.length);
  const html = await page.$$eval("#faq details", (ds) => ds.map((d) => ({
    q: d.querySelector("summary").textContent.trim(),
    a: d.querySelector(".answer").textContent.trim().replace(/\s+/g, " "),
  })));
  data.mainEntity.forEach((e, i) => {
    assert.equal(e["@type"], "Question");
    assert.equal(e.name, QUESTIONS[i]);
    assert.equal(e.name, html[i].q);
    assert.equal(e.acceptedAnswer["@type"], "Answer");
    assert.equal(e.acceptedAnswer.text.replace(/\s+/g, " "), html[i].a);
    const sentences = html[i].a.split(/(?<=[.!?])\s+/).length;
    assert.ok(sentences >= 1 && sentences <= 4, `Q${i + 1} : ${sentences} phrases`);
  });
});

test("meta, canonical, og:image accessible", async () => {
  const m = await page.evaluate(() => {
    const g = (s, a) => document.querySelector(s)?.getAttribute(a);
    return {
      desc: g('meta[name="description"]', "content"),
      canonical: g('link[rel="canonical"]', "href"),
      ogTitle: g('meta[property="og:title"]', "content"),
      ogDesc: g('meta[property="og:description"]', "content"),
      ogImage: g('meta[property="og:image"]', "content"),
      ogUrl: g('meta[property="og:url"]', "content"),
      card: g('meta[name="twitter:card"]', "content"),
    };
  });
  assert.ok(m.desc && m.desc.length >= 120 && m.desc.length <= 175, `description ${m.desc?.length}`);
  for (const w of ["texte en audio", "synthèse vocale gratuite", "français", "MP3"]) assert.ok(m.desc.toLowerCase().includes(w.toLowerCase()), w);
  assert.equal(m.canonical, "https://speechsynthe.si/");
  assert.ok(m.ogTitle && m.ogDesc && m.ogUrl);
  assert.equal(m.ogImage, "https://speechsynthe.si/assets/og.png");
  assert.equal(m.card, "summary_large_image");
  const r = await fetch(`${server.url}/assets/og.png`);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("content-type"), "image/png");
  const robots = await (await fetch(`${server.url}/robots.txt`)).text();
  assert.match(robots, /Allow: \//);
  assert.match(robots, /Sitemap: https:\/\/speechsynthe\.si\/sitemap\.xml/);
  const sm = await (await fetch(`${server.url}/sitemap.xml`)).text();
  assert.equal((sm.match(/<loc>/g) || []).length, 5, "accueil + 4 pages par usage");
  assert.match(sm, /<loc>https:\/\/speechsynthe\.si\/<\/loc>/);
});

test("crédits présents", async () => {
  const f = await page.evaluate(() => {
    const el = document.querySelector("footer");
    return el && { text: el.textContent, links: [...el.querySelectorAll("a")].map((a) => a.href) };
  });
  assert.ok(f, "footer absent");
  for (const w of ["CC BY-SA 4.0", "AGPLv3", "Piper"]) assert.ok(f.text.includes(w), w);
  assert.ok(f.links.includes("https://github.com/icanthateoncarti/speech-synthesis"));
});

test("icônes pour Google et les téléphones, nom du site en données structurées", async () => {
  const icons = await page.$$eval('link[rel="icon"], link[rel="apple-touch-icon"]', (els) => els.map((e) => e.getAttribute("href")));
  assert.deepEqual(icons, ["/favicon.ico", "/favicon.svg", "/icon-192.png", "/apple-touch-icon.png"]);
  for (const href of icons) {
    const status = await page.evaluate(async (url) => (await fetch(url)).status, href);
    assert.equal(status, 200, href);
  }
  const ld = await page.$$eval('script[type="application/ld+json"]', (els) => els.map((e) => JSON.parse(e.textContent)));
  assert.equal(ld.find((d) => d["@type"] === "WebSite")?.name, "speechsynthe.si");
});
