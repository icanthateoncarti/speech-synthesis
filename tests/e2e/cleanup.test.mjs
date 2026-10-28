import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { startServer, launch } from "./harness.mjs";

let server, browser, page, pdf;
before(async () => {
  server = await startServer(); ({ browser, page } = await launch());
  pdf = path.join(await mkdtemp(path.join(os.tmpdir(), 'speech-cleanup-')), 'cours.pdf');
  const generator = await browser.newPage();
  await generator.setContent(`<style>@page{size:600px 800px;margin:0}body{margin:0;font:16px Arial}.sheet{height:800px;position:relative;break-after:page;padding:24px;box-sizing:border-box}.sheet:last-child{break-after:auto}h1{font-size:22px}footer{position:absolute;bottom:20px}</style>${[1,2,3].map((n) => `<section class="sheet"><header>Cours programmation — EPHEC 2025/2026</header><h1>Chapitre ${n}</h1><p style="margin-top:100px">Une explication importante du cours numéro ${n}.</p><footer>Page ${n} / 3</footer></section>`).join('')}`);
  await generator.pdf({ path: pdf, preferCSSPageSize: true, tagged: true }); await generator.close();
});
after(async () => { await browser?.close(); await server?.close(); });

test("PDF : aperçu des parasites, suppression choisie, chapitres préservés, restauration et mobile", { timeout: 90_000 }, async () => {
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(server.url); await page.waitForSelector('#key-speak[aria-pressed="false"]');
  await (await page.$('#pdf-input')).uploadFile(pdf);
  await page.waitForFunction(() => document.querySelector('#screen').value.includes('Chapitre 3'));
  const original = await page.$eval('#screen', el => el.value);
  assert.ok(original.includes('EPHEC'));
  await page.click('#cleanup-open');
  await page.waitForFunction(() => document.querySelector('#cleanup-dialog').open);
  const suggestions = await page.$eval('#cleanup-list', el => el.textContent);
  assert.ok(suggestions.includes('EPHEC'));
  assert.ok(suggestions.includes('Numéros de page'));
  assert.ok(!suggestions.includes('Chapitre'));
  assert.equal(await page.$eval('#screen', el => el.value), original, 'pas de suppression avant validation');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'cleanup-open');
  await page.click('#cleanup-open'); await page.click('#cleanup-apply');
  await page.waitForFunction(() => !document.querySelector('#screen').hasAttribute('data-typing') && !document.querySelector('#screen').value.includes('EPHEC'));
  const cleaned = await page.$eval('#screen', el => el.value);
  for (const n of [1,2,3]) assert.ok(cleaned.includes(`Chapitre ${n}`));
  assert.ok(cleaned.includes('explication importante'));
  assert.ok(!cleaned.includes('Page 1 / 3'));
  assert.equal(await page.$eval('#cleanup-open', el => el.textContent), 'NETTOYÉ');
  await page.click('#cleanup-open'); await page.click('#cleanup-restore');
  await page.waitForFunction((value) => document.querySelector('#screen').value === value, {}, original);
  await page.click('#key-clear');
  assert.equal(await page.$eval('#cleanup-open', el => el.hidden), true);
});
