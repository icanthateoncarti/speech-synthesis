import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { startServer, launch } from "./harness.mjs";
import { SHARE_API } from "../../src/share-config.js";
import { fastChunks } from "../../src/mp3-fast.js";

let server, browser, page;
const errors = [];
before(async () => {
  server = await startServer();
  ({ browser, page } = await launch());
  page.on("pageerror", (err) => errors.push(err.message));
});
after(async () => { await browser?.close(); await server?.close(); });

const LONG = "Le contrat se forme par la rencontre d'une offre et d'une acceptation. ".repeat(60);
const status = () => page.$eval("#status-left", (el) => el.textContent);

// Relais Azure simulé : statut, puis un faux MP3 par morceau qui contient son texte.
async function withRelay({ available = true, tts = (body) => ({ status: 200, contentType: "audio/mpeg", body: body.text }) }, run) {
  const calls = [];
  const intercept = (request) => {
    const url = request.url();
    if (!url.startsWith(SHARE_API)) { void request.continue(); return; }
    const cors = { "Access-Control-Allow-Origin": "*" };
    if (request.method() === "OPTIONS") { void request.respond({ status: 204, headers: { ...cors, "Access-Control-Allow-Methods": "GET, POST", "Access-Control-Allow-Headers": "Content-Type" } }); return; }
    if (url.endsWith("/tts/status")) { void request.respond({ status: 200, headers: cors, contentType: "application/json", body: JSON.stringify({ available }) }); return; }
    if (url.endsWith("/tts")) {
      const body = JSON.parse(request.postData());
      calls.push(body);
      void request.respond({ headers: cors, ...tts(body) });
      return;
    }
    void request.respond({ status: 204, headers: cors });
  };
  await page.setBypassServiceWorker(true);
  await page.setRequestInterception(true);
  page.on("request", intercept);
  try { await run(calls); }
  finally { page.off("request", intercept); await page.setRequestInterception(false); await page.setBypassServiceWorker(false); }
}
async function open(text) {
  await page.goto(server.url);
  await page.waitForSelector('#key-speak[aria-pressed="false"]');
  await page.$eval("#screen", (el, value) => { el.value = value; el.dispatchEvent(new Event("input")); }, text);
}

test("MP3 rapide : un long cours propose le choix, et Azure fabrique le MP3 morceau par morceau", { timeout: 120_000 }, async () => {
  const folder = await mkdtemp(path.join(os.tmpdir(), "speech-mp3-fast-"));
  const client = await page.createCDPSession();
  await client.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: folder });
  await withRelay({}, async (calls) => {
    await open(LONG);
    await page.click("#key-mp3");
    await page.waitForSelector("#mp3-dialog[open]");
    assert.match(await page.$eval("#mp3-dialog", (el) => el.textContent), /Microsoft Azure/);
    await page.click("#mp3-fast");
    const name = "speechsynthe-si-jessica-rapide.mp3";
    for (let i = 0; i < 200 && !(await readdir(folder)).includes(name); i++) await new Promise((r) => setTimeout(r, 50));
    const data = (await readFile(path.join(folder, name))).toString();
    assert.ok(calls.length >= 2);
    assert.ok(calls.every((call) => call.voice === "fr-FR-DeniseNeural" && call.lang === "fr" && call.text.length <= 3000));
    // Deux morceaux partent à la fois : le MP3 garde quand même l'ordre du cours.
    assert.equal(data, fastChunks(LONG).join(""));
    assert.equal(await page.$eval("#key-mp3", (el) => el.textContent), "⬇ MP3");
  });
  assert.deepEqual(errors, []);
});

test("MP3 rapide : Annuler ne fabrique rien ; un court texte ne pose pas la question", { timeout: 60_000 }, async () => {
  await withRelay({}, async (calls) => {
    await open(LONG);
    await page.click("#key-mp3");
    await page.waitForSelector("#mp3-dialog[open]");
    await page.click("#mp3-cancel");
    await page.waitForSelector("#mp3-dialog:not([open])");
    assert.equal(await page.$eval("#key-mp3", (el) => el.textContent), "⬇ MP3");
    assert.equal(calls.length, 0);
    await page.$eval("#screen", (el) => { el.value = "Court."; el.dispatchEvent(new Event("input")); });
    await page.click("#key-mp3");
    await page.waitForFunction(() => document.querySelector("#key-mp3").textContent !== "⬇ MP3");
    assert.equal(await page.$eval("#mp3-dialog", (el) => el.open), false);
    assert.equal(calls.length, 0);
  });
});

test("MP3 rapide épuisé : le message le dit et le MP3 est préparé sur l'appareil", { timeout: 180_000 }, async () => {
  await withRelay({ tts: () => ({ status: 429, contentType: "application/json", body: JSON.stringify({ reason: "daily" }) }) }, async () => {
    await open(LONG.slice(0, 1600));
    await page.click("#key-mp3");
    await page.waitForSelector("#mp3-dialog[open]");
    await page.click("#mp3-fast");
    await page.waitForFunction(() => document.querySelector("#status-left").textContent === "MP3 RAPIDE ÉPUISÉ · MP3 SUR L’APPAREIL");
    await page.waitForFunction(() => document.querySelector("#status-left").textContent === "✓ MP3 PRÊT", { timeout: 170_000 });
  });
});

test("relais Azure indisponible : pas de question, MP3 sur l'appareil comme avant", { timeout: 60_000 }, async () => {
  await withRelay({ available: false }, async (calls) => {
    await open(LONG);
    await page.click("#key-mp3");
    await page.waitForFunction(() => document.querySelector("#key-mp3").textContent !== "⬇ MP3");
    assert.equal(await page.$eval("#mp3-dialog", (el) => el.open), false);
    assert.equal(calls.length, 0);
    assert.notEqual(await status(), "");
  });
});
