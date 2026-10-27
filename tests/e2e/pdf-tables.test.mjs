import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { startServer, launch } from "./harness.mjs";

let server, browser, page, pdf;
before(async () => {
  server = await startServer();
  ({ browser, page } = await launch());
  const dir = await mkdtemp(path.join(os.tmpdir(), "speech-table-"));
  pdf = path.join(dir, "tableau.pdf");
  const generator = await browser.newPage();
  await generator.setContent(`<style>body{font:14px Arial}h1{font-size:26px}td,th{padding:6px;width:130px}table{border-collapse:collapse}td,th{border:1px solid}</style>
    <h1>Chapitre 1 : Les cours</h1><p>Voici le programme.</p>
    <table><thead><tr><th>Cours</th><th>Objectif</th></tr></thead><tbody>
    <tr><td>Économie</td><td>Comprendre les échanges entre les entreprises.</td></tr>
    <tr><td>Anglais</td><td>Parler avec les clients.</td></tr></tbody></table>
    <p>Fin du programme.</p>`);
  await generator.pdf({ path: pdf, tagged: true });
  await generator.close();
});
after(async () => { await browser?.close(); await server?.close(); });

test("vrai PDF : cellules multilignes lues ensemble, en-têtes rappelés et positions de surlignage exactes", { timeout: 60_000 }, async () => {
  await page.goto(server.url);
  await page.waitForSelector('#key-speak[aria-pressed="false"]');
  await (await page.$("#pdf-input")).uploadFile(pdf);
  await page.waitForFunction(() => document.querySelector("#screen").value.includes("Fin du programme."));
  const text = await page.$eval("#screen", (el) => el.value);
  assert.ok(text.includes("Cours : Économie ; Objectif : Comprendre les échanges entre les entreprises."));
  assert.ok(text.includes("Cours : Anglais ; Objectif : Parler avec les clients."));
  const result = await page.evaluate(async (base64) => {
    const { extractPdfDocument, openPdfForView } = await import('/src/pdf.js');
    const file = new File([Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))], 'tableau.pdf', { type: 'application/pdf' });
    const doc = await extractPdfDocument(file);
    const { task } = await openPdfForView(file); const pdf = await task.promise;
    const items = (await (await pdf.getPage(1)).getTextContent()).items.filter((item) => typeof item.str === 'string');
    const map = doc.pageMaps[0], mismatches = [];
    items.forEach((item, i) => {
      if (!item.str.trim()) return;
      const start = map.spans[2 * i], end = map.spans[2 * i + 1];
      const mapped = start < 0 ? null : doc.text.slice(map.offset + map.map[start], map.offset + map.map[end]);
      if (mapped !== item.str.trim()) mismatches.push({ expected: item.str, mapped });
    });
    await task.destroy();
    return { mismatches, chapters: doc.chapters };
  }, (await readFile(pdf)).toString("base64"));
  assert.deepEqual(result.mismatches, []);
  assert.ok(result.chapters.some((chapter) => chapter.title.includes('Chapitre 1')));
  await page.click('#pages-open');
  await page.waitForSelector('.textLayer span[data-i]');
  const clickWord = async (word) => {
    const target = await page.evaluateHandle((word) => [...document.querySelectorAll('.textLayer span[data-i]')].find((el) => el.textContent.trim() === word), word);
    assert.ok(target.asElement(), word);
    await target.asElement().click();
    await target.dispose();
  };
  await clickWord('Économie'); await clickWord('Économie');
  await page.click('#pages-done');
  await page.waitForFunction(() => document.querySelector('#screen').value === 'Économie');
});
