import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { startServer, launch } from "./harness.mjs";

let server, browser, page;
const errors = [];
before(async () => {
  server = await startServer();
  ({ browser, page } = await launch());
  page.on("pageerror", (err) => errors.push(err.message));
});
after(async () => { await browser?.close(); await server?.close(); });

async function open(text = "Bonjour le monde. Voici la machine qui parle.") {
  await page.goto(server.url);
  await page.waitForSelector('#key-speak[aria-pressed="false"]');
  if (text) await page.$eval("#screen", (el, value) => { el.value = value; el.dispatchEvent(new Event("input")); }, text);
}
const status = () => page.$eval("#status-left", (el) => el.textContent);
const waitStatus = (value, timeout = 120_000) => page.waitForFunction((s) => document.querySelector("#status-left").textContent === s, { timeout }, value);

test("taper, PARLE : lecture, mots et vumètre, fin puis relecture du cache", { timeout: 120_000 }, async () => {
  await open();
  await page.click("#key-speak");
  await waitStatus("▶ LECTURE");
  await page.waitForSelector(".w.now");
  await page.waitForSelector("#meter .hot");
  await waitStatus("PRÊT");
  const start = Date.now();
  await page.click("#key-speak");
  await waitStatus("▶ LECTURE", 2000);
  assert.ok(Date.now() - start < 2000);
  await page.waitForSelector(".w.now");
  await waitStatus("PRÊT", 15_000);
});

test("PARLE pendant la lecture arrête immédiatement ; EFFACE vide l'écran", { timeout: 120_000 }, async () => {
  await open();
  await page.click("#key-speak");
  await waitStatus("▶ LECTURE");
  await page.click("#key-speak");
  await waitStatus("PRÊT", 1000);
  assert.equal(await page.$eval("#reader", (el) => el.hidden), true);
  await page.click("#key-clear");
  assert.equal(await page.$eval("#screen", (el) => el.value), "");
  assert.equal(await status(), "PRÊT");
});

test("écran vide et emojis : PARLE et MP3 ne téléchargent aucun modèle", async () => {
  await open("");
  const requests = [];
  const watch = (req) => requests.push(req.url());
  page.on("request", watch);
  try {
    for (const text of ["", "   ", "🙂 !!"]) {
      await page.$eval("#screen", (el, value) => { el.value = value; el.dispatchEvent(new Event("input")); }, text);
      for (const key of ["#key-speak", "#key-mp3"]) {
        await page.click(key);
        assert.equal(await status(), "ÉCRAN VIDE");
      }
    }
    assert.equal(requests.some((url) => /tts-worker|huggingface/.test(url)), false);
  } finally { page.off("request", watch); }
});

test("effacer pendant le préchargement ne fige pas l'état ; une erreur n'empêche pas le nouvel essai", async () => {
  const p = await browser.newPage();
  await p.setRequestInterception(true);
  p.on("request", (req) => {
    if (req.url().endsWith("/src/tts.js")) {
      req.respond({ status: 200, contentType: "text/javascript", body: `
        window.preloadCalls = 0;
        export function createTts() { return {
          preload(_voice, { onProgress }) {
            window.preloadCalls++;
            onProgress(42);
            return new Promise((resolve, reject) => { window.finishPreload = (fail) => fail ? reject(Object.assign(new Error(), { kind: "network" })) : resolve(); });
          },
          cancel() {}, synthesize() { throw Error("synthesize called unexpectedly"); }
        }; }
      ` });
    } else req.continue();
  });
  try {
    await p.goto(server.url);
    await p.waitForSelector('#key-speak[aria-pressed="false"]');
    const type = async (value) => p.$eval("#screen", (el, text) => { el.value = text; el.dispatchEvent(new Event("input")); }, value);
    await type("Bonjour.");
    await p.waitForFunction(() => window.preloadCalls === 1);
    await p.waitForFunction(() => document.querySelector("#status-left").textContent === "CHARGEMENT VOIX 42 %");
    await type("");
    assert.equal(await p.$eval("#status-left", (el) => el.textContent), "PRÊT");
    await p.evaluate(() => window.finishPreload(true));
    await new Promise((r) => setTimeout(r, 30));
    assert.equal(await p.$eval("#status-left", (el) => el.textContent), "PRÊT");
    await type("Bonjour encore.");
    await p.waitForFunction(() => window.preloadCalls === 2);
    await p.waitForFunction(() => document.querySelector("#status-left").textContent === "CHARGEMENT VOIX 42 %");
    await p.evaluate(() => window.finishPreload(false));
    await new Promise((r) => setTimeout(r, 30));
    assert.equal(await p.$eval("#status-left", (el) => el.textContent), "PRÊT");
  } finally { await p.close(); }
});

test("MP3 valide, changement de voix et vitesse : aucun ancien audio", { timeout: 180_000 }, async () => {
  await open("Bonjour, ceci est un fichier audio créé par la machine.");
  const folder = await mkdtemp(path.join(os.tmpdir(), "speech-mp3-"));
  const client = await page.createCDPSession();
  await client.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: folder });
  async function getMp3(voice) {
    await page.click("#key-mp3");
    await waitStatus("✓ MP3 PRÊT");
    const name = `speechsynthe-si-${voice}.mp3`;
    for (let i = 0; i < 100 && !(await readdir(folder)).includes(name); i++) await new Promise((r) => setTimeout(r, 50));
    const data = await readFile(path.join(folder, name));
    assert.ok(data.length > 1000);
    assert.ok((data[0] === 0xff && (data[1] & 0xe0) === 0xe0) || data.subarray(0, 3).toString() === "ID3");
    // Décodage par le navigateur : vérifie le fichier complet, pas seulement son en-tête.
    const seconds = await page.evaluate(async (bytes) => {
      const context = new AudioContext();
      try { return (await context.decodeAudioData(new Uint8Array(bytes).buffer)).duration; }
      finally { await context.close(); }
    }, [...data]);
    assert.ok(seconds > 1);
    return data;
  }
  const jessica = await getMp3("jessica");
  await page.click("#voice-tom");
  assert.equal(await status(), "PRÊT");
  const tom = await getMp3("tom");
  assert.notDeepEqual(jessica, tom);
  await page.$eval("#speed", (el) => { el.value = "1.2"; el.dispatchEvent(new Event("input")); });
  assert.equal(await status(), "PRÊT");
  assert.match(await page.$eval("#status-right", (el) => el.textContent), /TOM.*1\.2×/);
  await page.$eval("#screen", (el) => { el.value = "Un autre texte."; el.dispatchEvent(new Event("input")); });
  assert.equal(await status(), "PRÊT");
  await client.detach();
});

test("30 pages : lecture en moins de 20 s, interface réactive, changement de voix arrête", { timeout: 120_000 }, async () => {
  await open("La machine lit cette phrase pendant que la suivante se prépare. ".repeat(1200));
  const start = Date.now();
  await page.click("#key-speak");
  await waitStatus("▶ LECTURE", 20_000);
  assert.ok(Date.now() - start < 20_000);
  const ping = Date.now();
  assert.equal(await page.evaluate(() => 1), 1);
  assert.ok(Date.now() - ping < 200);
  await page.click("#voice-tom");
  await waitStatus("PRÊT", 1000);
  await new Promise((r) => setTimeout(r, 500));
  assert.equal(await status(), "PRÊT");
  assert.equal(await page.$eval("#reader", (el) => el.hidden), true);
});

test("réseau coupé au premier usage, puis réessai depuis la machine", { timeout: 180_000 }, async () => {
  const profile = await mkdtemp(path.join(os.tmpdir(), "speech-machine-offline-"));
  const fresh = await launch({ profile });
  try {
    const p = fresh.page;
    await p.goto(server.url);
    await p.waitForSelector('#key-speak[aria-pressed="false"]');
    let offline = true;
    await p.setRequestInterception(true);
    p.on("request", (req) => offline && /huggingface\.co|cdn\.jsdelivr\.net|cdnjs/.test(req.url()) ? req.abort("internetdisconnected") : req.continue());
    await p.$eval("#screen", (el) => { el.value = "Bonjour le monde."; el.dispatchEvent(new Event("input")); });
    await p.waitForFunction(() => document.querySelector("#status-left").textContent === "ERREUR RÉSEAU · RÉESSAIE");
    offline = false;
    await p.click("#key-speak");
    await p.waitForFunction(() => document.querySelector("#status-left").textContent === "▶ LECTURE", { timeout: 120_000 });
    await p.click("#key-speak");
  } finally { await fresh.browser.close(); }
});

test("aucune erreur JavaScript non gérée", () => assert.deepEqual(errors, []));
