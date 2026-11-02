import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { startServer, launch } from "./harness.mjs";

// Lexique du syllabus NL1 (EPHEC) : la moitié néerlandaise doit partir à la voix belge.
const DUTCH_ONLY = "Mag ik je aantekeningen van de laatste les rechten bekijken?";
const LEXIQUE = `blokken (blokte – heeft geblokt) ; étudier beaucoup, bûcher.
blokperiode, de ; le blocus.
academiejaar, het ; l’année académique.
Mag ik je aantekeningen van de laatste les rechten bekijken?`;

let server, browser, page;
before(async () => {
  server = await startServer();
  ({ browser, page } = await launch());
  await page.goto(`${server.url}/tests/e2e/fixtures/tts.html`);
  // Le profil de test garde le service worker du site : sans ça, il sert d’anciens modules.
  await page.evaluate(async () => {
    for (const registration of await navigator.serviceWorker.getRegistrations()) await registration.unregister();
    for (const key of await caches.keys()) await caches.delete(key);
  });
  await page.reload();
  await page.waitForFunction(() => window.ttsReady || window.ttsError, { timeout: 30_000 });
});
after(async () => { await browser?.close(); await server?.close(); });

test("lexique NL–FR : voix néerlandaise pour le néerlandais, française pour le français", { timeout: 600_000 }, async (t) => {
  for (const voice of ["jessica", "tom"]) {
    const r = await page.evaluate(async ({ text, voice }) => {
      const res = await window.tts.synthesize({ text, voice, speed: 1 });
      const bytes = new Uint8Array(res.wav);
      let binary = ""; for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return { chunks: res.chunks.length, seconds: window.wavDuration(res.wav), b64: btoa(binary) };
    }, { text: LEXIQUE, voice });
    t.diagnostic(`${voice} : ${r.chunks} morceaux, ${r.seconds.toFixed(1)} s`);
    if (process.env.VOCAB_WAV_DIR) await writeFile(`${process.env.VOCAB_WAV_DIR}/lexique-${voice}.wav`, Buffer.from(r.b64, "base64"));
    assert.ok(r.seconds > 5);
  }
  // La voix néerlandaise seule, pour vérifier l’accent à l’oreille ou par transcription.
  const nl = await page.evaluate(async (text) => {
    const res = await window.tts.synthesize({ text, voice: "tom", speed: 1 });
    const bytes = new Uint8Array(res.wav);
    let binary = ""; for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(binary);
  }, DUTCH_ONLY + "\n" + LEXIQUE);
  if (process.env.VOCAB_WAV_DIR) await writeFile(`${process.env.VOCAB_WAV_DIR}/phrase-nl.wav`, Buffer.from(nl, "base64"));
});
