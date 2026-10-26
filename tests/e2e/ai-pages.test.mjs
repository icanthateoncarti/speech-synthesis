import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startServer, launch } from "./harness.mjs";
import { PUBLIC_PAGES } from "../../scripts/pages.mjs";
import { absolute, pagePath, markdownPath } from "../../scripts/site.mjs";
import { escapeMarkdown } from "../../scripts/ai-pages.mjs";

let server, browser, page;
before(async () => {
  server = await startServer();
  ({ browser, page } = await launch());
});
after(async () => { await browser?.close(); await server?.close(); });
const url = (pathname) => new URL(pathname, server.url).href;

test("les cinq pages annoncent un Markdown accessible contenant le même guide et la même FAQ", { timeout: 60_000 }, async () => {
  for (const entry of PUBLIC_PAGES) {
    await page.goto(url(pagePath(entry)), { waitUntil: "load" });
    const signals = await page.evaluate(() => ({
      summary: document.querySelector('meta[name="ai-summary"]')?.content,
      alternate: document.querySelector('link[rel="alternate"][type="text/markdown"]')?.href,
      described: [...document.querySelectorAll('link[rel="describedby"]')].map((el) => el.href),
      guide: [...document.querySelectorAll('.guide h2, .guide h3, .guide li, .guide p')].map((el) => el.textContent.trim()),
      faq: [...document.querySelectorAll('#faq summary, #faq .answer')].map((el) => el.textContent.trim()),
      examples: [...document.querySelectorAll('.example h3, .example blockquote')].map((el) => el.textContent.trim()),
    }));
    assert.equal(signals.summary, entry.description);
    assert.equal(signals.alternate, absolute(markdownPath(entry)));
    assert.deepEqual(signals.described, ["/llms.txt", "/llms-full.txt", "/ai.txt"].map(absolute));
    const response = await fetch(url(markdownPath(entry)));
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /^text\/(plain|markdown)/);
    const markdown = await response.text();
    assert.ok(!markdown.startsWith("<!doctype"));
    for (const text of [...signals.guide, ...signals.faq, ...signals.examples]) assert.ok(markdown.includes(escapeMarkdown(text)), text);
  }
});

test("découverte statique : fichiers accessibles, HTML préservé quel que soit Accept, vrais 404", async () => {
  for (const pathname of ["/llms.txt", "/llms-full.txt", "/ai.txt", "/robots.txt", "/markdown-catalog.json", "/index.md"]) {
    const r = await fetch(url(pathname));
    assert.equal(r.status, 200, pathname);
    assert.ok((await r.text()).length > 0);
    const head = await fetch(url(pathname), { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), "");
  }
  for (const accept of ["*/*", "text/markdown", "text/html", "text/markdown;q=1, text/html;q=0.5"]) {
    const r = await fetch(url("/"), { headers: { Accept: accept } });
    assert.equal(r.status, 200);
    assert.match(r.headers.get("content-type"), /^text\/html/);
  }
  for (const pathname of ["/does-not-exist.md", "/admin.md", "/api/md/index", "/dashboard.md", "/auth.md"]) assert.equal((await fetch(url(pathname))).status, 404, pathname);
  const catalog = await (await fetch(url("/markdown-catalog.json"))).json();
  assert.equal(catalog.length, PUBLIC_PAGES.length);
});

test("les textes saisis dans la radio ne figurent jamais dans les fichiers de découverte", async () => {
  await page.goto(url("/"), { waitUntil: "load" });
  await page.waitForSelector('#key-speak[aria-pressed="false"]');
  const secret = "COURS_PERSONNEL_TEST_938264";
  await page.$eval("#screen", (el, value) => { el.value = value; el.dispatchEvent(new Event("input", { bubbles: true })); }, secret);
  for (const pathname of ["/index.md", "/llms.txt", "/llms-full.txt", "/ai.txt", "/markdown-catalog.json"]) {
    const content = await page.evaluate(async (pathname) => (await fetch(pathname)).text(), pathname);
    assert.ok(!content.includes(secret), pathname);
  }
});
