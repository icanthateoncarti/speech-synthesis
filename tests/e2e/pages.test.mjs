import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { startServer, launch } from "./harness.mjs";

const FULL = [
  "Chapitre 1 : Le départ",
  "Première phrase du cours. Deuxième phrase à garder. Troisième phrase inutile.",
  "Chapitre 2 : La marche",
  "Quatrième phrase importante. Cinquième phrase finale.",
].join("\n");

let server, browser, page, pdf;
const issues = [];
before(async () => {
  server = await startServer();
  ({ browser, page } = await launch({ viewport: { width: 1340, height: 900 } }));
  const dir = await mkdtemp(path.join(os.tmpdir(), "speech-pages-"));
  const generator = await browser.newPage();
  await generator.setContent(`
    <h1 style="font-size:28px">Chapitre 1 : Le départ</h1>
    <p style="font-size:14px">Première phrase du cours. Deuxième phrase à garder. Troisième phrase inutile.</p>
    <h1 style="font-size:28px;break-before:page">Chapitre 2 : La marche</h1>
    <p style="font-size:14px">Quatrième phrase importante. Cinquième phrase finale.</p>`);
  pdf = path.join(dir, "cours.pdf");
  await writeFile(pdf, await generator.pdf());
  await generator.close();
  await page.evaluateOnNewDocument(() => document.addEventListener("securitypolicyviolation", (e) => console.log(`CSP-VIOLATION ${e.violatedDirective} ${e.blockedURI}`)));
  page.on("console", (m) => { if (/CSP-VIOLATION|Refused to/.test(m.text())) issues.push(m.text()); });
  page.on("pageerror", (e) => issues.push(e.message));
});
after(async () => { await browser?.close(); await server?.close(); });

// Le texte s'écrit sur l'écran en ~0,6 s : on lit une fois l'écriture finie.
const screenText = async () => {
  await page.waitForFunction(() => !document.querySelector("#screen").hasAttribute("data-typing"));
  return page.$eval("#screen", (el) => el.value);
};
async function importPdf() {
  await page.goto(server.url);
  await page.waitForSelector('#key-speak[aria-pressed="false"]');
  await (await page.$("#pdf-input")).uploadFile(pdf);
  await page.waitForFunction(() => document.querySelector("#screen").value.includes("Cinquième"), { timeout: 60_000 });
}
async function openPages() {
  await page.click("#pages-open");
  await page.waitForFunction(() => document.querySelectorAll(".pdf-page .textLayer span[data-i]").length >= 4, { timeout: 30_000 });
}
// Centre d'un mot dans la couche de texte, après l'avoir fait défiler à l'écran.
async function wordAt(word) {
  await page.evaluate((word) => {
    [...document.querySelectorAll(".pdf-page .textLayer span[data-i]")].find((s) => s.textContent.includes(word))?.scrollIntoView({ block: "center" });
  }, word);
  await new Promise((r) => setTimeout(r, 300));
  const point = await page.evaluate((word) => {
    for (const span of document.querySelectorAll(".pdf-page .textLayer span[data-i]")) {
      const walker = document.createTreeWalker(span, NodeFilter.SHOW_TEXT);
      let offset = 0, nodes = [];
      for (let n = walker.nextNode(); n; n = walker.nextNode()) { nodes.push([n, offset]); offset += n.textContent.length; }
      const index = span.textContent.indexOf(word);
      if (index < 0) continue;
      const [node, base] = nodes.findLast(([, start]) => start <= index);
      const range = document.createRange();
      range.setStart(node, index - base); range.setEnd(node, Math.min(node.textContent.length, index - base + 2));
      const box = range.getBoundingClientRect();
      return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    }
    return null;
  }, word);
  assert.ok(point, `mot introuvable dans les pages : ${word}`);
  return point;
}
async function clickWord(word) { const p = await wordAt(word); await page.mouse.click(p.x, p.y); }
async function tool(name) { await page.click(`[data-tool="${name}"]`); }
async function done() {
  await page.click("#pages-done");
  await page.waitForFunction(() => !document.querySelector("#pages-dialog").open);
  // L'écran reçoit le texte juste après la fermeture de la vue.
  await page.waitForFunction(() => /^(SÉLECTION|TOUT LE DOCUMENT|RIEN À LIRE)/.test(document.querySelector("#status-left").textContent), { timeout: 5000 });
}

test("PAGES : seulement pour un PDF ; les vraies pages s'affichent, sans texte au premier écran de la machine", { timeout: 90_000 }, async () => {
  await page.goto(server.url);
  await page.waitForSelector('#key-speak[aria-pressed="false"]');
  await page.$eval("#screen", (el) => { el.value = "Un texte tapé."; el.dispatchEvent(new Event("input")); });
  assert.equal(await page.$eval("#pages-open", (b) => b.hidden), true, "pas de pages pour un texte tapé");
  await importPdf();
  assert.equal(await page.$eval("#pages-open", (b) => b.hidden), false);
  assert.equal(await screenText(), FULL);
  await openPages();
  const r = await page.evaluate(() => ({ pages: document.querySelectorAll(".pdf-page").length, canvas: document.querySelectorAll(".pdf-page canvas").length, summary: document.querySelector("#pages-summary").textContent }));
  assert.equal(r.pages, 2);
  assert.ok(r.canvas >= 1);
  assert.equal(r.summary, "Tout le document sera lu");
  await done();
  assert.equal(await screenText(), FULL, "fermer sans surligner ne change rien");
});

test("« À lire » sur deux pages, puis « À sauter » au milieu : seul le reste est lu, chapitres replacés", { timeout: 90_000 }, async () => {
  await importPdf();
  await openPages();
  await clickWord("Deuxième");
  assert.match(await page.$eval("#pages-hint", (e) => e.textContent), /dernier mot/);
  await clickWord("importante.");
  assert.equal(await page.$eval("#pages-summary", (e) => e.textContent), "1 passage · environ 1 min");
  await tool("exclude");
  await clickWord("Troisième");
  await clickWord("inutile.");
  const marks = await page.evaluate(() => ({
    include: [...document.querySelectorAll("mark.hl-include")].map((m) => m.textContent).join(""),
    exclude: [...document.querySelectorAll("mark.hl-exclude")].map((m) => m.textContent).join(""),
  }));
  assert.match(marks.include, /Deuxième phrase à garder\./);
  assert.equal(marks.exclude.trim(), "Troisième phrase inutile.");
  await done();
  assert.equal(await screenText(), "Deuxième phrase à garder.\nChapitre 2 : La marche\nQuatrième phrase importante.");
  assert.equal(await page.$eval("#status-left", (e) => e.textContent), "SÉLECTION · 2 PASSAGES");
  assert.equal(await page.$eval("#pages-open", (e) => e.textContent), "PAGES · 2");
  assert.deepEqual(await page.$$eval("#chapter option", (o) => o.map((x) => x.textContent)), ["Chapitre 1 : Le départ", "Chapitre 2 : La marche"]);
  // Les surlignages sont gardés quand on rouvre la vue.
  await openPages();
  assert.ok(await page.$("mark.hl-exclude"));
  await done();
});

test("« À sauter » seul : tout le document sauf le passage barré ; gomme et « Tout effacer »", { timeout: 90_000 }, async () => {
  await importPdf();
  await openPages();
  await tool("exclude");
  await clickWord("Troisième");
  await clickWord("inutile.");
  await done();
  assert.equal(await screenText(), FULL.replace(" Troisième phrase inutile.", ""));
  await openPages();
  await tool("erase");
  await clickWord("Troisième");
  await clickWord("inutile.");
  assert.equal(await page.$("mark.hl-exclude"), null, "la gomme retire le passage barré");
  await tool("include");
  await clickWord("Cinquième");
  await clickWord("nale."); // « fi » est une ligature, un morceau à part dans le PDF
  await page.click("#pages-clear");
  assert.equal(await page.$eval("#pages-summary", (e) => e.textContent), "Tout le document sera lu");
  await done();
  assert.equal(await screenText(), FULL);
  assert.equal(await page.$eval("#pages-open", (e) => e.textContent), "PAGES");
});

test("glisser d'un mot à l'autre surligne ; Échap annule un premier clic sans fermer la vue", { timeout: 90_000 }, async () => {
  await importPdf();
  await openPages();
  const from = await wordAt("Quatrième"), to = await wordAt("nale.");
  await page.mouse.move(from.x, from.y); await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 6 }); await page.mouse.up();
  assert.match(await page.$$eval("mark.hl-include", (m) => m.map((x) => x.textContent).join("")), /Quatrième phrase importante\. Cinquième phrase finale\./);
  await clickWord("Première");
  assert.ok(await page.$("mark.hl-anchor"));
  await page.keyboard.press("Escape");
  assert.equal(await page.$("mark.hl-anchor"), null);
  assert.equal(await page.$eval("#pages-dialog", (d) => d.open), true, "le premier Échap n'annule que le clic en cours");
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector("#pages-dialog").open);
  await page.waitForFunction(() => document.querySelector("#pages-open").textContent === "PAGES · 1");
  assert.equal(await screenText(), "Quatrième phrase importante. Cinquième phrase finale.", "fermer par Échap garde le surlignage");
  assert.deepEqual(issues, []);
});

test("pages PDF à 320 et 390 px : outils tactiles visibles et fermeture accessible", { timeout: 90_000 }, async () => {
  for (const width of [320, 390]) {
    await page.setViewport({ width, height: 844, isMobile: true, hasTouch: true });
    await importPdf();
    await openPages();
    const layout = await page.evaluate(() => ({
      dialogWidth: document.querySelector('#pages-dialog').scrollWidth,
      controls: [...document.querySelectorAll('.pages-bar button')].map(el => { const r = el.getBoundingClientRect(); return { id: el.id || el.dataset.tool, left: r.left, right: r.right, width: r.width, height: r.height }; }),
    }));
    assert.ok(layout.dialogWidth <= width, `${width} px : ${layout.dialogWidth}`);
    for (const c of layout.controls) assert.ok(c.left >= 0 && c.right <= width && c.width >= 44 && c.height >= 44, `${width} px : ${JSON.stringify(c)}`);
    if (width === 390) await page.screenshot({ path: '/tmp/radio-ui-pdf-mobile.png' });
    await done();
    assert.equal(await screenText(), FULL);
  }
  assert.deepEqual(issues, []);
});
