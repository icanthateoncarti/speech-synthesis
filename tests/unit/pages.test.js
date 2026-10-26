import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PAGES } from "../../scripts/pages.mjs";
import { renderPage, sitemap } from "../../scripts/build-pages.mjs";

test("pages par usage à jour : régénérées depuis index.html actuel (npm run build)", async () => {
  const home = await readFile(new URL("../../index.html", import.meta.url), "utf8");
  for (const page of PAGES) {
    const file = await readFile(new URL(`../../${page.slug}/index.html`, import.meta.url), "utf8");
    assert.ok(file === renderPage(home, page), `${page.slug}/index.html périmé : lance npm run build`);
  }
});

test("sitemap : accueil et toutes les pages", async () => {
  const file = await readFile(new URL("../../sitemap.xml", import.meta.url), "utf8");
  const date = /<lastmod>([^<]+)<\/lastmod>/.exec(file)[1];
  assert.equal(file, sitemap(date));
  assert.equal((file.match(/<loc>/g) ?? []).length, PAGES.length + 1);
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
