import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startServer, launch } from "./harness.mjs";
import { PAGES } from "../../scripts/pages.mjs";

let server, browser, page;
const errors = [];
before(async () => {
  server = await startServer();
  ({ browser, page } = await launch({ viewport: { width: 1340, height: 900 } }));
  page.on("pageerror", (err) => errors.push(err.message));
});
after(async () => { await browser?.close(); await server?.close(); });

for (const usage of PAGES) {
  test(`/${usage.slug}/ : titre, canonique, h1 gravé, FAQ identique aux données structurées, rien d'autre au premier écran`, { timeout: 60_000 }, async () => {
    await page.goto(`${server.url}/${usage.slug}/`);
    await page.waitForSelector('#key-speak[aria-pressed="false"]');
    assert.equal(await page.title(), usage.title);
    const r = await page.evaluate(() => {
      const visibleTexts = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const text = n.textContent.trim(), el = n.parentElement;
        if (!text || el.closest("[hidden], script, template")) continue;
        const box = el.getBoundingClientRect();
        if (box.width && box.height && box.top < innerHeight && box.bottom > 0 && getComputedStyle(el).visibility !== "hidden") visibleTexts.push(text);
      }
      const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent)).find((d) => d["@type"] === "FAQPage");
      return {
        canonical: document.querySelector('link[rel="canonical"]').href,
        h1: [...document.querySelectorAll("h1")].map((h) => h.textContent),
        current: document.querySelector('.usages [aria-current="page"]')?.getAttribute("href"),
        ld: ld.mainEntity.map((q) => [q.name, q.acceptedAnswer.text]),
        html: [...document.querySelectorAll("#faq details")].map((d) => [d.querySelector("summary").textContent, d.querySelector(".answer").textContent]),
        examplesTop: document.querySelector(".examples")?.getBoundingClientRect().top ?? null,
        guide: { top: document.querySelector(".guide").getBoundingClientRect().top, steps: document.querySelectorAll(".guide .steps li").length, title: document.querySelector("#guide-title").textContent },
        visibleTexts,
      };
    });
    assert.equal(r.canonical, `https://speechsynthe.si/${usage.slug}/`);
    assert.deepEqual(r.h1, [usage.h1]);
    assert.equal(r.current, `/${usage.slug}/`);
    assert.deepEqual(r.ld, usage.faq);
    assert.deepEqual(r.html, usage.faq);
    if (r.examplesTop !== null) assert.ok(r.examplesTop >= 900, "les exemples restent sous la machine");
    assert.ok(r.guide.top >= 900, "le guide reste sous la machine");
    assert.equal(r.guide.steps, 3);
    assert.equal(r.guide.title, usage.guide.title);
    for (const text of r.visibleTexts) assert.ok(!/Questions fréquentes|Exemples|Comment |Pourquoi /.test(text), `texte au premier écran : ${text}`);
  });
}

test("un exemple se charge dans la machine, prêt à être lu", { timeout: 60_000 }, async () => {
  const usage = PAGES.find((p) => p.examples);
  await page.goto(`${server.url}/${usage.slug}/`);
  await page.waitForSelector('#key-speak[aria-pressed="false"]');
  await page.click(".example button");
  assert.equal(await page.$eval("#screen", (el) => el.value), usage.examples[0][1]);
  assert.equal(await page.$eval("#transport", (el) => el.hidden), false);
  assert.equal(await page.evaluate(() => document.activeElement.id), "screen");
  assert.deepEqual(errors, []);
});
