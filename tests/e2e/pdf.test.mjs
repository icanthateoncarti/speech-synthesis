import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { startServer, launch } from "./harness.mjs";
import { splitIntoChunks } from "../../src/text.js";
const WRAPPED = "La lecture doit regrouper les lignes de chaque paragraphe pour conserver le sens de la phrase et éviter les coupures artificielles.";
let server, browser, page, fixtures;
before(async () => {
  server = await startServer();
  ({ browser, page } = await launch());
  fixtures = await mkdtemp(path.join(os.tmpdir(), "speech-pdf-"));
  const generator = await browser.newPage();
  await generator.setContent("<p>Bonjour le monde. Ceci est un PDF.</p><p style='break-before:page'>La deuxième page est là.</p>");
  await generator.pdf({ path: path.join(fixtures, "texte.pdf") });
  await generator.setContent(`<p style="width:120px;font-size:16px">${WRAPPED}</p>`);
  await generator.pdf({ path: path.join(fixtures, "wrapped.pdf") });
  await generator.setContent("<canvas width='300' height='300'></canvas><script>const c=document.querySelector('canvas');c.getContext('2d').fillRect(0,0,300,300)</script>");
  await generator.pdf({ path: path.join(fixtures, "scan.pdf") });
  await generator.setContent("<h1 style='font-size:28px'>Le fil rouge du cours</h1><p style='font-size:12px'>Tout le cours répond à une seule logique : transformer la donnée brute en décision.</p><h2 style='font-size:20px'>Les trois piliers</h2><p style='font-size:12px'>Chaque séance revient sur les mêmes piliers.</p>");
  await generator.pdf({ path: path.join(fixtures, "titres.pdf") });
  await writeFile(path.join(fixtures, "invalid.pdf"), "Ce fichier n'est pas un PDF.");
  await generator.close();
});
after(async () => { await browser?.close(); await server?.close(); });
async function open() {
  await page.goto(server.url);
  await page.waitForSelector('#key-speak[aria-pressed="false"]');
}
async function upload(file) { await (await page.$("#pdf-input")).uploadFile(path.join(fixtures, file)); }

test("PDF texte : extraction locale, toutes les pages, chargement à la demande", { timeout: 90_000 }, async () => {
  const urls = [];
  const watch = (req) => urls.push(req.url());
  page.on("request", watch);
  try {
    await open();
    assert.equal(urls.some((u) => u.includes("pdfjs-dist")), false);
    await upload("texte.pdf");
    await page.waitForFunction(() => document.querySelector("#screen").value.includes("deuxième page"), { timeout: 60_000 });
    const text = await page.$eval("#screen", (el) => el.value);
    assert.match(text, /Bonjour le monde\. Ceci est un PDF\./);
    assert.match(text, /\n.*deuxième page/);
    assert.ok(urls.some((u) => u.includes("pdfjs-dist")));
  } finally { page.off("request", watch); }
});

test("PDF scanné et invalide : message explicite, texte précédent conservé", { timeout: 90_000 }, async () => {
  await open();
  await page.$eval("#screen", (el) => { el.value = "Gardé."; el.dispatchEvent(new Event("input")); });
  for (const [file, expected] of [["scan.pdf", "PDF SANS TEXTE"], ["invalid.pdf", "PDF ILLISIBLE · RÉESSAIE"]]) {
    await upload(file);
    await page.waitForFunction((value) => document.querySelector("#status-left").textContent === value, { timeout: 60_000 }, expected);
    assert.equal(await page.$eval("#screen", (el) => el.value), "Gardé.");
  }
});

test("une phrase répartie sur plusieurs lignes PDF reste un seul morceau vocal", { timeout: 60_000 }, async () => {
  await open();
  await upload("wrapped.pdf");
  await page.waitForFunction(() => document.querySelector("#screen").value.includes("coupures artificielles"));
  const text = await page.$eval("#screen", (el) => el.value);
  assert.equal(text, WRAPPED);
  assert.deepEqual(splitIntoChunks(text), [WRAPPED]);
  assert.equal(await page.$eval("#screen", (el) => el.selectionStart), 0);
});

test("EFFACE pendant l'import PDF ne laisse pas réapparaître le texte", async () => {
  await open();
  await page.setRequestInterception(true);
  let held;
  const intercept = (req) => {
    if (req.url().includes("pdf.min.mjs")) held = req;
    else req.continue();
  };
  page.on("request", intercept);
  try {
    await upload("texte.pdf");
    for (let i = 0; i < 100 && !held; i++) await new Promise((r) => setTimeout(r, 20));
    assert.ok(held);
    await page.click("#key-clear");
    await held.continue();
    await new Promise((r) => setTimeout(r, 2000));
    assert.equal(await page.$eval("#screen", (el) => el.value), "");
    assert.equal(await page.$eval("#status-left", (el) => el.textContent), "PRÊT");
  } finally { page.off("request", intercept); await page.setRequestInterception(false); }
});

test("titres d'un PDF repérés à la taille de police : chacun sur sa ligne", { timeout: 90_000 }, async () => {
  await open();
  await upload("titres.pdf");
  await page.waitForFunction(() => document.querySelector("#screen").value.includes("piliers."), { timeout: 60_000 });
  const lines = (await page.$eval("#screen", (el) => el.value)).split("\n");
  assert.deepEqual(lines, [
    "Le fil rouge du cours",
    "Tout le cours répond à une seule logique : transformer la donnée brute en décision.",
    "Les trois piliers",
    "Chaque séance revient sur les mêmes piliers.",
  ]);
});
