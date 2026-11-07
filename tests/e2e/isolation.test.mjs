import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { startServer, launch } from "./harness.mjs";

// Le serveur de test n'envoie aucun en-tête d'isolation (sauf COI=1) : comme GitHub Pages,
// c'est le service worker qui doit isoler la page.
let server;
before(async () => { server = await startServer(); });
after(async () => { await server?.close(); });

const freshProfile = () => mkdtemp(path.join(os.tmpdir(), "speech-isolation-"));

test("première visite : la page se recharge une fois puis calcule sur plusieurs cœurs", { timeout: 180_000 }, async (t) => {
  if (process.env.COI) return t.skip("le serveur isole déjà la page");
  const { browser, page } = await launch({ profile: await freshProfile(), isolationReload: true });
  try {
    let loads = 0;
    page.on("load", () => loads++);
    await page.goto(`${server.url}/`);
    await page.waitForFunction(() => globalThis.crossOriginIsolated === true, { timeout: 60_000 });
    assert.equal(loads, 2, "un seul rechargement");
    assert.equal(await page.evaluate(() => typeof SharedArrayBuffer), "function");
    // Les pages suivantes sont isolées dès l'ouverture, sans rechargement.
    await page.goto(`${server.url}/pdf-en-audio/`);
    assert.equal(await page.evaluate(() => crossOriginIsolated), true);
    assert.equal(loads, 3);
    // La voix fonctionne dans la page isolée (moteur, phonémiseur et modèle chargés depuis les CDN).
    const seconds = await page.evaluate(async () => {
      const { createTts } = await import("/src/tts.js");
      const { wavDuration } = await import("/src/audio.js");
      const res = await createTts().synthesize({ text: "Première phrase du cours. Deuxième phrase du cours.", voice: "jessica", speed: 1 });
      return wavDuration(res.wav);
    });
    assert.ok(seconds > 1, `audio trop court : ${seconds}`);
  } finally { await browser.close(); }
});

test("première visite : pas de rechargement si la personne a déjà commencé", { timeout: 120_000 }, async (t) => {
  if (process.env.COI) return t.skip("le serveur isole déjà la page");
  const slowServer = await startServer({ slow: { "/icon-192.png": 4000 } });
  const { browser, page } = await launch({ profile: await freshProfile(), isolationReload: true });
  try {
    let loads = 0;
    page.on("load", () => loads++);
    // Une touche dès que la page est prête. Le service worker, lui, s'installe lentement :
    // une de ses copies hors ligne (inutile à la page) est servie avec 4 s de retard.
    await page.evaluateOnNewDocument(() => addEventListener("DOMContentLoaded", () => dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }))));
    await page.goto(`${slowServer.url}/`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, { timeout: 60_000 });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    assert.equal(loads, 1);
    assert.equal(await page.evaluate(() => crossOriginIsolated), false);
    // Elle sera isolée à la prochaine ouverture.
    await page.reload();
    assert.equal(await page.evaluate(() => crossOriginIsolated), true);
  } finally { await browser.close(); await slowServer.close(); }
});
