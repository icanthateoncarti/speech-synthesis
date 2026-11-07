// Vitesse de préparation d'un long texte (40 phrases de cours), modèle déjà en cache.
// Usage : node scripts/benchmark-vitesse.mjs   (COI=1 : page isolée ; WORKERS=n THREADS=n : forcer le plan)
import { startServer, launch } from "../tests/e2e/harness.mjs";

const server = await startServer();
const { browser, page } = await launch({ profile: "/tmp/speechsynthesi-tts-benchmark" });
try {
  // Un service worker resté dans le profil servirait d'anciens fichiers depuis son cache.
  await page.goto(`${server.url}/tests/e2e/fixtures/tts.html`);
  await page.evaluate(async () => {
    for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
    for (const k of await caches.keys()) await caches.delete(k);
  });
  await page.goto(`${server.url}/tests/e2e/fixtures/tts.html`);
  await page.waitForFunction(() => window.ttsReady || window.ttsError);
  const opts = { workers: Number(process.env.WORKERS) || undefined, threads: Number(process.env.THREADS) || undefined };
  const results = await page.evaluate(async (opts) => {
    const { createTts } = await import("/src/tts.js");
    const tts = createTts(opts);
    await tts.preload("jessica");
    const sujets = ["la mémoire", "le processeur", "une fonction", "la boucle", "le compilateur", "une variable", "le réseau", "la base de données"];
    // Le texte change à chaque passage : aucun morceau ne vient du cache.
    const salt = Date.now() % 997;
    const text = Array.from({ length: 40 }, (_, i) =>
      `Point ${i + salt} : ${sujets[i % sujets.length]} doit être compris avant l'examen, car le professeur pose souvent une question dessus.`).join(" ");
    const start = performance.now();
    let first;
    const res = await tts.synthesize({ text, voice: "jessica", speed: 1 }, { onChunk() { first ??= performance.now() - start; } });
    const ms = performance.now() - start;
    const audio = window.wavDuration(res.wav);
    return { isolated: globalThis.crossOriginIsolated, cores: navigator.hardwareConcurrency, chunks: res.chunks.length, ms: Math.round(ms), firstChunkMs: Math.round(first), audioSeconds: Math.round(audio), audioSecondsPerSecond: +(audio / (ms / 1000)).toFixed(2), ...opts };
  }, opts);
  console.log(JSON.stringify(results));
} finally { await browser.close(); await server.close(); }
