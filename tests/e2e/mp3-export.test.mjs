import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startServer, launch } from "./harness.mjs";

let server, browser, page;
before(async () => { server = await startServer(); ({ browser, page } = await launch()); await page.goto(server.url); });
after(async () => { await browser?.close(); await server?.close(); });

test("MP3 hors interface : mêmes octets, progrès et WAV conservé", { timeout: 90_000 }, async () => {
  const result = await page.evaluate(async () => {
    const { encodeWav, wavToMp3 } = await import('/src/audio.js');
    const { exportMp3Audio } = await import('/src/mp3-export.js');
    const samples = new Int16Array(22050 * 60);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.round(Math.sin(i * 2 * Math.PI * 220 / 22050) * 8000);
    const wav = encodeWav(samples, 22050), size = wav.byteLength, progress = [];
    let ticks = 0; const timer = setInterval(() => ticks++, 10);
    const worker = await exportMp3Audio(wav, { onProgress: pct => progress.push(pct) });
    clearInterval(timer);
    const reference = await wavToMp3(wav);
    return { same: worker.length === reference.length && worker.every((v, i) => v === reference[i]), preserved: wav.byteLength === size, progress, ticks };
  });
  assert.ok(result.same); assert.ok(result.preserved); assert.ok(result.ticks > 0);
  assert.equal(result.progress.at(-1), 100);
  assert.ok(result.progress.every((pct, i) => pct >= 0 && pct <= 100 && (!i || pct >= result.progress[i - 1])));
});

test("annuler l’export interrompt le worker et permet de recommencer", { timeout: 90_000 }, async () => {
  const result = await page.evaluate(async () => {
    const { encodeWav } = await import('/src/audio.js');
    const { exportMp3Audio } = await import('/src/mp3-export.js');
    const wav = encodeWav(new Int16Array(22050 * 60), 22050);
    const controller = new AbortController();
    let error;
    try { await exportMp3Audio(wav, { signal: controller.signal, onProgress: () => controller.abort() }); }
    catch (e) { error = e.name; }
    const retry = await exportMp3Audio(encodeWav(new Int16Array(22050), 22050));
    return { error, bytes: retry.length, wavBytes: wav.byteLength };
  });
  assert.equal(result.error, 'AbortError'); assert.ok(result.bytes > 0); assert.ok(result.wavBytes > 44);
});
